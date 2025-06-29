// 导入必要的 Hardhat 模块和 Node.js 模块
const { ethers, upgrades } = require("hardhat");

// 合约升级脚本模块导出
module.exports = async ({ getNamedAccounts, deployments }) => {
  // 获取 deployments 对象中的 save 方法
  const { save } = deployments;
  // 获取部署者账户信息
  const { deployer } = await getNamedAccounts();
  console.log("deployer address: ", deployer);

  // 获取升级版的业务合约工厂
  // NftAuctionV2 是合约的升级版本，包含新的功能或修复
  const NftAuctionV2 = await ethers.getContractFactory("NftAuctionV2");

  // 升级代理合约
  // 使用 upgrades.upgradeProxy 将现有的代理合约升级到新版本
  // 代理地址保持不变，但逻辑合约会更新为 NftAuctionV2
  const nftAuctionProxyV2 = await upgrades.upgradeProxy(
    proxyAddress,
    NftAuctionV2
  );

  // 等待升级完成
  await nftAuctionProxyV2.waitForDeployment();

  // 获取升级后的代理合约地址（通常与之前相同）
  const proxyAddressV2 = await nftAuctionProxyV2.getAddress();

  // 保存升级后的合约信息到 deployments 系统
  // 这样测试脚本可以通过 deployments.get("NftAuctionProxyV2") 获取升级后的合约
  await save("NftAuctionProxyV2", {
    abi: NftAuctionV2.interface.format("json"),
    address: proxyAddressV2,
    // args:[],  // 部署参数
    // log:true, // 是否打印日志
  });
};

// 设置升级标签，用于在测试中通过标签运行特定的升级脚本
module.exports.tags = ["upgradeNftAuction"];
