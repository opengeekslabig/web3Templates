import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from 'web3modal';
import {useCallback, useEffect, useState} from "react";
import {providers, utils} from "ethers";
import {getChainData} from "../utils/chainHelpers";
import {contractConfig} from "../config/const";
import Web3 from 'web3'

const INFURA_ID = '460f40a260564ac4a4f4b3fffb032dad'

const providerOptions = {
    walletconnect: {
        package: WalletConnectProvider, // required
        options: {
            infuraId: INFURA_ID, // required
        },
    },
}

let web3Modal: any;
if (typeof window !== 'undefined') {
    web3Modal = new Web3Modal({
        network: 'mainnet', // optional
        cacheProvider: true,
        providerOptions, // required
    })
}

type StateType = {
    signer: any,
    provider?: any,
    web3Provider?: any,
    address?: string | null,
    chainId?: number,
    error: string | null,
    web3: any,
}

const initialState: StateType = {
    signer: null,
    provider: null,
    web3Provider: null,
    address: null,
    chainId: undefined,
    error: 'connect your wallet',
    web3: null
}

interface IContractState {
    contract: any;
    privateMethods: any | null;
    publicMethods: any | null;
}

export function useWeb3Modal () {
    const [state, setState] = useState<StateType>(initialState);
    const [mintData, setMintData] = useState<any>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentContract, setCurrentContract] = useState<IContractState>({
        contract: null,
        privateMethods: null,
        publicMethods: null,
    });
    const { provider, address, chainId ,error } = state;

    const connect = useCallback(async function () {

        let error = null;
        const provider = await web3Modal.connect()
        const web3Provider = new providers.Web3Provider(provider)
        const web3 = new Web3(provider);
        if(!web3Provider) error = 'wallet connect error';

        const signer = web3Provider.getSigner()
        const address = await signer.getAddress()

        const network = await web3Provider.getNetwork()
        if(network.chainId!==contractConfig.chainId) error = 'select Ethereum network';

        setState({
            signer,
            provider,
            web3Provider,
            address,
            chainId: network.chainId,
            error,
            web3
        })

    }, [])

    const disconnect = useCallback(
        async function () {
            await web3Modal.clearCachedProvider()
            if (provider?.disconnect && typeof provider.disconnect === 'function') {
                await provider.disconnect()
            }
       setState(initialState)
        },
        [provider]
    )

    const getContractData = useCallback(async (contract:any) =>{
        let newState: any = {contract};
        try{
            await Promise.all(
                contractConfig.privateMethods.map(async el=>(
                    await contract.methods[el](address).call()
                ))
            ).then(res=>{
                const data: any = {};
                contractConfig.privateMethods.forEach((el,i)=>data[el]=res[i]._isBigNumber ?
                    Number(utils.formatUnits(res[i],0)) :
                    res[i])
                newState = {...newState, privateMethods: data}
            });

            await Promise.all(
                contractConfig.publicMethods.map(async el=>(
                    await contract.methods[el]().call()
                ))
            ).then(res=>{
                const data: any = {};
                contractConfig.publicMethods.forEach(
                    (el,i)=>data[el]=res[i]._isBigNumber ?
                        Number(utils.formatUnits(res[i],0)) :
                        res[i])
                newState = {...newState, publicMethods: data}
            });
            setCurrentContract({...currentContract,...newState});
        } catch (e){
            console.log(e);
            setState({...state, error: 'contract not available'})
        }
    },[address])

    const getContract = useCallback(async () =>{
        if(state.web3){
            const contract = new state.web3.eth.Contract(contractConfig.abi,contractConfig.address);
            await getContractData(contract);
        }
    },[state.web3])

    useEffect(()=>{
        if(state.web3Provider && state.address && !error){
            getContract().then()
        }
    },[state.web3Provider,state.address,getContract,error]);

    useEffect(()=>{
        if(currentContract.publicMethods){
            const now = (Date.now()/1000).toFixed(0);
            if(currentContract.publicMethods?.paused){
                setState({...state, error: 'contract paused'})
                return ;
            }
            if(now<currentContract.publicMethods?.preSaleStart){
                setState({...state, error: 'presale coming soon'})
                return ;
            }
            if(currentContract.publicMethods?.preSaleStart<now &&
                now<currentContract.publicMethods?.publicSaleStart){
                if(currentContract.privateMethods?.balanceOf>=currentContract.publicMethods?.maxPreSaleMintAmount){
                    setState({...state, error: 'you mint all presale nft'})
                    return ;
                }
                setMintData({
                    max:currentContract.publicMethods?.maxPreSaleMintAmount-currentContract.privateMethods?.balanceOf,
                    cost: currentContract.publicMethods?.preSaleCost,
                })
            }
            if(currentContract.publicMethods?.publicSaleStart<now){
                if(Number(currentContract.privateMethods?.balanceOf)>=Number(currentContract.publicMethods?.maxMintAmount)){
                    setState({...state, error: 'you mint all nft'})
                    return ;
                }
                setMintData({
                    max:currentContract.publicMethods?.maxMintAmount-currentContract.privateMethods?.balanceOf,
                    cost: currentContract.publicMethods?.publicSaleCost,
                })
            }
        }
    },[
        currentContract.publicMethods,
        currentContract.privateMethods?.balanceOf,
        currentContract.contract
    ])

    const Mint = async (value: number) =>{
        setIsLoading(true);
        try {
            await currentContract.contract?.methods?.mint(value)
                .send({from: address, value: value * mintData?.cost})
                .on('receipt', function(receipt:any){
                    getContractData(currentContract.contract).then()
                    setIsLoading(false);
                })
                .on('error', function(error: any, receipt: any) {
                    console.log('contract connection error');
                    setState({...state, error: 'contract not available'})
                    setIsLoading(false);
                });
        } catch {
            console.log('contract connection error');
            setState({...state, error: 'contract not available'})
            setIsLoading(false);
        }

    }

    useEffect(() => {
        if (web3Modal.cachedProvider) {
            connect().then()
        }
    }, [connect])

    useEffect(() => {
        if (provider?.on) {
            const handleAccountsChanged = (accounts: string[]) => {
                setState({
                    ...state,
                    address: accounts[0],
                })
            }

            // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes
            const handleChainChanged = (_hexChainId: string) => {
                window.location.reload()
            }

            const handleDisconnect = (error: { code: number; message: string }) => {
                disconnect().then()
            }

            provider.on('accountsChanged', handleAccountsChanged)
            provider.on('chainChanged', handleChainChanged)
            provider.on('disconnect', handleDisconnect)

            // Subscription Cleanup
            return () => {
                if (provider.removeListener) {
                    provider.removeListener('accountsChanged', handleAccountsChanged)
                    provider.removeListener('chainChanged', handleChainChanged)
                    provider.removeListener('disconnect', handleDisconnect)
                }
            }
        }
    }, [provider, disconnect])

    const chainData = getChainData(chainId)
  return {
      chainData,
      address,
      connect,
      disconnect,
      error,
      mintData,
      Mint,
      isLoading
  };
};
