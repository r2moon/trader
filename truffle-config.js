require("dotenv").config();
const {ethers} = require("ethers");
const HDWalletProvider = require("@truffle/hdwallet-provider");

const infuraUri = process.env.INFURA_URI || "";
const infuraTestnetUri = process.env.INFURA_TESTNET_URI || "";
const privKey = process.env.PRIVATE_KEY || "";

module.exports = {
  networks: {
    mainnet: {
      networkCheckTimeout: 10000,
      provider: () => new HDWalletProvider(privKey, infuraUri),
      network_id: 1,
      gasPrice: ethers.utils.parseUnits("41", "gwei").toString(),
      gas: 6000000,
    },
    testnet: {
      networkCheckTimeout: 10000,
      provider: () => new HDWalletProvider(privKey, infuraTestnetUri),
      network_id: 42, // kovan
      gasPrice: ethers.utils.parseUnits("90", "gwei").toString(),
      gas: 6000000,
    },
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },
    mainnetFork: {
      host: "127.0.0.1",
      port: 8545,
      network_id: 1,
      skipDryRun: true,
    },
    tenderly: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "*",
      gasPrice: 0,
    },
  },
};
