const assetData = require("../../assetData.json");

export default function handler(req, res) {
  const { query: account, method } = req;

  let playerTokens = {};

  for (let i = 1; i <= Object.keys(assetData).length; i++) {
    if (assetData[i]["owner"] === account["account"]) {
      playerTokens[i] = { tokenId: i, winPower: assetData[i]["winPower"] };
    }
  }

  res.status(200).json({ playerTokens });
}
