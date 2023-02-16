const { time } = require("@nomicfoundation/hardhat-network-helpers");
const chai = require("chai");
const { expect } = require("chai");
const { solidity } = require("ethereum-waffle");

chai.use(solidity);

describe("PreDeFi", () => {
  let admin, user0, user1, user2, preDeFi, ticketCost, oneDay;

  before(async () => {
    // Set addresses
    [admin, user0, user1, user2] = await ethers.getSigners();

    // Get contract abstraction
    const PreDeFi = await hre.ethers.getContractFactory("PreDeFi");
    const pairs = ["btc_usdt"];

    preDeFi = await PreDeFi.deploy(5000, pairs);
    await preDeFi.deployed();

    ticketCost = ethers.utils.parseEther("0.001");
    oneDay = 86400;
  });

  it("Should set the right values", async () => {
    expect(await preDeFi.available()).to.equal(0);
    expect(await preDeFi.fee()).to.equal(5000);
    expect(await preDeFi.routerAddress()).to.equal(
      "0x700a89Ba8F908af38834B9Aba238b362CFfB665F"
    );

    await expect(
      preDeFi.connect(user0).whitelist(["eth_usdt"])
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await preDeFi.whitelist(["eth_usdt"]);
  });

  it("Should create new predictions the correct way", async () => {
    await expect(
      preDeFi.connect(user0).newPrediction(ticketCost, 0, oneDay, "eth_usdt")
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      preDeFi.newPrediction(ticketCost, 0, oneDay, "celo_usdt")
    ).to.be.revertedWith("INVALID_PAIR");

    await preDeFi.newPrediction(ticketCost, oneDay, oneDay, "eth_usdt");

    const info = await preDeFi.batches(1);

    expect(info[0]).to.equal(1);
    expect(info[1]).to.equal(ticketCost);
    expect(info[7]).to.equal("eth_usdt");
    expect(info[8]).to.equal(false);
  });

  it("Should predict and resolve the correct way", async () => {
    let predictions = [10000, 373828, 2783278];

    await expect(
      preDeFi.connect(user0).predict(2, predictions)
    ).to.be.revertedWith("INVALID_ID");

    time.increase(10000);
    await expect(
      preDeFi.connect(user0).predict(1, predictions)
    ).to.be.revertedWith("PREDICTION_NOT_OPEN");

    time.increase(76402);
    await expect(
      preDeFi.connect(user0).predict(1, predictions, { value: ticketCost })
    ).to.be.revertedWith("WRONG_PAYMENT_VALUE");

    await preDeFi.connect(user0).predict(1, predictions, {
      value: ethers.BigNumber.from(ticketCost).mul(3),
    });

    const current = await preDeFi.getPrice("eth_usdt");

    predictions = [10700, current[0], 9083278];
    await preDeFi.connect(user1).predict(1, predictions, {
      value: ethers.BigNumber.from(ticketCost).mul(3),
    });

    predictions = [10700, 3783278, current[0], current[0]];
    await preDeFi.connect(user2).predict(1, predictions, {
      value: ethers.BigNumber.from(ticketCost).mul(4),
    });

    let info = await preDeFi.batches(1);

    expect(info[2]).to.equal(10);

    await expect(preDeFi.resolve(1)).to.be.revertedWith("NOT_YET");

    time.increase(86402);

    await expect(preDeFi.connect(user1).resolve(1)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
    await expect(preDeFi.resolve(1))
      .to.emit(preDeFi, "Resolve")
      .withArgs(admin.address, 1, current[0], current[1], [
        user1.address,
        user2.address,
        user2.address,
      ]);

    info = await preDeFi.batches(1);
    expect(info[6]).to.equal(current[0]);
    expect(info[8]).to.equal(true);
  });

  it("Should withdraw correctly", async () => {
    const available = ethers.BigNumber.from(
      ethers.BigNumber.from(await preDeFi.fee()).mul(
        ethers.BigNumber.from(ticketCost).mul(10)
      )
    ).div(100000);
    expect(await preDeFi.available()).to.equal(available);

    await expect(
      preDeFi.connect(user0).collectFee(user0.address)
    ).to.revertedWith("Ownable: caller is not the owner");

    await preDeFi.collectFee(admin.address);

    expect(await preDeFi.available()).to.equal(0);

    await expect(preDeFi.collectFee(admin.address)).to.revertedWith(
      "NOTHING_TO_WITHDRAW"
    );

    let result = await preDeFi.result(user0.address, 1);

    expect(result[0]).to.be.equal(false);
    expect(result[1]).to.be.equal(0);

    result = await preDeFi.result(user1.address, 1);

    expect(result[0]).to.be.equal(true);
    expect(result[1]).to.be.equal(1);

    result = await preDeFi.result(user2.address, 1);

    expect(result[0]).to.be.equal(true);
    expect(result[1]).to.be.equal(2);

    await expect(preDeFi.connect(user0).withdrawWin(1)).to.be.revertedWith(
      "NOT_WINNER"
    );

    await preDeFi.connect(user1).withdrawWin(1);

    await expect(preDeFi.connect(user1).withdrawWin(1)).to.be.revertedWith(
      "ALREADY_CLAIMED"
    );

    let info = await preDeFi.batches(1);

    expect(info[3]).to.equal(
      ethers.BigNumber.from(ticketCost).mul(10).sub(available)
    );
  });
});
