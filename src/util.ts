require("dotenv").config();
import config from "../config.json";
import addresses from "../addresses";
import truffleConfig from "../truffle-config";
import {ethers} from "ethers";
import chalk from "chalk";
import {MongoClient} from "mongodb";

export class Util {
  static Config = class {
    static dryrun = config.dryrun;
    static amount_token1_in_eth = config.amount_token1_in_eth;
    static txcost_gas_price_buff_in_wei = config.txcost_gas_price_buff_in_wei;
    static txcost_gas_limit = config.txcost_gas_limit;
    static kyber_service_fee = config.kyber_service_fee;
    static uniswap_service_fee = config.uniswap_service_fee;
    static profit_threshold = config.profit_threshold;
    static wait_blocks = config.wait_blocks;
    static useMainnetFork = config.network.toLowerCase() == "mainnetfork";
    static useTestnet = config.network.toLowerCase() == "kovan";
    static network = (() => {
      if (config.network.toLowerCase() == "mainnetfork") {
        return truffleConfig.networks.mainnetFork;
      }
      if (config.network.toLowerCase() == "kovan") {
        return truffleConfig.networks.testnet;
      }

      if (config.network.toLowerCase() == "mainnet") {
        return truffleConfig.networks.mainnet;
      }

      console.error(chalk.red(`Unsupported network ${config.network} in config.json`));
      process.exit(1);
    })();
  };

  static Env = class {
    static infuraUri = (Util.Config.useTestnet ? process.env.INFURA_TESTNET_URI : process.env.INFURA_URI) || "";
    static privKey = process.env.PRIVATE_KEY || "";
    static mongodb_pwd = process.env.MONGODB_PASSWORD || "";
  };

  static Address = class {
    static Token1 = class {
      static tokens = addresses.tokens.token1;
      // to checksum address
      static daiAddress = ethers.utils.getAddress(addresses.tokens.token1.dai);
      static wethAddress = ethers.utils.getAddress(addresses.tokens.token1.weth);
      static usdcAddress = ethers.utils.getAddress(addresses.tokens.token1.usdc);

      static resolveToken(token: string, amount?: number): Token {
        switch (token) {
          case "dai":
            return new Token("dai", this.daiAddress, amount);
          case "weth":
            return new Token("weth", this.wethAddress, amount);
          case "usdc":
            return new Token("usdc", this.usdcAddress, amount, 6);
          default:
            return Token.InvalidToken;
        }
      }
    };

    static Token2 = class {
      static tokens = addresses.tokens.token2;
      // to checksum address
      static daiAddress = ethers.utils.getAddress(addresses.tokens.token2.dai);
      static wethAddress = ethers.utils.getAddress(addresses.tokens.token2.weth);
      static usdcAddress = ethers.utils.getAddress(addresses.tokens.token2.usdc);
      static ethAddress = ethers.utils.getAddress(addresses.tokens.token2.eth);
      static kncAddress = ethers.utils.getAddress(addresses.tokens.token2.knc);
      static linkAddress = ethers.utils.getAddress(addresses.tokens.token2.link);
      static mkrAddress = ethers.utils.getAddress(addresses.tokens.token2.mkr);
      static batAddress = ethers.utils.getAddress(addresses.tokens.token2.bat);

      static resolveToken(token: string, amount?: number): Token {
        switch (token) {
          case "dai":
            return new Token("dai", this.daiAddress, amount);
          case "weth":
            return new Token("weth", this.wethAddress, amount);
          case "usdc":
            return new Token("usdc", this.usdcAddress, amount, 6);
          case "knc":
            return new Token("knc", this.kncAddress, amount);
          case "link":
            return new Token("link", this.linkAddress, amount);
          case "mkr":
            return new Token("mkr", this.mkrAddress, amount);
          case "bat":
            return new Token("bat", this.batAddress, amount);
          case "eth":
            return new Token("eth", this.ethAddress, amount);
          default:
            return Token.InvalidToken;
        }
      }
    };

    static soloMarginAddress = ethers.utils.getAddress(addresses.dydx.solo);
  };

  static sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  static etherToWei = (eth: string | number) => {
    eth = eth.toString();
    return ethers.utils.parseEther(eth);
  };

  static weiToEther = ethers.utils.formatEther;

  // skip invalid pairs
  static skipPair = async (token1: string, token2: string) => {
    if (Util.Config.useTestnet) {
      // exclude the valid 3 pairs
      return !((token1 == "dai" && token2 == "weth") || (token1 == "weth" && token2 == "mkr") || (token1 == "weth" && token2 == "dai"));
    }

    return (token1 == "weth" && token2 == "eth") || (token1 == "usdc" && token2 == "mkr") || token1 == token2;
  };

  // log
  static Log = class {
    static info = (...text: unknown[]) => {
      console.log(chalk.yellow(text, "\n"));
    };

    static error = (...text: unknown[]) => {
      console.log(chalk.red(text, "\n"));
    };

    static success = (...text: unknown[]) => {
      console.log(chalk.green(text, "\n"));
    };
  };

  static Storage = class {
    static mongoClient = (() => {
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

    // save data to mongodb atlas
    static saveToMongoDB = async (record: Object, collection: string) => {
      // console.log("Connected to Database");
      const db = (await Util.Storage.mongoClient.getInstance()).db("flashloan");
      const profits = db.collection(collection);
      await profits.insertOne(record).catch((err: Error) => console.error(err));
      // console.log(result);
    };
  };
}

export class Token {
  constructor(public name: string, public address: string, public amount?: number, public decimals = 18) {}
  static InvalidToken = new Token("NA", "", -1);
}
