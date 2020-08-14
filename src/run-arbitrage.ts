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

const daiAddress = Util.Address.daiAddress;
const ethAddress = Util.Address.ethAddress;
const soloMarginAddress = Util.Address.soloMarginAddress;

let ethPrice: number;

const main = async () => {
  const networkId = network.network_id;
  console.log(`Network ID is ${networkId}`);

  updateEtherPrice();

  // https://docs.ethers.io/v5/api/providers/provider/
  provider
    .on("block", async (block) => {
      console.log(`New block received. Block number: ${block}`);

      const amount_dai = amount_eth * ethPrice;
      const amount_dai_wei = ethers.utils.parseEther(amount_dai.toString());

      // fetch kyber buy / sell rates
      const kyberRates = await Price.FetchKyberRates();
      console.log(chalk.green("Kyber ETH/DAI"));
      console.log(kyberRates);

      const uniswapRates = await Price.FetchUniswapRates(ethPrice);
      console.log(chalk.blue("Uniswap ETH/DAI"));
      console.log(uniswapRates);

      if (kyberRates.buy < uniswapRates.sell || uniswapRates.buy < kyberRates.sell) {
        const direction = kyberRates.buy < uniswapRates.sell ? Direction.KYBER_TO_UNISWAP : Direction.UNISWAP_TO_KYBER;
        const flashloan = FlashloanFactory.connect(FlashloanContract.networks[networkId].address, wallet);

        const [gasPrice, gasLimit] = await Promise.all([
          // avg gas price + 10Gwei set in config.json
          (await provider.getGasPrice()).add(txcost_gas_price_buff_in_wei),
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

        // let uniswapServiceFee: number, kyberServiceFee: number;
        // if (direction == Direction.KYBER_TO_UNISWAP) {
        //   // dai to eth in kyber. fee = dai amount * 0.2% DAI
        //   kyberServiceFee = amount_dai * kyber_service_fee;
        //   // eth to dai in uniswap. fee = eth_amount * 0.3% ETH
        //   uniswapServiceFee = amount_eth * uniswap_service_fee;
        //   // convert uniswap service fee from eth to dai
        //   uniswapServiceFee = uniswapServiceFee * ethPrice;
        // } else {
        //   // dai to eth in uniswap. fee = dai amount * 0.3% DAI
        //   uniswapServiceFee = amount_dai * uniswap_service_fee;
        //   // eth to dai in kyber. fee = eth amount * 0.2% ETH
        //   kyberServiceFee = amount_eth * kyber_service_fee;
        //   // convert kyber service fee from eth to dai
        //   kyberServiceFee = kyberServiceFee * ethPrice;
        // }
        // since amount_eth * ethPrice = amount_dai, so we simpify it
        const kyberServiceFee = amount_dai * kyber_service_fee;
        const uniswapServiceFee = amount_dai * uniswap_service_fee;

        console.log(`kyber service fee is ${kyberServiceFee} USD`);
        console.log(`uniswap service fee is ${uniswapServiceFee} USD`);

        const cost = parseFloat(ethers.utils.formatEther(txCost)) * ethPrice + kyberServiceFee + uniswapServiceFee;
        console.log(`cost is ${cost} USD`);

        const profit = gross - cost;
        console.log(`profit is ${profit} USD`);

        if (profit > 0) {
          console.log(chalk.green("Arbitrage opportunity found!"));
          console.log(chalk.green(`Direction: ${direction == Direction.KYBER_TO_UNISWAP ? "Kyber => Uniswap" : "Uniswap => Kyber"}`));
          console.log(`Expected profit: ${profit} dai`);

          const options = {
            gasPrice: await provider.getGasPrice(),
            gasLimit: network.gas,
          };

          const tx = await flashloan.initateFlashLoan(soloMarginAddress, daiAddress, amount_dai_wei, direction, options);
          const recipt = await tx.wait();
          console.log(`Transaction hash: ${recipt.transactionHash}`);

          saveFlashloanEventLog(flashloan, block);
        }
      }
    })
    .on("error", async () => {});
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
  const connectString = `mongodb+srv://min:${Util.Env.mongodb_pwd}@cluster0-eosoe.mongodb.net/test?retryWrites=true&w=majority`;
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
