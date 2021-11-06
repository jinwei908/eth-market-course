// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract CourseMarketplace {
    
    // setup States*** Finite States
    enum State{
        Purchased,
        Activated,
        Deactivated 
    }

    //grouping of related variables - almost same as object in javasciprt
    struct Course {
        uint id; //32
        uint price; //32
        bytes32 proof; //string //32
        address owner; //owner of the course - user purcahsed then will be owner //20
        State state; //1
    }

    bool public isStopped = false;

    //storage - mapping of course hash to course data
    mapping(bytes32 => Course) private ownedCourses;
    //mapping of courseID to courseHash
    mapping(uint => bytes32) private ownedCourseHash;

    uint private totalOwnedCourses;

    address payable private owner; //payable address

    constructor(){ //executed during the deployment can do some initialization 
        setContractOwner(msg.sender);
    }

    //(3 slashes means error message)
    /// You already own the course!
    error CourseHasOwner();

    /// Only owner has access to this function
    error OnlyOwner();

    /// Course is in an invalid state!
    error InvalidState();

    /// Course has not been created!
    error CourseIsNotCreated();

    /// Sender is not course owner
    error SenderIsNoCourseOwner();

    modifier onlyOwner(){
        if(msg.sender != getContractOwner()){
            revert OnlyOwner();
        }
        _;
    }

    modifier onlyWhenNotStopped(){
        require(!isStopped, "Contract is currently stopped");
        _;
    }

    modifier onlyWhenStopped(){
        require(isStopped, "Contract is currently not stopped");
        _;
    }

    //if you want to receive ether
    receive() external payable {

    }

    //withdraw ether
    function withdraw(uint amount) 
        external
        onlyOwner
    {
        (bool success, ) = owner.call{value:amount}(""); // send amount to owner
        require(success, "Transfer failed");
    }

    //withdraw ether
    function emergencyWithdraw() 
        external
        onlyWhenStopped
        onlyOwner
    {
        (bool success, ) = owner.call{value: address(this).balance}(""); // send amount to owner
        require(success, "Transfer failed");
    }

    function selfDestruct()
        external
        onlyWhenStopped
        onlyOwner
    {
        selfdestruct(owner); //destroy smart contract and send the ether to owner
    }

    function stopContract() 
        external 
        onlyOwner
    {
        isStopped = true;
    }

    function resumeContract() 
        external 
        onlyOwner
    {
        isStopped = false;
    }

    function repurchaseCourse(bytes32 courseHash)
        external
        payable
        onlyWhenNotStopped
    {

        if(!isCourseCreated(courseHash)){
            revert CourseIsNotCreated();
        }

        if(!hasCourseOwnership(courseHash)){
            revert SenderIsNoCourseOwner();
        }

        Course storage course = ownedCourses[courseHash];

        if(course.state != State.Deactivated){
            revert InvalidState();
        }

        course.state = State.Purchased;
        course.price = msg.value;

    }

    function activateCourse (bytes32 courseHash)
        external
        onlyWhenNotStopped
        onlyOwner
    {

        if(!isCourseCreated(courseHash)){
            revert CourseIsNotCreated();
        }

        Course storage course = ownedCourses[courseHash]; //if use storage, can manupulate course data. memory is only for viewing / readying

        if(course.state != State.Purchased){
            revert InvalidState();
        }

        course.state = State.Activated;
    }

    function deactivateCourse (bytes32 courseHash)
        external
        onlyWhenNotStopped
        onlyOwner
    {

        if(!isCourseCreated(courseHash)){
            revert CourseIsNotCreated();
        }

        Course storage course = ownedCourses[courseHash]; //if use storage, can manupulate course data. memory is only for viewing / readying

        if(course.state != State.Purchased){
            revert InvalidState();
        }

        (bool success, ) = course.owner.call{value: course.price}(""); //??? transfer the eth back to the owner
        require(success, "Deactivation refund failed"); //must be successful
        //send back eth

        course.state = State.Deactivated;
        course.price = 0;
    }

    function transferOwnership(address newOwner)
        external
        onlyOwner()
    {
        setContractOwner(newOwner);
    }

    function purchaseCourse (
        bytes16 courseId, //hexadecimal
        bytes32 proof //from frontend
    ) 
        external 
        payable
        onlyWhenNotStopped
    {
        //e.g.
        //courseID = 10, hex will be 0x00000000000000000000000000003130
        //msg.sender 

        //construct course hash, hash of the course to store in the mapping
        //course hash map to actual course data
        bytes32 courseHash = keccak256(abi.encodePacked(courseId, msg.sender)); //abi is global function same with keccak, want to hash multiple values for encodePacked (hash id and sender together)

        if(hasCourseOwnership(courseHash)){
            revert CourseHasOwner();
        }

        uint id = totalOwnedCourses++;
        ownedCourseHash[id] = courseHash; //mapping id to course hash
        ownedCourses[courseHash] = Course({
            id: id,
            price: msg.value,
            proof: proof,
            owner: msg.sender,
            state: State.Purchased
        });
    }

    function getCourseCount() 
        external
        view
        returns(uint)   
    {
        return totalOwnedCourses;
    }

    function getCourseHashAtIndex(uint index)
        external
        view
        returns (bytes32)
    {
        return ownedCourseHash[index];
    }

    function getCourseByHash(bytes32 courseHash)
        external
        view
        returns (Course memory)
    { //when its a struck or array, its in memory
        return ownedCourses[courseHash];
    }

    function getContractOwner()
        public
        view
        returns (address)
    {
        return owner;
    }

    function setContractOwner(address newOwner)
        private
    {
        owner=payable(newOwner);
    }

    function isCourseCreated(bytes32 courseHash)
        private
        view
        returns (bool)
    {
        return ownedCourses[courseHash].owner != 0x0000000000000000000000000000000000000000;
    }

    function hasCourseOwnership (bytes32 courseHash)
        private
        view
        returns (bool)
    {
        return ownedCourses[courseHash].owner == msg.sender; //if same as user - means they already have this course so cannot repurchase
   }



}