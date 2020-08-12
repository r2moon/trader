import isNode from "detect-node";
import nodeFetch from "node-fetch";
import {Util} from "./util";
import {ChainId, Token, Route, Fetcher, WETH, Trade, TokenAmount, TradeType} from "@uniswap/sdk";
import {ethers} from "ethers";

const amount_eth = Util.Config.amount_eth;
const daiAddress = Util.Address.daiAddress;
const ethAddress = Util.Address.ethAddress;

export class Price {
  constructor(public buy: number, public sell: number) {}

  // fetch uniswap buy / sell rate
  static FetchUniswapRates = async (ethPrice: number): Promise<Price> => {
    const amount_eth_wei = ethers.utils.parseEther(amount_eth.toString());
    const amount_dai_wei = ethers.utils.parseEther((amount_eth * ethPrice).toString());

    const DAI = new Token(ChainId.MAINNET, daiAddress, 18);
    const daiWeth = await Fetcher.fetchPairData(DAI, WETH[DAI.chainId]);

    const sellRoute = new Route([daiWeth], WETH[DAI.chainId]);
    const buyRoute = new Route([daiWeth], DAI);

    const uniswapResults = await Promise.all([
      new Trade(buyRoute, new TokenAmount(DAI, amount_dai_wei.toString()), TradeType.EXACT_INPUT),
      new Trade(sellRoute, new TokenAmount(WETH[DAI.chainId], amount_eth_wei.toString()), TradeType.EXACT_INPUT),
    ]);

    return {
      // todo: uniswapResults[0].executionPrice or uniswapResults[0].nextMidPrice?
      buy: (amount_eth * ethPrice) / parseFloat(uniswapResults[0].executionPrice.invert().toSignificant(6)),
      sell: parseFloat(uniswapResults[1].executionPrice.toSignificant(6)) / amount_eth,
    };
  };

  // fetch kyber buy / sell rate
  static FetchKyberRates = async (): Promise<Price> => {
    const [buy, sell] = await Promise.all([Price.fetchKyberPriceByAction(Action.Buy), Price.fetchKyberPriceByAction(Action.Sell)]);
    return new Price(buy, sell);
  };

  // private function to fetch kyber buy / sell rate
  private static fetchKyberPriceByAction = async (type: Action): Promise<number> => {
    const fetch = isNode ? nodeFetch : window.fetch;
    const endpoint = `https://api.kyber.network/quote_amount?base=${ethAddress}&quote=${daiAddress}&base_amount=${amount_eth}&type=${type}&platformFee=8`;
    const response = await fetch(endpoint);
    const result = await response.json();
    return result.data / amount_eth;
  };
}

export enum Action {
  Sell = "sell",
  Buy = "buy",
}
