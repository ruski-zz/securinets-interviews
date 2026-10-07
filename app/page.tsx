import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080d18] text-white">
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-xl font-bold tracking-[0.2em]">
              SECURINETS
            </div>
            <div className="mt-1 text-[10px] tracking-[0.3em] text-blue-400">
              SEE BEYOND THE SCREEN
            </div>
          </div>

          <div className="hidden text-sm text-gray-400 sm:block">
            ISET ZAGHOUAN
          </div>
        </div>
      </nav>

      <section className="mx-auto flex min-h-[75vh] max-w-6xl items-center px-6 py-20">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-2 text-sm text-blue-300">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            INTERVIEW 2026
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
            Your next step
            <br />
            <span className="text-blue-400">starts here.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-gray-400">
            Choose your interview date and time slot for Securinets.
            Secure your place and get ready to see beyond the screen.
          </p>

          <div className="mt-10">
            <Link
              href="/book"
              className="inline-flex items-center rounded-lg bg-blue-500 px-7 py-4 font-semibold text-white transition hover:bg-blue-400"
            >
              Book an interview
              <span className="ml-3">→</span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span>SECURINETS ISET ZAGHOUAN</span>
          <span>SEE BEYOND THE SCREEN</span>
        </div>
      </footer>
    </main>
  );
}
