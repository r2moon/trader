import addresses from "../addresses";
import {Util} from "./util";
import {Price} from "./price";
import chalk from "chalk";
import {ethers} from "ethers";

const token1List = Object.keys(addresses.tokens.token1);
const token2List = Object.keys(addresses.tokens.token2);
const amount_token2 = Util.Config.amount_token2;
const provider = new ethers.providers.InfuraProvider("mainnet");

const main = async () => {
  for (let token1 of token1List) {
    for (let token2 of token2List) {
      // retry if error happens... the stupid failed to meet quorum
      while (!fetchPrice(token1, token2)) {
        sleep(1000);
      }
    }
  }
};

const fetchPrice = async (token1: string, token2: string): Promise<boolean> => {
  const token1Address = Util.Address.Token1.resolveTokenAddress(token1);
  const token2Address = Util.Address.Token2.resolveTokenAddress(token2);

  try {
    // fetch kyber buy / sell rates
    const kyberRates = await Price.FetchKyberRates(token1Address, token2Address, amount_token2);
    console.log(chalk.green(`Kyber ${token2}/${token1}`));
    console.log(kyberRates);

    const tokenPairRate = await Price.getToken2vsToken1Rate(token1Address, token2Address, provider);
    const uniswapRates = await Price.FetchUniswapRates(tokenPairRate, token1Address, token2Address);
    console.log(chalk.blue(`Uniswap ${token2}/${token1}`));
    console.log(uniswapRates);

    console.log(`\n`);
    return true;
  } catch (e) {
    return false;
  }
};

const sleep = async (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

main();
