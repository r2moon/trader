const FlashloanUniswapKyber = artifacts.require("FlashloanUniswapKyber.sol");
const TestFlashloan = artifacts.require("TestableFlashloan.sol");
const {default: addresses} = require("../dest/addresses");

module.exports = async function (deployer, network, [beneficiaryAddress, _]) {
  network = network.replace("-fork", "");
  // deploy test contract on testable networks
  if (network === "mainnetFork" || network == "testnet") {
    console.log(`deploying testable flashloan to ${network}`);

    await deployer.deploy(
      TestFlashloan,
      addresses.kyber.kyberNetworkProxy,
      addresses.uniswap.router,
      addresses.tokens.token1.weth,
      beneficiaryAddress
    );
  } else {
    console.log(`deploying flashloan to ${network}`);

    await deployer.deploy(
      FlashloanUniswapKyber,
      addresses.kyber.kyberNetworkProxy,
      addresses.uniswap.router,
      addresses.tokens.token1.weth,
      "0xCD46321F885563aA203faBF1D2cc5e28A947e5AB"
    );
  }
};
