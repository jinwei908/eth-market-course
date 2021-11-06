import useSWR from "swr";
import { normalizeOwnedCourse } from "utils/normalize";


export const handler = (web3, contract) => (courses,account) => {
    
    const swrRes = useSWR(() =>
        (web3 && contract && account.data && account.isAdmin) ? `web3/manageCourses/${account.data}` : null, //check if account is admin
        async () => {
            const courses = []

            const courseCount = await contract.methods.getCourseCount().call();
            for(let i=Number(courseCount)-1; i>=0; i--){
                const courseHash = await contract.methods.getCourseHashAtIndex(i).call();
                const course = await contract.methods.getCourseByHash(courseHash).call();
                if(course){
                    courses.push(normalizeOwnedCourse(web3)({hash: courseHash}, course))
                }
            }
            return courses
        }
    )
    return swrRes

}