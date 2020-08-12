require("dotenv").config();
import chalk from "chalk";
import {ethers} from "ethers";
import {KyberNetworkProxyFactory} from "../types/ethers-contracts/KyberNetworkProxyFactory";
import {VaultManagerFactory} from "../types/ethers-contracts/VaultManagerFactory";
import {ChainId, Token, TokenAmount, Pair, Fetcher, WETH, Route, Trade, TradeType} from "@uniswap/sdk";
import addresses from "../addresses";
import {startGanache, wallet, provider, deployContracts, Addresses} from "./ganache";
import Ganache from "ganache-core";
import {Ierc20Factory} from "../types/ethers-contracts/Ierc20Factory";
import {FlashloanFactory} from "../types/ethers-contracts/FlashloanFactory";

jest.setTimeout(100000);

describe("Test flashloan", () => {
  let account: string;
  let ganacheServer: Ganache.Server;
  let contractAddresses: Addresses;

  const daiAddress = addresses.tokens.dai;
  const wethAddress = addresses.tokens.weth;
  const ethAddress = addresses.tokens.eth;

  beforeAll(async (done) => {
    ganacheServer = await startGanache();
    contractAddresses = await deployContracts();
    account = wallet().address;
    console.log(`account address is ${account}`);
    done();
  });

  afterAll((done) => {
    ganacheServer.close();
    console.log(chalk.green("Test completed. Press ctrl+c to exit"));
    done();
  });

  test.skip("account should be initialized", async (done) => {
    expect(account).not.toBe(undefined);
    expect(account).not.toBe("");
    const balance = ethers.utils.formatEther(await provider().getBalance(account));
    console.log(`Account balance (ETH): ${balance}`);
    done();
  });

  test.skip("should get kayber expected rate", async (done) => {
    const kyber = KyberNetworkProxyFactory.connect(addresses.kyber.kyberNetworkProxy, provider());
    const amount = ethers.utils.parseEther("1").toString();

    const daiEthRate = await kyber.getExpectedRate(daiAddress, ethAddress, amount);
    expect(daiEthRate).not.toBe(null);
    console.log(`Kyber DAI-ETH expectedRate: ${daiEthRate.expectedRate}, slippageRate: ${daiEthRate.slippageRate}`);

    const ethDaiRate = await kyber.getExpectedRate(ethAddress, daiAddress, amount);
    expect(ethDaiRate).not.toBe(null);
    console.log(`Kyber ETH-DAI expectedRate: ${ethDaiRate.expectedRate}, slippageRate: ${ethDaiRate.slippageRate}`);
    done();
  });

  test("should get uniswap amount out", async (done) => {
    const amount = ethers.utils.parseEther("1").toString();
    const amount_dai = ethers.utils.parseEther("400").toString();

    const DAI = new Token(ChainId.MAINNET, daiAddress, 18);
    const daiWeth = await Fetcher.fetchPairData(DAI, WETH[DAI.chainId]);

    // input weth, get dai
    const amountOutDai = daiWeth.getOutputAmount(new TokenAmount(WETH[DAI.chainId], amount));
    const amountOutDaiExact = amountOutDai[0].toExact();
    console.log(`AmountOut Dai(Exact): ${amountOutDaiExact}`);
    expect(amountOutDai).not.toBe(null);

    const sellRoute = new Route([daiWeth], WETH[DAI.chainId]);
    const buyRoute = new Route([daiWeth], DAI);

    const uniswapResults = await Promise.all([
      new Trade(buyRoute, new TokenAmount(DAI, amount), TradeType.EXACT_INPUT),
      new Trade(sellRoute, new TokenAmount(WETH[DAI.chainId], amount_dai), TradeType.EXACT_INPUT),
    ]);

    const buy = 400 / parseFloat(uniswapResults[0].executionPrice.invert().toSignificant(6));
    const sell = parseFloat(uniswapResults[1].executionPrice.toSignificant(6)) / 1;
    console.log(`buy: ${buy}`);
    console.log(`sell: ${sell}`);

    expect(buy).toBeGreaterThan(0);
    expect(sell).toBeGreaterThan(0);
    done();
  });

  test.skip("should get eth price", async (done) => {
    const kyber = KyberNetworkProxyFactory.connect(addresses.kyber.kyberNetworkProxy, provider());
    const amount = ethers.utils.parseEther("1").toString();

    const ethDaiRate = await kyber.getExpectedRate(ethAddress, daiAddress, amount);
    const ethPrice = ethers.utils.formatEther(ethDaiRate.expectedRate);
    console.log(`eth price is ${ethPrice}`);

    expect(parseFloat(ethPrice)).toBeGreaterThan(0);
    done();
  });

  test.skip("borrowing DAI from Maker", async (done) => {
    const dai = Ierc20Factory.connect(daiAddress, wallet());
    const vaultManager = VaultManagerFactory.connect(contractAddresses.vaultManager, wallet()); // wallet instead of provider

    const amount = ethers.utils.parseEther("2000");
    console.log(`Borrowing DAI from Maker`);

    const options = {
      value: amount,
      gasLimit: 2000000,
      gasPrice: 1,
    };

    const tx = await vaultManager.openVault(
      addresses.makerdao.CDP_MANAGER,
      addresses.makerdao.MCD_JUG,
      addresses.makerdao.MCD_JOIN_ETH_A,
      addresses.makerdao.MCD_JOIN_DAI,
      amount,
      options
    );
    await tx.wait();

    console.log(`account is ${account}`);
    const daiAdminBalance = await dai.balanceOf(account);
    console.log(`DAI balance of Your account: ${ethers.utils.formatEther(daiAdminBalance)}`);

    expect(daiAdminBalance.toString()).toBe(amount.toString());
    done();
  });

  test.skip("transfer half of DAI to faucet", async (done) => {
    const dai = Ierc20Factory.connect(daiAddress, wallet());
    const amount = ethers.utils.parseEther("1000");

    const options = {
      gasLimit: 2000000,
      gasPrice: 1,
    };

    const tx = await dai.transfer(contractAddresses.daiFaucet, amount, options);
    await tx.wait();

    const daiAdminBalance = await dai.balanceOf(account);
    console.log(`DAI balance of Your account: ${ethers.utils.formatEther(daiAdminBalance)}`);

    const daiFaucetBalance = await dai.balanceOf(contractAddresses.daiFaucet);
    console.log(`DAI balance of faucet: ${ethers.utils.formatEther(daiFaucetBalance)}`);

    expect(daiAdminBalance.toString()).toBe(daiFaucetBalance.toString());
    done();
  });

  test.skip("initiate Flashloan", async (done) => {
    const flashloan = FlashloanFactory.connect(contractAddresses.flashloan, wallet());
    const amount = ethers.utils.parseEther("1000");

    const direction = {
      KYBER_TO_UNISWAP: 0,
      UNISWAP_TO_KYBER: 1,
    };

    console.log("Initiating flashloan Kyber => Uniswap");

    const options = {
      gasLimit: 2000000,
      gasPrice: 1,
    };

    const tx = await flashloan.initateFlashLoan(addresses.dydx.solo, addresses.tokens.dai, amount, direction.KYBER_TO_UNISWAP, options);
    await tx.wait();

    const newArbitrage = flashloan.interface.getEvent("NewArbitrage");
    const logs = await flashloan.provider.getLogs({
      toBlock: "latest",
      address: contractAddresses.flashloan,
      topics: [flashloan.interface.getEventTopic(newArbitrage)],
    });

    logs.forEach((log) => {
      const logData = flashloan.interface.parseLog(log);
      console.log(chalk.green(logData));
    });

    done();
  });
});
