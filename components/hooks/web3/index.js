import { useHooks } from "@components/providers/web3";
import { useEffect } from "react";
import { useWeb3 } from "@components/providers"
import { useRouter } from "next/router";

const _isEmpty = data => {
    return (
        data == null ||
        data == "" ||
        (Array.isArray(data) && data.length === 0) ||
        (Object.keys(data).length===0 && data.constructor === Object)
    )
}

const enhanceHook = (swrRes) => { //get data and mutate them wrapper

    const {data, error} = swrRes
    const hasInit = !!(data || error)
    const isEmpty = hasInit && _isEmpty(data); //if data is empty but has already initialized.

    return {
        ...swrRes,
        isEmpty,
        hasInitialized: hasInit
    }
}

export const useAccount = () => {
    const swrRes = enhanceHook(useHooks(hooks=>hooks.useAccount)());
    return {
        account: swrRes
    }
}

export const useAdmin = ({redirectTo}) => {  
    const { account } = useAccount();
    const { requireInstall } = useWeb3();
    const router  = useRouter();
    useEffect(()=>{
        if(
            (requireInstall || account.hasInitialized && !account.isAdmin) ||
            account.isEmpty
        ){
            router.push(redirectTo);
        }
    },[account])

    return { account }
}

export const useNetwork = () => {
    const swrRes = enhanceHook(useHooks(hooks=>hooks.useNetwork)());
    return {
        network: swrRes
    }
}

export const useManageCourses = (...args) => {
    const swrRes = enhanceHook(useHooks(hooks => hooks.useManageCourses)(...args));
    return {
        manageCourses:swrRes
    }
}

export const useOwnedCourses = (...args) => {
    const swrRes = enhanceHook(useHooks(hooks => hooks.useOwnedCourses)(...args));
    return {
        ownedCourses:swrRes
    }
}

export const useOwnedCourse = (...args) => {
    const swrRes = enhanceHook(useHooks(hooks => hooks.useOwnedCourse)(...args));
    return {
        ownedCourse:swrRes
    }
}

//combined hook
export const useWalletInfo = () => {
    const {account } = useAccount()
    const {network} = useNetwork()

    const isConnecting = !account.hasInitialized && !network.hasInitialized
    const hasConnectedWallet = !!(account.data && network.isSupported) //if you wanna get the actual boolean then put !! there, if not sometimes might be undefined

    return {
        account,
        network,
        isConnecting,
        hasConnectedWallet
    }
}