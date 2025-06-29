// Sepolia 测试网测试脚本
const { ethers, deployments, network } = require("hardhat");
const { expect } = require("chai");

describe("Sepolia 测试网 NFT 拍卖测试", function () {
  this.timeout(300000);
  let testERC721Contract;
  let nftAuctionProxyContract;
  let deployer, user, user2;
  let tokenId = 1;

  // Sepolia 测试网上的一些已知 ERC20 代币地址
  const SEPOLIA_USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Sepolia USDC (示例)

  before(async function () {
    // 跳过非 Sepolia 网络
    if (network.name !== "sepolia") {
      this.skip();
    }

    console.log("在 Sepolia 测试网上运行测试...");

    // 获取账户
    const accounts = await ethers.getSigners();

    deployer = accounts[0];
    user = accounts[1] || accounts[0]; // 如果只有一个账户，使用同一个
    user2 = accounts[2] || accounts[0]; // 如果只有一个账户，使用同一个

    console.log("部署者地址:", deployer.address);
    console.log("用户地址:", user.address);
    console.log("用户2地址:", user2.address);
    console.log("可用账户数量:", accounts.length);

    // 检查账户余额
    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    console.log("部署者 ETH 余额:", ethers.formatEther(deployerBalance));

    if (user.address !== deployer.address) {
      const userBalance = await ethers.provider.getBalance(user.address);
      console.log("用户 ETH 余额:", ethers.formatEther(userBalance));
    }
    if (user2.address !== deployer.address) {
      const user2Balance = await ethers.provider.getBalance(user2.address);
      console.log("用户2 ETH 余额:", ethers.formatEther(user2Balance));
    }
  });

  it("部署合约到 Sepolia", async function () {
    // 部署合约
    await deployments.fixture("sepolia");

    // 获取部署的合约
    const testERC721 = await deployments.get("TestERC721");
    testERC721Contract = await ethers.getContractAt(
      "TestERC721",
      testERC721.address
    );

    const nftAuctionProxy = await deployments.get("NftAuctionProxy");
    nftAuctionProxyContract = await ethers.getContractAt(
      "NftAuction",
      nftAuctionProxy.address
    );

    console.log("TestERC721 合约地址:", testERC721.address);
    console.log("NftAuction 代理合约地址:", nftAuctionProxy.address);

    // 验证合约部署成功
    expect(testERC721.address).to.not.equal(ethers.ZeroAddress);
    expect(nftAuctionProxy.address).to.not.equal(ethers.ZeroAddress);
  });

  it("铸造 NFT 并设置授权", async function () {
    console.log("开始铸造 NFT...");
    // 铸造 NFT
    const tx = await testERC721Contract
      .connect(deployer)
      .mint(deployer.address, tokenId);
    console.log("等待铸造交易确认...");
    await tx.wait();

    console.log(`NFT ${tokenId} 已铸造给:`, deployer.address);

    // 设置授权
    console.log("开始设置 NFT 授权...");
    const approveTx = await testERC721Contract
      .connect(deployer)
      .setApprovalForAll(nftAuctionProxyContract.target, true);
    console.log("等待授权交易确认...");
    await approveTx.wait();

    console.log("NFT 授权已设置");

    // 验证 NFT 所有权
    const owner = await testERC721Contract.ownerOf(tokenId);
    expect(owner).to.equal(deployer.address);
  });

  it("创建拍卖", async function () {
    console.log("开始创建拍卖...");

    // 创建拍卖
    const startPrice = ethers.parseEther("0.000001"); // 0.000001 ETH
    const duration = 180; // 180秒

    const tx = await nftAuctionProxyContract
      .connect(deployer)
      .createAuction(startPrice, duration, testERC721Contract.target, tokenId);
    console.log("等待创建拍卖交易确认...");
    await tx.wait();

    console.log("拍卖创建成功");

    // 获取拍卖信息
    const auction = await nftAuctionProxyContract.auctions(0);
    console.log("拍卖信息:", {
      seller: auction.seller,
      startPrice: ethers.formatEther(auction.startPrice),
      duration: auction.duration.toString(),
      startTime: new Date(Number(auction.startTime) * 1000).toLocaleString(),
      ended: auction.ended,
    });

    expect(auction.seller).to.equal(deployer.address);
    expect(auction.startPrice).to.equal(startPrice);
  });

  it("使用 ETH 出价", async function () {
    const bidAmount = ethers.parseEther("0.000002"); // 0.000002 ETH

    const tx = await nftAuctionProxyContract.connect(user).placeBid(
      0, // auctionId
      0, // amount (ETH 时为 0)
      ethers.ZeroAddress, // tokenAddress (ETH)
      { value: bidAmount }
    );
    await tx.wait();

    console.log("ETH 出价成功:", ethers.formatEther(bidAmount));

    // 检查拍卖状态
    const auction = await nftAuctionProxyContract.auctions(0);
    expect(auction.highestBidder).to.equal(user.address);
    expect(auction.highestBid).to.equal(bidAmount);
  });

  // 注意：ERC20 出价测试需要您先获得 ERC20 代币
  it("使用 ERC20 代币出价 (需要先获得代币)", async function () {
    // 这个测试需要您先在 Sepolia 上获得 ERC20 代币
    const erc20Token = await ethers.getContractAt("IERC20", SEPOLIA_USDC);
    let bidAmount = ethers.parseUnits("2", 6); // 2 USDC (6 位小数)

    // 检查用户的 ERC20 余额
    const balance = await erc20Token.balanceOf(user2.address);
    console.log("用户2 ERC20 余额:", ethers.formatUnits(balance, 6));

    // 授权拍卖合约使用 ERC20 代币
    const approveTx = await erc20Token
      .connect(user2)
      .approve(nftAuctionProxyContract.target, bidAmount);
    await approveTx.wait();

    // 使用 ERC20 出价
    const tx = await nftAuctionProxyContract.connect(user2).placeBid(
      0, // auctionId
      bidAmount, // amount
      SEPOLIA_USDC // tokenAddress
    );
    await tx.wait();

    console.log("ERC20 出价成功:", ethers.formatUnits(bidAmount, 6));

    // 获取拍卖状态来检查出价结果
    const auction = await nftAuctionProxyContract.auctions(0);

    expect(auction.highestBidder).to.equal(user2.address);
    expect(auction.highestBid).to.equal(bidAmount);
  });

  it("检查拍卖结果", async function () {
    // 先检查当前拍卖状态
    const auctionBefore = await nftAuctionProxyContract.auctions(0);
    console.log("结束拍卖前状态:", {
      highestBidder: auctionBefore.highestBidder,
      highestBid: auctionBefore.highestBid.toString(),
      tokenAddress: auctionBefore.tokenAddress,
      ended: auctionBefore.ended,
      startTime: auctionBefore.startTime.toString(),
      duration: auctionBefore.duration.toString(),
    });
    // 检查区块时间条件
    const currentBlock = await ethers.provider.getBlock("latest");
    const blockTime = currentBlock.timestamp;
    const auctionEndTime =
      Number(auctionBefore.startTime) + Number(auctionBefore.duration);
    console.log("当前区块时间:", blockTime);
    console.log("拍卖结束时间:", auctionEndTime);
    console.log("时间差:", blockTime - auctionEndTime);

    // 如果时间还没到，等待一段时间
    if (blockTime < auctionEndTime) {
      const waitTime = (auctionEndTime - blockTime + 10) * 1000; // 多等10秒
      console.log(`拍卖还未结束，等待 ${waitTime / 1000} 秒...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    } else {
      console.log("拍卖时间已到，额外等待10秒确保区块确认...");
      await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
    }

    // 再次检查区块时间
    const currentBlock2 = await ethers.provider.getBlock("latest");
    const blockTime2 = currentBlock2.timestamp;
    console.log("等待后区块时间:", blockTime2);
    console.log("等待后时间差:", blockTime2 - auctionEndTime);

    try {
      // 结束拍卖（使用管理员账户）
      console.log("开始调用 endAuction...");

      // 先检查是否有出价者
      if (auctionBefore.highestBidder === ethers.ZeroAddress) {
        console.log("警告：没有出价者，endAuction 将失败");
        throw new Error("No bids placed - 没有出价者");
      }

      const endTx = await nftAuctionProxyContract
        .connect(deployer)
        .endAuction(0);
      console.log("等待 endAuction 交易确认...");
      await endTx.wait();
      console.log("endAuction 交易已确认");
    } catch (error) {
      console.error("endAuction 调用失败:", error.message);

      // 检查具体的错误原因
      const auctionCheck = await nftAuctionProxyContract.auctions(0);
      console.log("错误时拍卖状态:", {
        ended: auctionCheck.ended,
        highestBidder: auctionCheck.highestBidder,
        startTime: auctionCheck.startTime.toString(),
        duration: auctionCheck.duration.toString(),
      });

      const latestBlock = await ethers.provider.getBlock("latest");
      console.log("错误时区块时间:", latestBlock.timestamp);
      console.log("错误时时间差:", latestBlock.timestamp - auctionEndTime);

      throw error;
    }

    const auctionResult = await nftAuctionProxyContract.auctions(0);
    console.log("拍卖结果:", {
      highestBidder: auctionResult.highestBidder,
      highestBid: auctionResult.highestBid.toString(),
      tokenAddress: auctionResult.tokenAddress,
      ended: auctionResult.ended,
    });

    expect(auctionResult.ended).to.be.true;
    expect(auctionResult.highestBidder).to.equal(user2.address);
  });

  it("检查NFT是否转移", async function () {
    // 先获取拍卖结果以确定实际的获胜者
    const auction = await nftAuctionProxyContract.auctions(0);
    const actualWinner = auction.highestBidder;

    const nftOwner = await testERC721Contract.ownerOf(tokenId);
    console.log("实际获胜者地址:", actualWinner);
    console.log("NFT当前所有者:", nftOwner);

    // NFT应该转移给实际的获胜者
    expect(nftOwner).to.equal(actualWinner);
  });
});
