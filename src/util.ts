require("dotenv").config();
import config from "../config.json";
import addresses from "../addresses";
import truffleConfig from "../truffle-config";
import {ethers} from "ethers";

export class Util {
  static Config = class {
    static token1 = config.token1.toLowerCase();
    // fallback to eth if token2 set as empty
    static token2 = (config.token2 ? config.token2 : "eth").toLowerCase();
    static amount_token2 = config.amount_token2;
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
      // to checksum address
      static daiAddress = ethers.utils.getAddress(addresses.tokens.token1.dai);
      static wethAddress = ethers.utils.getAddress(addresses.tokens.token1.weth);
      static usdcAddress = ethers.utils.getAddress(addresses.tokens.token1.usdc);

      static resolveTokenAddress(token: string): string {
        switch (token) {
          case "dai":
            return this.daiAddress;
          case "weth":
            return this.wethAddress;
          case "usdc":
            return this.usdcAddress;
          default:
            return "";
        }
      }
    };

    static Token2 = class {
      static ethAddress = ethers.utils.getAddress(addresses.tokens.token2.eth);
      static kncAddress = ethers.utils.getAddress(addresses.tokens.token2.knc);
      static lendAddress = ethers.utils.getAddress(addresses.tokens.token2.lend);
      static linkAddress = ethers.utils.getAddress(addresses.tokens.token2.link);
      static mkrAddress = ethers.utils.getAddress(addresses.tokens.token2.mkr);
      static susdAddress = ethers.utils.getAddress(addresses.tokens.token2.susd);
      static batAddress = ethers.utils.getAddress(addresses.tokens.token2.bat);

      static resolveTokenAddress(token: string): string {
        switch (token) {
          case "knc":
            return this.kncAddress;
          case "lend":
            return this.lendAddress;
          case "link":
            return this.linkAddress;
          case "mkr":
            return this.mkrAddress;
          case "susd":
            return this.susdAddress;
          case "bat":
            return this.batAddress;
          case "eth":
            return this.ethAddress;

          default:
            return "";
        }
      }
    };

    static soloMarginAddress = ethers.utils.getAddress(addresses.dydx.solo);
  };
}
