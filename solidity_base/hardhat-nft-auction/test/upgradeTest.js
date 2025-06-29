// 导入必要的 Hardhat 模块和测试框架
const { ethers, deployments } = require("hardhat");
const { expect } = require("chai");

// 测试套件：测试合约升级功能
describe("Test upgrade", async () => {
  // 测试用例：验证合约升级后数据保持一致性
  it("验证合约升级后数据保持一致性", async () => {
    // 步骤1：部署初始版本的业务合约
    // 运行标签为 "deployNftAuction" 的部署脚本
    await deployments.fixture("deployNftAuction");

    // 获取部署的代理合约信息
    const nftAuctionProxy = await deployments.get("NftAuctionProxy");

    // 步骤2：调用 createAuction 方法创建拍卖
    // 通过代理地址获取合约实例
    const nftAuctionProxyContract = await ethers.getContractAt(
      "NftAuction",
      nftAuctionProxy.address
    );

    // 创建拍卖，参数分别为：
    // - 起拍价：0.01 ETH
    // - 拍卖持续时间：100秒
    // - NFT 合约地址：零地址（测试用）
    // - NFT Token ID：1
    const tx = await nftAuctionProxyContract.createAuction(
      ethers.parseEther("0.01"),
      100 * 1000,
      ethers.ZeroAddress,
      1
    );

    // 获取创建的拍卖信息（ID为0的拍卖）
    const auction = await nftAuctionProxyContract.auctions(0);
    console.log("创建拍卖成功: ", auction);

    const implAddressV1 = await upgrades.erc1967.getImplementationAddress(
      nftAuctionProxy.address
    );
    // 步骤3：升级合约到 V2 版本
    // 运行标签为 "upgradeNftAuction" 的升级脚本
    await deployments.fixture("upgradeNftAuction");

    // 步骤4：读取升级后合约的 auction[0] 数据
    // 验证升级后数据是否保持一致
    const auction2 = await nftAuctionProxyContract.auctions(0);
    console.log("升级合约成功auction2: ", auction2);

    const implAddressV2 = await upgrades.erc1967.getImplementationAddress(
      nftAuctionProxy.address
    );

    console.log("v1addr: ", implAddressV1, "\nv2addr: ", implAddressV2);
    // 断言验证：升级后的拍卖数据应该与升级前保持一致
    // 这是代理合约升级的核心特性：数据持久化
    expect(auction2.startTime).to.equal(auction.startTime);
    // 断言验证：升级后合约的实现地址应该与升级前不同
    expect(implAddressV1).to.not.equal(implAddressV2);

    // 步骤5：调用 v2 版本的 testHello 方法
    // 重新通过代理地址获取合约实例
    const nftAuctionProxyContractV2 = await ethers.getContractAt(
      "NftAuctionV2",
      nftAuctionProxy.address
    );
    const hello = await nftAuctionProxyContractV2.testHello();
    console.log("hello: ", hello);
  });
});
