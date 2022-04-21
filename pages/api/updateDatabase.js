import Contract from "web3-eth-contract";
import fs from "fs";

Contract.setProvider(
  "https://rinkeby.infura.io/v3/af7a38f98bcd4ebbbc7c0c844640104f"
);

const addressesObject = require("../../contractData.json");
const gameContractAddress = addressesObject["gameContract"];
const tokenAddress = addressesObject["tokenContract"];
const nftAddress = addressesObject["nftContract"];
const compiledContract = require("../../compiledContract.json");
const ABI = compiledContract["abi"];
const gameContract = new Contract(ABI, gameContractAddress);

const playerData = require("../../database.json");

const getPlayerCount = async () => {
  await gameContract.methods
    .playerCount()
    .call()
    .then((resp) => {
      playerData["playerCount"] = resp;
      let playerDatajson = JSON.stringify(playerData);
      fs.writeFile("database.json", playerDatajson, (err) => {
        throw err;
      });
    })
    .catch((err) => {});
};

const getNFTValue = async () => {
  await gameContract.methods
    .NFTprice()
    .call()
    .then((resp) => {
      playerData["mintPrice"] = resp;
      let playerDatajson = JSON.stringify(playerData);
      fs.writeFile("database.json", playerDatajson, (err) => {
        throw err;
      });
    })
    .catch((err) => {});
};

const updateDatabase = (req, res) => {
  getPlayerCount();
  getNFTValue();
  res.status(200).json({ response: playerData });
};

export default updateDatabase;
