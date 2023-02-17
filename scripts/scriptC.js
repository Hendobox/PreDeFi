const hre = require("hardhat");
require("dotenv").config();

const main = async () => {
  // construct signer
  const signer = new hre.ethers.Wallet(process.env.PK, hre.ethers.provider);

  const addr = "0x58Bf9088F1609190B6cE6b3C79343516Fd475723";

  // instantiate contract
  const contract = await hre.ethers.getContractAt(
    "contracts/PreDeFi.sol:PreDeFi",
    addr,
    signer
  );

  // create markets
  const tx = await contract.newPrediction(
    ethers.utils.parseEther("1"),
    0,
    60 * 60 * 24 * 3,
    "eth_usdt"
  );

  await tx.wait();

  const tx2 = await contract.newPrediction(
    ethers.utils.parseEther("2"),
    60 * 60 * 24 * 2,
    60 * 60 * 24 * 3,
    "btc_usdt"
  );
  await tx2.wait();

  const tx3 = await contract.newPrediction(
    ethers.utils.parseEther("3"),
    60 * 60 * 24 * 3,
    60 * 60 * 24 * 7,
    "bat_usdt"
  );
  await tx3.wait();

  // confirm created markets
  console.log(await contract.batches(1));
  console.log(await contract.batches(2));
  console.log(await contract.batches(3));
  console.log(await contract.batches(4));
};
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
