import { useAdmin, useManageCourses } from "@components/hooks/web3";
import { useWeb3 } from "@components/providers";
import { Button, Message } from "@components/ui/common";
import { CourseFilter, ManageCourseCard, OwnedCourseCard } from "@components/ui/course";
import { BaseLayout } from "@components/ui/layout";
import { MarketHeader } from "@components/ui/marketplace";
import { withToast } from "@utils/toast";
import { useEffect, useState } from "react";
import { normalizeOwnedCourse } from "utils/normalize";

const VerificationInput = ({onVerify}) => {
  
  const [email, setEmail] = useState("");

  return (
    <div className="flex mr-2 relative rounded-md">
      <input
        value={email}
        onChange={({target: {value}})=>setEmail(value)}
        type="text"
        name="account"
        id="account"
        className="w-96 focus:ring-indigo-500 shadow-md focus:border-indigo-500 block pl-7 p-4 sm:text-sm border-gray-300 rounded-md"
        placeholder="0x2341ab..." />
      <Button
        onClick={ () => {
          onVerify(email);
        }}>
        Verify
      </Button>
    </div>
  )
}

export default function ManageCourses() {

  
  const [proofedOwnership, setProofedOwnership] = useState({});
  const [ searchedCourse, setSearchedCourse ] = useState(null);
  const [ filters, setFilters ] = useState({state:"All"});
  const { account } = useAdmin({redirectTo: "/marketplace"}); //if its not admin or never init, straight away redirect to somewhere.
  const { web3, contract } = useWeb3();
  const { manageCourses } = useManageCourses(web3,account);

  const verifyCourse = (email, {hash, proof}) => {
    if(!email) {
      return;
    }
    //store the email in the state
    const emailHash = web3.utils.sha3(email)
    const providedProof = web3.utils.soliditySha3(
      { type: "bytes32", value: emailHash },
      { type: "bytes32", value: hash }
    )
    setProofedOwnership({
      ...proofedOwnership,
      [hash]:(providedProof === proof)
    })
  }

  const changeCourseState = async (courseHash, method) => {
    try {
      const result = await contract.methods[method](courseHash).send({from:account.data}); //lower fees to activate
      return result;
    } catch (error){
      throw new Error(error.message);
    } finally {
      manageCourses.mutate();
    }
  }

  const activateCourse = async (courseHash) => {
    withToast(changeCourseState(courseHash, "activateCourse"));
  }

  const deactivateCourse = async (courseHash) => {
    withToast(changeCourseState(courseHash, "deactivateCourse"));
  }

  const searchCourse = async (hash) => {

    const re = /[0-9A-Fa-f]{6}/g;

    if(hash && hash.length === 66 && re.test(hash)) {
        //search for course
        const course = await contract.methods.getCourseByHash(hash).call();
        if(course.owner !== "0x0000000000000000000000000000000000000000"){ //if course owner is not empty
          //normalize course first
          const normalized = normalizeOwnedCourse(web3)({hash}, course);
          setSearchedCourse(normalized);
          return;
        }
    }
    setSearchedCourse(null);
  }

 

  const renderCard = (course, isSearched=false) => {
    return (
      <ManageCourseCard
        key={course.ownedCourseId}
        isSearched={isSearched}
        course={course}
      >
          <VerificationInput
          onVerify={(email)=>{
            verifyCourse(email, {hash: course.hash, proof: course.proof})
          }}
          />
          {
            proofedOwnership[course.hash] && 
            <div>
              <Message className="mt-2">
                Verified!
              </Message>
            </div>
          }
          {
            proofedOwnership[course.hash] === false && 
            <div>
              <Message type="danger"  className="mt-2">
                Wrong Proof!
              </Message>
            </div>
          }
          { course.state === "Purchased" &&
          <div>
            <Button 
              onClick={()=>activateCourse(course.hash)} 
              variant="green"
            >
              Activate
            </Button>
            <Button onClick={()=>deactivateCourse(course.hash)}  variant="red">
              Deactivate
            </Button>
          </div>
          }
      </ManageCourseCard>
    )
  }

  const filteredCourses = manageCourses.data
      ?.filter((course)=>{ ///filtering the course, course if displayed, just return true / false
        if(filters.state === "All"){ //if all just send all
          return true;
        }
        return course.state === filters.state
      })
      .map(course => renderCard(course));
    
    

  if(!account.isAdmin){
    return null;
  }

  return (
    <>
      <MarketHeader />
      <CourseFilter 
        onFilterSelect={(val)=>setFilters({state: val})}
        onSearchSubmit={searchCourse}
      />
      <section className="grid grid-cols-1">
        {
          searchedCourse &&
          //render the searched course first
          <div>
            <h1 className="text-2xl font-bold p-5">Searched Courses</h1>
            {renderCard(searchedCourse, true)}
          </div> 
        }
        <h1 className="text-2xl font-bold p-5">All Courses</h1>
        {
          filteredCourses
        }
        { filteredCourses?.length === 0 && 
          <Message type="warning">
            No courses to display
          </Message>
        }
        
      </section>
    </>
  )
}

ManageCourses.Layout = BaseLayout