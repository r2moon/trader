require("dotenv").config();
import addresses from "../addresses";
import {Util} from "./util";
import {Price} from "./price";
import readline from "readline";
import moment from "moment-timezone";
import chalk from "chalk";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const amount_token1 = 1;

const main = async () => {
  rl.question(chalk.yellow("* Select input token (dai | usdc | weth | * for all)\n"), async function (token1) {
    console.log(chalk.yellow(`👀 token1 is ${token1 == "*" ? "ALL" : token1}\n`));

    rl.question(chalk.yellow("* Select output token (eth | bat | knc | lend | link | mkr | susd | * for all)\n"), async function (token2) {
      console.log(chalk.yellow(`👀 token2 is ${token2 == "*" ? "ALL" : token2}\n`));

      if (token2 == "*" && token1 == "*") {
        console.log(chalk.yellow("⚠ Fetching a whole price list takes 1 or 2 minutes"));
      }

      console.log(`🚀 Loading ... \n`);

      rl.close();

      const token1List = Object.keys(addresses.tokens.token1).filter((x) => token1 == x || token1 == "*");
      const token2List = Object.keys(addresses.tokens.token2).filter((x) => token2 == x || token2 == "*");

      if (token1 == "weth" && token2 == "eth") {
        console.log(`${token1}/${token2} pair is not supported. Skipping`);
        return;
      }

      await fetchPrices(token1List, token2List);
    });
  });
};

const fetchPrices = async (token1List: string[], token2List: string[]) => {
  const token1Configs = token1List.map((token1) => Util.Address.Token1.resolveToken(token1, amount_token1));
  const token2Configs = token2List.map((token2) => Util.Address.Token2.resolveToken(token2));

  const [kyberRates, uniswapRates] = await Promise.all([
    Price.FetchKyberRates(token1Configs, token2Configs),
    Price.FetchUniswapRates(token1Configs, token2Configs),
  ]);

  kyberRates.forEach((kyberRate, i) => {
    const uniswapRate = uniswapRates[i];
    if (kyberRate.token1 == uniswapRate.token1 && kyberRate.token2 == uniswapRate.token2) {
      console.table([
        {
          "Token Pair": `${uniswapRate.token1}/${uniswapRate.token2}`,
          "Input Token Amount": `${amount_token1} ${uniswapRate.token1}`,
          "Kyber Buy": kyberRate.buy,
          "Kyber Sell": kyberRate.sell,
          "Uniswap Buy": uniswapRate.buy,
          "Uniswap Sell": uniswapRate.sell,
          Timestamp: moment().tz("Asia/Tokyo").format(),
        },
      ]);
    }
  });
};

main();
