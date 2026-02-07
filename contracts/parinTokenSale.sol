pragma solidity ^0.4.26;

import "./ParinToken.sol";

contract ParinTokenSale {
    address public admin;
    ParinToken public tokenContract;
    uint256 public tokenPrice;
    uint256 public tokensSold;

    event Sell(address indexed _buyer, uint256 _amount);

    constructor(ParinToken _tokenContract, uint256 _tokenPrice) public {
        admin = msg.sender;
        tokenContract = _tokenContract;
        tokenPrice = _tokenPrice;
    }

    function multiply(uint256 x, uint256 y) internal pure returns (uint256) {
        if (x == 0) {
            return 0;
        }
        uint256 z = x * y;
        require(z / x == y);
        return z;
    }

    function buyTokens(uint256 _numberOfTokens) public payable {
        require(msg.value == multiply(_numberOfTokens, tokenPrice));
        require(tokenContract.balanceOf(address(this)) >= _numberOfTokens);
        require(tokenContract.transfer(msg.sender, _numberOfTokens));

        tokensSold += _numberOfTokens;

        emit Sell(msg.sender, _numberOfTokens);
    }

    function endSale() public {
        require(msg.sender == admin);
    require(tokenContract.transfer(admin, tokenContract.balanceOf(this)));

    tokenPrice = 0;

        
    }
}
