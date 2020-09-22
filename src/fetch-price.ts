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

      console.log(`🚀 Loading ... \n`);

      rl.close();

      const token1List = Object.keys(addresses.tokens.token1).filter((x) => token1 == x || token1 == "*");
      const token2List = Object.keys(addresses.tokens.token2).filter((x) => token2 == x || token2 == "*");

      if (token1 == "weth" && token2 == "eth") {
        console.log(`${token1}/${token2} pair is not supported. Skipping`);
        return;
      }

      for (let token1 of token1List) {
        for (let token2 of token2List) {
          if (token1 == "weth" && token2 == "eth") continue;
          await fetchPrice(token1, token2);
        }
      }

      console.log("🚀 done");
    });
  });
};

const fetchPrice = async (token1: string, token2: string) => {
  const token1Config = Util.Address.Token1.resolveToken(token1);
  const token2Config = Util.Address.Token2.resolveToken(token2);

  const kyberRates = await Price.FetchKyberRates(token1Config.address, token2Config.address, amount_token1);
  const uniswapRates = await Price.FetchUniswapRates(token1Config, token2Config, amount_token1);

  console.table([
    {
      "Token Pair": `${token1}/${token2}`,
      "Input Token Amount": `${amount_token1} ${token1}`,
      "Kyber Buy": kyberRates.buy,
      "Kyber Sell": kyberRates.sell,
      "Uniswap Buy": uniswapRates.buy,
      "Uniswap Sell": uniswapRates.sell,
      Timestamp: moment().tz("Asia/Tokyo").format(),
    },
  ]);
};

main();
