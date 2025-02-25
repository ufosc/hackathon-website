"use client"

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Textfit } from "react-textfit"

export default function Home() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-3 h-auto md:h-full md:max-h-full p-4 pt-2 md:pt-4">
      <div className="flex flex-col justify-between md:mr-7">
        <div>
          <Textfit mode="single" max={999} className="text-center leading-none">
            UF OPEN SOURCE CLUB PRESENTS
          </Textfit>
          <Textfit mode="single" max={999} className="text-center leading-none">
            MINIHACK
          </Textfit>
          {/* Mobile image: shown only on mobile */}
          <div className="mt-4 md:hidden flex justify-center overflow-hidden">
            <img src="/nosferatu.png" alt="Nosferatu" className="w-full object-cover"/>
          </div>
          <Textfit mode="multi" max={999} className="font-serif text-center md:text-justify my-7">
            THE OPEN SOURCE CLUB’S MINIHACK IS AN OPPORTUNITY FOR
            UNIVERSITY OF FLORIDA STUDENTS TO COLLABORATE ON BUILDING
            OPEN SOURCE SOFTWARE OUTSIDE OF THE CLASSROOM. IT IS A 24H
            HACKATHON WHERE STUDENTS FORM THEIR OWN GROUPS AND WORK TO
            COMPLETE A SOFTWARE DEVELOPMENT CHALLENGE.
          </Textfit>
        </div>
        <div>
          <Textfit mode="single" className="text-center">
            2025.05.05 | VENUE TO BE ANNOUNCED
          </Textfit>
          <p className="font-serif text-xs text-center mt-2">
            THIS MESSAGE WAS BROUGHT TO YOU BY THE OSC DEPARTMENT OF
            PROPAGANDA.
          </p>
        </div>
      </div>
      <div className="hidden md:flex items-center justify-center overflow-hidden">
        <img src="/nosferatu.png" alt="Nosferatu" className="w-full h-full object-cover"/>
      </div>
    </div>
  )
}
