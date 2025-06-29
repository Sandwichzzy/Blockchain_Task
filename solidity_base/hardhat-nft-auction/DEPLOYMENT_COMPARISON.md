# Hardhat Deploy vs Hardhat Ignition 部署方式对比

## 概述

本项目展示了两种不同的 Hardhat 部署方式：

1. **hardhat-deploy** - 传统的脚本式部署
2. **hardhat-ignition** - 新的声明式部署

## 文件结构对比

### Hardhat Deploy 方式

```
deploy/
├── 01_deploy_nft_auction.js      # 初始部署脚本
├── 02_upgrade_nft_auction.js     # 升级脚本
└── .cache/
    └── proxyNftAuction.json      # 部署信息缓存

test/
└── index.js                      # 使用 hardhat-deploy 的测试
```

### Hardhat Ignition 方式

```
ignition/
└── modules/
    ├── 01_deploy_nft_auction.js           # 基础部署模块
    ├── 01_deploy_nft_auction_ignition.js  # 完整部署模块
    └── 02_upgrade_nft_auction.js          # 升级模块

test/
└── ignition_test.js                       # 使用 Ignition 的测试
```

## 核心差异对比

### 1. 语法风格

#### Hardhat Deploy (命令式)

```javascript
// 部署脚本
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { save } = deployments;
  const { deployer } = await getNamedAccounts();

  const NftAuction = await ethers.getContractFactory("NftAuction");
  const nftAuctionProxy = await upgrades.deployProxy(NftAuction, [], {
    initializer: "initialize",
  });

  await save("NftAuctionProxy", {
    abi: NftAuction.interface.format("json"),
    address: proxyAddress,
  });
};
```

#### Hardhat Ignition (声明式)

```javascript
// 部署模块
module.exports = buildModule("NftAuctionDeployment", (m) => {
  const deployer = m.getAccount(0);

  const nftAuction = m.contract("NftAuction", [], {
    from: deployer,
  });

  const proxy = m.contract(
    "TransparentUpgradeableProxy",
    [nftAuction, deployer, "0x"],
    {
      from: deployer,
    }
  );

  const initCall = m.call(nftAuction, "initialize", [], {
    from: deployer,
    contract: proxy,
  });

  initCall.after(proxy);

  return { nftAuction, proxy, initCall };
});
```

### 2. 依赖管理

#### Hardhat Deploy

- 手动管理依赖关系
- 使用 `await` 确保执行顺序
- 需要手动处理异步操作

#### Hardhat Ignition

- 声明式依赖管理
- 使用 `.after()` 方法定义依赖关系
- 自动处理执行顺序

### 3. 状态管理

#### Hardhat Deploy

- 使用 `deployments.save()` 保存状态
- 需要手动管理缓存文件
- 状态分散在多个地方

#### Hardhat Ignition

- 内置状态管理
- 自动生成部署状态
- 状态集中管理

### 4. 测试方式

#### Hardhat Deploy 测试

```javascript
describe("Test upgrade", async () => {
  it("验证合约升级后数据保持一致性", async () => {
    // 运行部署脚本
    await deployments.fixture("deployNftAuction");
    const nftAuctionProxy = await deployments.get("NftAuctionProxy");

    // 获取合约实例
    const nftAuctionProxyContract = await ethers.getContractAt(
      "NftAuction",
      nftAuctionProxy.address
    );

    // 测试逻辑...
  });
});
```

#### Hardhat Ignition 测试

```javascript
describe("Ignition 方式测试合约升级", function () {
  async function deployFixture() {
    const [deployer] = await ethers.getSigners();

    // 使用 Ignition 部署
    const deployment = await ignition.deploy("NftAuctionDeploymentIgnition");

    // 获取合约实例
    const nftAuctionProxy = await ethers.getContractAt(
      "NftAuction",
      deployment.transparentProxy
    );

    return { nftAuctionProxy, deployment };
  }

  it("应该能够通过 Ignition 部署并创建拍卖", async function () {
    const { nftAuctionProxy } = await loadFixture(deployFixture);
    // 测试逻辑...
  });
});
```

## 优势对比

### Hardhat Deploy 优势

1. **成熟稳定** - 经过长期验证
2. **灵活性高** - 可以编写复杂的部署逻辑
3. **生态系统丰富** - 大量现成的插件和工具
4. **学习资源多** - 文档和社区支持完善

### Hardhat Ignition 优势

1. **声明式语法** - 更清晰、更易读
2. **依赖管理** - 自动处理复杂的依赖关系
3. **状态管理** - 内置的状态管理机制
4. **类型安全** - 更好的 TypeScript 支持
5. **可组合性** - 模块可以轻松组合和重用

## 使用场景建议

### 选择 Hardhat Deploy 当：

- 项目需要复杂的部署逻辑
- 团队已经熟悉 hardhat-deploy
- 需要使用特定的插件或工具
- 项目对稳定性要求极高

### 选择 Hardhat Ignition 当：

- 新项目或团队愿意尝试新技术
- 需要清晰的依赖关系管理
- 希望减少样板代码
- 重视代码的可读性和可维护性

## 运行命令对比

### Hardhat Deploy

```bash
# 部署
npx hardhat deploy --tags deployNftAuction

# 升级
npx hardhat deploy --tags upgradeNftAuction

# 测试
npx hardhat test
```

### Hardhat Ignition

```bash
# 部署
npx hardhat ignition deploy ignition/modules/01_deploy_nft_auction_ignition.js

# 测试
npx hardhat test test/ignition_test.js
```

## 总结

两种方式都能实现相同的功能，选择哪种主要取决于：

1. **团队熟悉度** - 如果团队已经熟悉 hardhat-deploy，迁移成本较高
2. **项目复杂度** - 简单项目 Ignition 更合适，复杂项目可能需要 hardhat-deploy 的灵活性
3. **维护考虑** - Ignition 的声明式语法可能更容易维护
4. **生态系统** - hardhat-deploy 有更丰富的生态系统支持

建议在新项目中尝试 Ignition，在现有项目中继续使用 hardhat-deploy。
