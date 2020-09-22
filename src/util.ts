require("dotenv").config();
import config from "../config.json";
import addresses from "../addresses";
import truffleConfig from "../truffle-config";
import {ethers} from "ethers";

export class Util {
  static Config = class {
    static amount_token1_in_eth = config.amount_token1_in_eth;
    static network = config.use_mainnet_fork ? truffleConfig.networks.mainnetFork : truffleConfig.networks.mainnet;
    static txcost_gas_price_buff_in_wei = config.txcost_gas_price_buff_in_wei;
    static txcost_gas_limit = config.txcost_gas_limit;
    static kyber_service_fee = config.kyber_service_fee;
    static uniswap_service_fee = config.uniswap_service_fee;
    static profit_threshold = config.profit_threshold;
    static wait_blocks = config.wait_blocks;
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

      static resolveToken(token: string): Token {
        switch (token) {
          case "dai":
            return new Token("dai", this.daiAddress);
          case "weth":
            return new Token("weth", this.wethAddress);
          case "usdc":
            return new Token("usdc", this.usdcAddress);
          default:
            return Token.InvalidToken;
        }
      }
    };

    static Token2 = class {
      static tokens = addresses.tokens.token2;
      // to checksum address
      static ethAddress = ethers.utils.getAddress(addresses.tokens.token2.eth);
      static kncAddress = ethers.utils.getAddress(addresses.tokens.token2.knc);
      static lendAddress = ethers.utils.getAddress(addresses.tokens.token2.lend);
      static linkAddress = ethers.utils.getAddress(addresses.tokens.token2.link);
      static mkrAddress = ethers.utils.getAddress(addresses.tokens.token2.mkr);
      static susdAddress = ethers.utils.getAddress(addresses.tokens.token2.susd);
      static batAddress = ethers.utils.getAddress(addresses.tokens.token2.bat);

      static resolveToken(token: string): Token {
        switch (token) {
          case "knc":
            return new Token("knc", this.kncAddress);
          case "lend":
            return new Token("lend", this.lendAddress);
          case "link":
            return new Token("link", this.linkAddress);
          case "mkr":
            return new Token("mkr", this.mkrAddress);
          case "susd":
            return new Token("susd", this.susdAddress);
          case "bat":
            return new Token("bat", this.batAddress);
          case "eth":
            return new Token("eth", this.ethAddress);
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
  constructor(public name: string, public address: string) {}
  static InvalidToken = new Token("NA", "");
}
