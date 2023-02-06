// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "openzeppelin-contracts/contracts/utils/Counters.sol";

interface ISupraRouter {
    function generateRequest(
        string memory _functionSig,
        uint8 _rngCount,
        uint256 _numConfirmations
    ) external returns (uint256);
}

struct Batch {
    uint256 id;
    uint256 ticketCost;
    uint256 totalTickets;
    uint256 totalBalanceAfterFee;
    uint256 currentBalance;
    uint256 limit;
    uint256 startTimestamp;
    uint256 closeTimestamp;
    uint256[] winNums;
    address[] winners;
    address[] claimers;
    uint8 rngCount;
    bool isClosed;
}

contract PreDeFi is Ownable {
    using Counters for Counters.Counter;

    ISupraRouter internal supraRouter;
    Counters.Counter private _id;
    uint256 public fee; //1% = 1000
    uint256 public available;

    mapping(uint256 => uint256) private _nonceMap;
    mapping(address => mapping(uint256 => bool)) public claimed;
    mapping(uint256 => Batch) public batches;
    mapping(uint256 => mapping(uint256 => address[])) private predictions;
    mapping(address => mapping(uint256 => uint256[])) private activity;

    event NewPrediction(
        uint256 id,
        uint256 indexed ticketPrice,
        uint256 indexed limit,
        uint8 indexed rngCount,
        uint256 startTimestamp,
        uint256 endTimestamp
    );
    event Predict(
        address indexed user,
        uint256 indexed id,
        uint256[] predictions
    );
    event Resolve(address indexed caller, uint256 id, uint256 generated_nonce);
    event Execute(
        uint256 _nonce,
        uint256[] _rngList,
        uint256[] winNums,
        address[] arrWinners
    );
    event CollectFee(address indexed wallet, uint256 avail);
    event WithdrawWin(
        address indexed caller,
        uint256 indexed id,
        uint256 amount
    );

    constructor(address routerAddress) Ownable() {
        supraRouter = ISupraRouter(routerAddress);
    }

    modifier realId(uint256 id) {
        Batch memory b = batches[id];
        require(b.startTimestamp != 0, "INVALID_ID");
        _;
    }

    function newPrediction(
        uint256 ticketCost,
        uint256 limit,
        uint8 rngCount,
        uint256 startsIn,
        uint256 lastsFor
    ) external onlyOwner returns (uint256 id) {
        _id.increment();
        id = _id.current();

        uint256 start = block.timestamp + startsIn;
        uint256 end = start + lastsFor;

        Batch storage b = batches[id];

        b.id = id;
        b.ticketCost = ticketCost;
        b.startTimestamp = start;
        b.closeTimestamp = end;
        b.limit = limit;
        b.rngCount = rngCount;

        emit NewPrediction(id, ticketCost, limit, rngCount, start, end);
    }

    function predict(uint256 id, uint256[] calldata _predictions)
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
        require(!b.isClosed, "ALREADY_RESOLVED");
        Batch storage _b = batches[id];
        _b.isClosed = true;

        uint256 generated_nonce = supraRouter.generateRequest(
            "execute(uint256,uint256[])",
            b.rngCount,
            1
        );
        _nonceMap[generated_nonce] = id;
        emit Resolve(msg.sender, id, generated_nonce);
    }

    function execute(uint256 _nonce, uint256[] calldata _rngList) external {
        require(msg.sender == address(supraRouter));

        //determine total winners
        uint256 id = _nonceMap[_nonce];
        uint256 len = _rngList.length;

        Batch memory b = batches[id];
        Batch storage _b = batches[id];

        uint256[] memory arrNum = new uint256[](len);
        address[] memory arrWinners;
        uint256 k;

        for (uint256 i = 0; i < len; i++) {
            uint256 num = _rngList[i] % b.limit;
            arrNum[i] = num;

            address[] memory winnersList = predictions[id][num];
            uint256 wLen = winnersList.length;

            if (wLen > 0) {
                for (uint256 j = 0; j < wLen; j++) {
                    arrWinners[k] = winnersList[j];
                    k++;
                }
            }
        }

        _b.winners = arrWinners;
        _b.winNums = arrNum;

        uint256 _fee = fee;
        uint256 raised = b.ticketCost * b.totalTickets;
        uint256 feeAmt = (raised * _fee) / (1000 * 100);

        unchecked {
            available += feeAmt;
        }

        uint256 calc = raised - feeAmt;

        _b.totalBalanceAfterFee = calc;
        emit Execute(_nonce, _rngList, arrNum, arrWinners);
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

        _transfer(payable(msg.sender), amt);
        emit WithdrawWin(msg.sender, id, amt);
    }

    function result(address addr, uint256 id)
        public
        view
        realId(id)
        returns (bool, uint256)
    {
        Batch memory b = batches[id];
        uint256 len = b.winners.length;
        if (len > 0) {
            uint256 num;
            for (uint256 i = 0; i < len; i++) {
                if (b.winners[i] == addr) num++;
            }
            if (num > 0) {
                return (true, num);
            }
        }
        return (false, 0);
    }

    function _transfer(address payable wallet, uint256 amt) private {
        (bool success, ) = wallet.call{value: amt}("");
        require(success, "WITHDRAWAL_ERROR");
    }
}
