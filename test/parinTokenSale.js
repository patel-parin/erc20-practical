const ParinToken = artifacts.require('ParinToken');
const ParinTokenSale = artifacts.require('ParinTokenSale');

contract('ParinTokenSale', (accounts) => {
  let tokenInstance;
  let tokenSaleInstance;

  const admin = accounts[0];
  const buyer = accounts[1];
  const tokenPrice = web3.utils.toBN('1000000000000000'); // 0.001 ether
  const tokensAvailable = 750000;
  let numberOfTokens;

  before(async () => {
    tokenInstance = await ParinToken.deployed();
    tokenSaleInstance = await ParinTokenSale.deployed();
  });

  it('initializes the contract with correct values', async () => {
    const address = tokenSaleInstance.address;
    assert.notEqual(address, 0x0, 'has contract address');

    const tokenAddress = await tokenSaleInstance.tokenContract();
    assert.notEqual(tokenAddress, 0x0, 'has token contract address');

    const price = await tokenSaleInstance.tokenPrice();
    assert.equal(price.toString(), tokenPrice.toString(), 'token price is correct');
  });

  it('facilitates token buying', async () => {
    // Send tokens to sale contract
    await tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: admin });

    numberOfTokens = 10;

    const receipt = await tokenSaleInstance.buyTokens(numberOfTokens, {
      from: buyer,
      value: tokenPrice.mul(web3.utils.toBN(numberOfTokens))
    });

    assert.equal(receipt.logs.length, 1, 'triggers one event');
    assert.equal(receipt.logs[0].event, 'Sell');
    assert.equal(receipt.logs[0].args._buyer, buyer);
    assert.equal(receipt.logs[0].args._amount.toNumber(), numberOfTokens);

    const sold = await tokenSaleInstance.tokensSold();
    assert.equal(sold.toNumber(), numberOfTokens);

    const buyerBalance = await tokenInstance.balanceOf(buyer);
    assert.equal(buyerBalance.toNumber(), numberOfTokens);

    const saleBalance = await tokenInstance.balanceOf(tokenSaleInstance.address);
    assert.equal(saleBalance.toNumber(), tokensAvailable - numberOfTokens);

    // Wrong ether value
    try {
      await tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: 1 });
      assert.fail();
    } catch (err) {
      assert(err.message.includes('revert'));
    }

    // Buying more than available
    try {
      await tokenSaleInstance.buyTokens(800000, {
        from: buyer,
        value: tokenPrice.mul(web3.utils.toBN(numberOfTokens))
      });
      assert.fail();
    } catch (err) {
      assert(err.message.includes('revert'));
    }
  });

  it('ends token sale', async () => {
    // Non-admin should fail
    try {
      await tokenSaleInstance.endSale({ from: buyer });
      assert.fail();
    } catch (err) {
      assert(err.message.includes('revert'));
    }

    // Admin ends sale
    await tokenSaleInstance.endSale({ from: admin });

    const adminBalance = await tokenInstance.balanceOf(admin);
    assert(adminBalance.toNumber() > 0, 'unsold tokens returned to admin');
  });
});
