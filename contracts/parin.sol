pragma solidity ^0.4.26;

contract parin {
    string  public name = "parin";
    string  public symbol = "parin";
    string  public standard = "parin v1.0";

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;

    event Transfer(
        address indexed _from,
        address indexed _to,
        uint256 _value
    );

    function parin(uint256 _initialSupply) public {
        totalSupply = _initialSupply;
        balanceOf[msg.sender] = _initialSupply;
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
    if (balanceOf[msg.sender] < _value) {
        return false;
    }

    balanceOf[msg.sender] -= _value;
    balanceOf[_to] += _value;

    Transfer(msg.sender, _to, _value);
    return true;
}

}
