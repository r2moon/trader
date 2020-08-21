import {Price, Action} from "./price";
import {ethers} from "ethers";
import {Util} from "./util";

const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: "price.csv",
  header: [
    {id: "amount", title: "Amount"},
    {id: "ethPrice", title: "ETH Price"},
    {id: "kyberBuy", title: "KyberBuy"},
    {id: "kyberSell", title: "KyberSell"},
    {id: "uniswapBuy", title: "UniswapBuy"},
    {id: "uniswapSell", title: "UniswapSell"},
    {id: "kyberToUniswap", title: "KyberToUniswap"},
    {id: "uniswapToKyber", title: "UniswapToKyber"},
    {id: "time", title: "Time"},
  ],
});

const min = 1;
const max = 100;
const records: Record[] = [];
const infuraUri = Util.Env.infuraUri;

const main = async () => {
  const provider = new ethers.providers.InfuraProvider("mainnet");
  const amounts = Array.from(Array(max - min + 1), (_, i) => i + 1);

  for (let amount_eth = min; amount_eth <= amounts.length; amount_eth++) {
    console.log(`using amount ${amount_eth}`);
    const now = new Date().toISOString();
    const [kyberBuy, kyberSell] = await Promise.all([
      Price.fetchKyberPriceByAction(Action.Buy, amount_eth),
      Price.fetchKyberPriceByAction(Action.Sell, amount_eth),
    ]);

    const ethPrice = await Price.getEtherPrice(provider);
    const price = await Price.FetchUniswapRates(ethPrice, amount_eth);
    const [uniswapBuy, uniswapSell] = [price.buy, price.sell];

    const kyberToUniswap = kyberBuy - uniswapSell;
    const uniswapToKyber = uniswapBuy - kyberSell;

    records.push({
      amount: amount_eth,
      ethPrice: ethPrice.toFixed(2),
      kyberBuy: kyberBuy.toFixed(2),
      kyberSell: kyberSell.toFixed(2),
      uniswapBuy: uniswapBuy.toFixed(2),
      uniswapSell: uniswapSell.toFixed(2),
      kyberToUniswap: kyberToUniswap.toFixed(2),
      uniswapToKyber: uniswapToKyber.toFixed(2),
      time: now,
    });

    await sleep(1000);
  }

  csvWriter.writeRecords(records);
  console.log("done");
};

interface Record {
  amount: number | string;
  ethPrice: number | string;
  kyberBuy: number | string;
  kyberSell: number | string;
  uniswapBuy: number | string;
  uniswapSell: number | string;
  kyberToUniswap: number | string;
  uniswapToKyber: number | string;
  time: string;
}

const sleep = async (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

main();
