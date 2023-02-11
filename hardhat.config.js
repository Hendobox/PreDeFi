require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      saveDeployments: false,
      allowUnlimitedContractSize: true,
      forking: {
        url: process.env.MANTLE_TESTNET_URL,
      },
    },
    mantleTest: {
      url: process.env.MANTLE_TESTNET_URL,
      accounts: [process.env.PK],
    },
  },
};
