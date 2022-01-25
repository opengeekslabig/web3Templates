import React, {useEffect, useState} from "react";
import styles from './mint.module.scss'
import arrow from '../asset/img/arrow-right.svg'
import img1 from '../asset/img/1.png'
import img2 from '../asset/img/2.png'
import img3 from '../asset/img/3.png'
import img4 from '../asset/img/4.png'
import { useWeb3Modal } from "../hooks/web3Modal";


const Mint: React.FC = () => {
    const [errorMsg,setErrorMsg] = useState<string | null>(null);
    const [amount, setAmount] = useState(0);

    const {
        chainData,
        address,
        connect,
        disconnect,
        error,
        mintData,
        Mint,
        isLoading
    } = useWeb3Modal();

    // useEffect(()=>{
    //     if(currentContract){
    //         console.log(currentContract);
    //         console.log(currentContract?.publicMethods);
    //         console.log(currentContract?.privateMethods);
    //     }
    // },[currentContract])

    useEffect(()=>{
        if(error){
            setErrorMsg(error)
        } else {
            setErrorMsg(null)
        }
    },[error])

    const inputHandler = (e: any) =>{
        if(Number(e?.target?.value)<0){
            setAmount(0)
            return ;
        } else {
            if(Number(e?.target?.value)>mintData?.max){
                setAmount(mintData?.max)
                return ;
            }
        }
        setAmount(+e?.target?.value)
    }



    const mintHandle = () =>{
        if(!errorMsg && amount>0){
            //Mint(amount)
            console.log('mint');
        }
    }

    return <>
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.description}>
                    <div className={styles.connectButton} onClick={address ? disconnect : connect}>
                        {address ? 'DISCONNECT' : 'CONNECT'}
                    </div>
                    <div className={styles.description_title}>
                        You Finally Made It
                    </div>
                    <div className={styles.description_header}>
                        Mint Your Punk
                    </div>
                    <div className={styles.description_post}>
                        Simply click the button below to mint your punk directly into your wallet.
                    </div>
                    <div className={styles.mintControl}>
                        <input value={amount} className={styles.input} type="number" onInput={inputHandler} disabled={!!error}/>
                        <div className={styles.button} onClick={mintHandle}>MINT YOUR PUNK
                            <img className={styles.arrow} src={arrow} />
                        </div>
                    </div>
                    <div className={styles.error}>{errorMsg}</div>

                </div>
                <div className={styles.pics}>
                    <div className={styles.imgWrapper}>
                        <img src={img1} alt="punk1"/>
                    </div>
                    <div className={styles.imgWrapper}>
                        <img src={img2} alt="punk2"/>
                    </div>
                    <div className={styles.imgWrapper}>
                        <img src={img3} alt="punk3"/>
                    </div>
                    <div className={styles.imgWrapper}>
                        <img src={img4} alt="punk4"/>
                    </div>
                </div>
            </div>
        </div>
    </>;
};

export default Mint;
