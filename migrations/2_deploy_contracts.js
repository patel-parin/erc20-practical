var ParinToken = artifacts.require("ParinToken");
var ParinTokenSale = artifacts.require("ParinTokenSale");

module.exports = async function(deployer, network, accounts) {
  // Deploy token with 1,000,000 supply
  await deployer.deploy(ParinToken, 1000000);
  const token = await ParinToken.deployed();

  // Token price = 0.001 ETH
  const tokenPrice = web3.utils.toWei("0.001", "ether");

  // Deploy token sale
  await deployer.deploy(ParinTokenSale, token.address, tokenPrice);
  const sale = await ParinTokenSale.deployed();

  // 🔥 MOST IMPORTANT LINE 🔥
  // Transfer tokens from admin → sale contract
  await token.transfer(sale.address, 750000);
};
