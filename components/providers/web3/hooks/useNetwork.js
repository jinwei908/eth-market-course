import { useEffect } from "react"
import useSWR from "swr"

const NETWORKS = {
    1: "Ethereum Main Network",
    3: "Ropsten Test Network",
    4: "Rinkeby Test Network",
    5: "Goerli Test Network",
    42: "Kovan Test Network",
    56: "Binance Smart Chain",
    1337: "Ganache",
}

const targetNetwork = NETWORKS[process.env.NEXT_PUBLIC_TARGET_CHAIN_ID]; //depending on the environment

export const handler = (web3) => () => { //function returning a function

    const {data, ...rest} = useSWR(() => 
        web3 ? "web3/network" : null,
        async () => {
            const chainId = await web3.eth.getChainId() //get the connected network

            if(!chainId){
                throw new Error("Cannot retrieve a network. Please refresh the browser");
            }

            return NETWORKS[chainId] //to data
        }
    )

    return {
        data,
        target:targetNetwork,
        isSupported: data === targetNetwork, //find out if the data is connected to the target network
        ...rest
    }
}