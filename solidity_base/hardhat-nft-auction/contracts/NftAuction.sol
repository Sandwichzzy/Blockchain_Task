// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";


import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

import "hardhat/console.sol";

contract NftAuction is Initializable, UUPSUpgradeable, IERC721Receiver {

    struct Auction {
        address seller;
        //起始价格
        uint256 startPrice;
        uint256 duration;
        //拍卖开始时间
        uint256 startTime;

        //最高出价者
        address highestBidder;
        //最高出价
        uint256 highestBid; 
        bool ended; //是否结束

        //拍卖品合约地址
        address nftContract;
        //拍卖品id
        uint256 tokenId;

        //参加竞价的资产类型
        //0x地址表示eth 其他的地址ERC20
        address tokenAddress;
    }

    //状态变量
    //拍卖品id=>拍卖信息
    mapping(uint256=>Auction) public auctions;
    //下一个拍卖品id
    uint256 public nextAuctionId;

    //管理员
    address public admin;

    //Chainlink 价格feed
    // AggregatorV3Interface internal priceETHFeed;
    mapping (address => AggregatorV3Interface) public priceFeeds;


    function initialize() public initializer {
        admin = msg.sender;
    } 


    function setPriceFeed(address tokenAddress,address _priceETHFeed) public {
        // priceETHFeed = AggregatorV3Interface(_priceETHFeed);
        priceFeeds[tokenAddress] = AggregatorV3Interface(_priceETHFeed);
    }

     //eth->USD =>2428 .3006 5900
     //USCD->USD=>0.9999 5821   
     function getChainlinkLatestPrice(address tokenAddress) public view returns (int) {
        (
            /* uint80 roundId */, 
            int256 answer,
            /*uint256 startedAt*/,
            /*uint256 updatedAt*/,
            /*uint80 answeredInRound*/
        ) = priceFeeds[tokenAddress].latestRoundData();
        return answer;
    }
    // 实现 IERC721Receiver 接口
    function onERC721Received(
        address ,
        address ,
        uint256 ,
        bytes calldata 
    ) external override pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    //创建拍卖
    function createAuction( uint256 _startPrice, uint256 _duration, address _nftContract, uint256 _tokenId) public {
        require(_startPrice > 0, "Start price must be greater than 0");
        require(_duration >= 10, "Duration must be greater than 10s");
        require(msg.sender == admin,"Only admin can create auction");
        // 检查 NFT 是否属于调用者
        require(IERC721(_nftContract).ownerOf(_tokenId) == msg.sender, "Not the owner of NFT");
        //将拍卖品NFT 转移给合约
        IERC721(_nftContract).approve(address(this), _tokenId); 
        IERC721(_nftContract).safeTransferFrom(msg.sender, address(this), _tokenId);

        auctions[nextAuctionId] = Auction({
            seller: msg.sender,
            startPrice: _startPrice,
            duration: _duration,
            startTime: block.timestamp,
            highestBidder: address(0),
            highestBid: 0,
            ended: false,
            nftContract: _nftContract,
            tokenId: _tokenId,
            tokenAddress: address(0)
        });
        nextAuctionId++;
    }

    //买家参与买单
    function placeBid(uint256 auctionId, uint256 amount,address _tokenAddress ) external payable {
   
        //统一的价值尺度
        //1ETH = ?dollar
        //1USDC = ?dollar
        
        Auction storage auction = auctions[auctionId];
        //拍卖未结束
        require(!auction.ended && block.timestamp < auction.startTime + auction.duration, "Auction already ended");

        uint payValue;
        uint256 bidAmount;
        
        //如果tokenAddress不为0，则表示使用ERC20代币参与竞价
        if(_tokenAddress != address(0)){
            require(amount > 0, "Amount must be greater than 0");
            require(msg.value == 0, "Should not send ETH when using ERC20");
            bidAmount = amount;
            // ERC20代币数量 * ERC20/USD价格 = USD价值
            // USDC: 6位小数 * 8位小数价格 / 10^8 = 6位小数USD
            // 为了统一比较，转换为18位小数: 结果 * 10^12
            payValue = amount * uint256(getChainlinkLatestPrice(_tokenAddress)) * (10**12) / (10**8);
        }else{ 
            //处理ETH
            require(msg.value > 0, "Must send ETH");
            require(amount == 0, "Amount should be 0 when using ETH");
            bidAmount = msg.value;
            // ETH数量(wei) * ETH/USD价格 = USD价值
            // ETH: 18位小数 * 8位小数价格 / 10^8 = 18位小数USD
            payValue = msg.value * uint256(getChainlinkLatestPrice(address(0))) / (10**8);
        }

        // 计算起始价格的USD价值（使用ETH价格作为基准）
        uint startPriceValue = auction.startPrice * uint256(getChainlinkLatestPrice(address(0))) / (10**8);

        // 计算当前最高出价的USD价值
        uint highestBidValue = 0;
        if(auction.highestBidder != address(0) && auction.highestBid > 0){
            if(auction.tokenAddress == address(0)){
                // 之前的出价是ETH (18位小数)
                highestBidValue = auction.highestBid * uint256(getChainlinkLatestPrice(address(0))) / (10**8);
            }else{
                // 之前的出价是ERC20 (6位小数)，需要转换为18位小数统一比较
                highestBidValue = auction.highestBid * uint256(getChainlinkLatestPrice(auction.tokenAddress)) * (10**12) / (10**8);
            }
        }

        

        // 调试信息
        console.log("=== USD Value Calculation Debug ===");
        console.log("Token Address:", _tokenAddress);
        console.log("Bid Amount:", bidAmount);
        console.log("Token Price:", uint256(getChainlinkLatestPrice(_tokenAddress != address(0) ? _tokenAddress : address(0))));
        console.log("Pay Value (USD in 18 decimals):", payValue);
        console.log("Start Price Value (USD in 18 decimals):", startPriceValue);
        console.log("Highest Bid Value (USD in 18 decimals):", highestBidValue);
        console.log("Pay Value >= Start Price?", payValue >= startPriceValue);
        console.log("Pay Value > Highest Bid?", payValue > highestBidValue);
        console.log("=== Debug End ===");
        
        //出价必须大于最高价格 和 起始价格
        require(payValue >= startPriceValue, "Pay value must be greater than startPriceValue");
        require(payValue > highestBidValue, "Bid must be higher than the current highest bid");

        // 返回之前出价者的资金
        if(auction.highestBidder != address(0) && auction.highestBid > 0){
            if(auction.tokenAddress == address(0)){
                // 返回之前的ETH出价者
                payable(auction.highestBidder).transfer(auction.highestBid);
            }else{
                // 返回之前的ERC20出价者
                IERC20(auction.tokenAddress).transfer(auction.highestBidder, auction.highestBid);
            }
        }

        // 转移当前出价者的资金到合约
        if(_tokenAddress != address(0)){
            //转移ERC20代币给合约
            IERC20(_tokenAddress).transferFrom(msg.sender, address(this), bidAmount);
        }
        // ETH已经通过msg.value转移到合约了

        // 更新拍卖信息
        auction.tokenAddress = _tokenAddress;
        auction.highestBid = bidAmount;
        auction.highestBidder = msg.sender;
    }

    //结束拍卖
    function endAuction(uint256 auctionId) public {
        Auction storage auction = auctions[auctionId];


        //判断当前拍卖是否结束
        require(!auction.ended && auction.startTime + auction.duration <= block.timestamp, "Auction has not ended");
        //检查是否有出价者
        require(auction.highestBidder != address(0), "No bids placed"); 
        
        //转移NFT给最高出价者
        IERC721(auction.nftContract).safeTransferFrom( address(this), auction.highestBidder, auction.tokenId);
        
        //将资金转移给卖家
        if(auction.tokenAddress == address(0)){
            // 如果是ETH，转移ETH给卖家
            payable(auction.seller).transfer(auction.highestBid);
        }else{
            // 如果是ERC20代币，转移ERC20代币给卖家
            IERC20(auction.tokenAddress).transfer(auction.seller, auction.highestBid);
        }
        
        auction.ended = true;    
    }

    function _authorizeUpgrade(address ) internal view override {
        require(msg.sender == admin, "Only admin can upgrade");
    }
}
