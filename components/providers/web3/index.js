const { createContext, useContext, useEffect, useState, useMemo } = require("react");
import detectEthereumProvider from "@metamask/detect-provider";
import { loadContract } from "utils/loadContracts";
import Web3 from "web3";
import { setupHooks } from "./hooks/setupHooks";

const Web3Context = createContext(null); //initial value: inject this in

const setListeners = (provider) => {
    provider.on("chainChanged", _ => window.location.reload());
}

const createWeb3State = ({web3=null, provider=null, contract=null, isLoading=true}) => {
    return {
        web3,
        provider,
        contract,
        isWeb3Loaded:false,
        isLoading,
        hooks: setupHooks({web3, provider, contract})
    }
}

//must use the component.layout method (find out why)
export default function Web3Provider({children}) { //passing value to all children

    const [web3Api, setWeb3Api] = useState(createWeb3State({}));

    useEffect(()=>{
        const loadProvider = async() =>{
            const provider = await detectEthereumProvider();
            if(provider){
                const web3 = new Web3(provider);
                const contract = await loadContract("CourseMarketplace", web3); //get the contract
                setListeners(provider);
                setWeb3Api(createWeb3State({
                    web3,
                    provider,
                    contract,
                    isLoading:false,
                    hooks: setupHooks({web3, provider, contract})
                }));
            }else{
                setWeb3Api(api => ({ ...api,
                    isLoading:false
                }));
                console.error("Please install Metamask");
            }
        }
        loadProvider();
    },[]);

    const _web3Api = useMemo(()=>{ //abit like useEffect return a new state for _web3Api to extent a few functions
        const {web3, provider, isLoading} = web3Api;
        return{
            ...web3Api,
            requireInstall: !isLoading && !web3,
            connect: provider ? 
                async () => {
                    try{ //connect can fail too.. so try and catch
                        console.log("test");
                        await provider.request({method:"eth_requestAccounts"}) 
                        //opens metamask for us
                    } catch {
                        location.reload();
                    }
                 } : () => console.error("Cannot connect to Metamask, try to reload your browser please.")
        }
    },[web3Api])

    //can render everything, so this is a wrapper
    //web3Api will be consumed by all children components
    return (
        <Web3Context.Provider value={_web3Api}>
            {children}
        </Web3Context.Provider>
    )
}

export function useWeb3(){
    return useContext(Web3Context); //can consume the context
}

export function useHooks(cb){
    const {hooks} = useWeb3();
    return cb(hooks);
}