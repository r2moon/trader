// SPDX-License-Identifier: ISC
// todo: gas token
// todo: curve integration
pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "@studydefi/money-legos/dydx/contracts/DydxFlashloanBase.sol";
import "@studydefi/money-legos/dydx/contracts/ICallee.sol";
import {KyberNetworkProxy as IKyberNetworkProxy} from "@studydefi/money-legos/kyber/contracts/KyberNetworkProxy.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IUniswapV2Router02.sol";
import "./IWeth.sol";

contract Flashloan is ICallee, DydxFlashloanBase {
  enum Direction {KyberToUniswap, UniswapToKyber, KyberTokenUniswap, UniswapTokenKyber}
  enum TokenTwo {BAT, KNC, LEND, LINK, MKR, SUSD}
  struct ArbInfo {
    Direction direction;
    TokenTwo tokenTwo;
    uint256 repayAmount;
  }

  event NewArbitrage(Direction indexed direction, uint256 indexed profit, uint256 indexed date);
  event DebugBalance(uint256 indexed balance);

  IKyberNetworkProxy kyber;
  IUniswapV2Router02 uniswap;
  IWeth weth;
  IERC20 token;
  IERC20 token2;

  address beneficiary;
  address constant KYBER_ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  constructor(
    address kyberAddress,
    address uniswapAddress,
    address wethAddress,
    address tokenAddress,
    address token2Address,
    address beneficiaryAddress
  ) public {
    kyber = IKyberNetworkProxy(kyberAddress);
    uniswap = IUniswapV2Router02(uniswapAddress);
    weth = IWeth(wethAddress);
    token = IERC20(tokenAddress);
    token2 = IERC20(token2Address);
    beneficiary = beneficiaryAddress;
  }

  // This is the function that will be called postLoan
  // i.e. Encode the logic to handle your flashloaned funds here
  function callFunction(
    address sender,
    Account.Info memory account,
    bytes memory data
  ) public {
    ArbInfo memory arbInfo = abi.decode(data, (ArbInfo));
    uint256 balanceToken = token.balanceOf(address(this));
    uint256 balanceToken2 = token2.balanceOf(address(this));
    uint256 deadline = block.timestamp + 300;

    require(
      arbInfo.direction == Direction.KyberToUniswap ||
        arbInfo.direction == Direction.UniswapToKyber ||
        arbInfo.direction == Direction.KyberTokenUniswap ||
        arbInfo.direction == Direction.UniswapTokenKyber,
      "Unknown direction"
    );

    if (arbInfo.direction == Direction.KyberToUniswap) {
      // Buy ETH on Kyber
      require(token.approve(address(kyber), balanceToken), "Could not approve! (KyberToUniswap Buy ETH on Kyber)");
      (uint256 expectedRate, ) = kyber.getExpectedRate(token, IERC20(KYBER_ETH_ADDRESS), balanceToken);
      kyber.swapTokenToEther(token, balanceToken, expectedRate);

      // Sell ETH on Uniswap
      address[] memory path = new address[](2);
      path[0] = address(weth);
      path[1] = address(token);
      uint256[] memory minOuts = uniswap.getAmountsOut(address(this).balance, path);
      uniswap.swapExactETHForTokens.value(address(this).balance)(minOuts[1], path, address(this), deadline);
    }
    if (arbInfo.direction == Direction.UniswapToKyber) {
      // Buy ETH on Uniswap
      require(token.approve(address(uniswap), balanceToken), "Could not approve! (UniswapToKyber Buy ETH on Uniswap)");
      address[] memory path = new address[](2);
      path[0] = address(token);
      path[1] = address(weth);
      uint256[] memory minOuts = uniswap.getAmountsOut(balanceToken, path);
      uniswap.swapExactTokensForETH(balanceToken, minOuts[1], path, address(this), deadline);

      // Sell ETH on Kyber
      (uint256 expectedRate, ) = kyber.getExpectedRate(IERC20(KYBER_ETH_ADDRESS), token, address(this).balance);
      kyber.swapEtherToToken.value(address(this).balance)(token, expectedRate);
    }
    if (arbInfo.direction == Direction.KyberTokenUniswap) {
      // Buy TOKEN2 on Kyber
      require(token.approve(address(kyber), balanceToken), "Could not approve! (KyberTokenUniswap Buy TOKEN2 on Kyber)");
      (uint256 expectedRate, ) = kyber.getExpectedRate(token, token2, balanceToken);
      kyber.swapTokenToToken(token, balanceToken, token2, expectedRate);

      emit DebugBalance(balanceToken2);

      // Sell TOKEN2 on Uniswap
      // token approve needed for 2nd token on token to token exchange
      require(token2.approve(address(uniswap), balanceToken2), "Could not approve! (KyberTokenUniswap Sell TOKEN2 on Uniswap)");
      address[] memory path = new address[](2);
      path[0] = address(token2);
      path[1] = address(token);
      uint256[] memory minOuts = uniswap.getAmountsOut(balanceToken2, path);
      uniswap.swapExactTokensForTokens(balanceToken2, minOuts[1], path, address(this), deadline);
    }
    if (arbInfo.direction == Direction.UniswapTokenKyber) {
      // Buy ETH on Uniswap
      require(token.approve(address(uniswap), balanceToken), "Could not approve! (UniswapTokenKyber Buy ETH on Uniswap)");
      address[] memory path = new address[](2);
      path[0] = address(token);
      path[1] = address(token2);
      uint256[] memory minOuts = uniswap.getAmountsOut(balanceToken, path);
      uniswap.swapExactTokensForETH(balanceToken, minOuts[1], path, address(this), deadline);

      emit DebugBalance(balanceToken2);

      // Sell Token on Kyber
      require(token2.approve(address(kyber), balanceToken2), "Could not approve! (UniswapTokenKyber Sell Token on Kyber)");
      (uint256 expectedRate, ) = kyber.getExpectedRate(token2, token, balanceToken2);
      kyber.swapTokenToToken(token2, balanceToken2, token, expectedRate);
    }

    uint256 balance = token.balanceOf(address(this));
    require(balance - arbInfo.repayAmount >= 0, "Not enough funds to repay dydx loan!");

    uint256 profit = balance - arbInfo.repayAmount;
    require(token.transfer(beneficiary, profit), "Could not transfer back the profit!");
    emit NewArbitrage(arbInfo.direction, profit, now);
  }

  function initiateFlashloan(
    address _solo,
    address _token,
    uint256 _amount,
    TokenTwo _tokentwo,
    Direction _direction
  ) external {
    // Get marketId from token address
    uint256 marketId = _getMarketIdFromTokenAddress(_solo, _token);

    // Calculate repay amount (_amount + (2 wei))
    // Approve transfer from
    uint256 repayAmount = _getRepaymentAmountInternal(_amount);
    IERC20(_token).approve(_solo, repayAmount);

    // 1. Withdraw $
    // 2. Call callFunction(...)
    // 3. Deposit back $
    Actions.ActionArgs[] memory operations = new Actions.ActionArgs[](3);

    operations[0] = _getWithdrawAction(marketId, _amount);
    operations[1] = _getCallAction(
      // Encode MyCustomData for callFunction
      abi.encode(ArbInfo({direction: _direction, tokenTwo: _tokentwo, repayAmount: repayAmount}))
    );
    operations[2] = _getDepositAction(marketId, repayAmount);

    Account.Info[] memory accountInfos = new Account.Info[](1);
    accountInfos[0] = _getAccountInfo();

    ISoloMargin(_solo).operate(accountInfos, operations);
  }

  function() external payable {}
}
