"use client"

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Textfit } from "react-textfit"
import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { ChevronDown, Calendar, MapPin, Clock, Users } from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export default function Home() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    year: '',
    major: '',
    experience: '',
    dietaryRestrictions: '',
    linkedinUrl: '',
    githubUrl: '',
    resumeFile: null as File | null,
  })
  const [submitting, setSubmitting] = useState(false)

  const faqs = [
    {
      question: "What is Minihack?",
      answer: "Minihack is a 24-hour hackathon organized by the UF Open Source Club. It's an opportunity for University of Florida students to collaborate on building open source software outside of the classroom."
    },
    {
      question: "Who can participate?",
      answer: "Any University of Florida student can participate in Minihack. All skill levels are welcome, from beginners to experienced developers."
    },
    {
      question: "Do I need to have a team?",
      answer: "You can participate individually or form a team. We'll also have team formation activities at the beginning of the event to help you find teammates."
    },
    {
      question: "What should I bring?",
      answer: "Bring your laptop, charger, and any other equipment you need for coding. We'll provide food, drinks, and a great environment to work in."
    },
    {
      question: "Is there a cost to participate?",
      answer: "Minihack is completely free to participate in! We'll provide food, drinks, and prizes for the winners."
    },
    {
      question: "What are the prizes?",
      answer: "We'll have prizes for the top projects in different categories. More details about prizes will be announced closer to the event."
    }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (file && file.size > 5 * 1024 * 1024) {
      alert('File too large. Please upload a PDF up to 5MB.')
      e.currentTarget.value = ''
      setFormData({ ...formData, resumeFile: null })
      return
    }
    setFormData({ ...formData, resumeFile: file })
  }

  const validateForm = () => {
    // Client-side validation
    if (!formData.name.trim() || formData.name.length > 100) {
      alert('Name is required and must be less than 100 characters.')
      return false
    }
    
    const email = formData.email.trim().toLowerCase()
    if (!email.endsWith('@ufl.edu')) {
      alert('Please use your ufl.edu email address to register.')
      return false
    }
    
    if (!formData.year || !formData.major.trim() || !formData.experience) {
      alert('Please fill in all required fields.')
      return false
    }
    
    if (formData.major.length > 100) {
      alert('Major must be less than 100 characters.')
      return false
    }
    
    if (formData.dietaryRestrictions.length > 500) {
      alert('Dietary restrictions must be less than 500 characters.')
      return false
    }
    
    // Validate LinkedIn URL if provided
    if (formData.linkedinUrl && !formData.linkedinUrl.match(/^https?:\/\/.*linkedin\.com\/.*/)) {
      alert('Please enter a valid LinkedIn URL (e.g., https://www.linkedin.com/in/your-handle)')
      return false
    }
    
    // Validate GitHub URL if provided
    if (formData.githubUrl && !formData.githubUrl.match(/^https?:\/\/.*github\.com\/.*/)) {
      alert('Please enter a valid GitHub URL (e.g., https://github.com/your-username)')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    if (!supabaseUrl || !supabaseAnonKey) {
      alert('Registration backend not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      return
    }
    
    try {
      setSubmitting(true)
      let resumeUrl: string | null = null

      // Handle file upload first if present
      if (formData.resumeFile) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey)
        const file = formData.resumeFile
        
        // Validate file type and size client-side
        if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
          alert('Please upload a PDF file.')
          return
        }
        
        if (file.size > 5 * 1024 * 1024) {
          alert('File size must be less than 5MB.')
          return
        }
        
        const fileExt = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
        const fileName = `${Date.now()}_${formData.email.trim().toLowerCase()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('resumes')
          .upload(fileName, file, { 
            upsert: false, 
            contentType: 'application/pdf',
            cacheControl: '3600'
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error('Failed to upload resume. Please try again.')
        }

        const { data: publicUrl } = supabase
          .storage
          .from('resumes')
          .getPublicUrl(uploadData.path)
        resumeUrl = publicUrl.publicUrl
      }

      // Submit registration via secure Edge Function
      const registrationData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        year: formData.year,
        major: formData.major.trim(),
        experience: formData.experience,
        dietary_restrictions: formData.dietaryRestrictions.trim() || undefined,
        linkedin_url: formData.linkedinUrl.trim() || undefined,
        github_url: formData.githubUrl.trim() || undefined,
        resume_url: resumeUrl
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(registrationData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      alert('Registration submitted successfully! We\'ll be in touch soon.')
      setFormData({
        name: '', email: '', year: '', major: '', experience: '', dietaryRestrictions: '', linkedinUrl: '', githubUrl: '', resumeFile: null,
      })
      
      // Reset file input
      const fileInput = document.getElementById('resume') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
    } catch (err: any) {
      console.error('Registration error:', err)
      alert(err.message || 'Something went wrong submitting your registration. Please try again later.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section id="about" className="min-h-screen flex items-center justify-center p-4 pt-2 md:pt-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-3 h-auto md:h-full md:max-h-full w-full">
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
                <img src="/under-construction.gif" alt="Under Construction" className="w-full object-cover"/>
              </div>
              <Textfit mode="multi" min={18} max={999} className="font-serif text-center md:text-justify my-7">
                THE OPEN SOURCE CLUB'S MINIHACK IS AN OPPORTUNITY FOR
                UNIVERSITY OF FLORIDA STUDENTS TO COLLABORATE ON BUILDING
                OPEN SOURCE SOFTWARE OUTSIDE OF THE CLASSROOM. IT IS A 24H
                HACKATHON WHERE STUDENTS FORM THEIR OWN GROUPS AND WORK TO
                COMPLETE A SOFTWARE DEVELOPMENT CHALLENGE.
              </Textfit>
            </div>
            <div>
              <Textfit mode="single" className="text-center font-bold">
                September 27-28
              </Textfit>
              <p className="font-serif text-xs text-center mt-2">
                THIS MESSAGE WAS BROUGHT TO YOU BY THE OSC DEPARTMENT OF
                PROPAGANDA.
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center overflow-hidden">
            <img src="/under-construction.gif" alt="Under Construction" className="w-full h-full object-cover"/>
          </div>
        </div>
      </section>

      {/* Event Details Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center mb-12">Event Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-[#1C2646]" />
              <h3 className="font-bold mb-2">Date</h3>
              <p>September 27-28, 2024</p>
            </div>
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-[#1C2646]" />
              <h3 className="font-bold mb-2">Location</h3>
              <p>University of Florida<br />Campus</p>
            </div>
            <div className="text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-[#1C2646]" />
              <h3 className="font-bold mb-2">Duration</h3>
              <p>24 Hours</p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-[#1C2646]" />
              <h3 className="font-bold mb-2">Participants</h3>
              <p>UF Students Only</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 px-4 bg-[#F9FAFE]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm">
                <button
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                  onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                >
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 transition-transform ${faqOpen === index ? 'rotate-180' : ''}`} 
                  />
                </button>
                {faqOpen === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      <section id="sponsors" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center mb-12">Our Sponsors</h2>
          <div className="text-center mb-8">
            <p className="text-lg text-gray-600 mb-8">
              Thank you to our amazing sponsors who make Minihack possible!
            </p>
          </div>
          
          {/* Sponsor Tiers */}
          <div className="space-y-12">
            {/* Platinum Sponsors */}
            <div>
              <h3 className="text-center text-xl font-bold mb-6 text-gray-500">PLATINUM SPONSORS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center justify-items-center">
                <div className="bg-gray-100 p-8 rounded-lg w-full max-w-xs h-32 flex items-center justify-center">
                  <p className="text-gray-500 text-center">Your Company Here</p>
                </div>
                <div className="bg-gray-100 p-8 rounded-lg w-full max-w-xs h-32 flex items-center justify-center">
                  <p className="text-gray-500 text-center">Your Company Here</p>
                </div>
                <div className="bg-gray-100 p-8 rounded-lg w-full max-w-xs h-32 flex items-center justify-center">
                  <p className="text-gray-500 text-center">Your Company Here</p>
                </div>
              </div>
            </div>

            {/* Gold Sponsors */}
            <div>
              <h3 className="text-center text-xl font-bold mb-6 text-yellow-600">GOLD SPONSORS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-center justify-items-center">
                <div className="bg-gray-100 p-6 rounded-lg w-full max-w-xs h-24 flex items-center justify-center">
                  <p className="text-gray-500 text-center text-sm">Your Company Here</p>
                </div>
                <div className="bg-gray-100 p-6 rounded-lg w-full max-w-xs h-24 flex items-center justify-center">
                  <p className="text-gray-500 text-center text-sm">Your Company Here</p>
                </div>
                <div className="bg-gray-100 p-6 rounded-lg w-full max-w-xs h-24 flex items-center justify-center">
                  <p className="text-gray-500 text-center text-sm">Your Company Here</p>
                </div>
                <div className="bg-gray-100 p-6 rounded-lg w-full max-w-xs h-24 flex items-center justify-center">
                  <p className="text-gray-500 text-center text-sm">Your Company Here</p>
                </div>
              </div>
            </div>

            {/* Silver Sponsors */}
            <div>
              <h3 className="text-center text-xl font-bold mb-6 text-gray-400">SILVER SPONSORS</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-center justify-items-center">
                <div className="bg-gray-100 p-4 rounded-lg w-full max-w-xs h-20 flex items-center justify-center">
                  <p className="text-gray-500 text-center text-xs">Your Company Here</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg w-full max-w-xs h-20 flex items-center justify-center">
                  <p className="text-gray-500 text-center text-xs">Your Company Here</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg w-full max-w-xs h-20 flex items-center justify-center">
                  <p className="text-gray-500 text-center text-xs">Your Company Here</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg w-full max-w-xs h-20 flex items-center justify-center">
                  <p className="text-gray-500 text-center text-xs">Your Company Here</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg w-full max-w-xs h-20 flex items-center justify-center">
                  <p className="text-gray-500 text-center text-xs">Your Company Here</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg w-full max-w-xs h-20 flex items-center justify-center">
                  <p className="text-gray-500 text-center text-xs">Your Company Here</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sponsor CTA */}
          <div className="text-center mt-12 p-8 bg-[#F9FAFE] rounded-lg">
            <h3 className="text-xl font-bold mb-4">Interested in Sponsoring?</h3>
            <p className="text-gray-600 mb-6">
              Join us in supporting the next generation of developers and open source contributors.
            </p>
            <a 
              href="mailto:sponsors@ufosc.org" 
              className="inline-block bg-[#1C2646] text-white py-3 px-8 rounded-md font-medium hover:bg-[#0f1a2e] transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section id="registration" className="py-16 px-4 bg-[#F9FAFE]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center mb-12">Register for Minihack</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  maxLength={100}
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2646]"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  pattern="^[A-Za-z0-9._%+-]+@ufl\.edu$"
                  title="Please enter a valid ufl.edu email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2646]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="linkedinUrl" className="block text-sm font-medium mb-2">LinkedIn Profile (optional)</label>
                <input
                  type="url"
                  id="linkedinUrl"
                  name="linkedinUrl"
                  placeholder="https://www.linkedin.com/in/your-handle"
                  value={formData.linkedinUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2646]"
                />
              </div>
              <div>
                <label htmlFor="githubUrl" className="block text-sm font-medium mb-2">GitHub Profile (optional)</label>
                <input
                  type="url"
                  id="githubUrl"
                  name="githubUrl"
                  placeholder="https://github.com/your-username"
                  value={formData.githubUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2646]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="year" className="block text-sm font-medium mb-2">Academic Year *</label>
                <select
                  id="year"
                  name="year"
                  required
                  value={formData.year}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2646]"
                >
                  <option value="">Select Year</option>
                  <option value="freshman">Freshman</option>
                  <option value="sophomore">Sophomore</option>
                  <option value="junior">Junior</option>
                  <option value="senior">Senior</option>
                </select>
              </div>
              <div>
                <label htmlFor="major" className="block text-sm font-medium mb-2">Major *</label>
                <input
                  type="text"
                  id="major"
                  name="major"
                  required
                  maxLength={100}
                  value={formData.major}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2646]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="experience" className="block text-sm font-medium mb-2">Programming Experience *</label>
              <select
                id="experience"
                name="experience"
                required
                value={formData.experience}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2646]"
              >
                <option value="">Select Experience Level</option>
                <option value="beginner">Beginner (0-1 years)</option>
                <option value="intermediate">Intermediate (1-3 years)</option>
                <option value="advanced">Advanced (3+ years)</option>
              </select>
            </div>

            <div>
              <label htmlFor="resume" className="block text-sm font-medium mb-2">Resume (PDF, max 5MB)</label>
              <input
                type="file"
                id="resume"
                name="resume"
                accept="application/pdf"
                onChange={handleFileChange}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="dietaryRestrictions" className="block text-sm font-medium mb-2">Dietary Restrictions</label>
              <textarea
                id="dietaryRestrictions"
                name="dietaryRestrictions"
                value={formData.dietaryRestrictions}
                onChange={handleInputChange}
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1C2646]"
                placeholder="Please let us know about any dietary restrictions or allergies... (max 500 characters)"
              />
            </div>

            

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1C2646] text-white py-3 px-6 rounded-md font-medium hover:bg-[#0f1a2e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting…' : 'Register for Minihack'}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-[#1C2646] text-white text-center">
        <p className="font-serif text-sm">
          THIS MESSAGE WAS BROUGHT TO YOU BY THE OSC DEPARTMENT OF PROPAGANDA.
        </p>
      </footer>
    </div>
  )
}
