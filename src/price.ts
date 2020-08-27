import isNode from "detect-node";
import nodeFetch from "node-fetch";
import {Util} from "./util";
import {ChainId, Token, Route, Fetcher, WETH, Trade, TokenAmount, TradeType} from "@uniswap/sdk";
import {ethers} from "ethers";
import {KyberNetworkProxyFactory} from "../types/ethers-contracts/KyberNetworkProxyFactory";
import addresses from "../addresses";

const daiAddress = Util.Address.daiAddress;
const ethAddress = Util.Address.ethAddress;

export class Price {
  constructor(public buy: number, public sell: number) {}

  // fetch uniswap buy / sell rate
  static FetchUniswapRates = async (ethPrice: number, amount_eth = Util.Config.amount_eth): Promise<Price> => {
    const amount_eth_wei = ethers.utils.parseEther(amount_eth.toString()).toString();
    const amount_dai_wei = ethers.utils.parseEther((amount_eth * ethPrice).toString()).toString();

    const DAI = new Token(ChainId.MAINNET, daiAddress, 18);
    const daiWeth = await Fetcher.fetchPairData(DAI, WETH[DAI.chainId]);

    // weth to dai
    const wethToDaiRoute = new Route([daiWeth], WETH[DAI.chainId]);
    // dai to weth
    const daiToWethRoute = new Route([daiWeth], DAI);

    const uniswapResults = await Promise.all([
      new Trade(daiToWethRoute, new TokenAmount(DAI, amount_dai_wei), TradeType.EXACT_INPUT),
      new Trade(wethToDaiRoute, new TokenAmount(WETH[DAI.chainId], amount_eth_wei), TradeType.EXACT_INPUT),
    ]);

    return {
      // todo: uniswapResults[0].executionPrice or uniswapResults[0].nextMidPrice?
      // https://uniswap.org/docs/v2/advanced-topics/pricing/
      // https://uniswap.org/docs/v2/javascript-SDK/pricing/
      buy: parseFloat(uniswapResults[0].executionPrice.invert().toSignificant(6)),
      sell: parseFloat(uniswapResults[1].executionPrice.toSignificant(6)),
    };
  };

  // fetch kyber buy / sell rate
  static FetchKyberRates1 = async (amount_eth = Util.Config.amount_eth): Promise<Price> => {
    const [buy, sell] = await Promise.all([
      Price.fetchKyberPriceByAction(Action.Buy, amount_eth),
      Price.fetchKyberPriceByAction(Action.Sell, amount_eth),
    ]);
    return new Price(buy, sell);
  };

  static FetchKyberRates2 = async (amount_eth = Util.Config.amount_eth): Promise<Price> => {
    const [buy, sell] = await Promise.all([
      Price.fetchKyberPriceByAction(Action.Buy, amount_eth, 8),
      Price.fetchKyberPriceByAction(Action.Sell, amount_eth, 8),
    ]);
    return new Price(buy, sell);
  };

  static FetchKyberRates3 = async (
    provider: ethers.providers.Provider,
    ethPrice: number,
    amount_eth = Util.Config.amount_eth
  ): Promise<Price> => {
    const kyber = KyberNetworkProxyFactory.connect(addresses.kyber.kyberNetworkProxy, provider);
    const amount_eth_wei = ethers.utils.parseEther(amount_eth.toString()).toString();
    const amount_dai_wei = ethers.utils.parseEther((amount_eth * ethPrice).toString()).toString();

    const kyberResults = await Promise.all([
      kyber.getExpectedRate(daiAddress, ethAddress, amount_dai_wei),
      kyber.getExpectedRate(ethAddress, daiAddress, amount_eth_wei),
    ]);

    return new Price(
      1 / parseFloat(ethers.utils.formatEther(kyberResults[0].expectedRate)),
      parseFloat(ethers.utils.formatEther(kyberResults[1].expectedRate))
    );
  };

  // private function to fetch kyber buy / sell rate
  static fetchKyberPriceByAction = async (type: Action, amount_eth: number, platformFee = 0): Promise<number> => {
    const fetch = isNode ? nodeFetch : window.fetch;
    const endpoint = `https://api.kyber.network/quote_amount?base=${ethAddress}&quote=${daiAddress}&base_amount=${amount_eth}&type=${type}&platformFee=${platformFee}`;
    const response = await fetch(endpoint);
    const result = await response.json();
    return result.data / amount_eth;
  };

  static getEtherPrice = async (provider: ethers.providers.Provider) => {
    const kyber = KyberNetworkProxyFactory.connect(addresses.kyber.kyberNetworkProxy, provider);
    const expectedRate = (await kyber.getExpectedRate(ethAddress, daiAddress, 1)).expectedRate;
    return parseFloat(ethers.utils.formatEther(expectedRate));
  };
}

export enum Action {
  Sell = "sell",
  Buy = "buy",
}
