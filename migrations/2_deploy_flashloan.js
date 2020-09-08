const Flashloan = artifacts.require("Flashloan.sol");
const TestFlashloan = artifacts.require("TestableFlashloan.sol");
const VaultManager = artifacts.require("VaultManager.sol");
const DaiFaucet = artifacts.require("DaiFaucet.sol");
const {default: addresses} = require("../dest/addresses");

module.exports = async function (deployer, network, [beneficiaryAddress, _]) {
  await deployer.deploy(
    Flashloan,
    addresses.kyber.kyberNetworkProxy,
    addresses.uniswap.router,
    addresses.tokens.token1.weth,
    beneficiaryAddress
  );

  // deploy test contract on mainnet fork
  if (network === "mainnetFork") {
    console.log("deploying testable flashloan");

    await deployer.deploy(VaultManager);
    await deployer.deploy(DaiFaucet, addresses.tokens.token1.dai);
    const daiFaucet = await DaiFaucet.deployed();

    await deployer.deploy(
      TestFlashloan,
      addresses.kyber.kyberNetworkProxy,
      addresses.uniswap.router,
      addresses.tokens.token1.weth,
      daiFaucet.address,
      beneficiaryAddress
    );
  }
};
