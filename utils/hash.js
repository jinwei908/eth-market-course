

export const createCourseHash = web3 => (courseId, account) => { //inject dependencies then inject data
    const hexCourseID = web3.utils.utf8ToHex(courseId);
    const courseHash = web3.utils.soliditySha3(
        {type: "bytes16", value: hexCourseID},
        {type: "address", value: account}
    )
    return courseHash
}