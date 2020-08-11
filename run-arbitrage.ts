require("dotenv").config();

import isNode from "detect-node";
import nodeFetch from "node-fetch";
import chalk from "chalk";
import config from "./config.json";

import addresses from "./addresses";
import {KyberNetworkProxyFactory} from "./types/ethers-contracts/KyberNetworkProxyFactory";
import {ethers} from "ethers";
import {ChainId, Token, TokenAmount, Pair} from "@uniswap/sdk";

import {FlashloanFactory} from "./types/ethers-contracts/FlashloanFactory";
import FlashloanContract from "./build/contracts/Flashloan.json";
import truffleConfig from "./truffle-config";

const fetch = isNode ? nodeFetch : window.fetch;
// read amount eth from config.json
const AMOUNT_ETH = config.amount_eth;
// read infura uri from .env
const infuraUri = process.env.INFURA_URI;
if (!infuraUri) {
  console.log(chalk.red("Must assign INFURA_URI"));
  process.exit();
}

const privKey = process.env.PRIVATE_KEY;
if (!privKey) {
  console.log(chalk.red("Must assign PRIVATE_KEY"));
  process.exit();
}

const provider = new ethers.providers.WebSocketProvider(infuraUri);
const wallet = new ethers.Wallet(privKey, provider);

const kyber = KyberNetworkProxyFactory.connect(addresses.kyber.kyberNetworkProxy, provider);

const daiAddress = addresses.tokens.dai;
const wethAddress = addresses.tokens.weth;
const ethAddress = addresses.tokens.eth;
const soloAddress = addresses.dydx.solo;

const DIRECTION = {
  KYBER_TO_UNISWAP: 0,
  UNISWAP_TO_KYBER: 1,
};

let ethPrice: number;

