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
import moment from "moment-timezone";

const dryrun = Util.Config.dryrun;
if (dryrun) {
  console.log(chalk.yellowBright("ℹ You are running on DRY RUN mode\n"));
}

// read infura uri and private key from .env
const infuraUri = Util.Env.infuraUri;
if (!infuraUri) {
  console.log(chalk.red("ℹ Must assign INFURA_URI"));
  process.exit();
}

const privKey = Util.Env.privKey;
if (!privKey) {
  console.log(chalk.red("ℹ Must assign PRIVATE_KEY"));
  process.exit();
}

const amount_token1_in_eth = Util.Config.amount_token1_in_eth;
if (!amount_token1_in_eth) {
  console.log(chalk.red("ℹ Must assign amount_token1_in_eth for swap"));
  process.exit();
}

// init provider and wallet
const provider = new ethers.providers.JsonRpcProvider(infuraUri);
const wallet = new ethers.Wallet(privKey, provider);

const network = Util.Config.network;
const txcost_gas_limit = Util.Config.txcost_gas_limit;
const txcost_gas_price_buff_in_wei = Util.Config.txcost_gas_price_buff_in_wei;
const kyber_service_fee = Util.Config.kyber_service_fee;
const uniswap_service_fee = Util.Config.uniswap_service_fee;
const profit_threshold = Util.Config.profit_threshold;

const soloMarginAddress = Util.Address.soloMarginAddress;
const ethAddress = Util.Address.Token2.ethAddress;

// define how many blocks to wait after an arb is identified and a trade is made
const wait_blocks = Util.Config.wait_blocks;
let wait_blocks_arr: Array<number> = [];

const token1 = Util.Config.token1;
if (!token1) {
  console.log(chalk.red("ℹ Must assign token1 for swap"));
  process.exit();
}
if (!Util.Config.isValidToken1()) {
  console.log(chalk.red("ℹ Token1 is unsupported. Assign one of the following tokens: dai | usdc | weth"));
  process.exit();
}

const token2 = Util.Config.token2;
if (!token2) {
  console.log(chalk.red("ℹ Must assign token2 for swap"));
  process.exit();
}
if (!Util.Config.isValidToken2()) {
  console.log(chalk.red("ℹ Token2 is unsupported. Assign one of the following tokens: eth | bat | knc | lend | link | mkr | susd"));
  process.exit();
}

const main = async () => {
  console.log(`👀 Token1 is ${token1}\n`);
  console.log(`👀 Token2 is ${token2}\n`);

  for (let i = 0; ; i++) {
    await runArbitrage(token1, token2, i);
  }
};

