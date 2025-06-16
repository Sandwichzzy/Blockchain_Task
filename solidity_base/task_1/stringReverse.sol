// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract stringReverse {
    function reverseString(
        string memory str
    ) public pure returns (string memory) {
        bytes memory bytes_str = bytes(str);

        bytes memory resBytes = new bytes(bytes_str.length);

        //反转字符串
        uint i = 0;
        for (; i < bytes_str.length; i++) {
            resBytes[i] = bytes_str[bytes_str.length - 1 - i];
        }

        return string(resBytes);
    }
}