const init = async () => {
  const networkId = truffleConfig.networks.mainnet.network_id;
  console.log(`Network ID is ${networkId}`);

  updateEtherPrice();

  // https://docs.ethers.io/v5/api/providers/provider/
  provider.on("block", async (block) => {
    console.log(`New block received. Block number: ${block}`);

    const AMOUNT_ETH_WEI = ethers.utils.parseEther(AMOUNT_ETH.toString());
    const AMOUNT_DAI_WEI = ethers.utils.parseEther((AMOUNT_ETH * ethPrice).toString());

    const [buy, sell] = await Promise.all([getKyberPrice(Action.Buy), getKyberPrice(Action.Sell)]);
    const kyberRates = {buy, sell};

    console.log(chalk.green("Kyber ETH/DAI"));
    console.log(kyberRates);

    const [dai, weth] = await Promise.all([daiAddress, wethAddress].map((tokenAddress) => Token.fetchData(ChainId.MAINNET, tokenAddress)));
    const daiWeth = await Pair.fetchData(dai, weth);

    const uniswapResults = await Promise.all([
      daiWeth.getOutputAmount(new TokenAmount(dai, AMOUNT_DAI_WEI.toString())),
      daiWeth.getOutputAmount(new TokenAmount(weth, AMOUNT_ETH_WEI.toString())),
    ]);

    const uniswapRates = {
      buy: AMOUNT_DAI_WEI.div(ethers.utils.parseEther(uniswapResults[0][0].toExact())).toNumber(),
      sell: ethers.utils.parseEther(uniswapResults[1][0].toExact()).div(AMOUNT_ETH_WEI).toNumber(),
    };

    console.log(chalk.blue("Uniswap ETH/DAI"));
    console.log(uniswapRates);

    if (kyberRates.buy < uniswapRates.sell) {
      const flashloan = FlashloanFactory.connect(FlashloanContract.networks[networkId].address, wallet);
      const [gasPrice, gasCost] = await Promise.all([
        provider.getGasPrice(),
        // todo estimateGas throws `gas required exceeds allowance or always failing transaction` error
        // flashloan.estimateGas.initateFlashLoan(
        //   addresses.dydx.solo,
        //   addresses.tokens.dai,
        //   AMOUNT_DAI_WEI,
        //   DIRECTION.KYBER_TO_UNISWAP,
        //   options
        // ),

        // hard code temporarily
        truffleConfig.networks.mainnet.gas,
      ]);

      const txCost = gasPrice.mul(gasCost);
      console.log(`txCost is ${txCost}`);

      const gross = parseFloat(ethers.utils.formatEther(AMOUNT_ETH_WEI)) * (uniswapRates.sell - kyberRates.buy);
      console.log(`gross is ${gross}`);

      const cost = parseFloat(ethers.utils.formatEther(txCost)) * ethPrice;
      console.log(`cost is ${cost}`);

      const profit = gross - cost;
      console.log(`profit is ${profit}`);

      if (profit > 0) {
        console.log(chalk.green("Arbitrage opportunity found!"));
        console.log(`Buy ETH from Kyber at ${kyberRates.buy} dai`);
        console.log(`Sell ETH to Uniswap at ${uniswapRates.sell} dai`);
        console.log(`Expected profit: ${profit} dai`);

        const options = {
          gasLimit: truffleConfig.networks.mainnet.gas,
          gasPrice: gasCost,
        };

        const tx = await flashloan.initateFlashLoan(
          addresses.dydx.solo,
          addresses.tokens.dai,
          AMOUNT_DAI_WEI,
          DIRECTION.KYBER_TO_UNISWAP,
          options
        );

        const recipt = await tx.wait();
        console.log(`Transaction hash: ${recipt.transactionHash}`);
      }
    } else if (uniswapRates.buy < kyber.sell) {
      const flashloan = FlashloanFactory.connect(FlashloanContract.networks[networkId].address, wallet);
      const [gasPrice, gasCost] = await Promise.all([
        provider.getGasPrice(),
        // hard code temporarily
        truffleConfig.networks.mainnet.gas,
      ]);

      const txCost = gasPrice.mul(gasCost);
      console.log(`txCost is ${txCost}`);

      const gross = parseFloat(ethers.utils.formatEther(AMOUNT_ETH_WEI)) * (kyberRates.sell - uniswapRates.buy);
      console.log(`gross is ${gross}`);

      const cost = parseFloat(ethers.utils.formatEther(txCost)) * ethPrice;
      console.log(`cost is ${cost}`);

      const profit = gross - cost;
      console.log(`profit is ${profit}`);

      if (profit > 0) {
        console.log(chalk.green("Arbitrage opportunity found!"));
        console.log(`Buy ETH from Uniswap at ${uniswapRates.buy} dai`);
        console.log(`Sell ETH to Kyber at ${kyberRates.sell} dai`);
        console.log(`Expected profit: ${profit} dai`);

        const options = {
          gasLimit: truffleConfig.networks.mainnet.gas,
          gasPrice: gasCost,
        };

        const tx = await flashloan.initateFlashLoan(
          addresses.dydx.solo,
          addresses.tokens.dai,
          AMOUNT_DAI_WEI,
          DIRECTION.UNISWAP_TO_KYBER,
          options
        );

        const recipt = await tx.wait();
        console.log(`Transaction hash: ${recipt.transactionHash}`);
      }
    }
  });
};

const updateEtherPrice = async () => {
  const updateEthPrice = async () => {
    const expectedRate = (await kyber.getExpectedRate(ethAddress, daiAddress, 1)).expectedRate;
    ethPrice = parseFloat(ethers.utils.formatEther(expectedRate));
    console.log(`eth price is ${ethPrice}`);
  };
  await updateEthPrice();
  setInterval(updateEthPrice, 15000);
};

enum Action {
  Sell = "sell",
  Buy = "buy",
}

const getKyberPrice = async (type: Action): Promise<number> => {
  const endpoint = `https://api.kyber.network/quote_amount?base=${addresses.tokens.eth}&quote=${addresses.tokens.dai}&base_amount=${AMOUNT_ETH}&type=${type}&platformFee=8`;
  const response = await fetch(endpoint);
  const result = await response.json();
  return result.data / AMOUNT_ETH;
};

init();
