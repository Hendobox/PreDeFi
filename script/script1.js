const Web3 = require("web3");
const abi = require("./../artifacts/contracts/PreDeFi.sol/PreDeFi.json").abi;
const address = "";

// read contract functions

export const feeFunc = async (_provider) => {
  try {
    const web3 = new Web3(_provider);
    const contract = new web3.eth.Contract(abi, address);
    let result = null;
    await contract.methods.fee().call((err, res) => {
      if (!err) result = res;
    });
    return result;
  } catch (e) {
    console.log("Error occured: " + e);
    return null;
  }
};

export const availableFunc = async (_provider) => {
  try {
    const web3 = new Web3(_provider);
    const contract = new web3.eth.Contract(abi, address);
    let result = null;
    await contract.methods.available().call((err, res) => {
      if (!err) result = res;
    });
    return result;
  } catch (e) {
    console.log("Error occured: " + e);
    return null;
  }
};

export const routerAddressFunc = async (_provider) => {
  try {
    const web3 = new Web3(_provider);
    const contract = new web3.eth.Contract(abi, address);
    let result = null;
    await contract.methods.routerAddress().call((err, res) => {
      if (!err) result = res;
    });
    return result;
  } catch (e) {
    console.log("Error occured: " + e);
    return null;
  }
};

export const claimedFunc = async (_provider, user, id) => {
  try {
    const web3 = new Web3(_provider);
    const contract = new web3.eth.Contract(abi, address);
    let result = null;
    await contract.methods.claimed(user, id).call((err, res) => {
      if (!err) result = res;
    });
    return result;
  } catch (e) {
    console.log("Error occured: " + e);
    return null;
  }
};

export const batchesFunc = async (_provider, id) => {
  try {
    const web3 = new Web3(_provider);
    const contract = new web3.eth.Contract(abi, address);
    let result = null;
    await contract.methods.batches(id).call((err, res) => {
      if (!err) result = res;
    });
    return result;
  } catch (e) {
    console.log("Error occured: " + e);
    return null;
  }
};

export const isValidPairFunc = async (_provider, pair) => {
  try {
    const web3 = new Web3(_provider);
    const contract = new web3.eth.Contract(abi, address);
    let result = null;
    await contract.methods.isValidPair(pair).call((err, res) => {
      if (!err) result = res;
    });
    return result;
  } catch (e) {
    console.log("Error occured: " + e);
    return null;
  }
};

export const resultFunc = async (_provider, addr, id) => {
  try {
    const web3 = new Web3(_provider);
    const contract = new web3.eth.Contract(abi, address);
    let result = null;
    await contract.methods.result(addr, id).call((err, res) => {
      if (!err) result = res;
    });
    return result;
  } catch (e) {
    console.log("Error occured: " + e);
    return null;
  }
};

export const getPriceFunc = async (_provider, pair) => {
  try {
    const web3 = new Web3(_provider);
    const contract = new web3.eth.Contract(abi, address);
    let result = null;
    await contract.methods.getPrice(pair).call((err, res) => {
      if (!err) result = res;
    });
    return result;
  } catch (e) {
    console.log("Error occured: " + e);
    return null;
  }
};

// write contract functions

export const newPredictionFunc = async (
  _provider,
  ticketCost,
  startsIn,
  lastsFor,
  pair
) => {
  try {
    const web3 = new Web3(_provider);
    const contract = new web3.eth.Contract(abi, address);
    let txhash = null;
    const acc = await web3.eth.getAccounts();
    await contract.methods
      .newPrediction(ticketCost, startsIn, lastsFor, pair)
      .send({ from: acc[0] }, (err, txHash) => {
        if (!err) txhash = `SUCCESS! tx hash: ${txHash}`;
      });
    return txhash;
  } catch (e) {
    console.log("New Prediction Func error" + e);
    return null;
  }
};

export const predictFunc = async (_provider, id, predictions, value) => {
  try {
    const web3 = new Web3(_provider);
    const contract = new web3.eth.Contract(abi, address);
    let txhash = null;
    const acc = await web3.eth.getAccounts();
    await contract.methods
      .predict(id, predictions)
      .send({ from: acc[0], value: value }, (err, txHash) => {
        if (!err) txhash = `SUCCESS! tx hash: ${txHash}`;
      });
    return txhash;
  } catch (e) {
    console.log("Predict Func Error" + e);
    return null;
  }
};

export const resolveFunc = async (_provider, id) => {
  try {
    const web3 = new Web3(_provider);
    const contract = new web3.eth.Contract(abi, address);
    let txhash = null;
    const acc = await web3.eth.getAccounts();
    await contract.methods.resolve(id).send({ from: acc[0] }, (err, txHash) => {
      if (!err) txhash = `SUCCESS! tx hash: ${txHash}`;
    });
    return txhash;
  } catch (e) {
    console.log("Resolve Func Error" + e);
    return null;
  }
};

export const whitelistFunc = async (_provider, pairs) => {
  try {
    const web3 = new Web3(_provider);
    const contract = new web3.eth.Contract(abi, address);
    let txhash = null;
    const acc = await web3.eth.getAccounts();
    await contract.methods
      .whitelist(pairs)
      .send({ from: acc[0] }, (err, txHash) => {
        if (!err) txhash = `SUCCESS! tx hash: ${txHash}`;
      });
    return txhash;
  } catch (e) {
    console.log("Whitelist Func Error" + e);
    return null;
  }
};

export const collectFeeFunc = async (_provider, wallet) => {
  try {
    const web3 = new Web3(_provider);
    const contract = new web3.eth.Contract(abi, address);
    let txhash = null;
    const acc = await web3.eth.getAccounts();
    await contract.methods
      .collectFee(wallet)
      .send({ from: acc[0] }, (err, txHash) => {
        if (!err) txhash = `SUCCESS! tx hash: ${txHash}`;
      });
    return txhash;
  } catch (e) {
    console.log("Collect Fee Func Error" + e);
    return null;
  }
};

export const withdrawWinFunc = async (_provider, id) => {
  try {
    const web3 = new Web3(_provider);
    const contract = new web3.eth.Contract(abi, address);
    let txhash = null;
    const acc = await web3.eth.getAccounts();
    await contract.methods
      .withdrawWin(id)
      .send({ from: acc[0] }, (err, txHash) => {
        if (!err) txhash = `SUCCESS! tx hash: ${txHash}`;
      });
    return txhash;
  } catch (e) {
    console.log("Withdraw Win Func Error" + e);
    return null;
  }
};
