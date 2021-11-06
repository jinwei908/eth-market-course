import useSWR from "swr";
import { createCourseHash } from "utils/hash";
import { normalizeOwnedCourse } from "utils/normalize";


export const handler = (web3, contract) => (courses, account) => {
    
    const swrRes = useSWR(() =>
        (web3 && contract && account) ? `web3/ownedCourses/${account}` : null, 
        async () => {
            const ownedCourses = [];
            for (let i=0; i<courses.length; i++){
                const course = courses[i];
                if(!course.id) {
                    continue
                };
                //construct course hash (ID + account)
                const courseHash = createCourseHash(web3)(course.id, account);
                
                const ownedCourse = await contract.methods.getCourseByHash(courseHash).call() //call when you view / getter stuff. Only use send when making transaction. This will not process gas.
                    console.log("dsds");
                //check if course is ours or created
                if(ownedCourse.owner !== "0x0000000000000000000000000000000000000000"){ //40 characters - if not null as it will return the struct
                    //push to owned courses
                    const normalized = normalizeOwnedCourse(web3)(course,ownedCourse);
                    ownedCourses.push(normalized);
                }
            }
            return ownedCourses;
        }
    )
    return {
        ...swrRes,
        lookup: swrRes.data?.reduce((a, c)=>{
            a[c.id] = c
            return a
        }, {}) ?? {}
    }

}