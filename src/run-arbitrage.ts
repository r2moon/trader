require("dotenv").config();
import fs from "fs";
import chalk from "chalk";

import addresses from "../addresses";
import {KyberNetworkProxyFactory} from "../types/ethers-contracts/KyberNetworkProxyFactory";
import {ethers} from "ethers";

import {FlashloanFactory} from "../types/ethers-contracts/FlashloanFactory";
import FlashloanContract from "../build/contracts/Flashloan.json";

import {Flashloan} from "../types/ethers-contracts/Flashloan";
import {MongoClient} from "mongodb";
import {Util} from "./util";
import {Price} from "./price";
import config from "../config.json";

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

const amount_eth = Util.Config.amount_eth;
const network = Util.Config.network;
const daiAddress = Util.Address.daiAddress;
const wethAddress = Util.Address.wethAddress;
const ethAddress = Util.Address.ethAddress;
const soloMarginAddress = Util.Address.soloMarginAddress;

let ethPrice: number;

const main = async () => {
  const networkId = network.network_id;
  console.log(`Network ID is ${networkId}`);

  updateEtherPrice();

  // https://docs.ethers.io/v5/api/providers/provider/
  provider.on("block", async (block) => {
    console.log(`New block received. Block number: ${block}`);

    const amount_eth_wei = ethers.utils.parseEther(amount_eth.toString());
    const amount_dai_wei = ethers.utils.parseEther((amount_eth * ethPrice).toString());

    // fetch kyber buy / sell rates
    const kyberRates = await Price.FetchKyberRates();
    console.log(chalk.green("Kyber ETH/DAI"));
    console.log(kyberRates);

    const uniswapRates = await Price.FetchUniswapRates(ethPrice);
    console.log(chalk.blue("Uniswap ETH/DAI"));
    console.log(uniswapRates);

    if (kyberRates.buy < uniswapRates.sell) {
      const flashloan = FlashloanFactory.connect(FlashloanContract.networks[networkId].address, wallet);
      const [gasPrice, gasLimit] = await Promise.all([
        provider.getGasPrice(),
        // todo: estimateGas throws `gas required exceeds allowance or always failing transaction` error
        // flashloan.estimateGas.initateFlashLoan(soloMarginAddress, daiAddress, amount_dai_wei, Direction.KYBER_TO_UNISWAP),
        // hard code temporarily
        network.gas,
      ]);

      const txCost = gasPrice.mul(gasLimit);
      console.log(`txCost is ${txCost}`);

      const gross = amount_eth * (uniswapRates.sell - kyberRates.buy);
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
        const tx = await flashloan.initateFlashLoan(soloMarginAddress, daiAddress, amount_dai_wei, Direction.KYBER_TO_UNISWAP, options);
        const recipt = await tx.wait();
        console.log(`Transaction hash: ${recipt.transactionHash}`);

        saveFlashloanEventLog(flashloan, block);
      }
    } else if (uniswapRates.buy < kyberRates.sell) {
      const flashloan = FlashloanFactory.connect(FlashloanContract.networks[networkId].address, wallet);
      const [gasPrice, gasLimit] = await Promise.all([provider.getGasPrice(), network.gas]);

      const txCost = gasPrice.mul(gasLimit);
      console.log(`txCost is ${txCost}`);

      const gross = amount_eth * (kyberRates.sell - uniswapRates.buy);
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
        const tx = await flashloan.initateFlashLoan(soloMarginAddress, daiAddress, amount_dai_wei, Direction.UNISWAP_TO_KYBER, options);
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
