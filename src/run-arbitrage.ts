require("console.table");
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
import addresses from "../addresses";

const info = (...text: unknown[]) => {
  console.log(chalk.yellow(text));
};

const error = (...text: unknown[]) => {
  console.log(chalk.red(text));
};

const success = (...text: unknown[]) => {
  console.log(chalk.green(text));
};

const dryrun = Util.Config.dryrun;
if (dryrun) {
  info("⚠ You are running on DRYRUN mode\n");
}

// read infura uri and private key from .env
const infuraUri = Util.Env.infuraUri;
if (!infuraUri) {
  error("⚠ Must assign INFURA_URI\n");
  process.exit();
}

const privKey = Util.Env.privKey;
if (!privKey) {
  error("⚠ Must assign PRIVATE_KEY\n");
  process.exit();
}

const amount_token1_in_eth = Util.Config.amount_token1_in_eth;
if (!amount_token1_in_eth) {
  error("⚠ Must assign amount_token1_in_eth for swap\n");
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
let wait_blocks_map: Map<string /* token1_token2 */, Array<number> /* index to skip */> = new Map();

const token1List = Object.keys(addresses.tokens.token1);
const token2List = Object.keys(addresses.tokens.token2);

const eth = Util.Address.Token2.resolveToken("eth", 1);
const dai = Util.Address.Token2.resolveToken("dai");

const main = async () => {
  for (let i = 0; ; i++) {
    for (let token1 of token1List) {
      for (let token2 of token2List) {
        // skip invalid pairs
        if (await skipPair(token1, token2)) {
          info(`⚠ skip ${token1}/${token2}\n`);
          continue;
        }

        // go
        success(`\n***********************************${moment().tz("Asia/Tokyo").format()}***************************************\n`);
        await runArbitrage(token1, token2, i);
      }
    }
  }
};

const runArbitrage = async (token1Name: string, token2Name: string, index: number) => {
  info(`👀 Token pair is ${token1Name}/${token2Name}\n`);
  const token1 = Util.Address.Token1.resolveToken(token1Name);
  const token2 = Util.Address.Token2.resolveToken(token2Name);

  const ethToken1Rate = await Price.FetchKyberOutput(eth, token1, provider);
  const amount_token1 = amount_token1_in_eth * ethToken1Rate;
  token1.amount = amount_token1;

  const [kyberSwap, uniswapSwap] = await Promise.all([
    Price.FetchKyberOutput(token1, token2, provider),
    Price.FetchUniswapOutput(token1, token2),
  ]);

  const [uniswapReturn, kyberReturn] = await Promise.all([
    ((amount_token2) => {
      token2.amount = amount_token2;
      return Price.FetchUniswapOutput(token2, token1);
    })(kyberSwap),

    ((amount_token2) => {
      token2.amount = amount_token2;
      return Price.FetchKyberOutput(token2, token1, provider);
    })(uniswapSwap),
  ]);

  const rawProfit = await resolveProfitFound(uniswapReturn, kyberReturn, amount_token1);
  // prettier-ignore
  const record = {
    "Token Pair": `${token1Name}/${token2Name}`,
    "Input Token Amount": `${amount_token1.toFixed(3)} ${token1Name}`,
    "Kyber -> Uniswap": `${amount_token1.toFixed(3)} ${token1Name} -> ${kyberSwap.toFixed(3)} ${token2Name} -> ${uniswapReturn.toFixed(3)} ${token1Name}`,
    "Uniswap -> Kyber": `${amount_token1.toFixed(3)} ${token1Name} -> ${uniswapSwap.toFixed(3)} ${token2Name} -> ${kyberReturn.toFixed(3)} ${token1Name}`,
    "Profit Found": rawProfit,
  }

  console.table([record]);
  Object.assign(record, {Timestamp: moment().tz("Asia/Tokyo").format()});

  // skip this loop if an arb was just identified
  const indexesToSkip = wait_blocks_map[`${token1Name}_${token2Name}`] ?? [];
  if (indexesToSkip.includes(index)) {
    wait_blocks_map[`${token1Name}_${token2Name}`] = indexesToSkip.filter((i: number) => i != index);
    info(`⚠ Skip loop: ${index}`);
    return;
  }

  // if dryrun we always trigger it. Otherwise we check it profit found
  if (dryrun || rawProfit) {
    if (!dryrun) await saveInfo(record);

    const direction =
      uniswapReturn > amount_token1
        ? token2Name == "eth"
          ? Direction.KYBER_TO_UNISWAP
          : Direction.KYBER_TOKEN_UNISWAP
        : token2Name == "eth"
        ? Direction.UNISWAP_TO_KYBER
        : Direction.UNISWAP_TOKEN_KYBER;

    const directionInfo = await resolveDirection(direction, token1Name, token2Name);
    info(`👀 direction is ${directionInfo}\n`);

    const avgGasPrice = await provider.getGasPrice();
    const [gasPrice, gasLimit] = await Promise.all([
      // avg gas price + 10Gwei set in config.json
      avgGasPrice.add(txcost_gas_price_buff_in_wei),
      txcost_gas_limit,
    ]);
    info(`👀 gas price is ${ethers.utils.formatUnits(gasPrice, "gwei")} GWei\n`);

    // tx cost in token1
    const txCost = parseFloat(Util.weiToEther(gasPrice.mul(gasLimit))) * ethToken1Rate;
    info(`👀 txCost is ${txCost.toFixed(3)} ${token1Name}\n`);

    // gross in token1
    const gross =
      direction == (Direction.KYBER_TO_UNISWAP || Direction.KYBER_TOKEN_UNISWAP)
        ? uniswapReturn - amount_token1
        : kyberReturn - amount_token1;
    info(`👀 gross is ${gross} ${token1Name}\n`);

    const kyberServiceFee = amount_token1 * kyber_service_fee;
    const uniswapServiceFee = amount_token1 * uniswap_service_fee;
    info(`👀 Kyber service fee is ${kyber_service_fee} ${token1Name}\n`);
    info(`👀 Uniswap service fee is ${uniswapServiceFee} ${token1Name}\n`);

    // total cost
    const cost = txCost + kyberServiceFee + uniswapServiceFee;
    info(`👀 total cost is ${cost} ${token1Name}\n`);

    const profit = gross - cost;
    // eth price is just used to calc profit
    const ethPrice = await Price.FetchKyberOutput(eth, dai, provider);
    const profitInUSD = (profit / ethToken1Rate) * ethPrice;
    info(`👀 profit is ${profit} ${token1Name} (${profitInUSD} USD)\n`);

    if (dryrun || profit >= profit_threshold) {
      if (!dryrun && !indexesToSkip.length) {
        // wait 10 loops (start from next loop)
        wait_blocks_map[`${token1Name}_${token2Name}`] = Array.from(Array(wait_blocks), (_, i) => i + index + 1);
      }

      const balance = await provider.getBalance(wallet.address);
      // check wallet balance. Skip if not enough balance
      const insufficientBalance = balance.lte(gasPrice.mul(gasLimit)); // balance less than txCost wei
      if (insufficientBalance) {
        error(`⚠ Insufficient balance. Skip`);
        return;
      }

      success(`💰 Arbitrage opportunity found! ${dryrun ? "(dryrun ignores profit)" : ""}\n`);
      success(`💰 Direction: ${directionInfo}\n`);
      success(`💰 Expected profit: ${profit} USD\n`);

      const record = {time: moment().tz("Asia/Tokyo").format(), direction: directionInfo, profit: profit};
      saveArbInfo(record);

      const options = {
        gasLimit: txcost_gas_limit,
      };

      // if dryrun we don't call smartcontract
      if (dryrun) return;

      try {
        const networkId = network.network_id;
        const amount_token1_in_wei = Util.etherToWei(amount_token1_in_eth);
        const flashloan = FlashloanFactory.connect(FlashloanContract.networks[networkId].address, wallet);
        const tx = await flashloan.initateFlashLoan(
          soloMarginAddress,
          amount_token1_in_wei,
          token1.address,
          token2.address,
          direction,
          options
        );

        const recipt = await tx.wait();
        const txHash = recipt.transactionHash;
        info(`👀 Transaction hash: ${txHash}\n`);

        saveTransactionHash(txHash);
        saveFlashloanEventLog(flashloan);
      } catch (e) {
        error(`⚠ tx error!`);
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

const saveInfo = async (record: Object) => {
  if (config.save_to_mongodb) {
    saveToMongoDB(record, "priceInfo");
  } else {
    // else save to local file
    fs.appendFile("priceInfo.log", JSON.stringify(record) + "\n", (err) => {
      if (err) console.log(err);
    });
  }
};

const saveArbInfo = async (arb: Object) => {
  if (config.save_to_mongodb) {
    saveToMongoDB(arb, "arbs");
  }
  // save to local file
  fs.appendFile("arbs.log", JSON.stringify(arb) + "\n", (err) => {
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

// skip invalid pairs
export const skipPair = async (token1: string, token2: string) => {
  return (token1 == "weth" && token2 == "eth") || token1 == token2;
};

const resolveDirection = async (direction: Direction, token1: string, token2: string) => {
  switch (direction) {
    case Direction.KYBER_TO_UNISWAP:
      return `Kyber to Uniswap ${token1}/${token2}`;
    case Direction.UNISWAP_TO_KYBER:
      return `Uniswap to Kyber ${token1}/${token2}`;
    case Direction.KYBER_TOKEN_UNISWAP:
      return `Kyber token Uniswap ${token1}/${token2}`;
    case Direction.UNISWAP_TOKEN_KYBER:
      return `Uniswap token Kyber ${token1}/${token2}`;
    default:
      // no, it's impossible
      return "Unknown";
  }
};

const resolveProfitFound = async (uniswapReturn: number, kyberReturn: number, amount: number): Promise<string | boolean> => {
  if (uniswapReturn > amount) return `Kyber -> Uniswap (${(uniswapReturn - amount).toFixed(3)})`;
  if (kyberReturn > amount) return `Uniswap -> Kyber (${(kyberReturn - amount).toFixed(3)})`;
  return false;
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
