import { CourseCard, CourseList } from "@components/ui/course"
import { BaseLayout } from "@components/ui/layout"
import { getAllCourses } from "@content/courses/fetcher"
import { useOwnedCourses, useWalletInfo } from "@components/hooks/web3"
import { Button, Loader, Message } from "@components/ui/common"
import { OrderModal } from "@components/ui/order"
import { useState } from "react"
import { MarketHeader } from "@components/ui/marketplace"
import { useWeb3 } from "@components/providers"
import { withToast } from "@utils/toast";

export default function Marketplace({courses}) {
  const { web3, contract, requireInstall } = useWeb3()
  const { hasConnectedWallet, isConnecting, account } = useWalletInfo()
  const { ownedCourses } = useOwnedCourses(courses, account.data) //has a mutation function
  const [ isNewPurchase, setIsNewPurchase ] = useState (true);
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [ busyCourseId, setBusyCourseId ] = useState(null);

  const purchaseCourse = async (order, course) => {
    
    

    const hexCourseId = web3.utils.utf8ToHex(course.id)
    const orderHash = web3.utils.soliditySha3(
      { type: "bytes16", value: hexCourseId },
      { type: "address", value: account.data }
    )
    
    const value = web3.utils.toWei(String(order.price))

    setBusyCourseId(course.id);

    if(isNewPurchase){
      const emailHash = web3.utils.sha3(order.email)
      const proof = web3.utils.soliditySha3(
        { type: "bytes32", value: emailHash },
        { type: "bytes32", value: orderHash }
      )
      withToast(_purchaseCourse(hexCourseId, proof, value))
    } else {
      withToast(_repurchaseCourse({courseHash:orderHash, value}, course));
    }
  }

  const _purchaseCourse = async (hexCourseId, proof, value) => {
    try {
      const result = await contract.methods.purchaseCourse(
        hexCourseId,
        proof
      ).send({from: account.data, value})
      ownedCourses.mutate(); //swr function
      return result //return as resolve to the promise data.transactionHash
    } catch (error){
      throw new Error(error.message)
    } finally {
      //finally if either try or after catch
      setBusyCourseId(null);
    }
  }

  const _repurchaseCourse = async ({courseHash, value}, course) => {
    try {
      const result = await contract.methods.repurchaseCourse(
        courseHash
      ).send({from: account.data, value}) //return as resolve to the promise

      const index = ownedCourses.data.findIndex(c => c.id === course.id); //find index
      if(index >= 0){ 
        ownedCourses.data[index].state = "Purchased";
        ownedCourses.mutate(ownedCourses.data);
      } else {
        ownedCourses.mutate(); //swr function
      }

      return result
    } catch (error) {
      throw new Error(error.message)
    } finally {
      //finally if either try or after catch
      setBusyCourseId(null);
    }
  }

  const cleanupModal = () => {
    setSelectedCourse(null);
    setIsNewPurchase(true);
  }

  return (
    <>
      <MarketHeader />
      <CourseList
        courses={courses}
      >
      {course => {

        const owned = ownedCourses.lookup[course.id] //if null or not

        return (
          <CourseCard
            key={course.id}
            course={course}
            state={owned?.state}
            disabled={!hasConnectedWallet}
            Footer={() => {
              if (requireInstall) {
                return (
                  <Button
                    size="sm"
                    disabled={true}
                    variant="lightPurple">
                    Install
                  </Button>
                )
              }

              if (isConnecting) {
                return (
                  <Button
                    size="sm"
                    disabled={true}
                    variant="lightPurple">
                    <Loader size="sm" />
                  </Button>
                )
              }

              if (!ownedCourses.hasInitialized) {
                return (
                  <Button variant="white" size="sm" disabled={true}>
                    {hasConnectedWallet ? "Resolving State" : "Connect"}
                  </Button>
                )
              }

              
              const isBusy = busyCourseId === course.id;
              if (owned) {
                return (
                  <>
                  <div className="flex">
                      <Button
                        size="sm"
                        disabled={true}
                        variant="white">
                        Yours &#10003;
                      </Button>
                      {owned.state === "Deactivated" &&
                        <div className="ml-1">
                          <Button
                            size="sm"
                            disabled={isBusy}
                            onClick={()=>{ 
                              setIsNewPurchase(false)
                              setSelectedCourse(course);
                            }}
                            variant="purple">
                            {
                              isBusy ? 
                              <div className="flex">
                                <Loader size="sm"/>
                                <div className="ml-2">In progress</div>
                              </div> :
                              <div>
                                Funds to Activate
                              </div>
                            }
                          </Button>
                        </div>
                      }
                    </div>
                    
                  </>
                )
              }


              return (
                <Button
                  onClick={() => {setSelectedCourse(course)
                    setIsNewPurchase(true)}}
                  disabled={!hasConnectedWallet || isBusy}
                  variant="lightPurple">
                  {
                    isBusy ? 
                    <div className="flex">
                      <Loader size="sm"/>
                      <div className="ml-2">In progress</div>
                    </div> :
                    <div>
                      Purchase
                    </div>
                  }
                </Button>
              )}
            }
          />
        )}
      }
      </CourseList>
      { selectedCourse &&
        <OrderModal
          course={selectedCourse}
          onSubmit={(formData,course)=>{
            purchaseCourse(formData,course);
            cleanupModal();
          }}
          isNewPurchase={isNewPurchase}
          onClose={
            cleanupModal
          }
        />
      }
    </>
  )
}

export function getStaticProps() {
  const { data } = getAllCourses()
  return {
    props: {
      courses: data
    }
  }
}

Marketplace.Layout = BaseLayout