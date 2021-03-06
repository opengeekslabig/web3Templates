import React from "react";
import styles from './home.module.scss'
import { useWeb3Modal } from "../hooks/web3Modal";
import {useContract} from "../hooks/useContract";
import {contractConfig} from "../config/const";


const Home: React.FC = () => {
    const {
        chainData,
        address,
        connect,
        disconnect,
        modalError,
        web3Provider,
        error,
        setModalError
    } = useWeb3Modal(contractConfig.chainId);
    const {
        currentContract,
        getEvents
    } = useContract(web3Provider,address,!error);
    // console.log(test);
//     console.log(error);
//     console.log(modalError);
//     console.log(currentContract);
// console.log('render');

const getEventsHandler = () =>{
    getEvents().then(e=>console.log('get'))
}
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
                <div className={styles.connectButton} onClick={getEventsHandler}>
                    get events
                </div>
            </div>
          {modalError && <div className="modal" onClick={()=>setModalError(null)}>{modalError}</div>}

      </div>
  </>;
};

export default Home;
