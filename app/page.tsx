"use client"

import { Textfit } from "react-textfit"

export default function Home() {
  return (
    <div className="grid grid-cols-[1fr_4fr] gap-3 justify-end max-h-full h-full">
      <div className="flex flex-col justify-between h-full mr-7">
        <div>
          <Textfit mode="single" max={100} className="text-center leading-none">
            UF OPEN SOURCE CLUB PRESENTS
          </Textfit>
          <Textfit mode="single" max={200} className="text-center leading-none">
            MINIHACK
          </Textfit>
          <p className="font-serif text-justify text-2xl my-7">
            THE OPEN SOURCE CLUB’S MINIHACK IS AN OPPORTUNITY FOR
            UNIVERSITY OF FLORIDA STUDENTS TO COLLABORATE ON BUILDING OPEN
            SOURCE SOFTWARE OUTSIDE OF THE CLASSROOM. IT IS A 24H
            HACKATHON WHERE STUDENTS FORM THEIR OWN GROUPS AND WORK TO
            COMPLETE A SOFTWARE DEVELOPMENT CHALLENGE.
          </p>
        </div>
        <div>
          <Textfit mode="single" max={100}>
            2025.05.05 | Venue to be Announced
          </Textfit>
          <Textfit mode="single" max={100} className="font-serif">
            THIS MESSAGE WAS BROUGHT TO YOU BY THE OSC DEPARTMENT OF
            PROPAGANDA.
          </Textfit>
        </div>
      </div>
      <div className="flex justify-end pl-4 h-full">
        { /* TODO Fix this overflowing image */ }
        <img src="/nosferatu.png" className="h-full w-full object-contain"/>
      </div>
    </div>
  )
}
