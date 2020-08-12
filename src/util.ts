import config from "../config.json";
import addresses from "../addresses";
import truffleConfig from "../truffle-config";

export class Util {
  static Config = class {
    static amount_eth = config.amount_eth;
    static network = config.use_mainnet_fork ? truffleConfig.networks.mainnetFork : truffleConfig.networks.mainnet;
  };

  static Address = class {
    static daiAddress = addresses.tokens.dai;
    static wethAddress = addresses.tokens.weth;
    static ethAddress = addresses.tokens.eth;
    static soloMarginAddress = addresses.dydx.solo;
  };
}
