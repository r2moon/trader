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

const token1 = Util.Config.token1;
if (!token1) {
  console.log(chalk.red("Must assign token for swap"));
  process.exit();
}
if (!Util.Config.isValidToken1()) {
  console.log(chalk.red("Token1 is unsupported. Assign one of the following tokens: dai | usdc | weth"));
  process.exit();
}

const token2 = Util.Config.token2;
if (!Util.Config.isValidToken2()) {
  console.log(chalk.red("Token2 is unsupported. Assign one of the following tokens: eth | bat | knc | lend | link | mkr | susd"));
  process.exit();
}

// init provider and wallet
// https://docs.ethers.io/v5/api/providers/other/#WebSocketProvider
const provider = new ethers.providers.WebSocketProvider(infuraUri);
const wallet = new ethers.Wallet(privKey, provider);

const amount_token2 = Util.Config.amount_token2;
const network = Util.Config.network;
const txcost_gas_limit = Util.Config.txcost_gas_limit;
const txcost_gas_price_buff_in_wei = Util.Config.txcost_gas_price_buff_in_wei;
const kyber_service_fee = Util.Config.kyber_service_fee;
const uniswap_service_fee = Util.Config.uniswap_service_fee;
const profit_threshold = Util.Config.profit_threshold;

const token1Address = Util.Address.Token1.resolveTokenAddress(token1);
const token2Address = Util.Address.Token2.resolveTokenAddress(token2);
const soloMarginAddress = Util.Address.soloMarginAddress;
const ethAddress = Util.Address.Token2.ethAddress;

// define how many blocks to wait after an arb is identified and a trade is made
const wait_blocks = Util.Config.wait_blocks;
let wait_blocks_arr: Array<number> = [];

const main = async () => {
  const networkId = network.network_id;
  console.log(`Network ID is ${networkId}`);
  console.log(`Token1 is ${token1}`);
  console.log(`Token2 is ${token2}`);

  // https://docs.ethers.io/v5/api/providers/provider/
  provider.on("block", async (block) => {
    console.log(`New block received. Block number: ${block}`);

    // eth price is just used to calc profit. We use dai to get eth / usd rate
    const ethPrice = await Price.getToken2vsToken1Rate(Util.Address.Token1.daiAddress, ethAddress, provider);
    console.log(`eth price is ${ethPrice}`);

    // token2 / token1 rate
    const tokenPairRate = await Price.getToken2vsToken1Rate(token1Address, token2Address, provider);
    console.log(chalk.green(`${token2}/${token1} rate: ${tokenPairRate}`));

    const token1EthRate = await Price.getToken2vsToken1Rate(token1Address, ethAddress, provider);

    const amount_token1 = amount_token2 * tokenPairRate;
    const amount_token1_wei = ethers.utils.parseEther(amount_token1.toString());

    // fetch kyber buy / sell rates
    const kyberRates = await Price.FetchKyberRates(token1Address, token2Address, amount_token2);
    console.log(chalk.green(`Kyber ${token2}/${token1}`));
    console.log(kyberRates);

    const uniswapRates = await Price.FetchUniswapRates(tokenPairRate, token1Address, token2Address);
    console.log(chalk.blue(`Uniswap ${token2}/${token1}`));
    console.log(uniswapRates);

    saveBlockInfo(block, kyberRates, uniswapRates);

    // skip block if an arb was just identified
    if (wait_blocks_arr.includes(block)) {
      wait_blocks_arr = wait_blocks_arr.filter((i) => i != block);
      console.log(`Skip block: ${block}`);
      return;
    }

    if (kyberRates.buy < uniswapRates.sell || uniswapRates.buy < kyberRates.sell) {
      // prettier-ignore
      const direction =
        kyberRates.buy < uniswapRates.sell
          ? token2 == "eth"
            ? Direction.KYBER_TO_UNISWAP
            : Direction.KYBER_TOKEN_UNISWAP
          : token2 == "eth"
            ? Direction.UNISWAP_TO_KYBER
            : Direction.UNISWAP_TOKEN_KYBER;

      const flashloan = FlashloanFactory.connect(FlashloanContract.networks[networkId].address, wallet);
      const avgGasPrice = await provider.getGasPrice();

      const [gasPrice, gasLimit] = await Promise.all([
        // avg gas price + 10Gwei set in config.json
        avgGasPrice.add(txcost_gas_price_buff_in_wei),
        txcost_gas_limit,
      ]);

      console.log(`gas price is ${ethers.utils.formatUnits(gasPrice, "gwei")} GWei`);

      const txCost = gasPrice.mul(gasLimit);
      console.log(`txCost is ${ethers.utils.formatEther(txCost)} ETH (${parseFloat(ethers.utils.formatEther(txCost)) * ethPrice} USD)`);

      const unitGross =
        direction == (Direction.KYBER_TO_UNISWAP || Direction.KYBER_TOKEN_UNISWAP)
          ? uniswapRates.sell - kyberRates.buy
          : kyberRates.sell - uniswapRates.buy;

      const gross = amount_token2 * unitGross;
      console.log(`gross is ${gross} ${token1} (${(gross / token1EthRate) * ethPrice} USD)`);

      const kyberServiceFee = ((amount_token1 * kyber_service_fee) / token1EthRate) * ethPrice;
      const uniswapServiceFee = ((amount_token1 * uniswap_service_fee) / token1EthRate) * ethPrice;
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
        console.log(chalk.green(`Direction: ${resolveDirection(direction)}`));
        console.log(`Expected profit: ${profit} USD`);

        const record = `Time: ${new Date().toISOString()}, Block: ${block}, Direction: ${resolveDirection(direction)}, profit: ${profit}\n`;
        // save arbs to local file
        fs.appendFile("arbs.log", record, (err) => {
          if (err) console.log(err);
        });

        const options = {
          gasPrice: avgGasPrice,
          gasLimit: txcost_gas_limit,
        };

        try {
          const tx = await flashloan.initateFlashLoan(
            soloMarginAddress,
            amount_token1_wei,
            token1Address,
            token2Address,
            direction,
            options
          );
          const recipt = await tx.wait();
          const txHash = recipt.transactionHash;
          console.log(`Transaction hash: ${txHash}`);

          saveTransactionHash(txHash);
          saveFlashloanEventLog(flashloan, block);
        } catch (e) {
          console.log(`tx error!`);
          console.log(e);
        }
      }
    }
  });
};

export enum Direction {
  KYBER_TO_UNISWAP = 0,
  UNISWAP_TO_KYBER = 1,
  KYBER_TOKEN_UNISWAP = 2,
  UNISWAP_TOKEN_KYBER = 3,
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

const resolveDirection = (direction: Direction, token?: string): string => {
  switch (direction) {
    case Direction.KYBER_TO_UNISWAP:
      return "Kyber to Uniswap";
    case Direction.UNISWAP_TO_KYBER:
      return "Uniswap to Kyber";
    case Direction.KYBER_TOKEN_UNISWAP:
      return `Kyber token Uniswap ${token}`;
    case Direction.UNISWAP_TOKEN_KYBER:
      return `Uniswap token Kyber ${token}`;
    default:
      // no, it's impossible
      return "Unknown";
  }
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
