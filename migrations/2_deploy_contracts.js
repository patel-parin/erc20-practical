var parin = artifacts.require("parin");
var parinTokenSale = artifacts.require("parinTokenSale");

module.exports = async function(deployer) {
  // Deploy token with 1,000,000 supply
  await deployer.deploy(parin, 1000000);
  const token = await parin.deployed();

  // Token price = 0.001 ether in wei
  const tokenPrice = 1000000000000000;

  // Deploy token sale
  await deployer.deploy(parinTokenSale, token.address, tokenPrice);
};
