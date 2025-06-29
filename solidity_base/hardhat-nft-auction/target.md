实现一个 NFT 拍卖市场
任务目标
//prettier-ignore

1. 使用 Hardhat 框架开发一个 NFT 拍卖市场。
2. 使用 Chainlink 的 feedData 预言机功能，计算 ERC20 和以太坊到美元的价格。
3. 使用 UUPS/透明代理模式实现合约升级。
4. 使用类似于 Uniswap V2 的工厂模式管理每场拍卖

任务步骤 1. 项目初始化
使用 Hardhat 初始化项目：
npx hardhat init (已完成) 2. 安装必要的依赖：
npm install @openzeppelin/contracts @chainlink/contracts @nomiclabs/hardhat-ethers hardhat-deploy（完成） 3. 实现 NFT 拍卖市场 （完成）4. NFT 合约：
使用 ERC721 标准实现一个 NFT 合约。
支持 NFT 的铸造和转移。 5. 拍卖合约：
实现一个拍卖合约，支持以下功能：
创建拍卖：允许用户将 NFT 上架拍卖。
出价：允许用户以 ERC20 或以太坊出价。
结束拍卖：拍卖结束后，NFT 转移给出价最高者，资金转移给卖家。（完成） 6. 工厂模式：
使用类似于 Uniswap V2 的工厂模式，管理每场拍卖。
工厂合约负责创建和管理拍卖合约实例。 7. 集成 Chainlink 预言机 
价格计算：
使用 Chainlink 的 feedData 预言机，获取 ERC20 和以太坊到美元的价格。
在拍卖合约中，将出价金额转换为美元，方便用户比较。（完成） 8. 跨链拍卖：
使用 Chainlink 的 CCIP 功能，实现 NFT 跨链拍卖。
允许用户在不同链上参与拍卖。 9. 合约升级
UUPS/透明代理：
使用 UUPS 或透明代理模式实现合约升级。（完成）
确保拍卖合约和工厂合约可以安全升级。 10.测试与部署
测试：
编写单元测试和集成测试，覆盖所有功能。
部署：
使用 Hardhat 部署脚本，将合约部署到测试网（如 Goerli 或 Sepolia）。
