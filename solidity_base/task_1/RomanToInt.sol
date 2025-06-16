// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RomanToInt {
    mapping(bytes1 => uint256) private romanValues;

    constructor() {
        romanValues["I"] = 1;
        romanValues["V"] = 5;
        romanValues["X"] = 10;
        romanValues["L"] = 50;
        romanValues["C"] = 100;
        romanValues["D"] = 500;
        romanValues["M"] = 1000;
    }

    function romanToInt(string memory s) public view returns (uint256) {
        bytes memory romanBytes = bytes(s);

        uint256 total = 0;
        uint256 preValue = 0;

        for (uint256 i = romanBytes.length; i > 0; i--) {
            bytes1 currentChar = romanBytes[i - 1];
            uint256 currentValue = romanValues[currentChar];

            if (currentValue < preValue) {
                total -= currentValue; //If its less than current value then we need to subtract it from our answer else add it.
            } else {
                total += currentValue;
            }

            preValue = currentValue;
        }

        return total;
    }
}
