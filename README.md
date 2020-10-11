# Flashloan

## Spinup

```bash
yarn start
```

## Check realtime token price

```bash
yarn fetch-price
```

## Docker build

```bash
yarn docker:build
```

then

```bash
yarn docker:run
```

## Test

```bash
yarn test
```

## Test On Kovan

set `network: kovan` in `config.json` to switch to Kovan.

## Dryrun

Dryrun will not trigger the smart contract. It helps to analyze the price and profit output for debugging. Set `dryrun: true` in `config.json` to enable dryrun mode

## Price fetcher

Price fetcher is a debugging tool for double checking the DEX price output.

```js
yarn fetch-price
```

## DYDX Solo Margin Address

`https://github.com/dydxprotocol/solo/blob/master/migrations/deployed.json`

## KyberNetworkProxy Address

`https://developer.kyber.network/docs/Environments-Kovan/`

## Token Address

`https://changelog.makerdao.com/`

## Uniswap Router Address

`https://uniswap.org/docs/v2/smart-contracts/router02/`

## Flashloan Mainnet Contract Address

address: `0x6d546843F281E23B853fD82ac0119C04BA120464`
txHash: `0x883fbe32308016e79418ae7b5121f912c016b843993b6d294e9a9eb09ef2a477`
