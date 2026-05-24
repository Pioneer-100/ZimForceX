import React from "react";

export default function Home() {
  return (
    <main>
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-6 max-w-5xl flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Career networking that actually works
            </h1>
            <p className="text-lg md:text-xl text-muted mb-8 max-w-lg">
              Connect with professionals, showcase your skills, and explore opportunities tailored to you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#features"
                className="px-6 py-3 bg-gradient-to-r from-accent to-purple-600 text-white rounded-lg hover:opacity-90 transition font-semibold text-center"
              >
                Create an account
              </a>
              <a
                href="#about"
                className="px-6 py-3 border border-white/10 text-white rounded-lg hover:bg-white/5 transition font-semibold text-center"
              >
                Learn more
              </a>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white/5 border border-white/10 p-12 rounded-2xl text-center text-muted backdrop-blur-md shadow-2xl skew-y-3 md:skew-y-0 transform hover:-translate-y-2 transition duration-500 max-w-xs">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-accent mx-auto mb-4 animate-pulse"></div>
              <p className="font-semibold text-white">Your professional profile</p>
              <p className="text-sm mt-2">Get discovered today.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-surface/50 border-y border-white/5">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl font-bold mb-10 text-center text-blue-100">What you can do</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition">
              <h3 className="text-xl font-bold mb-3 text-white">Connect</h3>
              <p className="text-muted">Find and message professionals in your industry.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition">
              <h3 className="text-xl font-bold mb-3 text-white">Showcase skills</h3>
              <p className="text-muted">Create rich skill profiles and get endorsements.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition">
              <h3 className="text-xl font-bold mb-3 text-white">Explore opportunities</h3>
              <p className="text-muted">Discover curated jobs, projects, and collaborations.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="py-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl font-bold mb-10 text-center text-blue-100">Why ZimForceX</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
              <h3 className="text-lg font-bold mb-2 text-yellow-300">Skills-first profiles</h3>
              <p className="text-sm text-muted">Highlight verified skills and real contributions — not vague resumes.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
              <h3 className="text-lg font-bold mb-2 text-yellow-300">Curated opportunities</h3>
              <p className="text-sm text-muted">Receive job and project matches tailored to your skills and goals.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
              <h3 className="text-lg font-bold mb-2 text-yellow-300">Trusted network</h3>
              <p className="text-sm text-muted">Connect with verified professionals and mentors in your field.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
              <h3 className="text-lg font-bold mb-2 text-yellow-300">Privacy-first</h3>
              <p className="text-sm text-muted">You control what recruiters and peers can see — share selectively.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
              <h3 className="text-lg font-bold mb-2 text-yellow-300">Skill endorsements</h3>
              <p className="text-sm text-muted">Get endorsements and micro-recommendations from collaborators.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
              <h3 className="text-lg font-bold mb-2 text-yellow-300">Actionable insights</h3>
              <p className="text-sm text-muted">Use analytics to identify skill gaps and growth opportunities.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-20 bg-surface/50 border-t border-white/5">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-6 text-blue-100">About ZimForceX</h2>
          <p className="text-lg text-muted">
            We help people build meaningful career relationships by focusing on skills and opportunities — not noise.
          </p>
        </div>
      </section>

      <footer className="py-8 border-t border-white/5 text-center md:text-left">
        <div className="container mx-auto px-6 max-w-5xl flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-muted text-sm">© 2026 ZimForceX</span>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted hover:text-white transition">Privacy</a>
            <a href="#" className="text-sm text-muted hover:text-white transition">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
