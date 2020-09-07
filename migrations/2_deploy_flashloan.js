// Mainnet
const Flashloan = artifacts.require("Flashloan.sol");
const {default: addresses} = require("../dest/addresses");

module.exports = function (deployer, _network, [beneficiaryAddress, _]) {
  deployer.deploy(Flashloan, addresses.kyber.kyberNetworkProxy, addresses.uniswap.router, addresses.tokens.weth, beneficiaryAddress);
};

// //// For Test
// const Flashloan = artifacts.require("TestableFlashloan.sol");
// const VaultManager = artifacts.require("VaultManager.sol");
// const DaiFaucet = artifacts.require("DaiFaucet.sol");
// const {default: addresses} = require("../dest/addresses");

// module.exports = async function (deployer, network, [beneficiaryAddress, _]) {
//   await deployer.deploy(VaultManager);
//   await deployer.deploy(DaiFaucet, addresses.tokens.dai);
//   const daiFaucet = await DaiFaucet.deployed();

//   await deployer.deploy(
//     Flashloan,
//     addresses.kyber.kyberNetworkProxy,
//     addresses.uniswap.router,
//     addresses.tokens.weth,
//     addresses.tokens.dai,
//     daiFaucet.address,
//     beneficiaryAddress
//   );
// };
