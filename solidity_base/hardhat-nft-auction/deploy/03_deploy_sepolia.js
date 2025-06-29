// Sepolia 测试网部署脚本
const { deployments, upgrades, ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { save } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("网络:", network.name);
  console.log("部署者地址:", deployer);

  // 只在 Sepolia 网络上运行
  if (network.name !== "sepolia") {
    console.log("跳过部署 - 不是 Sepolia 网络");
    return;
  }

  // 部署 TestERC721 合约
  const TestERC721 = await ethers.getContractFactory("TestERC721");
  const testERC721 = await TestERC721.deploy();
  await testERC721.waitForDeployment();
  const testERC721Address = await testERC721.getAddress();

  console.log("TestERC721 部署到:", testERC721Address);

  await save("TestERC721", {
    abi: TestERC721.interface.format("json"),
    address: testERC721Address,
  });

  // 部署 NftAuction 代理合约
  const NftAuction = await ethers.getContractFactory("NftAuction");
  const nftAuctionProxy = await upgrades.deployProxy(NftAuction, [], {
    initializer: "initialize",
  });

  await nftAuctionProxy.waitForDeployment();
  const proxyAddress = await nftAuctionProxy.getAddress();
  const logicAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );

  console.log("NFT 拍卖代理合约地址:", proxyAddress);
  console.log("NFT 拍卖逻辑合约地址:", logicAddress);

  await save("NftAuctionProxy", {
    abi: NftAuction.interface.format("json"),
    address: proxyAddress,
  });

  // 设置价格预言机
  const nftAuctionContract = await ethers.getContractAt(
    "NftAuction",
    proxyAddress
  );

  // 设置 ETH/USD 价格预言机 (Sepolia 测试网地址)
  const ethUsdPriceFeed = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
  await nftAuctionContract.setPriceFeed(ethers.ZeroAddress, ethUsdPriceFeed);
  console.log("设置 ETH/USD 价格预言机:", ethUsdPriceFeed);

  // 设置 USDC/USD 价格预言机 (如果您的 ERC20 是 USDC 类似的代币)
  const usdcUsdPriceFeed = "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E";
  // 这里需要替换为您实际的 ERC20 代币地址
  const yourERC20Address = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
  await nftAuctionContract.setPriceFeed(yourERC20Address, usdcUsdPriceFeed);
  console.log("设置 ERC20/USD 价格预言机:", usdcUsdPriceFeed);

  // 保存部署信息到文件
  const deploymentInfo = {
    network: network.name,
    deployer: deployer,
    testERC721: testERC721Address,
    nftAuctionProxy: proxyAddress,
    nftAuctionLogic: logicAddress,
    timestamp: new Date().toISOString(),
  };

  const deploymentPath = path.resolve(
    __dirname,
    `../deployments/${network.name}_deployment.json`
  );
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("部署信息已保存到:", deploymentPath);
};

module.exports.tags = ["sepolia", "deployNftAuctionSepolia"];
