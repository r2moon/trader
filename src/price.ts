import {Util, Token as TokenConfig} from "./util";
import {ethers} from "ethers";
import {KyberNetworkProxyFactory} from "../types/ethers-contracts/KyberNetworkProxyFactory";
import addresses from "../addresses";
import {ChainId, Fetcher, TokenAmount, Token, WETH} from "@uniswap/sdk";

const wethAddress = Util.Address.Token2.wethAddress;
const ethAddress = Util.Address.Token2.ethAddress;
const maxRetry = Util.Config.useTestnet ? 1 : 3;

export class Price {
  constructor(public buy: number, public sell: number) {}

  // fetch uniswap output amount
  static FetchUniswapOutput = async (tokenSrc: TokenConfig, tokenDest: TokenConfig, retry = 0): Promise<number> => {
    if (retry >= maxRetry) {
      Util.Log.error(`⚠ FetchUniswapOutput (${tokenSrc.name}/${tokenDest.name}) Failed! Skip`);
      return 0;
    }

    const amount_token_src_in_wei = Util.etherToWei(tokenSrc.amount!)
      .div(10 ** (18 - tokenSrc.decimals))
      .toString();

    try {
      const TOKENSRC = Price.resolveUniswapToken(tokenSrc);
      const TOKENDEST = Price.resolveUniswapToken(tokenDest);
      const pair = await Fetcher.fetchPairData(TOKENSRC, TOKENDEST);

      const outputAmount = pair.getOutputAmount(new TokenAmount(TOKENSRC, amount_token_src_in_wei));
      const amount_token_dest = Util.weiToEther(outputAmount[0].raw.toString());
      return parseFloat(amount_token_dest) * 10 ** (18 - tokenDest.decimals);
    } catch (e) {
      Util.Log.info(`👀 FetchUniswapOutput Error (${tokenSrc.name}/${tokenDest.name}). Retrying ...`);
      Util.sleep(1000);
      return await Price.FetchUniswapOutput(tokenSrc, tokenDest, ++retry);
    }
  };

  // fetch kyber output
  static FetchKyberOutput = async (
    tokenSrc: TokenConfig,
    tokenDest: TokenConfig,
    provider: ethers.providers.Provider,
    retry = 0
  ): Promise<number> => {
    if (retry >= maxRetry) {
      Util.Log.error(`⚠ FetchKyberOutput (${tokenSrc.name}/${tokenDest.name}) Failed! Skip`);
      return 0;
    }

    try {
      const amount_token_src = Util.etherToWei(tokenSrc.amount!).div(10 ** (18 - tokenSrc.decimals));
      const kyber = KyberNetworkProxyFactory.connect(addresses.kyber.kyberNetworkProxy, provider);
      const expectedRate = (await kyber.getExpectedRate(tokenSrc.address, tokenDest.address, amount_token_src)).expectedRate;
      return parseFloat(Util.weiToEther(expectedRate)) * tokenSrc.amount!;
    } catch (e) {
      Util.Log.info(`👀 FetchKyberOutput Error (${tokenSrc.name}/${tokenDest.name}). Retrying ...`);
      Util.sleep(1000);
      return await Price.FetchKyberOutput(tokenSrc, tokenDest, provider, ++retry);
    }
  };

  private static resolveUniswapToken = (token: TokenConfig) => {
    switch (token.address) {
      case wethAddress:
        return WETH[Price.resolveNetwork()];
      case ethAddress:
        return WETH[Price.resolveNetwork()];
      default:
        return new Token(Price.resolveNetwork(), token.address, token.decimals);
    }
  };

  private static resolveNetwork = () => {
    return Util.Config.useTestnet ? ChainId.KOVAN : ChainId.MAINNET;
  };
}
