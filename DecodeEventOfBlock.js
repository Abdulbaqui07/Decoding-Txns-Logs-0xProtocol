const Web3 = require('web3');

const web3 = new Web3(
    "https://mainnet.infura.io/v3/738d607b3d294eb58ad33862a792d0bc"
);


const contractAddress = "0xdef1c0ded9bec7f1a1670819833240f027b25eff"; // 0x protocal proxy contract

// const fillLimitOrder = "", unknown = "", 

let functionArray = ["0x312aae89", "0x415565b0", "0xf6274f66", "0x000000ff", "0x5f575529", "0xde7b5f9e", "0x56603732", "0x5cf54026", "0xca8bd1f9"]
// 0x00000000


const limitOrderSig = web3.eth.abi.encodeEventSignature('LimitOrderFilled(bytes32,address,address,address,address,address,uint128,uint128,uint128,uint256,bytes32)');
console.log("limit ",limitOrderSig)

/**
* @returns txn of specific contract and takes only swap and unoswap function call txns
*/
async function getTransactionFromBlock() {
    count = 0 
    let arr = []

    const blockNumber = await web3.eth.getBlockNumber();
    // const blockNumber  = '16518400'
    console.log("blockNumber", blockNumber);

    // 
    for (let i = blockNumber - 60; i <= blockNumber; i++) {
        console.log("blockl", i)
        // getting the specific block txns
        let getBlock = await web3.eth.getBlock(i, true)

        if(getBlock.transactions){
             // accessing each txn of the block
        getBlock.transactions.forEach(async (tx) => {

            // filter it with 1inch contract only
            // if (tx.to !== null && tx.to.toLowerCase() === contractAddress) {

                // console.log("TX ",tx)

                // filtering only swap and unoswap function call
                // if (functionArray.indexOf(tx.input.slice(0, 10)) != -1) {
                    count++;
                    
                    let resultArr = await getLogsDataFromHash(tx.hash)
                    if(resultArr.length != 0){
                        arr.push(resultArr)
                    }
                    // console.log("result received ", resultArr)
                    
                    // pushing each tranaction arr to sub arr
                // }
            // }
        })
        }
    }
    return arr
}



async function getLogsDataFromHash(hash){
    console.log("hash ",hash)
    console.log("count", count)
    let result = await web3.eth.getTransactionReceipt(hash)
    let data = filterLogsOfspecificTx(result)

    // console.log("filter ",data)
    return data
}

function filterLogsOfspecificTx(logsObj){
    let result = []
    let logs = logsObj.logs

    logs.forEach((log) => {
        let txtype = EventType(log)
        if(txtype){
            // console.log("obj", txtype)
            txtype.hash = logsObj['transactionHash']
            result.push(txtype)
            console.log("result", result)
        }
    })


    return result
}

function EventType(log) {
    if(log.topics[0].toLowerCase() == limitOrderSig){
        return decodeFillOrder(log)
    } 
    // else {
    //     return "other"
    // }
}

function decodeFillOrder(log){
    let topicArr = []

    for (let i = 1; i < log.topics.length; i++) {
        topicArr.push(log.topics[i])
    }

    let res = web3.eth.abi.decodeLog(
        [
            {
                "name": "orderHash",
                "type": "bytes32"
            },
            {
                "name": "maker",
                "type": "address"
            },
            {
                "name": "taker",
                "type": "address"
            },
            {
                "name": "feeRecipient",
                "type": "address"
            },
            {
                "name": "makerToken",
                "type": "address"
            }, 
            {
                "name": "takerToken",
                "type": "address"
            },
            {
                "name": "takerTokenFilledAmount",
                "type": "uint128"
            },
            {
                "name": "makerTokenFilledAmount",
                "type": "uint128"
            },
            {
                "name": "takerTokenFeeFilledAmount",
                "type": "uint128"
            },
            {
                "name": "protocolFeePaid",
                "type": "uint256"
            },
            {
                "name": "pool",
                "type": "bytes32"   
            }
        ],
        log["data"],
        topicArr
    );

    return {
        "contract-address": log.address,
        "decodeValue": {
            "orderHash": res.orderHash,
            "maker": res.maker,
            "taker": res.taker,
            "feeRecipient": res.feeRecipient,
            "makerToken": res.makerToken,
            "takerToken": res.takerToken,
            "takerTokenFilledAmount": res.takerTokenFilledAmount,
            "makerTokenFilledAmount": res.makerTokenFilledAmount,
            "takerTokenFeeFilledAmount": res.takerTokenFeeFilledAmount,
            "protocolFeePaid": res.protocolFeePaid,
            "pool": res.pool
        }
    }
}

// DecodeTxnOfOrderFilledEvent('0x87b06f51b6e14c9edc26f9af246bc7b4ba3d82ae7b61597dda772a0a6547f934').then((result) => {
//     console.log(result)
// })

function consoleResult(resultArray){
    for(let i = 0 ; i < resultArray; i++){
        for(let j = 0 ; j < resultArray[i]; j++){
            console.log(resultArray[i][j])
        }
    }
}

getTransactionFromBlock().then((result) => {
    console.log("count ",count)
    console.log("result final ",result)
    consoleResult(result)
})