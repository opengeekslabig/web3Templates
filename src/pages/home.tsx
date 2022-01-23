import React from "react";
import styles from './home.module.scss'
import { useWeb3Modal } from "../hooks/web3Modal";

interface Props {
  props?: any;
}

const Home: React.FC<Props> = (props) => {
    const {
        chainData,
        address,
        connect,
        disconnect
    } = useWeb3Modal();
    console.log(chainData)
  return <>
      <div className={styles.container}>
          <div className={styles.walletData}>
              <div className={styles.chainData}>
                  Chain: {chainData?.name}
              </div>
              <div className={styles.wallet}>
                  {address}:Wallet
              </div>
          </div>
            <div className={styles.controlContainer}>
                <div className={styles.connectButton} onClick={address ? disconnect : connect}>
                    {address ? "DISCONNECT":"CONNECT"}
                </div>
            </div>
      </div>
  </>;
};

export default Home;
