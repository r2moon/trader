require("dotenv").config();
import config from "../config.json";
import addresses from "../addresses";
import truffleConfig from "../truffle-config";
import {ethers} from "ethers";

export class Util {
  static Config = class {
    static amount_eth = config.amount_eth;
    static network = config.use_mainnet_fork ? truffleConfig.networks.mainnetFork : truffleConfig.networks.mainnet;
    static txcost_gas_price_buff_in_wei = config.txcost_gas_price_buff_in_wei;
    static txcost_gas_limit = config.txcost_gas_limit;
    static kyber_service_fee = config.kyber_service_fee;
    static uniswap_service_fee = config.uniswap_service_fee;
    static profit_threshold = config.profit_threshold;
  };

  static Env = class {
    static infuraUri = process.env.INFURA_URI || "";
    static privKey = process.env.PRIVATE_KEY || "";
    static mongodb_pwd = process.env.MONGODB_PASSWORD || "";
  };

  static Address = class {
    // to checksum address
    static daiAddress = ethers.utils.getAddress(addresses.tokens.dai);
    static wethAddress = ethers.utils.getAddress(addresses.tokens.weth);
    static ethAddress = ethers.utils.getAddress(addresses.tokens.eth);
    static soloMarginAddress = ethers.utils.getAddress(addresses.dydx.solo);
  };
}
