// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract voting {
    //统计票数
    mapping(string => uint256) public candidateVotes;

    string[] private candidatesList; //用于reset

    //vote for a candidate
    function vote(string memory candidateName) public {
        candidateVotes[candidateName]++; //incre vote count by 1

        if (candidateVotes[candidateName] == 1) {
            candidatesList.push(candidateName);
        } //如果是第一次给他投票，把它加入到candidateList
    }

    function getVotes(
        string memory candidateName
    ) public view returns (uint256) {
        return candidateVotes[candidateName];
    }

    function resetVotes() public {
        for (uint i = 0; i < candidatesList.length; i++) {
            candidateVotes[candidatesList[i]] = 0;
        }
    }

    function getAllCandidates() public view returns (string[] memory) {
        return candidatesList;
    }
}
