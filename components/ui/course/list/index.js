import Image from "next/image"; //will optimize image before returning to webpage
import Link from "next/link";



export default function List({courses, children}) {
  return (
    <section className="grid md:grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
      {courses.map(course =>
        children(course) //put course into children
      )}
    </section>
  )
}
