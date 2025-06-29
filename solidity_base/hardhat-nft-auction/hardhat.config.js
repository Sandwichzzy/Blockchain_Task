require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("@openzeppelin/hardhat-upgrades");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  namedAccounts: {
    deployer: 0,
    user: 1,
    user2: 2,
    user3: 3,
    user4: 4,
    user5: 5,
    user6: 6,
    user7: 7,
    user8: 8,
  },
};
  