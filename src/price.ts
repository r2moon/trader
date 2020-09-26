import isNode from "detect-node";
import nodeFetch from "node-fetch";
import {Util, Token as TokenConfig} from "./util";
import {ethers} from "ethers";
import {KyberNetworkProxyFactory} from "../types/ethers-contracts/KyberNetworkProxyFactory";
import addresses from "../addresses";
import puppeteer, {ElementHandle, Page} from "puppeteer";
import chalk from "chalk";

const maxRetry = 3;

export class Price {
  constructor(public token1: string, public token2: string, public buy: number, public sell: number) {}

  static FetchUniswapRates = async (token1List: TokenConfig[], token2List: TokenConfig[], retry = 0): Promise<Price[]> => {
    const prices: Price[] = [];

    const svgIconsSel = "#swap-page svg";

    // we use puppeteer to scrape the price data instead of calling uniswap sdk fetcher
    const browser = await puppeteer.launch();
    // we can connect to local chrome to make the bootstrap the performance a littel bit
    // const browser = await puppeteer.connect({browserURL: "http://localhost:9222"});
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);

    await page.goto("https://app.uniswap.org/#/swap", {waitUntil: "domcontentloaded"});

    await page.waitForFunction((selector) => document.querySelectorAll(selector).length == 3, {}, svgIconsSel);

    let buttons = await page.$$("#swap-page svg");
    const inputCurrencyBtn = buttons[0];
    const swapCurrencyBtn = buttons[1];
    const outputCurrencyBtn = buttons[2];

    for (let token1 of token1List) {
      for (let token2 of token2List) {
        if (token1.name == "weth" && token2.name == "eth") continue;
        prices.push(await Price.FetchUniswapRate(token1, token2, page, inputCurrencyBtn, outputCurrencyBtn, swapCurrencyBtn));
      }
    }

    browser.close();
    return prices;
  };

  // fetch kyber buy / sell rate
  static FetchKyberRates = async (token1List: TokenConfig[], token2List: TokenConfig[]): Promise<Price[]> => {
    const prices: Price[] = [];
    for (let token1 of token1List) {
      for (let token2 of token2List) {
        if (token1.name == "weth" && token2.name == "eth") continue;
        prices.push(await Price.FetchKyberRate(token1, token2));
      }
    }
    return prices;
  };

  // fetch uniswap buy / sell rate
  private static FetchUniswapRate = async (
    token1: TokenConfig,
    token2: TokenConfig,
    page: Page,
    inputCurrencyBtn: ElementHandle<Element>,
    outputCurrencyBtn: ElementHandle<Element>,
    swapCurrencyBtn: ElementHandle<Element>,
    retry = 0
  ): Promise<Price> => {
    if (retry > maxRetry) {
      console.log(chalk.red(`⚠ Failed to fetch uniswap ${token1.name} / ${token2.name} price`));
      return new Price(token1.name, token2.name, 0, 0);
    }

    const swapCurrencyInputSel = "#swap-currency-input .token-amount-input";
    const swapCurrencyOutputSel = "#swap-currency-output .token-amount-input";
    const svgIconsSel = "#swap-page svg";
    const tokenSearchInputSel = "#token-search-input";
    const delay = {delay: 300}; // input like a human

    try {
      // wait for dom ready
      await page.waitForSelector(svgIconsSel);

      // 1. set output currency amount
      await clear(page, swapCurrencyInputSel);
      await page.click(swapCurrencyInputSel, delay);
      await page.keyboard.type((token1.amount ?? 1).toString(), delay);

      // 2. select input currency
      await inputCurrencyBtn.click(delay);
      await page.waitForSelector(tokenSearchInputSel);

      await clear(page, tokenSearchInputSel);
      await page.click(tokenSearchInputSel, delay);
      await page.keyboard.type(token1.name, delay);
      await page.keyboard.press(String.fromCharCode(13), delay); // press enter key

      // 3. select output currency
      await page.waitForSelector(svgIconsSel);

      await outputCurrencyBtn.click(delay);
      await page.waitForSelector(tokenSearchInputSel);
      await clear(page, tokenSearchInputSel);
      await page.click(tokenSearchInputSel, delay);
      await page.keyboard.type(token2.name, delay);
      await page.keyboard.press(String.fromCharCode(13), delay);

      // 4. get buy price
      await page.waitForFunction((selector) => document.querySelector(selector).value > 0, {}, swapCurrencyOutputSel);

      let outputFieldHandle = await page.$(swapCurrencyOutputSel);
      const buyPrice = await page.evaluate((x) => x.value, outputFieldHandle);

      // 5. swap it
      await swapCurrencyBtn.click(delay);

      // 6. get sell price
      await page.waitForFunction((selector) => document.querySelector(selector).value > 0, {}, swapCurrencyInputSel);

      let inputFieldHandle = await page.$(swapCurrencyInputSel);
      const sellPrice = await page.evaluate((x) => x.value, inputFieldHandle);

      // 7. swap back
      await swapCurrencyBtn.click(delay);

      // 8. done
      return new Price(token1.name, token2.name, parseFloat(buyPrice), parseFloat(sellPrice));
    } catch (e) {
      console.log(`You failed xxx!`, e);
      await Util.sleep(500);
      return Price.FetchUniswapRate(token1, token2, page, inputCurrencyBtn, outputCurrencyBtn, swapCurrencyBtn, ++retry);
    }
  };

  // fetch single pair kyber buy / sell rate
  private static FetchKyberRate = async (token1: TokenConfig, token2: TokenConfig): Promise<Price> => {
    const token1Address = token1.address;
    const token2Address = token2.address;
    const amount_token1 = token1.amount ?? 1;

    const [buy, sell] = await Promise.all([
      Price.fetchKyberPriceByAction(Action.Buy, token1Address, token2Address, amount_token1),
      Price.fetchKyberPriceByAction(Action.Sell, token1Address, token2Address, amount_token1),
    ]);

    return new Price(token1.name, token2.name, parseFloat(buy), parseFloat(sell));
  };

  // private function to fetch kyber buy / sell rate
  static fetchKyberPriceByAction = async (
    type: Action,
    token1Address: string,
    token2Address: string,
    amount_token1: number,
    platformFee = 0
  ): Promise<string> => {
    const fetch = isNode ? nodeFetch : window.fetch;
    const endpoint = `https://api.kyber.network/quote_amount?base=${token1Address}&quote=${token2Address}&base_amount=${amount_token1}&type=${type}&platformFee=${platformFee}`;
    const response = await fetch(endpoint);
    const result = await response.json();
    return result.data;
  };

  static fetchKyberTokenPairRate = async (token1Address: string, token2Address: string, provider: ethers.providers.Provider) => {
    if (token1Address == token2Address) return 1;
    const kyber = KyberNetworkProxyFactory.connect(addresses.kyber.kyberNetworkProxy, provider);
    const expectedRate = (await kyber.getExpectedRate(token1Address, token2Address, 1e8)).expectedRate;
    return parseFloat(ethers.utils.formatEther(expectedRate));
  };
}

export enum Action {
  Sell = "sell",
  Buy = "buy",
}

// puppeteer clear input hack
async function clear(page: Page, selector: any) {
  await page.evaluate((selector) => {
    document.querySelector(selector).value = "";
  }, selector);
}
