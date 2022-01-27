import {useCallback, useEffect, useState} from "react";
import { contractConfig } from "../config/const";

interface IContractState {
    contract: any;
    privateMethods: any | null;
    publicMethods: any | null;
    error: string | null;
}

const initialState:IContractState = {
    contract: null,
    privateMethods: null,
    publicMethods: null,
    error: null,
}

export function useContract (web3Provider: any, address: string | null, isEnable: boolean) {

    const [currentContract, setCurrentContract] = useState<IContractState>(initialState);
    const { contract, privateMethods, publicMethods } = currentContract;
    const [contractModalError, setContractModalError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const getContractData = useCallback(async (contract:any) =>{
        let newState: any = {contract};
        try{
            await Promise.all(
                contractConfig.privateMethods.map(async el=>(
                    await contract.methods[el](address).call()
                ))
            ).then(res=>{
                const data: any = {};
                contractConfig.privateMethods.forEach((el,i)=>data[el]=res[i])
                newState = {...newState, privateMethods: data}
            });

            await Promise.all(
                contractConfig.publicMethods.map(async el=>(
                    await contract.methods[el]().call()
                ))
            ).then(res=>{
                const data: any = {};
                contractConfig.publicMethods.forEach(
                    (el,i)=>data[el]=res[i])
                newState = {...newState, publicMethods: data}
            });
            setCurrentContract(c=>({...c,...newState}));
        } catch (e){
            console.log(e);
            setContractModalError('Contract not available')
        }
    },[address])

    const mint = useCallback(async (value: number)=>{
        console.log(mint);
        // setIsLoading(true);
        // await contract?.methods?.mint(value)
        //     .send({from: address, value: value * mintData?.cost})
        //     .on('receipt', function(receipt:any){
        //         getContractData(contract).then()
        //         setIsLoading(false);
        //     })
        //     .on('error', function(error: any, receipt: any) {
        //         if(error.code && error.code===4001){
        //             setContractModalError('User denied transaction signature.')
        //         } else {
        //             setContractModalError('Contract connection error')
        //         }
        //         setIsLoading(false);
        //     });
    },[])


    useEffect(()=>{
        if(web3Provider && address && isEnable){
            const contract = new web3Provider.eth.Contract(contractConfig.abi,contractConfig.address);
            getContractData(contract).then();
        } else {
            setCurrentContract(initialState)
        }
    },[web3Provider,address,isEnable,getContractData]);

    return {
        currentContract,
        contractModalError,
        setContractModalError,
        isLoading,
        mint
    };
}
