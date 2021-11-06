
export const COURSE_STATES = {
    0: "Purchased",
    1: "Activated",
    2: "Deactivated"
}

export const normalizeOwnedCourse = web3 => (course, ownedCourse) => {
    return {
        ...course, //put in course and add in new ones
        ownedCourseId: ownedCourse.id,
        proof: ownedCourse.proof,
        owner: ownedCourse.owner,
        price: web3.utils.fromWei(ownedCourse.price),
        state: COURSE_STATES[ownedCourse.state]
    }
}