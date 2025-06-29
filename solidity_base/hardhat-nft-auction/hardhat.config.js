require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      // 本地测试网络
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [
        process.env.PRIVATE_KEY,
        process.env.PRIVATE_KEY_2 || process.env.PRIVATE_KEY, // 如果没有第二个私钥，使用第一个
        process.env.PRIVATE_KEY_3 || process.env.PRIVATE_KEY, // 如果没有第三个私钥，使用第一个
      ],
      chainId: 11155111,
      timeout: 300000, // 5 分钟网络超时
      gas: "auto",
      gasPrice: "auto",
    },
  },
  namedAccounts: {
    deployer: {
      default: 0, // 默认使用第一个账户作为部署者
      sepolia: "0x523df39cAe18ea125930DA730628213e4b147CDc", // 您的第一个账户
    },
    user: {
      default: 1,
      sepolia: "0xcaFd18C0C33676a17fB3bF63bD46F8FfCbFf9039", // 您的第二个账户
    },
    user2: {
      default: 2,
      sepolia: "0x6002BaD747AfD5690f543a670f3e3bD30E033084", // 您的第二个账户
    },
    user3: 3,
    user4: 4,
    user5: 5,
    user6: 6,
    user7: 7,
    user8: 8,
  },
};
