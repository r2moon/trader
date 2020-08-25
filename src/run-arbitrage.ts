import fs from "fs";
import chalk from "chalk";

import {ethers} from "ethers";

import {FlashloanFactory} from "../types/ethers-contracts/FlashloanFactory";
import FlashloanContract from "../build/contracts/Flashloan.json";

import {Flashloan} from "../types/ethers-contracts/Flashloan";
import {MongoClient} from "mongodb";
import {Util} from "./util";
import {Price} from "./price";
import config from "../config.json";

// read infura uri and private key from .env
const infuraUri = Util.Env.infuraUri;
if (!infuraUri) {
  console.log(chalk.red("Must assign INFURA_URI"));
  process.exit();
}

const privKey = Util.Env.privKey;
if (!privKey) {
  console.log(chalk.red("Must assign PRIVATE_KEY"));
  process.exit();
}

// init provider and wallet
// https://docs.ethers.io/v5/api/providers/other/#WebSocketProvider
const provider = new ethers.providers.WebSocketProvider(infuraUri);
const wallet = new ethers.Wallet(privKey, provider);

const amount_eth = Util.Config.amount_eth;
const network = Util.Config.network;
const txcost_gas_limit = Util.Config.txcost_gas_limit;
const txcost_gas_price_buff_in_wei = Util.Config.txcost_gas_price_buff_in_wei;
const kyber_service_fee = Util.Config.kyber_service_fee;
const uniswap_service_fee = Util.Config.uniswap_service_fee;
const profit_threshold = Util.Config.profit_threshold;
const daiAddress = Util.Address.daiAddress;
const soloMarginAddress = Util.Address.soloMarginAddress;

// define how many blocks to wait after an arb is identified and a trade is made
const wait_blocks = Util.Config.wait_blocks;
let wait_blocks_arr: Array<number> = [];

const main = async () => {
  const networkId = network.network_id;
  console.log(`Network ID is ${networkId}`);

  // https://docs.ethers.io/v5/api/providers/provider/
  provider.on("block", async (block) => {
    console.log(`New block received. Block number: ${block}`);

    // skip block if an arb was just identified
    if (wait_blocks_arr.includes(block)) {
      wait_blocks_arr = wait_blocks_arr.filter((i) => i != block);
      console.log(`Skip block: ${block}`);
      return;
    }

    const ethPrice = await Price.getEtherPrice(provider);
    console.log(chalk.magenta(`eth price is ${ethPrice}`));

    const amount_dai = amount_eth * ethPrice;
    const amount_dai_wei = ethers.utils.parseEther(amount_dai.toString());

    // fetch kyber buy / sell rates
    const kyberRates = await Price.FetchKyberRates();
    console.log(chalk.green("Kyber ETH/DAI"));
    console.log(kyberRates);

    const uniswapRates = await Price.FetchUniswapRates(ethPrice);
    console.log(chalk.blue("Uniswap ETH/DAI"));
    console.log(uniswapRates);

    saveBlockInfo(block, kyberRates, uniswapRates);

    if (kyberRates.buy < uniswapRates.sell || uniswapRates.buy < kyberRates.sell) {
      const direction = kyberRates.buy < uniswapRates.sell ? Direction.KYBER_TO_UNISWAP : Direction.UNISWAP_TO_KYBER;
      const flashloan = FlashloanFactory.connect(FlashloanContract.networks[networkId].address, wallet);
      const avgGasPrice = await provider.getGasPrice();

      const [gasPrice, gasLimit] = await Promise.all([
        // avg gas price + 10Gwei set in config.json
        avgGasPrice.add(txcost_gas_price_buff_in_wei),
        // set gaslimit to 1200000 based on this tx
        // https://bloxy.info/tx/0xaa45cb18083e42eb77fd011e8ef6e93750fca6ebdddb803859db2c99c10818dc
        txcost_gas_limit,
      ]);

      console.log(`gas price is ${ethers.utils.formatUnits(gasPrice, "gwei")} GWei`);

      const txCost = gasPrice.mul(gasLimit);
      console.log(`txCost is ${ethers.utils.formatEther(txCost)} ETH (${parseFloat(ethers.utils.formatEther(txCost)) * ethPrice} USD)`);

      const unitGross = direction == Direction.KYBER_TO_UNISWAP ? uniswapRates.sell - kyberRates.buy : kyberRates.sell - uniswapRates.buy;
      const gross = amount_eth * unitGross;
      console.log(`gross is ${gross} USD`);

      const kyberServiceFee = amount_dai * kyber_service_fee;
      const uniswapServiceFee = amount_dai * uniswap_service_fee;
      console.log(`kyber service fee is ${kyberServiceFee} USD`);
      console.log(`uniswap service fee is ${uniswapServiceFee} USD`);

      const cost = parseFloat(ethers.utils.formatEther(txCost)) * ethPrice + kyberServiceFee + uniswapServiceFee;
      console.log(`cost is ${cost} USD`);

      const profit = gross - cost;
      console.log(`profit is ${profit} USD`);

      if (profit >= profit_threshold) {
        if (!wait_blocks_arr.length) {
          // wait 10 blocks (start from next block)
          wait_blocks_arr = Array.from(Array(wait_blocks), (_, i) => i + block + 1);
        }

        const balance = await provider.getBalance(wallet.address);
        console.log(`wallet balance is ${ethers.utils.formatEther(balance)} ETH`);

        // check wallet balance. Skip if not enough balance
        const insufficientBalance = balance.lte(txCost); // balance less than txCost
        if (insufficientBalance) {
          console.log(`Insufficient balance. Skip`);
          return;
        }

        console.log(chalk.green("Arbitrage opportunity found!"));
        console.log(chalk.green(`Direction: ${direction == Direction.KYBER_TO_UNISWAP ? "Kyber => Uniswap" : "Uniswap => Kyber"}`));
        console.log(`Expected profit: ${profit} dai`);

        const record = `Time: ${new Date().toISOString()}, Block: ${block}, Direction: ${
          direction == Direction.KYBER_TO_UNISWAP ? "Kyber => Uniswap" : "Uniswap => Kyber"
        }, profit: ${profit}\n`;

        // save arbs to local file
        fs.appendFile("arbs.log", record, (err) => {
          if (err) console.log(err);
        });

        const options = {
          gasPrice: avgGasPrice,
          gasLimit: txcost_gas_limit,
        };

        const tx = await flashloan.initateFlashLoan(soloMarginAddress, daiAddress, amount_dai_wei, direction, options);
        const recipt = await tx.wait();
        const txHash = recipt.transactionHash;
        console.log(`Transaction hash: ${txHash}`);

        saveTransactionHash(txHash);
        saveFlashloanEventLog(flashloan, block);
      }
    }
  });
};

