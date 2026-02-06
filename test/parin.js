var parin = artifacts.require("./parin.sol");

contract('parin', function(accounts) {
  var tokenInstance;

  it('initializes the contract with the correct values', function() {
    return parin.deployed().then(function(instance) {
      tokenInstance = instance;
      return tokenInstance.name();
    }).then(function(name) {
      assert.equal(name, 'parin', 'has the correct name');
      return tokenInstance.symbol();
    }).then(function(symbol) {
      assert.equal(symbol, 'parin', 'has the correct symbol');
      return tokenInstance.standard();
    }).then(function(standard) {
      assert.equal(standard, 'parin v1.0', 'has the correct standard');
    });
  })

  it('allocates the initial supply upon deployment', function() {
    return parin.deployed().then(function(instance) {
      tokenInstance = instance;
      return tokenInstance.totalSupply();
    }).then(function(totalSupply) {
      assert.equal(totalSupply.toNumber(), 1000000, 'sets the total supply to 1,000,000');
      return tokenInstance.balanceOf(accounts[0]);
    }).then(function(adminBalance) {
      assert.equal(adminBalance.toNumber(), 1000000, 'it allocates the initial supply to the admin account');
    });
  });

  it('transfers token ownership', function() {
  return parin.deployed().then(function(instance) {
    tokenInstance = instance;

    // This should FAIL and return false (not revert)
return tokenInstance.transfer.call(accounts[1], 2000000);
  }).then(function(success) {
    assert.equal(success, false, 'transfer should fail when balance is low');

    // Valid transfer check
    return tokenInstance.transfer.call(accounts[1], 250000, { from: accounts[0] });
  }).then(function(success) {
    assert.equal(success, true, 'it returns true');

    return tokenInstance.transfer(accounts[1], 250000, { from: accounts[0] });
  }).then(function(receipt) {
    assert.equal(receipt.logs.length, 1, 'triggers one event');
    assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
    assert.equal(receipt.logs[0].args._from, accounts[0]);
    assert.equal(receipt.logs[0].args._to, accounts[1]);
    assert.equal(receipt.logs[0].args._value.toNumber(), 250000);

    return tokenInstance.balanceOf(accounts[1]);
  }).then(function(balance) {
    assert.equal(balance.toNumber(), 250000);

    return tokenInstance.balanceOf(accounts[0]);
  }).then(function(balance) {
    assert.equal(balance.toNumber(), 750000);
  });
});

});
