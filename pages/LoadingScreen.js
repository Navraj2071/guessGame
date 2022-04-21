import React from "react";
import { useEffect, useReducer, useState } from "react";
import { useEthers } from "@usedapp/core";

import Web3 from "web3";
import Contract from "web3-eth-contract";
Contract.setProvider(Web3.givenProvider);
const addressesObject = require("../contractData.json");
// Game Contract
const gameContractAddress = addressesObject["gameContract"];
const compiledContract = require("../compiledContract.json");
const gameABI = compiledContract["abi"];
const gameContract = new Contract(gameABI, gameContractAddress);
// Token Contract
const tokenContractAddress = addressesObject["tokenContract"];
const compiledTokenContract = require("../compiledTokenContract.json");
const tokenABI = compiledTokenContract["abi"];
const tokenContract = new Contract(tokenABI, tokenContractAddress);
// NFT Contract
const NFTContractAddress = addressesObject["nftContract"];
const compiledNFTContract = require("../compiledNFTContract.json");
const NFTABI = compiledNFTContract["abi"];
const NFTContract = new Contract(NFTABI, NFTContractAddress);

const LoadingScreen = () => {
  const { account } = useEthers();
  const [hasData, setHasData] = useState(true);
  const reducer = (state, action) => {
    switch (action.type) {
      case "name":
        return { ...state, name: action.payload.name };
      case "id":
        return { ...state, id: action.payload.id };
      case "tokenBalance":
        return { ...state, tokenBalance: action.payload.tokenBalance };
      case "gameBalance":
        return { ...state, gameBalance: action.payload.gameBalance };
      case "NFTprice":
        return { ...state, NFTprice: action.payload.NFTprice };
      case "assets":
        return { ...state, assets: action.payload.assets };
    }
  };
  const [state, dispatch] = useReducer(reducer, {
    name: "",
    id: 0,
    tokenBalance: 0,
    gameBalance: 0,
    NFTprice: 0,
    assets: [],
  });

  const [status, setStatus] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [displayNumber, setDisplayNumber] = useState("");
  useEffect(() => {
    poppulatePlayerData();
    fetch("/api/updateTokenData");
  }, []);

  const poppulatePlayerData = async () => {
    gameContract.methods
      .playerToName(account)
      .call()
      .then((resp) => {
        dispatch({
          type: "name",
          payload: { name: resp },
        });
      })
      .catch((err) => setHasData(false));
    gameContract.methods
      .playerToId(account)
      .call()
      .then((resp) => {
        dispatch({
          type: "id",
          payload: { id: resp },
        });
      })
      .catch((err) => setHasData(false));
    tokenContract.methods
      .balanceOf(account)
      .call()
      .then((resp) => {
        dispatch({
          type: "tokenBalance",
          payload: { tokenBalance: resp },
        });
      })
      .catch((err) => setHasData(false));
    gameContract.methods
      .NFTprice()
      .call()
      .then((resp) => {
        dispatch({
          type: "NFTprice",
          payload: { NFTprice: resp },
        });
      })
      .catch((err) => setHasData(false));

    fetch("/api/getTokenData?account=" + account).then(async (resp) => {
      let tokenData = await resp.json();
      let assets = [];
      if (Object.keys(tokenData["playerTokens"]).length === 0) {
        return;
      }
      assets.push(tokenData["playerTokens"]);
      dispatch({
        type: "assets",
        payload: { assets: assets },
      });
    });
  };

  const addPlayer = async () => {
    setStatus("");
    let playerName = document.getElementById("nameform").value;
    if (playerName === "") {
      setStatus("Enter valid player name.");
    } else {
      await gameContract.methods
        .createPlayer(playerName)
        .send({ from: account })
        .then((resp) => {
          location.reload();
        })
        .catch((err) => console.log(err["message"]));
    }
  };

  const getAsset = async () => {
    let randomPower = Math.round(Math.random() * 100, 2);
    let price = state.NFTprice;
    await gameContract.methods
      .mintNFT(randomPower)
      .send({ from: account, value: price })
      .then((resp) => {
        console.log(resp);
        fetch("/api/updateTokenData");
        setStatus(
          "Asset minted. It can take a few minutes to load your assets. Refresh the page after a few minutes."
        );
      })
      .catch((err) => console.log(err));
  };

  const getToken = async () => {
    let points = state.gameBalance;
    dispatch({
      type: "gameBalance",
      payload: { gameBalance: 0 },
    });

    await fetch(
      "/api/payout?method=send&account=" +
        account +
        "&points=" +
        state.gameBalance
    )
      .then((resp) => {
        console.log(resp);
        location.reload();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const GamePlay = () => {
    const play = () => {
      setStatus("");
      setDisplayNumber("");
      let guessedNumber = parseInt(document.getElementById("guesser").value);
      if (guessedNumber > 10 || guessedNumber < 1) {
        setStatus("Number should be +ve and < 11");
        setIsCalculating(false);
      } else {
        setIsCalculating(true);
        let randomNumber = Math.round(Math.random() * 10, 1);
        setDisplayNumber("It was " + randomNumber);
        if (guessedNumber === randomNumber) {
          setStatus("You won.");
          let winning = 0;
          for (let i = 0; i < Object.keys(state.assets[0]).length; i++) {
            winning =
              winning +
              parseInt(
                state.assets[0][Object.keys(state.assets[0])[i]]["winPower"]
              );
          }
          dispatch({
            type: "gameBalance",
            payload: {
              gameBalance: state.gameBalance + winning * randomNumber,
            },
          });
          setIsPlaying(false);
        } else {
          setStatus("You lost. Try again");
        }
      }
    };

    const Calculating = () => {
      return (
        <>
          <div className="winning">
            <div>
              <video
                src="/open.mp4"
                type="video/quicktime"
                autoPlay
                muted
                loop
                height="100%"
                width="100%"
              ></video>
            </div>
            <h3>{displayNumber}</h3>
            <h3>{status}</h3>
            <div>
              <button
                onClick={() => {
                  setIsCalculating(false);
                  setIsPlaying(true);
                }}
              >
                Try again
              </button>
              <button
                onClick={() => {
                  setIsCalculating(false);
                  setIsPlaying(false);
                }}
              >
                Exit
              </button>
            </div>
          </div>
        </>
      );
    };

    const EnterNumber = () => {
      return (
        <>
          <button
            className="connectButton"
            onClick={() => {
              setStatus("");
              setIsPlaying(false);
            }}
          >
            Exit
          </button>
          <div className="myform">
            <video
              src="mystery.mp4"
              type="video/mp4"
              autoPlay
              muted
              loop
              width="300"
            ></video>

            <label htmlFor="guesser">
              <h3>Guess a number between 0 and 10</h3>
            </label>
            <input type="number" placeholder="Enter integer" id="guesser" />
            <button
              onClick={() => {
                play();
              }}
            >
              Enter
            </button>
          </div>
          <h3>{status}</h3>
        </>
      );
    };

    return (
      <>
        <div className="gamePlay">
          {isCalculating ? (
            <>
              <Calculating />
            </>
          ) : (
            <>
              <EnterNumber />
            </>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <div className="loadingScreen">
        <div className="leftPanel">
          <div className="greeting">
            <h1>Hi {state.name}</h1>
            {account}
          </div>
          {state.assets.length > 0 ? (
            <>
              <div className="cardholder">
                <h2>Your Assets</h2>
                <button onClick={() => getAsset()}>Get Asset</button>
                {Object.keys(state.assets[0]).map((asset) => {
                  return (
                    <React.Fragment key={state.assets[0][asset]["tokenId"]}>
                      <div className="card">
                        <h3>Token Id: {state.assets[0][asset]["tokenId"]}</h3>
                        <h3>Win Power: {state.assets[0][asset]["winPower"]}</h3>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </>
          ) : (
            <></>
          )}
        </div>
        <div className="centerPanel">
          <video src="/coin.mp4" type="video/mp4" autoPlay muted loop></video>
          {state.assets.length > 0 ? (
            <>
              {isPlaying ? (
                <></>
              ) : (
                <>
                  <button onClick={() => setIsPlaying(true)}>Start Game</button>
                </>
              )}
            </>
          ) : (
            <></>
          )}
          {state.name === "" ? (
            <>
              <h2>Sign up to get started.</h2>
              <h3>Player data will be on the BlockChain</h3>
              <div className="myform">
                <input type="text" placeholder="Your name" id="nameform" />
                <button onClick={() => addPlayer()}>Sign up</button>
              </div>
            </>
          ) : (
            <>
              {state.assets.length > 0 ? (
                <></>
              ) : (
                <>
                  <h2>Get some assets to play.</h2>
                  <button onClick={() => getAsset()}>Get Asset</button>
                </>
              )}
            </>
          )}
          <h3>{status}</h3>
        </div>
        <div className="rightPanel">
          {state.name === "" ? (
            <></>
          ) : (
            <>
              <div className="card">
                <h3>ToonCoin Balance: {state.tokenBalance}</h3>
                <h3>Game Balance: {state.gameBalance}</h3>
              </div>
              {state.gameBalance > 0 ? (
                <>
                  <button
                    style={{ margin: "20px" }}
                    onClick={() => {
                      getToken();
                    }}
                  >
                    Get Token
                  </button>
                </>
              ) : (
                <></>
              )}
            </>
          )}
        </div>
      </div>
      {isPlaying && state.assets.length > 0 ? <GamePlay /> : <></>}
    </>
  );
};

export default LoadingScreen;
