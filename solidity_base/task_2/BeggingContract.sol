// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract BeggingContract {
    // 合约所有者
    address public owner;
    // 记录每个捐赠者的捐赠金额
    mapping(address => uint256) public donations;
    // 总捐赠金额
    uint256 public totalDonations;

    event Donation(address indexed donor, uint256 amount);

    event WithDraw(address indexed owner, uint256 amount);

    struct Donor {
        address donorAddr;
        uint256 amount;
    }
    // 捐赠排行榜（前3名）
    Donor[3] public topThree;

    //捐赠时间限制
    uint256 public donationStartTime;
    uint256 public donationEndTime;
    bool public timeRestrictionEnabled;

    constructor() {
        owner = msg.sender;
        timeRestrictionEnabled = false;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Only owner can call this function");
        _;
    }

    modifier donationPeriod() {
        if (timeRestrictionEnabled) {
            require(
                block.timestamp >= donationStartTime &&
                    block.timestamp <= donationEndTime,
                "Donate time period has passed"
            );
        }
        _;
    }

    function donate() external payable donationPeriod {
        require(msg.value > 0, "Donation amount must be greater than 0");
        //记录
        donations[msg.sender] += msg.value;
        totalDonations += msg.value;

        //更新排名
        updateTop3(msg.sender);
        //捐赠事件
        emit Donation(msg.sender, msg.value);
    }

    function updateTop3(address donor) private {
        uint256 currentDonation = donations[donor];
        // 检查是否已经在前3名中
        for (uint i = 0; i < 3; i++) {
            if (topThree[i].donorAddr == donor) {
                topThree[i].amount = currentDonation;
                sortTopDonors();
                return;
            }
        }
        // 如果不在前3名中，检查是否能进入排行榜
        if (currentDonation > topThree[2].amount) {
            topThree[2] = Donor(donor, currentDonation);
            sortTopDonors();
        }
    }

    function sortTopDonors() private {
        for (uint i = 1; i < 3; i++) {
            for (uint j = 0; j < 3 - i; j++) {
                if (topThree[j].amount < topThree[j + 1].amount) {
                    Donor memory temp = topThree[j];
                    topThree[j] = topThree[j + 1];
                    topThree[j + 1] = temp;
                }
            }
        }
    }

    function getTop3Donors() external view returns (Donor[3] memory) {
        return topThree;
    }

    //当合约直接接收ETH 用户直接向合约地址转账而不调用任何函数（没有调用任何函数）时自动触发
    receive() external payable donationPeriod {
        require(msg.value > 0, "Donation amount must be greater than 0");
        donations[msg.sender] += msg.value;
        totalDonations += msg.value;

        updateTop3(msg.sender);
        emit Donation(msg.sender, msg.value);
    }

    function getDonation(address donationAddr) external view returns (uint256) {
        return donations[donationAddr];
    }

    function withDraw() external payable onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No amount to withdraw");
        payable(owner).transfer(balance);
        emit WithDraw(msg.sender, balance);
    }

    function setDonationPeriod(
        uint256 startTime,
        uint256 endTime
    ) external onlyOwner {
        require(startTime < endTime, "Start time must be before end time");
        donationStartTime = startTime;
        donationEndTime = endTime;
        timeRestrictionEnabled = true;
    }

    function disableTimePeriod() external onlyOwner {
        timeRestrictionEnabled = false;
    }
}