export enum Direction {
  KYBER_TO_UNISWAP = 0,
  UNISWAP_TO_KYBER = 1,
}

const saveBlockInfo = async (block: number, kyberPrice: Price, uniwapPrice: Price) => {
  const blockInfo = {
    block,
    kyberBuy: kyberPrice.buy,
    kyberSell: kyberPrice.sell,
    uniswapBuy: uniwapPrice.buy,
    uniswapSell: uniwapPrice.sell,
  };

  if (config.save_to_mongodb) {
    saveToMongoDB(blockInfo, "blockInfo");
  } else {
    // else save to local file
    fs.appendFile("blockInfo.log", JSON.stringify(blockInfo) + "\n", (err) => {
      if (err) console.log(err);
    });
  }
};

const saveTransactionHash = async (txHash: string) => {
  if (config.save_to_mongodb) {
    saveToMongoDB({tx: txHash}, "txHash");
  }

  // else save to local file
  fs.appendFile("transactionHash.log", txHash + "\n", (err) => {
    if (err) console.log(err);
  });
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
      saveToMongoDB({log: record}, "profits");
    }

    // else save to local file
    fs.appendFile("transaction.log", record, (err) => {
      if (err) console.log(err);
    });
  });
};

// save data to mongodb atlas
const saveToMongoDB = async (record: Object, collection: string) => {
  // console.log("Connected to Database");
  const db = (await mongoClient.getInstance()).db("flashloan");
  const profits = db.collection(collection);
  await profits.insertOne(record).catch((err: Error) => console.error(err));
  // console.log(result);
};

const mongoClient = (() => {
  let instance: MongoClient;
  const createInstance = async () => {
    console.log("Connecting to Database");
    const connectString = `mongodb+srv://flashloan:${Util.Env.mongodb_pwd}@cluster0-eosoe.mongodb.net/flashloan?retryWrites=true&w=majority`;
    return await MongoClient.connect(connectString, {
      useUnifiedTopology: true,
    });
  };

  return {
    getInstance: async () => {
      if (!instance) {
        instance = await createInstance();
      }
      return instance;
    },
  };
})();

// main logic
main();
