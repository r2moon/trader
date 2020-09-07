import isNode from "detect-node";
import nodeFetch from "node-fetch";
import {Util} from "./util";
import {ChainId, Token, Route, Fetcher, WETH, Trade, TokenAmount, TradeType} from "@uniswap/sdk";
import {ethers} from "ethers";
import {KyberNetworkProxyFactory} from "../types/ethers-contracts/KyberNetworkProxyFactory";
import addresses from "../addresses";
import chalk from "chalk";

const ethAddress = Util.Address.Token2.ethAddress;

export class Price {
  constructor(public buy: number, public sell: number) {}

  // fetch uniswap buy / sell rate
  static FetchUniswapRates = async (
    tokenPairRate: number,
    token1Address: string,
    token2Address: string,
    amount_token2 = Util.Config.amount_token2
  ): Promise<Price> => {
    const amount_token2_wei = ethers.utils.parseEther(amount_token2.toString()).toString();
    const amount_token1_wei = ethers.utils.parseEther((amount_token2 * tokenPairRate).toString()).toString();

    const TOKEN1 = new Token(ChainId.MAINNET, token1Address, 18);
    // default token2 is weth if not set explictly
    const TOKEN2 = token2Address == ethAddress ? WETH[ChainId.MAINNET] : new Token(ChainId.MAINNET, token2Address, 18);

    const pair = await Fetcher.fetchPairData(TOKEN1, TOKEN2);
    const token2ToToken1Route = new Route([pair], TOKEN2);
    const token1ToToken2Route = new Route([pair], TOKEN1);

    try {
      const uniswapResults = await Promise.all([
        new Trade(token1ToToken2Route, new TokenAmount(TOKEN1, amount_token1_wei), TradeType.EXACT_INPUT),
        new Trade(token2ToToken1Route, new TokenAmount(TOKEN2, amount_token2_wei), TradeType.EXACT_INPUT),
      ]);

      return {
        // https://uniswap.org/docs/v2/advanced-topics/pricing/
        // https://uniswap.org/docs/v2/javascript-SDK/pricing/
        buy: parseFloat(uniswapResults[0].executionPrice.invert().toSignificant(6)),
        sell: parseFloat(uniswapResults[1].executionPrice.toSignificant(6)),
      };
    } catch (e) {
      console.log(chalk.red("FetchUniswapRates Error:", e));
      process.exit();
    }
  };

  // fetch kyber buy / sell rate
  static FetchKyberRates = async (
    token1Address: string,
    token2Address: string,
    amount_token2 = Util.Config.amount_token2
  ): Promise<Price> => {
    const [buy, sell] = await Promise.all([
      Price.fetchKyberPriceByAction(Action.Buy, token1Address, token2Address, amount_token2),
      Price.fetchKyberPriceByAction(Action.Sell, token1Address, token2Address, amount_token2),
    ]);
    return new Price(buy, sell);
  };

  // private function to fetch kyber buy / sell rate
  static fetchKyberPriceByAction = async (
    type: Action,
    token1Address: string,
    token2Address: string,
    amount_token2: number,
    platformFee = 0
  ): Promise<number> => {
    const fetch = isNode ? nodeFetch : window.fetch;
    const endpoint = `https://api.kyber.network/quote_amount?base=${token2Address}&quote=${token1Address}&base_amount=${amount_token2}&type=${type}&platformFee=${platformFee}`;
    const response = await fetch(endpoint);
    const result = await response.json();
    return result.data / amount_token2;
  };

  static getToken2vsToken1Rate = async (token1Address: string, token2Address: string, provider: ethers.providers.Provider) => {
    const kyber = KyberNetworkProxyFactory.connect(addresses.kyber.kyberNetworkProxy, provider);
    const expectedRate = (await kyber.getExpectedRate(token2Address, token1Address, 10000)).expectedRate;
    return parseFloat(ethers.utils.formatEther(expectedRate));
  };
}

export enum Action {
  Sell = "sell",
  Buy = "buy",
}
