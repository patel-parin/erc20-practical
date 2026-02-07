const ParinToken = artifacts.require('ParinToken');

contract('ParinToken', (accounts) => {
  let tokenInstance;

  const admin = accounts[0];
  const receiver = accounts[1];
  const fromAccount = accounts[2];
  const toAccount = accounts[3];
  const spendingAccount = accounts[4];

  before(async () => {
    tokenInstance = await ParinToken.deployed();
  });

  it('initializes the contract with correct values', async () => {
    const name = await tokenInstance.name();
    const symbol = await tokenInstance.symbol();
    const standard = await tokenInstance.standard();

    assert.equal(name, 'Parin Token');
    assert.equal(symbol, 'Parin');
    assert.equal(standard, 'Parin Token v1.0');
  });

  it('allocates the initial supply to admin', async () => {
    const totalSupply = await tokenInstance.totalSupply();
    const adminBalance = await tokenInstance.balanceOf(admin);

    assert.equal(totalSupply.toNumber(), 1000000);
    assert.equal(adminBalance.toNumber(), 1000000);
  });

  it('transfers token ownership', async () => {
    // should fail
    try {
      await tokenInstance.transfer(receiver, web3.utils.toBN('25000000'));
      assert.fail();
    } catch (err) {
      assert(err.message.includes('revert'));
    }

    // should succeed
    const receipt = await tokenInstance.transfer(receiver, 250000, { from: admin });

    assert.equal(receipt.logs.length, 1);
    assert.equal(receipt.logs[0].event, 'Transfer');
    assert.equal(receipt.logs[0].args._from, admin);
    assert.equal(receipt.logs[0].args._to, receiver);
    assert.equal(receipt.logs[0].args._value.toNumber(), 250000);

    const receiverBalance = await tokenInstance.balanceOf(receiver);
    const adminBalance = await tokenInstance.balanceOf(admin);

    assert.equal(receiverBalance.toNumber(), 250000);
    assert.equal(adminBalance.toNumber(), 750000);
  });

  it('approves tokens for delegated transfer', async () => {
    const receipt = await tokenInstance.approve(receiver, 100, { from: admin });

    assert.equal(receipt.logs.length, 1);
    assert.equal(receipt.logs[0].event, 'Approval');
    assert.equal(receipt.logs[0].args._owner, admin);
    assert.equal(receipt.logs[0].args._spender, receiver);
    assert.equal(receipt.logs[0].args._value.toNumber(), 100);

    const allowance = await tokenInstance.allowance(admin, receiver);
    assert.equal(allowance.toNumber(), 100);
  });

  it('handles delegated token transfers', async () => {
    // send tokens to fromAccount
    await tokenInstance.transfer(fromAccount, 100, { from: admin });

    // approve spendingAccount
    await tokenInstance.approve(spendingAccount, 10, { from: fromAccount });

    // fail: more than balance
    try {
      await tokenInstance.transferFrom(fromAccount, toAccount, 9999, { from: spendingAccount });
      assert.fail();
    } catch (err) {
      assert(err.message.includes('revert'));
    }

    // fail: more than allowance
    try {
      await tokenInstance.transferFrom(fromAccount, toAccount, 20, { from: spendingAccount });
      assert.fail();
    } catch (err) {
      assert(err.message.includes('revert'));
    }

    // success
    const receipt = await tokenInstance.transferFrom(fromAccount, toAccount, 10, { from: spendingAccount });

    assert.equal(receipt.logs.length, 1);
    assert.equal(receipt.logs[0].event, 'Transfer');
    assert.equal(receipt.logs[0].args._from, fromAccount);
    assert.equal(receipt.logs[0].args._to, toAccount);
    assert.equal(receipt.logs[0].args._value.toNumber(), 10);

    const fromBalance = await tokenInstance.balanceOf(fromAccount);
    const toBalance = await tokenInstance.balanceOf(toAccount);
    const allowance = await tokenInstance.allowance(fromAccount, spendingAccount);

    assert.equal(fromBalance.toNumber(), 90);
    assert.equal(toBalance.toNumber(), 10);
    assert.equal(allowance.toNumber(), 0);
  });
});
