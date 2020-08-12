require("dotenv").config();
import fs from "fs";
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

import {Flashloan} from "./types/ethers-contracts/Flashloan";
import {MongoClient} from "mongodb";

const fetch = isNode ? nodeFetch : window.fetch;

// read eth amount and use mainnet fork flag from config.json
const AMOUNT_ETH = config.amount_eth;
const network = config.use_mainnet_fork ? truffleConfig.networks.mainnetFork : truffleConfig.networks.mainnet;

// read infura uri and private key from .env
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

// init provider and wallet
const provider = new ethers.providers.WebSocketProvider(infuraUri);
const wallet = new ethers.Wallet(privKey, provider);

const daiAddress = addresses.tokens.dai;
const wethAddress = addresses.tokens.weth;
const ethAddress = addresses.tokens.eth;
const soloMarginAddress = addresses.dydx.solo;
let ethPrice: number;

const main = async () => {
  const networkId = network.network_id;
  console.log(`Network ID is ${networkId}`);

  updateEtherPrice();

  // https://docs.ethers.io/v5/api/providers/provider/
  provider.on("block", async (block) => {
    console.log(`New block received. Block number: ${block}`);

    const AMOUNT_ETH_WEI = ethers.utils.parseEther(AMOUNT_ETH.toString());
    const AMOUNT_DAI_WEI = ethers.utils.parseEther((AMOUNT_ETH * ethPrice).toString());

    // fetch kyber buy / sell rates
    const [buy, sell] = await Promise.all([getKyberPrice(Action.Buy), getKyberPrice(Action.Sell)]);
    const kyberRates = {buy, sell};

    console.log(chalk.green("Kyber ETH/DAI"));
    console.log(kyberRates);

    // fetch uniswap buy / sell rates
    const [dai, weth] = await Promise.all([daiAddress, wethAddress].map((tokenAddress) => Token.fetchData(ChainId.MAINNET, tokenAddress)));
    const daiWeth = await Pair.fetchData(dai, weth);

    const uniswapResults = await Promise.all([
      daiWeth.getOutputAmount(new TokenAmount(dai, AMOUNT_DAI_WEI.toString())),
      daiWeth.getOutputAmount(new TokenAmount(weth, AMOUNT_ETH_WEI.toString())),
    ]);

    const uniswapRates = {
      buy: (AMOUNT_ETH * ethPrice) / parseFloat(uniswapResults[0][0].toExact()),
      sell: parseFloat(uniswapResults[1][0].toExact()) / AMOUNT_ETH,
    };

    console.log(chalk.blue("Uniswap ETH/DAI"));
    console.log(uniswapRates);

    if (kyberRates.buy < uniswapRates.sell) {
      const flashloan = FlashloanFactory.connect(FlashloanContract.networks[networkId].address, wallet);
      const [gasPrice, gasLimit] = await Promise.all([
        provider.getGasPrice(),
        // todo: estimateGas throws `gas required exceeds allowance or always failing transaction` error
        // flashloan.estimateGas.initateFlashLoan(soloMarginAddress, daiAddress, AMOUNT_DAI_WEI, Direction.KYBER_TO_UNISWAP),
        // hard code temporarily
        network.gas,
      ]);

      const txCost = gasPrice.mul(gasLimit);
      console.log(`txCost is ${txCost}`);

      const gross = AMOUNT_ETH * (uniswapRates.sell - kyberRates.buy);
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

        const options = {gasPrice, gasLimit};
        const tx = await flashloan.initateFlashLoan(soloMarginAddress, daiAddress, AMOUNT_DAI_WEI, Direction.KYBER_TO_UNISWAP, options);
        const recipt = await tx.wait();
        console.log(`Transaction hash: ${recipt.transactionHash}`);

        saveFlashloanEventLog(flashloan, block);
      }
    } else if (uniswapRates.buy < kyberRates.sell) {
      const flashloan = FlashloanFactory.connect(FlashloanContract.networks[networkId].address, wallet);
      const [gasPrice, gasLimit] = await Promise.all([provider.getGasPrice(), network.gas]);

      const txCost = gasPrice.mul(gasLimit);
      console.log(`txCost is ${txCost}`);

      const gross = AMOUNT_ETH * (kyberRates.sell - uniswapRates.buy);
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

        const options = {gasLimit, gasPrice};
        const tx = await flashloan.initateFlashLoan(soloMarginAddress, daiAddress, AMOUNT_DAI_WEI, Direction.UNISWAP_TO_KYBER, options);
        const recipt = await tx.wait();
        console.log(`Transaction hash: ${recipt.transactionHash}`);

        saveFlashloanEventLog(flashloan, block);
      }
    }
  });
};

const updateEtherPrice = async () => {
  const kyber = KyberNetworkProxyFactory.connect(addresses.kyber.kyberNetworkProxy, provider);
  const updateEthPrice = async () => {
    const expectedRate = (await kyber.getExpectedRate(ethAddress, daiAddress, 1)).expectedRate;
    ethPrice = parseFloat(ethers.utils.formatEther(expectedRate));
    console.log(`eth price is ${ethPrice}`);
  };
  await updateEthPrice();
  setInterval(updateEthPrice, 15000);
};

enum Direction {
  KYBER_TO_UNISWAP = 0,
  UNISWAP_TO_KYBER = 1,
}

enum Action {
  Sell = "sell",
  Buy = "buy",
}

const getKyberPrice = async (type: Action): Promise<number> => {
  const endpoint = `https://api.kyber.network/quote_amount?base=${ethAddress}&quote=${daiAddress}&base_amount=${AMOUNT_ETH}&type=${type}&platformFee=8`;
  const response = await fetch(endpoint);
  const result = await response.json();
  return result.data / AMOUNT_ETH;
};

// save event log to mongodb or local file
const saveFlashloanEventLog = async (flashloan: Flashloan, block: number) => {
  const newArbitrageEvent = flashloan.interface.getEvent("NewArbitrage");
  const logs = await flashloan.provider.getLogs({
    fromBlock: block,
    toBlock: "latest",
    address: flashloan.address,
    topics: [flashloan.interface.getEventTopic(newArbitrageEvent)],
  });

  logs.forEach((log) => {
    const logData = flashloan.interface.parseLog(log);
    const record = logData.args.toString();
    if (config.save_to_mongodb) {
      saveToMongoDB(record);
      return;
    }
    // else save to local file
    fs.appendFile("transaction.json", record, (err) => {
      if (err) console.log(err);
    });
  });
};

// save data to mongodb atlas
const saveToMongoDB = async (record: string) => {
  // mongodb atlas
  const connectString = `mongodb+srv://min:${process.env.MONGODB_PASSWORD}@cluster0-eosoe.mongodb.net/test?retryWrites=true&w=majority`;
  const mongoClient = await MongoClient.connect(connectString, {
    useUnifiedTopology: true,
  });

  console.log("Connected to Database");
  const db = mongoClient.db("flashloan");
  const profits = db.collection("profits");
  const result = await profits.insertOne(record).catch((err: Error) => console.error(err));
  console.log(result);
};

// main logic
main();
