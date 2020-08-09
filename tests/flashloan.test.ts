require("dotenv").config();
import {ethers, Contract} from "ethers";
import {KyberNetworkProxyFactory} from "../types/ethers-contracts/KyberNetworkProxyFactory";
// const Web3 = require("web3");

import Flashloan from "../build/contracts/TestableFlashloan.json";
import DaiFaucet from "../build/contracts/DaiFaucet.json";
import VaultManager from "../build/contracts/VaultManager.json";

import abis from "../abis";
import addresses from "../addresses";
import chalk from "chalk";

// const {mainnet: addresses} = require("./addresses");
import {startGanache, networkId, ganacheUri, wallet, provider, deployIdentityContract} from "./ganache";

import Ganache from "ganache-core";
// const web3 = new Web3("http://localhost:8545"); // mainnet fork

jest.setTimeout(100000);

// // start chain (mainnet or mainnet fork)
// const startChain = async () => {
//   // returns account address
//   return web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY).address;
// };

describe("Test flashloan", () => {
  // const AMOUNT_ETH = 1;
  // const RECENT_ETH_PRICE = 300;

  const WETH_AMOUNT = ethers.utils.parseEther("1");
  const DAI_AMOUNT = ethers.utils.parseEther("10");

  // const DOUBLE_DAI_AMOUNT = web3.utils.toWei(
  //   (AMOUNT_ETH * RECENT_ETH_PRICE * 2).toString()
  // );

  // const DIRECTION = {
  //   KYBER_TO_UNISWAP: 0,
  //   UNISWAP_TO_KYBER: 1,
  // };

  let account: string;
  let ganacheServer: Ganache.Server;

  beforeAll(async () => {
    ganacheServer = await startGanache();
    const contractAddress = await deployIdentityContract();
    console.log(`contact address is ${contractAddress}`);
    account = wallet().address;
    console.log(`account address is ${account}`);
  });

  afterAll(() => {
    ganacheServer.close();
  });

  test("account should be initialized", async () => {
    expect(account).not.toBe(undefined);
    expect(account).not.toBe("");
    console.log(`Account balance (ETH): ${ethers.utils.formatEther(await provider().getBalance(account))}`);
  });

  test("should get kayber expected rate", async () => {
    const kyber = KyberNetworkProxyFactory.connect(addresses.kyber.kyberNetworkProxy, provider());
    const daiEthRate = await kyber.getExpectedRate(
      addresses.tokens.dai,
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      DAI_AMOUNT.toString()
    );
    console.log(`Kyber DAI-ETH expectedRate: ${daiEthRate.expectedRate}, slippageRate: ${daiEthRate.slippageRate}`);

    // const kyber = new web3.eth.Contract(
    //   abis.kyber.kyberNetworkProxy,
    //   addresses.kyber.kyberNetworkProxy
    // );
    // const daiAddress = addresses.tokens.dai;
    // const daiEthRate = await kyber.methods
    //   .getExpectedRate(
    //     daiAddress,
    //     "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    //     DAI_AMOUNT
    //   )
    //   .call();
    // const ethDaiRate = await kyber.methods
    //   .getExpectedRate(
    //     "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    //     daiAddress,
    //     DAI_AMOUNT
    //   )
    //   .call();
    // console.log(
    //   `Kyber DAI-ETH expectedRate: ${daiEthRate.expectedRate}, slippageRate: ${daiEthRate.slippageRate}`
    // );
    // console.log(
    //   `Kyber ETH-DAI expectedRate: ${ethDaiRate.expectedRate}, slippageRate: ${ethDaiRate.slippageRate}`
    // );
    // expect(daiEthRate).not.toBe(null);
    // expect(ethDaiRate).not.toBe(null);
  });

  test.skip("should get uniswap amount out", async () => {
    // const {ChainId, Token, TokenAmount, Pair} = require("@uniswap/sdk");
    // const daiAddress = addresses.tokens.dai;
    // const wethAddress = addresses.tokens.weth;
    // const [dai, weth] = await Promise.all(
    //   [daiAddress, wethAddress].map((tokenAddress) =>
    //     Token.fetchData(ChainId.MAINNET, tokenAddress)
    //   )
    // );
    // const daiWeth = await Pair.fetchData(dai, weth);
    // // input weth, get dai
    // const amountOutDai = daiWeth.getOutputAmount(
    //   new TokenAmount(weth, WETH_AMOUNT)
    // );
    // const amountOutDaiExact = amountOutDai[0].toExact();
    // console.log(`AmountOut Dai(Exact): ${web3.utils.toWei(amountOutDaiExact)}`);
    // expect(amountOutDai).not.toBe(null);
  });

  test.skip("should get eth price", async () => {
    // const kyber = new web3.eth.Contract(
    //   abis.kyber.kyberNetworkProxy,
    //   addresses.kyber.kyberNetworkProxy
    // );
    // const daiAddress = addresses.tokens.dai;
    // const ONE_ETH_WEI = web3.utils.toBN(web3.utils.toWei("1"));
    // const results = await kyber.methods
    //   .getExpectedRate(
    //     "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    //     daiAddress,
    //     1
    //   )
    //   .call();
    // const ethPrice = web3.utils
    //   .toBN("1")
    //   .mul(web3.utils.toBN(results.expectedRate))
    //   .div(ONE_ETH_WEI);
    // console.log(`eth price is ${ethPrice}`);
  });

  test.skip("borrowing DAI from Maker", async () => {
    // const dai = new web3.eth.Contract(abis.tokens.erc20, addresses.tokens.dai);
    // const vaultManager = new web3.eth.Contract(
    //   VaultManager.abi,
    //   VaultManager.networks[networkId].address
    // );
    // console.log(
    //   `Borrowing ${web3.utils.fromWei(DOUBLE_DAI_AMOUNT)} DAI from Maker`
    // );
    // // the minimum amount of DAI is 20 when you create a vault.
    // await vaultManager.methods
    //   .openVault(
    //     addresses.makerdao.CDP_MANAGER,
    //     addresses.makerdao.MCD_JUG,
    //     addresses.makerdao.MCD_JOIN_ETH_A,
    //     addresses.makerdao.MCD_JOIN_DAI,
    //     DOUBLE_DAI_AMOUNT
    //   )
    //   .send({
    //     from: admin,
    //     gas: 2000000,
    //     gasPrice: 1,
    //     value: DOUBLE_DAI_AMOUNT,
    //   });
    // const daiAdminBalance = await dai.methods.balanceOf(admin).call();
    // console.log(
    //   `DAI balance of Your account: ${web3.utils.fromWei(daiAdminBalance)}`
    // );
    // expect(daiAdminBalance).toBe(DOUBLE_DAI_AMOUNT);
  });

  test.skip("transfer half of DAI to faucet", async () => {
    // const dai = new web3.eth.Contract(abis.tokens.erc20, addresses.tokens.dai);
    // const daiFaucetAddress = DaiFaucet.networks[networkId].address;
    // // transfer half to faucet while keep half
    // await dai.methods.transfer(daiFaucetAddress, DAI_AMOUNT).send({
    //   from: admin,
    //   gas: 2000000,
    //   gasPrice: 1,
    // });
    // const daiFaucetBalance = await dai.methods
    //   .balanceOf(daiFaucetAddress)
    //   .call();
    // console.log(
    //   `DAI balance of DaiFaucet: ${web3.utils.fromWei(daiFaucetBalance)}`
    // );
    // expect(daiFaucetBalance).toBe(DAI_AMOUNT);
    // const daiAdminBalance = await dai.methods.balanceOf(admin).call();
    // console.log(
    //   `DAI balance of Your account: ${web3.utils.fromWei(daiAdminBalance)}`
    // );
    // expect(daiAdminBalance).toBe(DAI_AMOUNT);
  });

  test.skip("initiate Flashloan", async () => {
    // const flashloan = new web3.eth.Contract(
    //   Flashloan.abi,
    //   Flashloan.networks[networkId].address
    // );
    // console.log("initiating flashloan Kyber => Uniswap");
    // const logs = await flashloan.methods
    //   .initateFlashLoan(
    //     addresses.dydx.solo,
    //     addresses.tokens.dai,
    //     DAI_AMOUNT,
    //     DIRECTION.KYBER_TO_UNISWAP
    //   )
    //   .send({
    //     from: admin,
    //     gas: 2000000,
    //     gasPrice: 1,
    //   });
    // // console.log(logs);
    // await logChainEvent(flashloan);
  });

  async function logChainEvent(flashloan: any) {
    // event listener
    // https://www.pauric.blog/How-to-Query-and-Monitor-Ethereum-Contract-Events-with-Web3/
    await flashloan
      .getPastEvents("allEvents", {
        toBlock: "latest",
      })
      .then((logs) => {
        logs.forEach((log) => {
          const record = `Event: ${log.event}, Return values: ${JSON.stringify(log.returnValues)}`;
          console.log(chalk.green(record));
        });
      })
      .catch((err) => {
        console.error(err);
      });
  }
});
