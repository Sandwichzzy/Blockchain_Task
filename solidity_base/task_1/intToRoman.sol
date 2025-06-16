// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract intToRoman {
    struct RomanNum {
        uint256 value;
        string symbol;
    }

    RomanNum[] private romanNums;

    constructor() {
        romanNums.push(RomanNum(1000, "M"));
        romanNums.push(RomanNum(900, "CM"));
        romanNums.push(RomanNum(500, "D"));
        romanNums.push(RomanNum(400, "CD"));
        romanNums.push(RomanNum(100, "C"));
        romanNums.push(RomanNum(90, "XC"));
        romanNums.push(RomanNum(50, "L"));
        romanNums.push(RomanNum(40, "XL"));
        romanNums.push(RomanNum(10, "X"));
        romanNums.push(RomanNum(9, "IX"));
        romanNums.push(RomanNum(5, "V"));
        romanNums.push(RomanNum(4, "IV"));
        romanNums.push(RomanNum(1, "I"));
    }

    function intToRomanNum(uint256 num) public view returns (string memory) {
        require(num > 0 && num <= 3999, "Invalid number");

        string memory res;
        for (uint256 i = 0; i < romanNums.length; i++) {
            while (num >= romanNums[i].value) {
                num -= romanNums[i].value;
                res = string(abi.encodePacked(res, romanNums[i].symbol)); //abi.encodePacked 拼接字符串
            }
        }

        return res;
    }
}
