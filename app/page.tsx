export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <img
          src="https://i.imgur.com/fPS9mwv.png"
          alt="Open Source Club logo"
          width={180}
        />
        <p className="text-lg text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          OSC is hosting a hackathon!
        </p>
        <ol className="list-inside list-decimal text-sm text-left font-[family-name:var(--font-geist-mono)]">
          <li>Medieval themed (possibly vampires?).</li>
          <li>Aiming for April 5-6th. 24 hours.</li>
          <li>We will have food.</li>
          <li>Venue to be announced.</li>
          <li>Follow socials, more info coming soon!</li>
        </ol>
        <div className="row-start-3 flex gap-6 flex-wrap items-center justify-center mt-10">
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://discord.com/invite/Gsxej6u"
            target="_blank"
            rel="noopener noreferrer"
          >
            Discord
          </a>
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://www.instagram.com/uf_osc"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://ufosc.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Go to ufosc.org →
          </a>
        </div>
      </main>
    </div>
  )
}
