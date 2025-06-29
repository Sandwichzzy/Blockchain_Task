const { ethers, deployments } = require("hardhat");
const { expect } = require("chai");

describe("Test NftAuction", function () {
  async function main() {
    //1. 部署ERC721合约
    await deployments.fixture("deployTestERC721");

    const testERC721 = await deployments.get("TestERC721");

    const testERC721Contract = await ethers.getContractAt(
      "TestERC721",
      testERC721.address
    );

    //2. 部署NftAuction合约
    await deployments.fixture("deployNftAuction");

    const nftAuctionProxy = await deployments.get("NftAuctionProxy");

    const nftAuctionProxyContract = await ethers.getContractAt(
      "NftAuction",
      nftAuctionProxy.address
    );

    const [deployer, buyer1, buyer2] = await ethers.getSigners();
    // await testERC721Contract
    //   .connect(deployer)
    //   .setApprovalForAll(nftAuctionProxy.address, true);
    //3. mint NFT 给 deployer（管理员）
    for (let i = 0; i < 10; i++) {
      await testERC721Contract.mint(deployer.address, i);
    }
    await testERC721Contract
      .connect(deployer)
      .setApprovalForAll(nftAuctionProxy.address, true);

    const tokenId = 1;
    //4. 创建拍卖（使用管理员账户）
    // - 起拍价：0.01 ETH
    // - 拍卖持续时间：10秒
    // - NFT 合约地址：testERC721.address
    // - NFT Token ID：1
    await nftAuctionProxyContract.createAuction(
      ethers.parseEther("0.000001"),
      10,
      testERC721.address,
      tokenId
    );

    const auction = await nftAuctionProxyContract.auctions(0);

    console.log("创建拍卖成功: ", auction);

    //5. 购买者拍卖出价
    await nftAuctionProxyContract
      .connect(buyer1)
      .placeBid(0, { value: ethers.parseEther("0.001") });
    //6. 购买者2拍卖出价
    await nftAuctionProxyContract
      .connect(buyer2)
      .placeBid(0, { value: ethers.parseEther("0.002") });

    //7. 等待拍卖时间结束（10秒）
    await new Promise((resolve) => setTimeout(resolve, 10 * 1000));

    //8. 结束拍卖（使用管理员账户）
    await nftAuctionProxyContract.connect(deployer).endAuction(0);

    //9. 检查拍卖结果
    const auctionResult = await nftAuctionProxyContract.auctions(0);
    console.log("拍卖结束: ", auctionResult);
    expect(auctionResult.highestBidder).to.equal(buyer2.address);
    expect(auctionResult.highestBid).to.equal(ethers.parseEther("0.02"));

    //10. 检查NFT是否转移
    const nftOwner = await testERC721Contract.ownerOf(tokenId);
    console.log("NFT所有者: ", nftOwner);
    expect(nftOwner).to.equal(buyer2.address);
  }

  it("test auction", async function () {
    await main();
  });
});
