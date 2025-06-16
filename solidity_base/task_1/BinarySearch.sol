// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BinarySearch {

    uint[] public array=[1,34,67];

    // 添加数据到数组（可选）
    function addData(uint value) public {
        array.push(value);
    }

    function binarySearch(uint target) public view returns (bool){
        return binarySearchArray(target,0,int(array.length-1));
    }
    //有序数组
    function binarySearchArray(uint target, int left, int right) private  view  returns(bool ){
        if (left>right){
            return false;
        }
        int mid=(left+right)/2; //向下取整

        if(array[uint(mid)]==target){
            return true;
        }else if (array[uint(mid)]<target){
            return binarySearchArray(target,mid+1,right);
        }else{
            return binarySearchArray(target,left,mid-1);
        }
    }
}