import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from 'web3modal';
import {useCallback, useEffect, useState} from "react";
import {providers} from "ethers";
import {getChainData} from "../utils/chainHelpers";

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
    provider?: any
    web3Provider?: any
    address?: string | null
    chainId?: number
}

const initialState: StateType = {
    provider: null,
    web3Provider: null,
    address: null,
    chainId: undefined,
}

export function useWeb3Modal () {
    const [state, setState] = useState<StateType>(initialState);
    const { provider, web3Provider, address, chainId } = state;

    const connect = useCallback(async function () {
        // This is the initial `provider` that is returned when
        // using web3Modal to connect. Can be MetaMask or WalletConnect.
        const provider = await web3Modal.connect()

        // We plug the initial `provider` into ethers.js and get back
        // a Web3Provider. This will add on methods from ethers.js and
        // event listeners such as `.on()` will be different.
        const web3Provider = new providers.Web3Provider(provider)

        const signer = web3Provider.getSigner()
        const address = await signer.getAddress()

        const network = await web3Provider.getNetwork()

        setState({
            provider,
            web3Provider,
            address,
            chainId: network.chainId,
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

    // useEffect(()=>{
    //     if (typeof window !== 'undefined') {
    //         setWeb3Modal(new Web3Modal({
    //             network: 'mainnet', // optional
    //             cacheProvider: true,
    //             providerOptions, // required
    //         }))
    //     }
    // },[])

    useEffect(() => {
        if (web3Modal.cachedProvider) {
            connect().then()
        }
    }, [connect])

    useEffect(() => {
        if (provider?.on) {
            const handleAccountsChanged = (accounts: string[]) => {
                // eslint-disable-next-line no-console
                console.log('accountsChanged', accounts)
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
                // eslint-disable-next-line no-console
                console.log('disconnect', error)
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
      disconnect
  };
};
