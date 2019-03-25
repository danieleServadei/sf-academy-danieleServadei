pragma solidity ^0.5.1;
pragma experimental ABIEncoderV2;

// avoid overflows
library SafeMath {
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    if (a == 0) {
      return 0;
    }
    uint256 c = a * b;
    require(c / a == b);
    return c;
  }

  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b > 0);
    uint256 c = a / b;
    return c;
  }

  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b <= a);
    uint256 c = a - b;
    return c;
  }

  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    require(c >= a);
    return c;
  }

  function mod(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b != 0);
    return a % b;
  }
}

contract ICO {
  using SafeMath for uint256; 
  
  // ICO tokens available till open
  uint256 public tokensAvailable;
  
  // constructor, set the max tokens available
  constructor(uint256 quantity) public {
    tokensAvailable = quantity;
  }
  
  // update contract's tokens available
  function set(uint toSet) public {
    tokensAvailable = toSet;
  }
  
  // users balance, the key will be their address
  mapping (bytes => uint256) balance;
  
  // create a wallet
  function createWallet(bytes memory wallet) public {
    balance[wallet] = 0;
  }

  // get a wallet's balance
  function walletBalance(bytes memory wallet) view public returns (uint256) {
    return balance[wallet];
  }

  // add founds to a wallet
  function addFounds(bytes memory wallet, uint256 toAdd) public {
    require(tokensAvailable > toAdd);
    tokensAvailable = SafeMath.sub(tokensAvailable, toAdd);
    balance[wallet] = SafeMath.add(balance[wallet], toAdd);
  }

  // transfer tokens between two wallets
  function transfer(bytes memory walletBuyer, bytes memory walletSeller, uint256 price) public {
    balance[walletBuyer] = SafeMath.sub(balance[walletBuyer], price);
    balance[walletSeller] = SafeMath.add(balance[walletSeller], price);
  }

  // remove founds from a wallet (AKA burn - single wallet)
  function burn(bytes memory wallet, uint256 toRemove) public {
    balance[wallet] = SafeMath.sub(balance[wallet], toRemove);
  }

  // array recipients, array values, assign tokens to recipients.
  function AirDrop(bytes[] memory recipients, uint[] memory values) public {
    for(uint i = 0; i < recipients.length; i++) {
      addFounds(recipients[i], values[i]);
    }
  }

  // util, check if two bytes are equal
  function stringsEqual(bytes storage _a, bytes memory _b) view internal returns (bool) {
    bytes storage a = bytes(_a);
    bytes memory b = bytes(_b);
    if (a.length != b.length)
      return false;
    for (uint i = 0; i < a.length; i ++)
      if (a[i] != b[i])
        return false;
    return true;
  }
}