const runArbitrage = async (token1: string, token2: string, index: number) => {
  const networkId = network.network_id;
  const resolvedToken1 = Util.Address.Token1.resolveToken(token1);
  const resolvedToken2 = Util.Address.Token2.resolveToken(token2);

  const token1Address = resolvedToken1.address;
  const token2Address = resolvedToken2.address;

  const ethToken1Rate = await Price.fetchKyberTokenPairRate(ethAddress, token1Address, provider);
  const amount_token1 = amount_token1_in_eth * ethToken1Rate;
  console.log(`👀 ${token1} amount: ${amount_token1}\n`);

  resolvedToken1.amount = amount_token1;

  const [kyberRates, uniswapRates] = await Promise.all([
    Price.FetchKyberRates([resolvedToken1], [resolvedToken2]),
    Price.FetchUniswapRates([resolvedToken1], [resolvedToken2]),
  ]);

  const kyberRate = kyberRates[0];
  const uniswapRate = uniswapRates[0];

  console.table([
    {
      "Token Pair": `${token1}/${token2}`,
      "Input Token Amount In ETH": `${amount_token1_in_eth}`,
      "Input Token Amount": `${amount_token1} ${token1}`,
      "Kyber Buy": kyberRate.buy,
      "Kyber Sell": kyberRate.sell,
      "Uniswap Buy": uniswapRate.buy,
      "Uniswap Sell": uniswapRate.sell,
      Timestamp: moment().tz("Asia/Tokyo").format(),
    },
  ]);

  saveInfo(kyberRate, uniswapRate);

  // skip this loop if an arb was just identified
  if (wait_blocks_arr.includes(index)) {
    wait_blocks_arr = wait_blocks_arr.filter((i) => i != index);
    console.log(`Skip loop: ${index}`);
    return;
  }

  // if dryrun we always trigger it
  if (dryrun || kyberRate.buy < uniswapRate.sell || uniswapRate.buy < kyberRate.sell) {
    // prettier-ignore
    const direction =
          kyberRate.buy < uniswapRate.sell
            ? token2 == "eth"
              ? Direction.KYBER_TO_UNISWAP
              : Direction.KYBER_TOKEN_UNISWAP
            : token2 == "eth"
              ? Direction.UNISWAP_TO_KYBER
              : Direction.UNISWAP_TOKEN_KYBER;

    console.log(`direction is ${resolveDirection(direction)}`);

    const avgGasPrice = await provider.getGasPrice();

    const [gasPrice, gasLimit] = await Promise.all([
      // avg gas price + 10Gwei set in config.json
      avgGasPrice.add(txcost_gas_price_buff_in_wei),
      txcost_gas_limit,
    ]);

    console.log(chalk.blue(`👀 gas price is ${ethers.utils.formatUnits(gasPrice, "gwei")} GWei`));

    const txCost = gasPrice.mul(gasLimit);

    // eth price is just used to calc profit
    const [ethPrice, token1EthRate, token2EthRate] = await Promise.all([
      Price.fetchKyberTokenPairRate(ethAddress, Util.Address.Token1.daiAddress, provider),
      Price.fetchKyberTokenPairRate(ethAddress, token1Address, provider),
      Price.fetchKyberTokenPairRate(ethAddress, token2Address, provider),
    ]);

    console.log(`txCost is ${ethers.utils.formatEther(txCost)} ETH (${parseFloat(ethers.utils.formatEther(txCost)) * ethPrice} USD)\n`);

    // gross in token2
    const gross =
      direction == (Direction.KYBER_TO_UNISWAP || Direction.KYBER_TOKEN_UNISWAP)
        ? uniswapRate.sell - kyberRate.buy
        : kyberRate.sell - uniswapRate.buy;

    console.log(chalk.yellow(`👀 gross is ${gross} ${token2} (${(gross / token2EthRate) * ethPrice} USD)\n`));

    const kyberServiceFee = ((amount_token1 * kyber_service_fee) / token1EthRate) * ethPrice;
    const uniswapServiceFee = ((amount_token1 * uniswap_service_fee) / token1EthRate) * ethPrice;
    console.log(chalk.yellow(`👀 Kyber service fee is ${amount_token1 * kyber_service_fee} ${token1} (${kyberServiceFee} USD)\n`));
    console.log(chalk.yellow(`👀 Uniswap service fee is ${amount_token1 * uniswap_service_fee} ${token1} (${uniswapServiceFee} USD)\n`));

    const cost = parseFloat(ethers.utils.formatEther(txCost)) * ethPrice + kyberServiceFee + uniswapServiceFee;
    console.log(chalk.yellow(`👀 cost is ${cost} USD\n`));

    const profit = gross - cost;
    console.log(chalk.yellow(`👀 profit is ${profit} USD\n`));

    if (dryrun || profit >= profit_threshold) {
      if (!dryrun && !wait_blocks_arr.length) {
        // wait 10 loops (start from next loop)
        wait_blocks_arr = Array.from(Array(wait_blocks), (_, i) => i + index + 1);
      }

      const balance = await provider.getBalance(wallet.address);
      // check wallet balance. Skip if not enough balance
      const insufficientBalance = balance.lte(txCost); // balance less than txCost
      if (insufficientBalance) {
        console.log(chalk.magenta(`⚠ Insufficient balance. Skip`));
        return;
      }

      console.log(chalk.green("ℹ Arbitrage opportunity found!\n"));
      console.log(chalk.green(`ℹ Direction: ${resolveDirection(direction)}\n`));
      console.log(`Expected profit: ${profit} USD\n`);

      const record = {time: moment().tz("Asia/Tokyo").format(), direction: resolveDirection(direction), profit: profit};
      saveArbInfo(record);

      const options = {
        gasLimit: txcost_gas_limit,
      };

      // if dryrun we don't call smartcontract
      if (dryrun) return;

      try {
        const amount_token1_in_wei = Util.etherToWei(amount_token1_in_eth);
        const flashloan = FlashloanFactory.connect(FlashloanContract.networks[networkId].address, wallet);
        const tx = await flashloan.initateFlashLoan(
          soloMarginAddress,
          amount_token1_in_wei,
          token1Address,
          token2Address,
          direction,
          options
        );
        const recipt = await tx.wait();
        const txHash = recipt.transactionHash;
        console.log(`Transaction hash: ${txHash}`);

        saveTransactionHash(txHash);
        saveFlashloanEventLog(flashloan);
      } catch (e) {
        console.log(`tx error!`);
        console.log(e);
        saveError(e);
      }
    }
  }
};

export enum Direction {
  KYBER_TO_UNISWAP = 0,
  UNISWAP_TO_KYBER = 1,
  KYBER_TOKEN_UNISWAP = 2,
  UNISWAP_TOKEN_KYBER = 3,
}

const saveInfo = async (kyberPrice: Price, uniwapPrice: Price) => {
  const blockInfo = {
    Timestamp: moment().tz("Asia/Tokyo").format(),
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

const saveArbInfo = async (arb: Object) => {
  if (config.save_to_mongodb) {
    saveToMongoDB(arb, "arb");
  }
  // save to local file
  fs.appendFile("arb.log", JSON.stringify(arb) + "\n", (err) => {
    if (err) console.log(err);
  });
};

const saveTransactionHash = async (txHash: string) => {
  if (config.save_to_mongodb) {
    saveToMongoDB({tx: txHash}, "txHash");
  }
  // save to local file
  fs.appendFile("transactionHash.log", txHash + "\n", (err) => {
    if (err) console.log(err);
  });
};

const saveError = async (e: Error) => {
  if (config.save_to_mongodb) {
    saveToMongoDB({error: e}, "txError");
  }
  // save to local file
  fs.appendFile("transactionError.log", e + "\n", (err) => {
    if (err) console.log(err);
  });
};

// save event log to mongodb or local file
const saveFlashloanEventLog = async (flashloan: Flashloan) => {
  const newArbitrageEvent = flashloan.interface.getEvent("NewArbitrage");
  const logs = await flashloan.provider.getLogs({
    fromBlock: "latest",
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
