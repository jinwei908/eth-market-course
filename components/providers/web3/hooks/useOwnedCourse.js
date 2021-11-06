import useSWR from "swr";
import { createCourseHash } from "utils/hash";
import { normalizeOwnedCourse } from "utils/normalize";


export const handler = (web3, contract) => (course,account) => {
    
    const swrRes = useSWR(() =>
        (web3 && contract && account) ? `web3/ownedCourse/${account}` : null, 
        async () => {

            //construct course hash (ID + account)
            const courseHash = createCourseHash(web3)(course.id, account);
            const ownedCourse = await contract.methods.getCourseByHash(courseHash).call() //call when you view / getter stuff. Only use send when making transaction. This will not process gas.
                console.log("dsds");
            //check if course is ours or created
            if(ownedCourse.owner === "0x0000000000000000000000000000000000000000"){ //40 characters - if not null as it will return the struct
                //push to owned courses
                return null;
            }

            return normalizeOwnedCourse(web3)(course,ownedCourse);;
        }
    )
    return swrRes

}