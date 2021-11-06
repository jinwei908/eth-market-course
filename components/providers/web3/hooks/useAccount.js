import { useEffect, useState } from "react"
import useSWR from "swr";

//swr = stale, 

const adminAddresses = {"0xe84da52ab5da5aa49dd5a94636dfebc2f41ba9539ecfe8dfd073cbf1e4b3f0b9" : true};

export const handler = (web3, provider) => () => { //function returning a function
    //const [account, setAccount] = useState(null);

    const {data, mutate, ...rest} = useSWR(() => 
        web3 != null ? "web3/accounts" : null, //null will exit, if have web3 can execute
        async () => {
            const accounts = await web3.eth.getAccounts()
            const account = accounts[0]
            if (!account){
                throw new Error("Cannot retrieve an account. Please refresh the browser.")
            }
            return account
        }
    )



    useEffect(()=>{ //listen to event initialize events
        const mutator = (accounts) => mutate(accounts[0] ?? null)
        provider?.on("accountsChanged", mutator)

        return () =>{
            provider?.removeListener("accountsChanged", mutator); //remove the listener and add new listener.
        }

    },[provider])

    return {
        data,
        isAdmin: (data && adminAddresses[web3.utils.keccak256(data)]) ?? false, //how to differentiate?
        mutate,
        ...rest
    }
}