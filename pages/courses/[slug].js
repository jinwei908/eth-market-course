import { Message, Modal } from "@components/ui/common";
import { BaseLayout } from "@components/ui/layout"
import {
  CourseHero,
  Curriculum,
  Keypoints
} from "@components/ui/course";
import { getAllCourses } from "@content/courses/fetcher";
import { useAccount, useOwnedCourse } from "@components/hooks/web3";
import { useWeb3 } from "@components/providers";

export default function Course({course}) {
  const {isLoading} = useWeb3();
  const {account} = useAccount();
  const {ownedCourse} = useOwnedCourse(course,account.data);
  const courseState = ownedCourse.data?.state //if data is undefined, you will return null
  //const courseState = "Activated" //if data is undefined, you will return null
  const isLocked = !courseState || courseState === "Purchased" || courseState === "Deactivated"

  return (
    <>
    <div className="py-4">
      <CourseHero 
        hasOwner={!!ownedCourse.data}
        title={course.title}
        description={course.description}
        image={course.coverImage}
      />
    </div>
      <Keypoints 
        points={course.wsl}
      />
      {courseState &&
      <div className="max-w-5xl mx-auto">
        {
          courseState === "Purchased" &&
          
          <Message type="warning">
            Course is purchased and waiting for the activation. Process can take up to 24 hours.
            <i className="block font-normal">In case of any questions, please contact help@samsaradao.com</i> 
          </Message>
          
        }
        {
          courseState === "Activated" &&
          
          <Message type="success">
            SamsaraDAO wishes you happy learning!
          </Message>
          
        }
        {
          courseState === "Deactivated" &&
          
          <Message type="danger">
            Course has been deactivated, due to incorrect purchase data.
            The functionality to watch the course has been temporarily disabled. 
            <i className="block font-normal">Please contact help@samsaradao.com</i> 
          </Message>
          
        }
      </div>
      }
      
      
      
      <Curriculum 
      isLoading={isLoading}
        locked={isLocked}
        courseState = {courseState}
      />
      <Modal />
      </>
  )
}

//extract all slugs - maps all slug to the slug so we have "15" pages
export function getStaticPaths(){
    const {data} = getAllCourses();

    //extract all slugs - maps all slug to the slug so we have "15" pages
    return {
        paths: data.map(c => ({
            params:{
                slug: c.slug
            }
        })), fallback: false
    }
}

export function getStaticProps({params}){ //will call automatically by Next.js | params is taking from getStaticPaths
    const {data} = getAllCourses();
    const course = data.filter(c => c.slug === params.slug)[0] //find, no need to loop through. will return an array
    return {
      props: {
        course
      }
    }
  }

  Course.Layout = BaseLayout;