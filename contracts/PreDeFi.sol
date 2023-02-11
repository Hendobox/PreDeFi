// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

//
interface ISupraSValueFeed {
    function checkPrice(string memory marketPair)
        external
        view
        returns (int256 price, uint256 timestamp);
}

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

contract PreDeFi is Ownable {
    using Counters for Counters.Counter;

    ISupraSValueFeed internal sValueFeed;
    Counters.Counter private _id;
    uint256 public fee; //1% = 1000
    uint256 public available;
    address public routerAddress = 0x700a89Ba8F908af38834B9Aba238b362CFfB665F;

    mapping(address => mapping(uint256 => bool)) public claimed;
    mapping(uint256 => Batch) public batches;
    mapping(uint256 => mapping(int256 => address[])) private predictions;
    mapping(address => mapping(uint256 => int256[])) private activity;
    mapping(string => bool) public isValidPair;

    event NewPrediction(
        uint256 id,
        uint256 indexed ticketPrice,
        string indexed pair,
        uint256 startTimestamp,
        uint256 endTimestamp
    );
    event Predict(
        address indexed user,
        uint256 indexed id,
        int256[] predictions
    );
    event Resolve(
        address indexed caller,
        uint256 id,
        int256 price,
        uint256 timestamp,
        address[] winners
    );
    event CollectFee(address indexed wallet, uint256 available);
    event WithdrawWin(
        address indexed caller,
        uint256 indexed id,
        uint256 amount
    );
    event Whitelist(address indexed caller, string[] pairs);

    constructor(uint256 _fee, string[] memory pairs) Ownable() {
        fee = _fee;
        whitelist(pairs);
        sValueFeed = ISupraSValueFeed(routerAddress);
    }

    modifier realId(uint256 id) {
        Batch memory b = batches[id];
        require(b.startTimestamp != 0, "INVALID_ID");
        _;
    }

    function newPrediction(
        uint256 ticketCost,
        uint256 startsIn,
        uint256 lastsFor,
        string calldata pair
    ) external onlyOwner returns (uint256 id) {
        bool valid = isValidPair[pair];
        require(valid, "INVALID_PAIR");

        _id.increment();
        id = _id.current();

        uint256 start = block.timestamp + startsIn;
        uint256 end = start + lastsFor;

        Batch storage b = batches[id];

        b.id = id;
        b.ticketCost = ticketCost;
        b.startTimestamp = start;
        b.closeTimestamp = end;
        b.pair = pair;

        emit NewPrediction(id, ticketCost, pair, start, end);
    }

    function predict(uint256 id, int256[] calldata _predictions)
        external
        payable
        realId(id)
    {
        Batch memory b = batches[id];
        require(
            b.closeTimestamp > block.timestamp &&
                b.startTimestamp < block.timestamp,
            "PREDICTION_NOT_OPEN"
        );

        uint256 len = _predictions.length;

        uint256 cost = b.ticketCost * len;

        require(cost == msg.value, "WRONG_PAYMENT_VALUE");

        for (uint256 i = 0; i < len; i++) {
            activity[msg.sender][id].push(_predictions[i]);
            predictions[id][_predictions[i]].push(msg.sender);
        }

        Batch storage _b = batches[id];
        unchecked {
            _b.totalTickets += len;
        }
        emit Predict(msg.sender, id, _predictions);
    }

    function resolve(uint256 id) external onlyOwner realId(id) {
        Batch memory b = batches[id];
        require(block.timestamp > b.closeTimestamp, "NOT_YET");
        require(!b.isClosed, "ALREADY_RESOLVED");

        Batch storage _b = batches[id];
        _b.isClosed = true;

        (int256 price, uint256 timestamp) = getPrice(b.pair);

        // address[] memory wnrs = new address[]()

        _b.winPrice = price;

        uint256 feeAmt;
        uint256 raised = b.ticketCost * b.totalTickets;
        uint256 len = predictions[id][price].length;

        if (len == 0) {
            feeAmt = raised;
        } else {
            uint256 _fee = fee;
            feeAmt = (raised * _fee) / (1000 * 100);

            uint256 calc = raised - feeAmt;
            _b.totalBalanceAfterFee = calc;
            _b.winners = predictions[id][price];
        }

        unchecked {
            available += feeAmt;
        }

        b = batches[id];

        emit Resolve(msg.sender, id, price, timestamp, b.winners);
    }

    function whitelist(string[] memory pairs) public onlyOwner {
        uint256 len = pairs.length;
        for (uint256 i = 0; i < len; i++) {
            isValidPair[pairs[i]] = true;
        }
        emit Whitelist(msg.sender, pairs);
    }

    function collectFee(address payable wallet) external onlyOwner {
        uint256 avail = available;
        require(avail > 0, "NOTHING_TO_WITHDRAW");
        available = 0;
        _transfer(wallet, avail);
        emit CollectFee(wallet, avail);
    }

    function withdrawWin(uint256 id) external {
        bool clm = claimed[msg.sender][id];
        require(!clm, "ALREADY_CLAIMED");

        (, uint256 count) = result(msg.sender, id);
        require(count > 0, "NOT_WINNER");

        Batch memory b = batches[id];
        uint256 amt = (b.totalBalanceAfterFee / b.winners.length) * count;

        claimed[msg.sender][id] = true;

        _transfer(payable(msg.sender), amt);
        emit WithdrawWin(msg.sender, id, amt);
    }

    function result(address addr, uint256 id)
        public
        view
        realId(id)
        returns (bool isWinner, uint256 winTickets)
    {
        Batch memory b = batches[id];
        uint256 len = b.winners.length;
        if (len > 0) {
            uint256 num;
            for (uint256 i = 0; i < len; i++) {
                if (b.winners[i] == addr) num++;
            }
            if (num > 0) {
                (isWinner, winTickets) = (true, num);
            }
        }
    }

    function getPrice(string memory pair)
        public
        view
        returns (int256 price, uint256 timestamp)
    {
        return sValueFeed.checkPrice(pair);
    }

    function _transfer(address payable wallet, uint256 amt) private {
        (bool success, ) = wallet.call{value: amt}("");
        require(success, "WITHDRAWAL_ERROR");
    }
}
