const { ethers, deployments } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { save } = deployments;

  const TestERC721 = await ethers.getContractFactory("TestERC721");

  const testERC721 = await TestERC721.deploy();

  await testERC721.waitForDeployment();

  const testERC721Address = await testERC721.getAddress();

  console.log("TestERC721 deployed to: ", testERC721Address);

  await save("TestERC721", {
    abi: TestERC721.interface.format("json"),
    address: testERC721Address,
  });
};

module.exports.tags = ["deployTestERC721"];
