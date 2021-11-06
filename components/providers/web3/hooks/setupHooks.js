import {handler as createAccountHook} from "./useAccount";
import {handler as createNetworkHook} from "./useNetwork";
import {handler as createOwnedCoursesHook} from "./useOwnedCourses";
import {handler as createOwnedCourseHook} from "./useOwnedCourse";
import {handler as createdManageCoursesHook} from "./useManageCourses";

//should only setup once or twice
export const setupHooks = ({web3, provider, contract}) => {
    //console.log("Setting up hooks");
    return {
        useAccount:createAccountHook(web3,provider), //setup the hooks with web3 so setup once only?
        useNetwork: createNetworkHook(web3),
        useOwnedCourses: createOwnedCoursesHook(web3,contract),
        useOwnedCourse: createOwnedCourseHook(web3,contract),
        useManageCourses: createdManageCoursesHook(web3,contract)

    }
}
