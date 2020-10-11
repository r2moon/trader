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
