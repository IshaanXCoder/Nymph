// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
 
import "@pythnetwork/entropy-sdk-solidity/IEntropyV2.sol";
import "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";
 
contract ColorFlip is IEntropyConsumer {
  event FlipRequested(uint64 sequenceNumber);
  event ColorGenerated(uint64 sequenceNumber, uint8 r, uint8 g, uint8 b, string hexColor);
 
  IEntropyV2 entropy;
  
  constructor(address _entropy) {
    entropy = IEntropyV2(_entropy);
  }
 
  // This method is required by the IEntropyConsumer interface
  function getEntropy() internal view override returns (address) {
    return address(entropy);
  }

  function request() external payable {
    // get the required fee
    uint128 requestFee = entropy.getFeeV2();
    // check if the user has sent enough fees
    if (msg.value < requestFee) revert("not enough fees");
 
    // pay the fees and request a random number from entropy
    uint64 sequenceNumber = entropy.requestV2{ value: requestFee }();
 
    // emit event
    emit FlipRequested(sequenceNumber);
  }

  function entropyCallback(
    uint64 sequenceNumber,
    address _providerAddress,
    bytes32 randomNumber
  ) internal override {
    // Generate RGB values from the random number
    uint256 rand = uint256(randomNumber);
    uint8 r = uint8(rand % 256);
    uint8 g = uint8((rand >> 8) % 256);
    uint8 b = uint8((rand >> 16) % 256);
    
    // Convert to hex string (e.g., "#FF00FF")
    string memory hexColor = string(
        abi.encodePacked(
            "#",
            toHexString(r),
            toHexString(g),
            toHexString(b)
        )
    );
    
    emit ColorGenerated(sequenceNumber, r, g, b, hexColor);
  }
  
  // Helper function to convert uint8 to 2-digit hex string
  function toHexString(uint8 value) private pure returns (string memory) {
    bytes memory alphabet = "0123456789ABCDEF";
    bytes memory str = new bytes(2);
    str[0] = alphabet[value >> 4];
    str[1] = alphabet[value & 0x0f];
    return string(str);
  }
}