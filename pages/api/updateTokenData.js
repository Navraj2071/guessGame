import Contract from "web3-eth-contract";
import fs from "fs";

Contract.setProvider(
  "https://rinkeby.infura.io/v3/af7a38f98bcd4ebbbc7c0c844640104f"
);
const addressesObject = require("../../contractData.json");
const NFTContractAddress = addressesObject["nftContract"];
const compiledNFTContract = require("../../compiledNFTContract.json");
const NFTABI = compiledNFTContract["abi"];
const NFTContract = new Contract(NFTABI, NFTContractAddress);

const assetData = require("../../assetData.json");

const updateNFTdata = async () => {
  let isCounting = true;
  let tokenId = 1;
  while (isCounting) {
    await NFTContract.methods
      .ownerOf(tokenId)
      .call()
      .then(async (resp) => {
        if (resp > 0) {
          await NFTContract.methods
            .tokenIdToWinPower(tokenId)
            .call()
            .then((resp2) => {
              assetData[tokenId] = { owner: resp, winPower: resp2 };
            })
            .catch((err) => {
              isCounting = false;
            });
        } else {
          isCounting = false;
        }
      })
      .catch((err) => {
        isCounting = false;
      });
    tokenId++;
  }
  let assetDataJson = JSON.stringify(assetData);
  fs.writeFile("assetData.json", assetDataJson, (err) => {
    throw err;
  });
};

export default function handler(req, res) {
  updateNFTdata();
  res.status(200).json({ name: "John Doe" });
}
