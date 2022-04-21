import ConnectButton from "./connectButton";
import { useEthers } from "@usedapp/core";
import { useState, useEffect, useReducer } from "react";
import LoadingScreen from "./LoadingScreen";
const addressesObject = require("../contractData.json");

export default function Home() {
  const { account, chainId, activateBrowserWallet, deactivate } = useEthers();
  const [isConnected, setIsConnected] = useState(false);
  const tokenContractAddress = addressesObject["tokenContract"];
  useEffect(() => {
    if (account === undefined) {
      setIsConnected(false);
    } else {
      setIsConnected(true);
    }
  }, [account]);

  const TitlePage = () => {
    return (
      <>
        <div className="titleSection">
          Welcome to Guessing Game
          <h2 style={{ color: "white" }}>Guess and earn Crypto</h2>
          <h3 style={{ color: "white" }}>ToonCoin</h3>
          <h3 style={{ color: "white", margin: "0" }}>
            {tokenContractAddress}
          </h3>
          <h2 style={{ color: "white" }}>Connect to play</h2>
          <button
            onClick={() => {
              if (isConnected) {
                deactivate();
              } else {
                activateBrowserWallet();
              }
            }}
          >
            Connect
          </button>
          <h3 style={{ color: "yellow", margin: "0" }}>Network: Rinkeby</h3>
        </div>
      </>
    );
  };

  return (
    <>
      {isConnected ? (
        <>
          <ConnectButton />
          <LoadingScreen />
        </>
      ) : (
        <TitlePage />
      )}
    </>
  );
}
