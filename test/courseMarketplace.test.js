
const {catchRevert} = require("./utils/exceptions");

const CourseMarketplace = artifacts.require("CourseMarketplace");

//Mocha - testing framework!
//Chai - assertion JS library

const getBalance = async (_buyer) => {
    return web3.eth.getBalance(_buyer);
}

const toBN = (value)=>{
    return web3.utils.toBN(value);
}

const getGas = async (result) => {
    const tx = await web3.eth.getTransaction(result.tx); //hash of transaction
    const gasUsed = toBN(result.receipt.gasUsed); //receipt actual units of gas
    const gasPrice = toBN(tx.gasPrice); //per unit of gas
    const gas = gasUsed.mul(gasPrice) //multiply
    return gas;
}

contract("CourseMarketplace", accounts => {

    let _contract = null
    let contractOwner = null
    let buyer = null
    let courseHash = null

    const courseId = "0x00000000000000000000000000003130"; //0x00000000000000000000000000003130
    const proof = "0x0000000000000000000000000000313000000000000000000000000000003130";
    const courseId2 = "0x00000000000000000000000000002130"; //0x00000000000000000000000000003130
    const proof2 = "0x0000000000000000000000000000213000000000000000000000000000002130";
    const value = "900000000";

    //encapsulated env for contract
    before(async ()=>{
        //make one test
        _contract = await CourseMarketplace.deployed();
        contractOwner = accounts[0];
        buyer = accounts[1];
    })

    //make one test describe = wrap some feature to test
    describe("Purchase the new course", () => {
        //before a test
        before(async () => {
            //action, then check values at the bottom for the unit testing.  Change state
            await _contract.purchaseCourse(courseId, proof, {from:buyer, value})
        })

        it("should NOT allow to repurchase course by same buyer", async()=>{
            await catchRevert(_contract.purchaseCourse(courseId, proof, {from:buyer, value}))
        })

        //the test itself
        it("can get the purchased course by Index  ", async ()=>{
            const index = 0;
            courseHash = await _contract.getCourseHashAtIndex(index);
            const expectedHash = web3.utils.soliditySha3(
                { type:"bytes16", value:courseId },
                { type:"address", value: buyer }
            )
            assert.equal(courseHash, expectedHash, "Course hash is not matching the hash of purchased course") //if null or undefined test will not pass
        })

        it("should match the purchased data of the course purchased by buyer", async()=>{
            const expectedIndex = 0;
            const expectedState = 0; //expected state
            const course = await _contract.getCourseByHash(courseHash);

            assert.equal(course.id, expectedIndex, "Course index should be 0");
            assert.equal(course.price, value, `Course price should be ${value}!`);
            assert.equal(course.proof, proof, `Course proof should be ${proof}!`);
            assert.equal(course.owner, buyer, `Course buyer should be ${buyer}`);
            assert.equal(course.state, expectedState, `Course state should be ${expectedState}`);

        })
    })

    //another test - activating course
    describe("Activate the purchased course", ()=>{

        it("should not be able activate by not admin / not contract owner", async () => {
            //there should be a revert, if not error
            await catchRevert(_contract.activateCourse(courseHash, {from: buyer}));
        })

        it("should have 'activated' state", async () => {
            await _contract.activateCourse(courseHash, {from: contractOwner});
            const course = await _contract.getCourseByHash(courseHash)
            const expectedState = 1;

            assert.equal(course.state, expectedState, `Course state sould be ${expectedState}`);
        })
    })

    describe("Transfer ownership", ()=>{
        let currentOwner = null
        before(async () => {
            //get current contract owner
            currentOwner = await _contract.getContractOwner()
        })

        it("getContractOwner should return deployer address", async () => {
            //there should be a revert, if not error
            assert.equal(currentOwner, contractOwner, "Contract owner is not matching with getContractOwner function");
        })

        //test transfer ownership from wrong account
        it("should not be able transfer ownership by not admin / not contract owner", async () => {
            //there should be a revert, if not error
            await catchRevert(_contract.transferOwnership(buyer, {from: buyer}));
        })

        //test transfer ownership
        it("should transfer ownership to new address", async () => {
            //there should be a revert, if not error
            await _contract.transferOwnership(buyer, {from: contractOwner});
            expectedAccount = buyer;
            changedOwner = await _contract.getContractOwner();
            assert.equal(changedOwner, expectedAccount, "owner is not set correctly from the function")
        })

        //test transfer ownership back to initial contract owner
        it("should transfer ownership to original contract owner", async () => {
            //there should be a revert, if not error
            await _contract.transferOwnership(contractOwner, {from: buyer});
            expectedAccount = contractOwner;
            changedOwner = await _contract.getContractOwner();
            assert.equal(changedOwner, expectedAccount, "owner is not set correctly from the function")
        })
        
    })

    describe("Deactivate course", ()=>{
        let courseHash2 = null;

        before(async()=>{
            await _contract.purchaseCourse(courseId2, proof2, {from: buyer, value});
            courseHash2 = await _contract.getCourseHashAtIndex(1);
        })

        it("should not be able to deactivate the course by not admin / not contract owner", async()=>{
            await catchRevert(_contract.deactivateCourse(courseHash2, {from:buyer}));
        })

        it("should be able to deactivate the course by admin / contract owner", async()=>{
            const beforeTxContractBalance = await getBalance(_contract.address); //getting balance of the address
            const currentCourseBeforeDeactivate = await _contract.getCourseByHash(courseHash2);
            await _contract.deactivateCourse(courseHash2, {from:contractOwner})
            const afterTxContractBalance = await getBalance(_contract.address); //getting balance of the address
            const currentCourse = await _contract.getCourseByHash(courseHash2);
            const expectedState = 2;
            const expectedPrice = 0;
            
            
            assert.equal(currentCourse.state, expectedState, "Wrong state after deactivation");
            assert.equal(currentCourse.price, expectedPrice, "Course price is not 0!");
            assert.equal(toBN(beforeTxContractBalance).sub(toBN(currentCourseBeforeDeactivate.price)).toString(), afterTxContractBalance, "Contract balance is not correct!");
        })

        it("should not be able to activate in a deactivated state", async()=>{
            await catchRevert(_contract.activateCourse(courseHash2, {from:contractOwner}));
        })


    })

    describe("Repurchase Course", () => {
        //before a test
        before(async()=>{
            courseHash2 = await _contract.getCourseHashAtIndex(1);
        })

        it("should NOT repurchase when the course doesn't exist", async()=>{
            const notExistingHash = "0x00000000000000000000000000003131"
            await catchRevert(_contract.repurchaseCourse(notExistingHash, {from:buyer}))
        })

        //the test itself
        it("Should NOT repurcahse with NOT course owner  ", async ()=>{
            const notOwnerAddress = accounts[2]
            await catchRevert(_contract.repurchaseCourse(courseHash2, {from:notOwnerAddress}))
        })

        it("should be able to repurchase with the original buyer", async()=>{
            const beforeTxBuyerBalance = await getBalance(buyer); //getting balance of the address
            const beforeTxContractBalance = await getBalance(_contract.address); //getting balance of the address
            const result = await _contract.repurchaseCourse(courseHash2, {from:buyer, value})
            const afterTxBuyerBalance = await getBalance(buyer); //getting balance of the address
            const afterTxContractBalance = await getBalance(_contract.address); //getting balance of the address

            const gas = await getGas(result) 

            const currentCourse = await _contract.getCourseByHash(courseHash2);
            const expectedState = 0;
            const expectedPrice = value;
            
            
            assert.equal(currentCourse.state, expectedState, "The course is not in purchased state");
            assert.equal(currentCourse.price, expectedPrice, `Course price is not equal to ${value}`);
            //whenever working with numbers in ETH, it will be Huge, use web3.utils.toBN
            assert.equal(toBN(beforeTxBuyerBalance).sub(gas).sub(toBN(value)).toString(), afterTxBuyerBalance, "Client balance is not correct!")
            assert.equal(toBN(beforeTxContractBalance).add(toBN(value)).toString(), afterTxContractBalance, "Contract balance is not correct!");

        })

        //the test itself
        it("Should NOT be able to Repurchase purchased course", async ()=>{
            await catchRevert(_contract.repurchaseCourse(courseHash2, {from:buyer}))
        })
    })

    describe("Receive Funds", ()=>{

        it("Should transacted funds", async()=>{
            const value = "100000000000000000";
            const contractBeforeTx = await getBalance(_contract.address);
            //make a transaction
            await web3.eth.sendTransaction({
                from: buyer,
                to: _contract.address,
                value
            })
            const contractAfterTx = await getBalance(_contract.address);

            assert.equal((toBN(contractBeforeTx).add(toBN(value))).toString(), contractAfterTx, "Value after transaction is not matching")
        })
        
    })

    describe("Normal withdrawal", ()=>{
        const fundsToDeposit = "100000000000000000";
        const overLimitFunds = "990000000000000000000";
        let currentOwner = null;

        before(async ()=>{ //send transaction before
            await web3.eth.sendTransaction({
                from: buyer,
                to: _contract.address,
                value: fundsToDeposit
            })
            currentOwner = await _contract.getContractOwner();
        })

        it("Should fail when withdrawing with not owner address", async() =>{
            const value = "10000000000000000";
            await catchRevert(_contract.withdraw(value,{from:buyer}));
        })

        it("Should fail when withdrawing over limit balances", async() =>{
            await catchRevert(_contract.withdraw(overLimitFunds,{from:currentOwner}));
        })

        it("should have +0.1 eth balance after withdrawal", async() =>{
            const contractOwnerBalance = await getBalance(currentOwner);
            const result = await _contract.withdraw(fundsToDeposit,{from:currentOwner});
            const newOwnerBalance = await getBalance(currentOwner);
            const gas = await getGas(result); //minus gas

            assert.equal(toBN(contractOwnerBalance).add(toBN(fundsToDeposit).sub(gas)).toString(),newOwnerBalance,"The new owner balance is not correct");
        })
    })

    describe("Emergency Withdrawal", ()=>{
        let currentOwner = null;

        before(async()=>{
            currentOwner = await _contract.getContractOwner();
        })

        //clean up
        after(async()=>{
            await _contract.resumeContract({from:currentOwner});
        })

        it("should fail when contract is not stopped", async() =>{
            await catchRevert(_contract.emergencyWithdraw({from: currentOwner}));
        })

        it("should have +contract funds on contract owner", async() =>{
            await _contract.stopContract({from: currentOwner});
            const beforeContractFunds = await getBalance(_contract.address);
            const beforeOwnerBalance = await getBalance(currentOwner);

            const result = await _contract.emergencyWithdraw({from: currentOwner});

            const gas = await getGas(result);
            const newOwnerBalance = await getBalance(currentOwner);

            //assert contract funds
            assert.equal(toBN(beforeOwnerBalance).add(toBN(beforeContractFunds)).sub(gas).toString(), newOwnerBalance, "Owner does not have contract balance.");

        })

        it("should have contract balance of 0", async() => {
            const contractFunds = await getBalance(_contract.address);
            assert.equal(contractFunds, "0", "Contract balance should be 0")
        })
    })

    describe("Self Destruct", ()=>{
        let currentOwner = null;

        before(async()=>{
            currentOwner = await _contract.getContractOwner();
        })

        it("should fail when contract is not stopped", async() =>{
            await catchRevert(_contract.selfDestruct({from: currentOwner}));
        })

        it("should fail when called from NOT owner", async() =>{
            await catchRevert(_contract.selfDestruct({from: buyer}));
        })

        it("should have +contract funds on contract owner after self destruct", async() =>{
            await _contract.stopContract({from: currentOwner});
            const beforeContractFunds = await getBalance(_contract.address);
            const beforeOwnerBalance = await getBalance(currentOwner);

            const result = await _contract.selfDestruct({from: currentOwner});

            const gas = await getGas(result);
            const newOwnerBalance = await getBalance(currentOwner);

            //assert contract funds
            assert.equal(toBN(beforeOwnerBalance).add(toBN(beforeContractFunds)).sub(gas).toString(), newOwnerBalance, "Owner does not have contract balance after self destruct.");

        })

        it("should have contract balance of 0", async() => {
            const contractFunds = await getBalance(_contract.address);
            assert.equal(contractFunds, "0", "Contract balance should be 0")
        })

        it("should have 0x byte code on contract confirmed destroyed", async() => {
            const code = await web3.eth.getCode(_contract.address);
            assert.equal(code, "0x", "Contract not destroyed")
        })
    })
    

}) //get all accounts