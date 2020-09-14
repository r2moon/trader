require("dotenv").config();
import addresses from "../addresses";
import {Util} from "./util";
import {Price} from "./price";
import chalk from "chalk";
import {ethers} from "ethers";
import readline from "readline";
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const provider = new ethers.providers.InfuraProvider("mainnet", process.env.API_KEY);
const amount_token2 = 1;

const main = async () => {
  rl.question("Select token1 (dai | usdc | weth | * for all)\n", function (token1) {
    rl.question("Select token2 (eth | bat | knc | lend | link | mkr | susd | * for all)\n", function (token2) {
      rl.close();

      const token1List = Object.keys(addresses.tokens.token1).filter((x) => token1 == "*" || token1 == x);
      const token2List = Object.keys(addresses.tokens.token2).filter((x) => token2 == "*" || token2 == x);

      console.log("token1 is", token1 == "*" ? "ALL" : token1);
      console.log("token2 is", token2 == "*" ? "ALL" : token2);

      if (token1 == "weth" && token2 == "eth") {
        console.log("this pair is not supported");
        return;
      }

      // we should support this pair though.. but uniswap sdk always returns InsufficientInputAmountError
      if (token1 == "usdc" && token2 == "susd") {
        console.log("this pair is not supported");
        return;
      }

      for (let token1 of token1List) {
        for (let token2 of token2List) {
          if (token1 == "weth" && token2 == "eth") continue;
          if (token1 == "usdc" && token2 == "susd") continue;

          fetchPrice(token1, token2);
        }
      }
    });
  });
};

const fetchPrice = async (token1: string, token2: string) => {
  const token1Config = Util.Address.Token1.resolveToken(token1);
  const token2Config = Util.Address.Token2.resolveToken(token2);

  try {
    const kyberRates = await Price.FetchKyberRates(token1Config.address, token2Config.address, amount_token2);

    const tokenPairRate = 1 / (await Price.getToken1vsToken2Rate(token1Config.address, token2Config.address, provider));
    const uniswapRates = await Price.FetchUniswapRates(provider, tokenPairRate, token1Config, token2Config, amount_token2);

    const header = `${token2}/${token1} Kyber Buy | Sell ***** Uniswap Buy | Sell\n`;
    const record = `${kyberRates.buy} | ${kyberRates.sell} ***** ${uniswapRates.buy} | ${uniswapRates.sell}`;

    console.log(header);
    console.log(chalk.blue(record));

    console.log(`\n`);
  } catch (e) {
    // usually the stupid "failed to meet quorum"
  }
};

main();
