// 导入必要的 Hardhat 模块和 Node.js 模块
const { deployments, upgrades, ethers } = require("hardhat");

// 部署脚本模块导出
module.exports = async ({ getNamedAccounts, deployments, network }) => {
  // 获取 deployments 对象中的 save 方法，用于保存部署信息
  const { save } = deployments;
  // 获取部署者账户信息
  const { deployer } = await getNamedAccounts();

  // 打印部署者地址
  console.log("deployer address: ", deployer);

  // 获取 NftAuction 合约工厂
  const NftAuction = await ethers.getContractFactory("NftAuction");

  // 通过 OpenZeppelin 的代理合约部署 NFT 拍卖合约
  // 使用 upgrades.deployProxy 创建可升级的代理合约
  // 第二个参数是初始化参数数组（这里为空）
  // 第三个参数指定初始化函数名为 "initialize"
  const nftAuctionProxy = await upgrades.deployProxy(NftAuction, [], {
    initializer: "initialize",
  });

  // 等待代理合约部署完成
  await nftAuctionProxy.waitForDeployment();

  // 获取代理合约地址
  const proxyAddress = await nftAuctionProxy.getAddress();

  // 获取逻辑合约地址（实际业务逻辑所在的合约地址）
  const logicAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );

  // 打印代理合约地址和逻辑合约地址
  console.log("管理员地址Proxy address: ", proxyAddress);
  console.log("实现地址Logic owner: ", logicAddress);

  // 使用 Hardhat 的 deployments 系统保存部署信息
  // 这样可以在测试中通过 deployments.get() 获取合约信息
  await save("NftAuctionProxy", {
    abi: NftAuction.interface.format("json"),
    address: proxyAddress,
    // args:[],  // 部署参数（这里为空）
    // log:true, // 是否打印日志
  });
};

// 设置部署标签，用于在测试中通过标签运行特定的部署脚本
module.exports.tags = ["deployNftAuction"];
