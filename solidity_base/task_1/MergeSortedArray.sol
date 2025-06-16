// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract MergeSortedArray {
    function merge(
        uint[] memory arr1,
        uint[] memory arr2
    ) public pure returns (uint[] memory) {
        //
        uint length1 = arr1.length;
        uint length2 = arr2.length;
        uint[] memory mergedArr = new uint[](length1 + length2);

        uint i = 0;
        uint j = 0;
        uint k = 0;

        while (i < length1 && j < length2) {
            if (arr1[i] < arr2[j]) {
                mergedArr[k++] = arr1[i++];
            } else {
                mergedArr[k++] = arr2[j++];
            }
        }
        //剩余元素如果存在
        while (i < length1) {
            mergedArr[k++] = arr1[i++];
        }

        while (j < length2) {
            mergedArr[k++] = arr2[j++];
        }

        return mergedArr;
    }
}
