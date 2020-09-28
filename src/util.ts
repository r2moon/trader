require("dotenv").config();
import config from "../config.json";
import addresses from "../addresses";
import truffleConfig from "../truffle-config";
import {ethers} from "ethers";

export class Util {
  static Config = class {
    static dryrun = config.dryrun;
    static token1 = config.token1.toLowerCase();
    static token2 = config.token2.toLowerCase();
    static amount_token1_in_eth = config.amount_token1_in_eth;
    static network = config.use_mainnet_fork ? truffleConfig.networks.mainnetFork : truffleConfig.networks.mainnet;
    static txcost_gas_price_buff_in_wei = config.txcost_gas_price_buff_in_wei;
    static txcost_gas_limit = config.txcost_gas_limit;
    static kyber_service_fee = config.kyber_service_fee;
    static uniswap_service_fee = config.uniswap_service_fee;
    static profit_threshold = config.profit_threshold;
    static wait_blocks = config.wait_blocks;

    static isValidToken1 = () => {
      // USDC | DAI | WETH
      const token1 = Util.Config.token1;
      return token1 == "dai" || token1 == "usdc" || token1 == "weth";
    };

    static isValidToken2 = () => {
      const token2 = Util.Config.token2;
      return (
        token2 == "eth" || token2 == "bat" || token2 == "knc" || token2 == "lend" || token2 == "link" || token2 == "mkr" || token2 == "susd"
      );
    };
  };

  static Env = class {
    static infuraUri = process.env.INFURA_URI || "";
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
      static lendAddress = ethers.utils.getAddress(addresses.tokens.token2.lend);
      static linkAddress = ethers.utils.getAddress(addresses.tokens.token2.link);
      static mkrAddress = ethers.utils.getAddress(addresses.tokens.token2.mkr);
      static susdAddress = ethers.utils.getAddress(addresses.tokens.token2.susd);
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
          case "lend":
            return new Token("lend", this.lendAddress, amount);
          case "link":
            return new Token("link", this.linkAddress, amount);
          case "mkr":
            return new Token("mkr", this.mkrAddress, amount);
          case "susd":
            return new Token("susd", this.susdAddress, amount);
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
}

export class Token {
  constructor(public name: string, public address: string, public amount?: number, public decimals = 18) {}
  static InvalidToken = new Token("NA", "", -1);
}
