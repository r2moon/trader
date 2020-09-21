import isNode from "detect-node";
import nodeFetch from "node-fetch";
import {Util, Token as TokenConfig} from "./util";
import {ChainId, Token, Route, Fetcher, WETH, Trade, TokenAmount, TradeType} from "@uniswap/sdk";
import {ethers} from "ethers";
import {KyberNetworkProxyFactory} from "../types/ethers-contracts/KyberNetworkProxyFactory";
import addresses from "../addresses";
import chalk from "chalk";
import puppeteer from "puppeteer";

const ethAddress = Util.Address.Token2.ethAddress;

export class Price {
  constructor(public buy: number, public sell: number) {}

  // fetch uniswap buy / sell rate
  static FetchUniswapRates = async (
    token1: TokenConfig,
    token2: TokenConfig,
    amount_token1 = Util.Config.amount_token1
  ): Promise<Price> => {
    try {
      // we use puppeteer to scrape the price data instead of calling uniswap sdk fetcher
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      page.setDefaultTimeout(5000);

      const swapCurrencyInputSel = "#swap-currency-input .token-amount-input";
      const swapCurrencyOutputSel = "#swap-currency-output .token-amount-input";
      const svgIconsSel = "#swap-page svg";
      const tokenSearchInputSel = "#token-search-input";

      await page.goto("https://app.uniswap.org/#/swap");
      // wait for dom ready
      await page.waitForFunction('document.querySelectorAll("#swap-page svg").length == 3');

      let svgItems = await page.$$(svgIconsSel);
      const inputCurrencyBtn = svgItems[0];
      const swapCurrencyBtn = svgItems[1];
      const outputCurrencyBtn = svgItems[2];

      const delay = {delay: 100}; // input like a human

      // 1. set output currency amount
      await page.click(swapCurrencyInputSel);
      await page.keyboard.type(amount_token1.toString(), delay);

      // 2. select input currency
      await inputCurrencyBtn.click();
      await page.waitForSelector(tokenSearchInputSel);
      await page.click(tokenSearchInputSel);
      await page.keyboard.type(token1.name, delay);
      await page.keyboard.press(String.fromCharCode(13), delay); // press enter key

      // 3. select output currency
      await page.waitForFunction('document.querySelectorAll("#swap-page svg").length == 3');
      await outputCurrencyBtn.click();
      await page.waitForSelector(tokenSearchInputSel);
      await page.click(tokenSearchInputSel);
      await page.keyboard.type(token2.name, delay);
      await page.keyboard.press(String.fromCharCode(13), delay);

      // 4. get sell price
      await page.waitForFunction('document.querySelector("#swap-currency-output .token-amount-input").value > 0');
      await page.screenshot({path: "screenshots/uniswap1.png"});
      let outputFieldHandle = await page.$(swapCurrencyOutputSel);
      const buyPrice = await page.evaluate((x) => x.value, outputFieldHandle);

      // 5. swap it
      await swapCurrencyBtn.click();

      // 6. get buy price
      await page.waitForFunction('document.querySelector("#swap-currency-output .token-amount-input").value > 0');
      await page.screenshot({path: "screenshots/uniswap2.png"});
      let inputFieldHandle = await page.$(swapCurrencyInputSel);
      const sellPrice = await page.evaluate((x) => x.value, inputFieldHandle);

      return new Price(parseFloat(buyPrice), parseFloat(sellPrice));
    } catch (e) {
      console.error(chalk.red("FetchUniswapRates error. Please retry (will try to fix it asap)"));
      return new Price(0, 0);
    }
  };

  // fetch kyber buy / sell rate
  static FetchKyberRates = async (
    token1Address: string,
    token2Address: string,
    amount_token1 = Util.Config.amount_token1
  ): Promise<Price> => {
    const [buy, sell] = await Promise.all([
      Price.fetchKyberPriceByAction(Action.Buy, token1Address, token2Address, amount_token1),
      Price.fetchKyberPriceByAction(Action.Sell, token1Address, token2Address, amount_token1),
    ]);
    return new Price(buy, sell);
  };

  // private function to fetch kyber buy / sell rate
  static fetchKyberPriceByAction = async (
    type: Action,
    token1Address: string,
    token2Address: string,
    amount_token1: number,
    platformFee = 0
  ): Promise<number> => {
    const fetch = isNode ? nodeFetch : window.fetch;
    const endpoint = `https://api.kyber.network/quote_amount?base=${token1Address}&quote=${token2Address}&base_amount=${amount_token1}&type=${type}&platformFee=${platformFee}`;
    const response = await fetch(endpoint);
    const result = await response.json();
    return result.data / amount_token1;
  };

  static fetchKyberTokenPairRate = async (token1Address: string, token2Address: string, provider: ethers.providers.Provider) => {
    const kyber = KyberNetworkProxyFactory.connect(addresses.kyber.kyberNetworkProxy, provider);
    const expectedRate = (await kyber.getExpectedRate(token1Address, token2Address, 1e6)).expectedRate;
    return parseFloat(ethers.utils.formatEther(expectedRate));
  };
}

export enum Action {
  Sell = "sell",
  Buy = "buy",
}
