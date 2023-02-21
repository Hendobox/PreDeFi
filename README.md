# PreDeFi

A decentralized prediction market.

[DEPLOYED CONTRACT](https://explorer.testnet.mantle.xyz/address/0x58Bf9088F1609190B6cE6b3C79343516Fd475723)

## OVERVIEW

This project is a price prediction market which uses price oracles form [SupraOracles](https://supraoracles.com).

The admin wallet creates a new prediction round by inoutting the ticket cost, prediction period, and pair to predict for.

The users on the other hand would need to predict on an open round. They are free to predict several tickets. On doing this, they will be charged in BIT based on the number of tickets chosen.

A task is set on the backend to end the round with the price of the chosen pair. This is where the winners are chosen and allocated their earnings. The admin also gets allocated fees.

## INSTALLATION

- clone the repository

```
git clone https://github.com/IOFY-Protocol/blockchain.git
```

- install the packages

```
npm install
```

- compile the contracts

```
npx hardhat compile
```

- run the unit tests

```
npx hardhat test
```

## SMART CONTRACT INTEGRATION DOCS

This section contains details of the different endpoints available in the smart contract.

During the deployment of this smart contct, the following varianles are passed into the constructor:

```
constructor(uint256 fee, string[] memory pairs);
```

where,

| Syntax | description                                                                                                                                          |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| fee    | the fee value (integer) to be set. When the value is set to **1000**, it means that the contract will charge **1%** fee after every round.           |
| pairs  | an array of [pairs](https://supraoracles.com/docs/get-started/market-pairs) available on Supra Oracles which the contract can offer predictions for. |

The address that deploys the the smart contract is automatically set to be the _owner()_ address. This is also modifyable in the contract. See [Openzeppelin](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol).

### Read Methods

Find the available read methods below:

```
function fee() external view returns (uint256 fee);
```

where,

| Syntax | description                                                                                                                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| fee    | returns the fee value (integer) charged from the device owner by IOFY whenever payment is made to rent a device. When the return value is **1000**, it means that IOFY charges **1%** fee. |

```
function available() external view returns (uint256 available);
```

where,

| Syntax    | description                                                                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| available | returns the available amount (integer) accumulated by the contract from all the fees. This tells you how much revenue can be withdrawn by the admin at the current time |

```
function routerAddress() external view returns (address routerAddress);
```

where,

| Syntax        | description                                                                                                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| routerAddress | returns the [router address](https://supraoracles.com/docs/get-started/networks#:~:text=Solidity-,0x700a89Ba8F908af38834B9Aba238b362CFfB665F,-Evmos%20TestNet) of Supra Oracles deployed for Mantle test network |

```
function claimed(address user, uint256 id) external view returns (bool claimed);
```

where,

| Syntax  | description                                        |
| ------- | -------------------------------------------------- |
| user    | address to query for                               |
| id      | id to query for                                    |
| claimed | returns true/false if user has claimed wins for id |

```
function isValidPair(string memory pair) external view returns (bool isValidPair);
```

where,

| Syntax      | description                                     |
| ----------- | ----------------------------------------------- |
| pair        | the pair to query for                           |
| isValidPair | returns true/false if pair has been whitelisted |

```
struct Batch {
    uint256 id;
    uint256 ticketCost;
    uint256 totalTickets;
    uint256 totalBalanceAfterFee;
    uint256 startTimestamp;
    uint256 closeTimestamp;
    int256 winPrice;
    address[] winners;
    string pair;
    bool isClosed;
}

function batches(uint256 id) returns (Batch memory batch);
```

where,

| Syntax               | description                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| batches              | returns the batch info of batch with id                                                              |
| id                   | id (integer) of the batch to query.                                                                  |
| ticketCost           | the cost for one ticket in this batch                                                                |
| totalTickets         | the total number of tickets played                                                                   |
| totalBalanceAfterFee | the balance left from all the funds raised from the tickets in a batch after admin fees are deducted |
| startTimestamp       | the epoch timestamp when the predictions will start                                                  |
| closeTimestamp       | the epoch timestamp when the predictions will end                                                    |
| winPrice             | the win price as derived from the oracle                                                             |
| winners              | array of addresses who won in this batch                                                             |
| pair                 | the pair for this batch. (eg "eth_usdt")                                                             |
| isClosed             | a boolean showing if the batch has been closed                                                       |

```
function result(address addr, uint256 id) public view  returns (bool isWinner, uint256 winTickets);
```

where,

| Syntax     | description                                                   |
| ---------- | ------------------------------------------------------------- |
| result     | returns the result of addr in the batch with the selected id. |
| addr       | user address to query for                                     |
| id         | id (integer) of the batch to query for.                       |
| isWinner   | a boolean showing if addr is a winner in the selected batch   |
| winTickets | the number of tickets won by addr in the batch selected       |

```
function getPrice(string memory pair) public view returns (int256 price, uint256 timestamp)
```

where,

| Syntax    | description                                                             |
| --------- | ----------------------------------------------------------------------- |
| getPrice  | returns the price and timestamp of the inputted pair from SupraOracles. |
| pair      | the pair for this batch. (eg "eth_usdt").                               |
| price     | the current price of the inputted pair                                  |
| timsetamp | the epoch timestamp related to the price                                |

### Write Methods

```
function whitelist(string[] memory pairs) public;

```

where,

| Syntax    | description                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| whitelist | is used by the admin to include new paird that are predictable by the contract.                                       |
| pairs     | an array of pairs to be whitelisted. see [Supra market pairs](https://supraoracles.com/docs/get-started/market-pairs) |
| price     | the current price of the inputted pair                                                                                |

**NOTE**

- this will fail if called by non-admin
- the pair passed in must be accurate to avoid errors when getting prize, which will mess the setup up.

```
function newPrediction(uint256 ticketCost, uint256 startsIn, uint256 lastsFor, string calldata pair) external returns (uint256 id)
```

where,

| Syntax        | description                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------- |
| newPrediction | the method used to by the admin to create a new prediction round/batch                          |
| ticketCost    | the cost for one ticket in this batch                                                           |
| startsIn      | this tells the contract the period to wait before starting to accept predictions for this batch |
| lastsFor      | this tells the contract how long to accept predictions from the period when it starts           |
| pair          | the SupraOracles pair to predict                                                                |
| id            | the id of the newly created batch                                                               |

**NOTE**

- _pair_ must be valid. (see **isValidPair**).

```
function predict(uint256 id, int256[] calldata predictions) external payable;
```

where,

| Syntax      | description                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| id          | the mbatch to predict                                                                                                                 |
| predictions | an array of predictions. the user will pay for the number of tickets based on the cost. predictions.length = number of tickets bought |

**NOTE**

- The user must predict during the prediction window. (see **batches(id)**).
- the user must send the correct amount of BIT.

```
function resolve(uint256 id) external;

```

where,

| Syntax  | description                                                        |
| ------- | ------------------------------------------------------------------ |
| resolve | determines the win price and winners by engaging the Supra oracle. |
| id      | id of the batch to resolve                                         |

**NOTE**

- the close timestamp for this batch should have been reached
- cannot be done twice
- must be called by the admin
- the winners and admin allocations happen here
- users who predicted the win price will be winners

```
function withdrawWin(uint256 id) external;
```

where,

| Syntax      | description                               |
| ----------- | ----------------------------------------- |
| withdrawWin | is used to withdraw winnings              |
| id          | id of the batch to withdraw winnings from |

**NOTE**

- only winners of the selected batch can withdraw. (see **result(user, id)**).
- winners cannot withdraw twice from a batch.

```
function collectFee(address payable wallet) external;

```

where,

| Syntax     | description                            |
| ---------- | -------------------------------------- |
| collectFee | is used by the admins to withdraw fees |
| wallet     | the fee recipient                      |

**NOTE**

- only admin can call this.
- will fail if there isn't any available fee. (see **available()**).
