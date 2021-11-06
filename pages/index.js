
import { Hero } from "@components/ui/common"
import { CourseCard, CourseList } from "@components/ui/course"
import { BaseLayout } from "@components/ui/layout"
import { getAllCourses } from "@content/courses/fetcher"

export default function Home({courses}) {
  return (
    <>
        <Hero />
        <CourseList courses={courses}>
        {
            //this is the children
            (course) => 
            <CourseCard key={course.id} course={course}/>
        }
        </CourseList>
    </>
  )
}


export function getStaticProps(){ //will call automatically by Next.js
  const {data} = getAllCourses();
  return {
    props: {
      courses: data 
    }
  }
}

Home.Layout = BaseLayout; //must use this method