require("dotenv").config();

import {ethers} from "ethers";
import truffle from "../truffle-config";
import FlashloanContract from "../build/contracts/Flashloan.json";
import Ganache from "ganache-core";
import addresses from "../addresses";

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

export async function deployIdentityContract() {
  console.log("Deploying Flashloan Contract");

  const factory = new ethers.ContractFactory(FlashloanContract.abi, FlashloanContract.bytecode, wallet());
  const contract = await factory.deploy(
    addresses.kyber.kyberNetworkProxy,
    addresses.uniswap.router,
    addresses.tokens.weth,
    addresses.tokens.dai,
    wallet().address
  );

  await contract.deployed();
  return contract.address;
}
