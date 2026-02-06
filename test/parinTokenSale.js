const ParinToken = artifacts.require("parin");
const ParinTokenSale = artifacts.require("parinTokenSale");

contract("ParinTokenSale", (accounts) => {
  let tokenInstance;
  let tokenSaleInstance;

  const admin = accounts[0];
  const buyer = accounts[1];

  const tokenPrice = 1000000000000000; // 0.001 ether in wei
  const tokensAvailable = 750000;
  let numberOfTokens;

  it("initializes the contract with correct values", async () => {
    tokenSaleInstance = await ParinTokenSale.deployed();

    const address = tokenSaleInstance.address;
    assert.notEqual(address, 0x0, "has contract address");

    const tokenContractAddress = await tokenSaleInstance.tokenContract();
    assert.notEqual(tokenContractAddress, 0x0, "has token contract address");

    const price = await tokenSaleInstance.tokenPrice();
    assert.equal(price.toNumber(), tokenPrice, "token price is correct");
  });

  it("facilitates token buying", async () => {
    tokenInstance = await ParinToken.deployed();
    tokenSaleInstance = await ParinTokenSale.deployed();

    // Transfer tokens to sale contract
    await tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: admin });

    numberOfTokens = 10;

    const receipt = await tokenSaleInstance.buyTokens(numberOfTokens, {
      from: buyer,
      value: numberOfTokens * tokenPrice,
    });

    assert.equal(receipt.logs.length, 1, "triggers one event");
    assert.equal(receipt.logs[0].event, "Sell", "should be Sell event");
    assert.equal(receipt.logs[0].args._buyer, buyer, "logs buyer");
    assert.equal(receipt.logs[0].args._amount.toNumber(), numberOfTokens, "logs amount");

    const sold = await tokenSaleInstance.tokensSold();
    assert.equal(sold.toNumber(), numberOfTokens, "increments tokens sold");

    const buyerBalance = await tokenInstance.balanceOf(buyer);
    assert.equal(buyerBalance.toNumber(), numberOfTokens, "buyer gets tokens");

    const saleBalance = await tokenInstance.balanceOf(tokenSaleInstance.address);
    assert.equal(
      saleBalance.toNumber(),
      tokensAvailable - numberOfTokens,
      "sale contract balance reduced"
    );

    // Wrong ether value
    try {
      await tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: 1 });
      assert.fail("should revert");
    } catch (error) {
      assert(error.message.includes("revert"), "must revert on wrong value");
    }

    // Buying more than available
    try {
      await tokenSaleInstance.buyTokens(800000, {
        from: buyer,
        value: numberOfTokens * tokenPrice,
      });
      assert.fail("should revert");
    } catch (error) {
      assert(error.message.includes("revert"), "cannot buy more than available");
    }
  });

  it("ends token sale", async () => {
    tokenInstance = await ParinToken.deployed();
    tokenSaleInstance = await ParinTokenSale.deployed();

    // Non-admin cannot end sale
    try {
      await tokenSaleInstance.endSale({ from: buyer });
      assert.fail("should revert");
    } catch (error) {
      assert(error.message.includes("revert"), "only admin can end sale");
    }

    // Admin ends sale
    await tokenSaleInstance.endSale({ from: admin });

    const adminBalance = await tokenInstance.balanceOf(admin);
    assert(adminBalance.toNumber() > 0, "admin receives unsold tokens");

    const price = await tokenSaleInstance.tokenPrice();
    assert.equal(price.toNumber(), 0, "token price reset after selfdestruct");
  });
});
