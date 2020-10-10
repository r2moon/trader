require("dotenv").config();

import kyberMainnet from "./mainnet/kyber.json";
import uniswapMainnet from "./mainnet/uniswap.json";
import dydxMainnet from "./mainnet/dydx.json";
import tokensMainnet from "./mainnet/tokens.json";
import makerdaoMainnet from "./mainnet/makerdao.json";

import kyberKovan from "./kovan/kyber.json";
import uniswapKovan from "./kovan/uniswap.json";
import dydxKovan from "./kovan/dydx.json";
import tokensKovan from "./kovan/tokens.json";
import makerdaoKovan from "./kovan/makerdao.json";
import config from "../config.json";

const mainnet = {
  kyber: kyberMainnet,
  uniswap: uniswapMainnet,
  dydx: dydxMainnet,
  tokens: tokensMainnet,
  makerdao: makerdaoMainnet,
};

const kovan = {
  kyber: kyberKovan,
  uniswap: uniswapKovan,
  dydx: dydxKovan,
  tokens: tokensKovan,
  makerdao: makerdaoKovan,
};

const useTestnet = config.testnet;
console.log(`using ${useTestnet ? "kovan" : "mainnet"} addresses`);
export default useTestnet ? kovan : mainnet;
