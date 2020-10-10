require("console.table");
import fs from "fs";
import {ethers} from "ethers";
import {Util} from "./util";
import {Price} from "./price";
import config from "../config.json";
import moment from "moment-timezone";
import addresses from "../addresses";

import {TestableFlashloanFactory} from "../types/ethers-contracts/TestableFlashloanFactory";
import TestableFlashloanContract from "../build/contracts/TestableFlashloan.json";
import {FlashloanFactory} from "../types/ethers-contracts/FlashloanFactory";
import FlashloanContract from "../build/contracts/Flashloan.json";

const dryrun = Util.Config.dryrun;
if (dryrun) {
  Util.Log.info("⚠ You are running on DRYRUN mode");
}

// read infura uri and private key from .env
const infuraUri = Util.Env.infuraUri;
if (!infuraUri) {
  Util.Log.error("⚠ Must assign INFURA_URI");
  process.exit();
}

const privKey = Util.Env.privKey;
if (!privKey) {
  Util.Log.error("⚠ Must assign PRIVATE_KEY");
  process.exit();
}

const amount_token1_in_eth = Util.Config.amount_token1_in_eth;
if (!amount_token1_in_eth) {
  Util.Log.error("⚠ Must assign amount_token1_in_eth for swap");
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

// define how many blocks to wait after an arb is identified and a trade is made
const wait_blocks = Util.Config.wait_blocks;
let wait_blocks_map: Map<string /* token1_token2 */, Array<number> /* index to skip */> = new Map();

const token1List = Object.keys(addresses.tokens.token1);
const token2List = Object.keys(addresses.tokens.token2);

const eth = Util.Address.Token2.resolveToken("eth", 1);
const dai = Util.Address.Token2.resolveToken("dai");

const useTestnet = Util.Config.useTestnet;
const contract = useTestnet
  ? {
      FlashloanFactory: TestableFlashloanFactory,
      FlashloanContract: TestableFlashloanContract,
    }
  : {
      FlashloanFactory: FlashloanFactory,
      FlashloanContract: FlashloanContract,
    };

const main = async () => {
  if (useTestnet) {
    Util.Log.info("Running on Kovan testnet. Not all the token pairs are supported");
  }

  for (let i = 0; ; i++) {
    for (let token1 of token1List) {
      for (let token2 of token2List) {
        // skip invalid pairs
        if (await Util.skipPair(token1, token2)) {
          continue;
        }

        // go
        Util.Log.success(
          `\n***********************************${moment().tz("Asia/Tokyo").format()}***************************************`
        );
        await runArbitrage(token1, token2, i);

        // rate limit. remove me when local geth node completes sync up
        Util.sleep(1500);
      }
    }
  }
};

const runArbitrage = async (token1Name: string, token2Name: string, index: number) => {
  Util.Log.info(`👀 Token pair is ${token1Name}/${token2Name}`);
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
    Util.Log.info(`⚠ Skip loop: ${index}`);
    return;
  }

  // if dryrun we always trigger it. Otherwise we check if profit found
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
    Util.Log.info(`👀 direction is ${directionInfo}`);

    const avgGasPrice = await provider.getGasPrice();
    const [gasPrice, gasLimit] = await Promise.all([
      // avg gas price + 10Gwei set in config.json
      avgGasPrice.add(txcost_gas_price_buff_in_wei),
      txcost_gas_limit,
    ]);
    Util.Log.info(`👀 gas price is ${ethers.utils.formatUnits(gasPrice, "gwei")} GWei`);

    // tx cost in token1
    const txCost = parseFloat(Util.weiToEther(gasPrice.mul(gasLimit))) * ethToken1Rate;
    Util.Log.info(`👀 txCost is ${txCost.toFixed(3)} ${token1Name}`);

    // gross in token1
    const gross =
      direction == (Direction.KYBER_TO_UNISWAP || Direction.KYBER_TOKEN_UNISWAP)
        ? uniswapReturn - amount_token1
        : kyberReturn - amount_token1;
    Util.Log.info(`👀 gross is ${gross} ${token1Name}`);

    const kyberServiceFee = amount_token1 * kyber_service_fee;
    const uniswapServiceFee = amount_token1 * uniswap_service_fee;
    Util.Log.info(`👀 Kyber service fee is ${kyber_service_fee} ${token1Name}`);
    Util.Log.info(`👀 Uniswap service fee is ${uniswapServiceFee} ${token1Name}`);

    // total cost
    // this is not 100% accurate since we need to calculate the service fee by token2 when swap back. But it shouldn't matter so much
    const cost = txCost + kyberServiceFee + uniswapServiceFee;
    Util.Log.info(`👀 total cost is ${cost} ${token1Name}`);

    const profit = gross - cost;
    // eth price is just used to calc profit
    const ethPrice = await Price.FetchKyberOutput(eth, dai, provider);
    const profitInUSD = (profit / ethToken1Rate) * ethPrice;
    Util.Log.info(`👀 profit is ${profit} ${token1Name} (${profitInUSD} USD)`);

    if (dryrun || profitInUSD >= profit_threshold) {
      if (!dryrun && !indexesToSkip.length) {
        // wait 10 loops (start from next loop)
        wait_blocks_map[`${token1Name}_${token2Name}`] = Array.from(Array(wait_blocks), (_, i) => i + index + 1);
      }

      const balance = await provider.getBalance(wallet.address);
      // check wallet balance. Skip if not enough balance
      const insufficientBalance = balance.lte(gasPrice.mul(gasLimit)); // balance less than txCost wei
      if (!dryrun && insufficientBalance) {
        Util.Log.error(`⚠ Insufficient balance. Skip`);
        return;
      }

      Util.Log.success(`💰 Arbitrage opportunity found! ${dryrun ? "(dryrun ignores profit)" : ""}`);
      Util.Log.success(`💰 Direction: ${directionInfo}`);
      Util.Log.success(`💰 Expected profit: ${profitInUSD} USD`);

      const record = {time: moment().tz("Asia/Tokyo").format(), direction: directionInfo, profit: profit};
      saveArbInfo(record);

      // hard code a gas limit
      const options = {
        gasLimit: 6000000,
      };

      // if dryrun we just return
      if (dryrun) return;

      try {
        const networkId = network.network_id;
        const amount_token1_in_wei = Util.etherToWei(amount_token1_in_eth);
        const flashloan = contract.FlashloanFactory.connect(
          (useTestnet ? TestableFlashloanContract : FlashloanContract).networks[networkId].address,
          wallet
        );

        console.log(`flashloan address`, flashloan.address);

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
        Util.Log.info(`👀 Transaction hash: ${txHash}`);

        saveTransactionHash(txHash);
        await saveFlashloanEventLog(flashloan);
      } catch (e) {
        Util.Log.error(`⚠ tx error!`);
        Util.Log.error(e);
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
    Util.Storage.saveToMongoDB(record, "priceInfo");
  } else {
    // else save to local file
    fs.appendFile("priceInfo.log", JSON.stringify(record) + "\n", (err) => {
      if (err) Util.Log.error(err);
    });
  }
};

const saveArbInfo = async (arb: Object) => {
  if (config.save_to_mongodb) {
    Util.Storage.saveToMongoDB(arb, "arbs");
  }
  // save to local file
  fs.appendFile("arbs.log", JSON.stringify(arb) + "\n", (err) => {
    if (err) Util.Log.error(err);
  });
};

const saveTransactionHash = async (txHash: string) => {
  if (config.save_to_mongodb) {
    Util.Storage.saveToMongoDB({tx: txHash}, "txHash");
  }
  // save to local file
  fs.appendFile("transactionHash.log", txHash + "\n", (err) => {
    if (err) Util.Log.error(err);
  });
};

const saveError = async (e: Error) => {
  if (config.save_to_mongodb) {
    Util.Storage.saveToMongoDB({error: e}, "txError");
  }
  // save to local file
  fs.appendFile("transactionError.log", e + "\n", (err) => {
    if (err) Util.Log.error(err);
  });
};

// save event log to mongodb or local file
const saveFlashloanEventLog = async (flashloan) => {
  const newArbitrageEvent = flashloan.interface.getEvent("NewArbitrage");
  const logs = await flashloan.provider.getLogs({
    fromBlock: 0,
    address: flashloan.address,
    // topics: [flashloan.interface.getEventTopic(newArbitrageEvent)],
  });

  console.log(logs);
  // remove me!
  return;

  logs.forEach((log) => {
    const logData = flashloan.interface.parseLog(log);
    const record = logData.args.toString();
    if (config.save_to_mongodb) {
      Util.Storage.saveToMongoDB({log: record}, "profits");
    }

    // else save to local file
    fs.appendFile("transaction.log", record, (err) => {
      if (err) Util.Log.error(err);
    });
  });
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

// main logic
main();
