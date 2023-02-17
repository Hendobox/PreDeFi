const hre = require("hardhat");

const main = async () => {
  const PreDeFi = await hre.ethers.getContractFactory("PreDeFi");

  const pairs = ["eth_usdt", "btc_usdt", "bat_usdt"];
  const contract = await PreDeFi.deploy(2000, pairs);
  await contract.deployed();
  console.log("PreDeFi deployed to:", contract.address);
};
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// 0x58Bf9088F1609190B6cE6b3C79343516Fd475723
