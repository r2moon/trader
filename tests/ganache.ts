require("dotenv").config();

import {ethers} from "ethers";
import truffle from "../truffle-config";
import FlashloanContract from "../build/contracts/TestableFlashloan.json";
import VaultManagerContract from "../build/contracts/VaultManager.json";
import DaiFaucetContract from "../build/contracts/DaiFaucet.json";
import Ganache from "ganache-core";
import addresses from "../addresses";
import chalk from "chalk";

export const network = truffle.networks.mainnetFork;
export const ganacheUri = `http://${network.host}:${network.port}`;
export const networkId = network.network_id;
console.log(`Ganache URI: ${ganacheUri}. Network ID: ${networkId}`);

const privKey = process.env.PRIVATE_KEY || "";
const infuraUri = process.env.INFURA_URI || "";

export const provider = () => new ethers.providers.JsonRpcProvider(ganacheUri);
export const wallet = () => new ethers.Wallet(privKey, provider());

export async function startGanache() {
  const server = Ganache.server({
    fork: infuraUri,
    network_id: networkId,
    accounts: [{secretKey: privKey, balance: 1e24}],
    gasLimit: 6000000,
  });

  server.listen(network.port);
  return server;
}

export async function deployContracts(): Promise<Addresses> {
  console.log(chalk.green("Deploying VaultManager Contract"));
  const vaultManagerFactory = new ethers.ContractFactory(VaultManagerContract.abi, VaultManagerContract.bytecode, wallet());
  const vaultManagerContract = await vaultManagerFactory.deploy();

  console.log(chalk.green("Deploying DaiFaucet Contract"));
  const daiFaucetFactory = new ethers.ContractFactory(DaiFaucetContract.abi, DaiFaucetContract.bytecode, wallet());
  const daiFaucetContract = await daiFaucetFactory.deploy(addresses.tokens.dai);

  await vaultManagerContract.deployed();
  await daiFaucetContract.deployed();

  // console.log(`VaultManager Address: ${vaultManagerContract.address}`);
  // console.log(`DaiFaucet Address: ${daiFaucetContract.address}`);

  console.log(chalk.green("Deploying Flashloan Contract"));
  const flashloanFactory = new ethers.ContractFactory(FlashloanContract.abi, FlashloanContract.bytecode, wallet());
  const flashloanContract = await flashloanFactory.deploy(
    addresses.kyber.kyberNetworkProxy,
    addresses.uniswap.router,
    addresses.tokens.weth,
    addresses.tokens.dai,
    daiFaucetContract.address,
    wallet().address
  );

  await flashloanContract.deployed();
  // console.log(`Flashloan Address: ${flashloanContract.address}`);
  return {
    vaultManager: vaultManagerContract.address,
    daiFaucet: daiFaucetContract.address,
    flashloan: flashloanContract.address,
  };
}

export interface Addresses {
  vaultManager: string;
  daiFaucet: string;
  flashloan: string;
}
