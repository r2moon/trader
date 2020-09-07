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

  struct ArbInfo {
    Direction direction;
    address token1;
    address token2;
    uint256 repayAmount;
  }

  event NewArbitrage(Direction indexed direction, address indexed token1, address indexed token2, uint256 profit, uint256 date);

  IKyberNetworkProxy kyber;
  IUniswapV2Router02 uniswap;
  IWeth weth;

  address beneficiary;
  address constant KYBER_ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  constructor(
    address kyberAddress,
    address uniswapAddress,
    address wethAddress,
    address beneficiaryAddress
  ) public {
    kyber = IKyberNetworkProxy(kyberAddress);
    uniswap = IUniswapV2Router02(uniswapAddress);
    weth = IWeth(wethAddress);
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

    /**
     * token1 should be one the following tokens, we check it on script side
     * USDC | DAI | WETH
     */
    IERC20 token1 = IERC20(arbInfo.token1);
    /**
     * token2 should be one of the following tokens
     * BAT | KNC | LEND | LINK | MKR | SUSD
     */
    IERC20 token2 = IERC20(arbInfo.token2);

    uint256 balanceToken1 = token1.balanceOf(address(this));
    uint256 balanceToken2 = token2.balanceOf(address(this));
    uint256 deadline = block.timestamp + 300; // add 300 millisec buffer time just in case it exceeds trading deadline

    require(
      arbInfo.direction == Direction.KyberToUniswap ||
        arbInfo.direction == Direction.UniswapToKyber ||
        arbInfo.direction == Direction.KyberTokenUniswap ||
        arbInfo.direction == Direction.UniswapTokenKyber,
      "Unknown direction"
    );

    if (arbInfo.direction == Direction.KyberToUniswap) {
      // Buy ETH on Kyber
      require(token1.approve(address(kyber), balanceToken1), "Could not approve! (KyberToUniswap Buy ETH on Kyber)");
      (uint256 expectedRate, ) = kyber.getExpectedRate(token1, IERC20(KYBER_ETH_ADDRESS), balanceToken1);
      kyber.swapTokenToEther(token1, balanceToken1, expectedRate);

      // Sell ETH on Uniswap
      address[] memory path = new address[](2);
      path[0] = address(weth);
      path[1] = address(token1);
      uint256[] memory minOuts = uniswap.getAmountsOut(address(this).balance, path);
      uniswap.swapExactETHForTokens.value(address(this).balance)(minOuts[1], path, address(this), deadline);
    }

    if (arbInfo.direction == Direction.UniswapToKyber) {
      // Buy ETH on Uniswap
      require(token1.approve(address(uniswap), balanceToken1), "Could not approve! (UniswapToKyber Buy ETH on Uniswap)");
      address[] memory path = new address[](2);
      path[0] = address(token1);
      path[1] = address(weth);
      uint256[] memory minOuts = uniswap.getAmountsOut(balanceToken1, path);
      uniswap.swapExactTokensForETH(balanceToken1, minOuts[1], path, address(this), deadline);

      // Sell ETH on Kyber
      (uint256 expectedRate, ) = kyber.getExpectedRate(IERC20(KYBER_ETH_ADDRESS), token1, address(this).balance);
      kyber.swapEtherToToken.value(address(this).balance)(token1, expectedRate);
    }

    if (arbInfo.direction == Direction.KyberTokenUniswap) {
      // Buy TOKEN2 on Kyber
      require(token1.approve(address(kyber), balanceToken1), "Could not approve! (KyberTokenUniswap Buy TOKEN2 on Kyber)");
      (uint256 expectedRate, ) = kyber.getExpectedRate(token1, token2, balanceToken1);
      kyber.swapTokenToToken(token1, balanceToken1, token2, expectedRate); // switched to swaptoken

      // Sell TOKEN2 on Uniswap
      // token approve needed for 2nd token on token to token exchange
      require(token2.approve(address(uniswap), balanceToken2), "Could not approve! (KyberTokenUniswap Sell TOKEN2 on Uniswap)");
      address[] memory path = new address[](2);
      path[0] = address(token2);
      path[1] = address(token1);
      uint256[] memory minOuts = uniswap.getAmountsOut(balanceToken2, path);
      uniswap.swapExactTokensForTokens(balanceToken2, minOuts[1], path, address(this), deadline);
    }

    if (arbInfo.direction == Direction.UniswapTokenKyber) {
      // Buy TOKEN2 on Uniswap
      require(token1.approve(address(uniswap), balanceToken1), "Could not approve! (UniswapTokenKyber Buy ETH on Uniswap)");
      address[] memory path = new address[](2);
      path[0] = address(token1);
      path[1] = address(token2);
      uint256[] memory minOuts = uniswap.getAmountsOut(balanceToken1, path);
      uniswap.swapExactTokensForTokens(balanceToken1, minOuts[1], path, address(this), deadline);

      // Sell TOKEN2 on Kyber
      require(token2.approve(address(kyber), balanceToken2), "Could not approve! (UniswapTokenKyber Sell Token on Kyber)");
      (uint256 expectedRate, ) = kyber.getExpectedRate(token2, token1, balanceToken2);
      kyber.swapTokenToToken(token2, balanceToken2, token1, expectedRate);
    }

    uint256 balance = token1.balanceOf(address(this));
    require(balance - arbInfo.repayAmount >= 0, "Not enough funds to repay dydx loan!");

    uint256 profit = balance - arbInfo.repayAmount;
    require(token1.transfer(beneficiary, profit), "Could not transfer back the profit!");

    emit NewArbitrage(arbInfo.direction, arbInfo.token1, arbInfo.token2, profit, now);
  }

  function initateFlashLoan(
    address _solo,
    uint256 _amount,
    address _token1,
    address _token2,
    Direction _direction
  ) external {
    // Get marketId from token address
    uint256 marketId = _getMarketIdFromTokenAddress(_solo, _token1);

    // Calculate repay amount (_amount + (2 wei))
    // Approve transfer from
    uint256 repayAmount = _getRepaymentAmountInternal(_amount);
    IERC20(_token1).approve(_solo, repayAmount);

    // 1. Withdraw $
    // 2. Call callFunction(...)
    // 3. Deposit back $
    Actions.ActionArgs[] memory operations = new Actions.ActionArgs[](3);

    operations[0] = _getWithdrawAction(marketId, _amount);
    operations[1] = _getCallAction(
      // Encode MyCustomData for callFunction
      abi.encode(ArbInfo({direction: _direction, token1: _token1, token2: _token2, repayAmount: repayAmount}))
    );
    operations[2] = _getDepositAction(marketId, repayAmount);

    Account.Info[] memory accountInfos = new Account.Info[](1);
    accountInfos[0] = _getAccountInfo();

    ISoloMargin(_solo).operate(accountInfos, operations);
  }

  function() external payable {}
}
