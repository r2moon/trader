import config from "../config.json";
import addresses from "../addresses";
import truffleConfig from "../truffle-config";
import {ethers} from "ethers";

export class Util {
  static Config = class {
    static amount_eth = config.amount_eth;
    static network = config.use_mainnet_fork ? truffleConfig.networks.mainnetFork : truffleConfig.networks.mainnet;
  };

  static Address = class {
    // to checksum address
    static daiAddress = ethers.utils.getAddress(addresses.tokens.dai);
    static wethAddress = ethers.utils.getAddress(addresses.tokens.weth);
    static ethAddress = ethers.utils.getAddress(addresses.tokens.eth);
    static soloMarginAddress = ethers.utils.getAddress(addresses.dydx.solo);
  };
}
