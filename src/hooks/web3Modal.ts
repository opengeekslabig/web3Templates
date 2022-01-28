import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from 'web3modal';
import {useCallback, useEffect, useState} from "react";
import Web3 from 'web3';
import {getChainData} from "../utils/chainHelpers";
import supportedChains from "../utils/chains";

const INFURA_ID = '460f40a260564ac4a4f4b3fffb032dad';

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
    provider?: any
    web3Provider?: any
    address: string | null
    chainId?: number,
    error: string | null,
}

const initialState: StateType = {
    provider: null,
    web3Provider: null,
    address: null,
    chainId: undefined,
    error: 'Connect wallet',
}

export const useWeb3Modal = (networkId?: number) => {
    const [state, setState] = useState<StateType>(initialState);
    const { provider, web3Provider, address, chainId, error} = state;
    const [modalError, setModalError] = useState<string | null>(null);

    const connect = useCallback(async function () {
        try{
            let error = null;
            const provider = await web3Modal.connect()
            const web3Provider = new Web3(provider);
            const address = provider.selectedAddress;
            const balance = await web3Provider.eth.getBalance(address);
            const network = await web3Provider.eth.net.getId();
            if(networkId && network!==networkId){
                const chainName = supportedChains.find(el=>el.chain_id===networkId)?.name ?? 'correct';
                error = `Select ${chainName} network`;
            }

            setState({
                provider,
                web3Provider,
                address,
                chainId: network,
                error
            })
        } catch (e) {
            setModalError('Could not get a wallet connection')
            console.log("Could not get a wallet connection", e);
            return;
        }


    }, [networkId])

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

    useEffect(() => {
        if (web3Modal.cachedProvider) {
            connect().then()
        }
    }, [connect])

    useEffect(() => {
        if (provider?.on) {
            const handleAccountsChanged = (accounts: string[]) => {
                if(accounts[0]){
                    setState((s)=>({
                        ...s,
                        address: accounts[0],
                    }))
                } else {
                    disconnect().then()
                    window.location.reload()
                }
            }

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

    const chainData = getChainData(chainId);

    return {
        chainData,
        address,
        connect,
        disconnect,
        web3Provider,
        error,
        modalError,
        setModalError,
    };
};
