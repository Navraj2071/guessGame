import Contract from "web3-eth-contract";
import Web3 from "web3";

Contract.setProvider(
  "https://rinkeby.infura.io/v3/af7a38f98bcd4ebbbc7c0c844640104f"
);
const addressesObject = require("../../contractData.json");
const ContractAddress = addressesObject["gameContract"];
const compiledContract = require("../../compiledContract.json");
const ABI = compiledContract["abi"];
const myContract = new Contract(ABI, ContractAddress);

const myAccount = addressesObject["myAccount"];
const privateKey = addressesObject["privateKey"];

const web3 = new Web3(
  "https://rinkeby.infura.io/v3/af7a38f98bcd4ebbbc7c0c844640104f"
);

export default async function handler(req, res) {
  const { query: params, method } = req;
  let player = params["account"];
  let gamepoints = params["points"];
  let queryType = params["method"];
  let gas = "";
  await myContract.methods
    .cashOut(player, gamepoints)
    .estimateGas({ from: myAccount })
    .then((resp) => {
      gas = resp;
    });

  if (queryType === "gas") {
    res.status(200).json({ queries: gas });
  } else {
    // await myContract.methods
    //   .cashOut(player, gamepoints)
    //   .send({ from: myAccount })
    //   .then((resp) => {
    //     res.status(200).json({ queries: "executed" });
    //   });

    let txData = myContract.methods.cashOut(player, gamepoints).encodeABI();
    let txObject = {
      to: ContractAddress,
      from: myAccount,
      data: txData,
      gas: gas,
    };
    let signedTx = await web3.eth.accounts
      .signTransaction(txObject, privateKey)
      .then((resp) => {
        return resp["rawTransaction"];
      })
      .catch((err) => {
        res.status(200).json({ queries: err["message"] });
      });

    await web3.eth
      .sendSignedTransaction(signedTx)
      .then((resp) => {
        res.status(200).json({ queries: resp });
      })
      .catch((err) => {
        res.status(200).json({ queries: err["message"] });
      });

    // let rawTx = { to: ContractAddress, data: txData };
    // let tx = FeeMarketEIP1559Transaction.fromTxData(rawTx);
    // let signedTx = tx.sign(privateKey);
    // let serializedTx = signedTx.serialize();
    // await web3.eth
    //   .sendSignedTransaction("0x" + serializedTx.toString("hex"))
    //   .then((resp) => {
    //     res.status(200).json({ queries: resp });
    //   });
  }
}
