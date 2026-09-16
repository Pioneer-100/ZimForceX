"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { BookOpen, ExternalLink, Filter, Search, Award } from "lucide-react";

export default function LearningHubPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadCourses() {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setCourses(data);
      }
      setLoading(false);
    }
    loadCourses();
  }, []);

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.skills_taught.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative pt-24 pb-12 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent"></div>
        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                Upskill for the <span className="text-gradient">Future</span>
              </h1>
              <p className="text-xl text-[#94a3b8] mb-8 leading-relaxed max-w-2xl">
                Bridge your skill gaps with curated courses. Learn, earn certificates, and get AI-verified to unlock premium opportunities.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-lg">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-[#94a3b8]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search for React, Data Science, AWS..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-[#0a1929] text-white placeholder-[#94a3b8] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition duration-150 ease-in-out"
                  />
                </div>
              </div>
            </div>
            
            <div className="hidden md:flex flex-col gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md w-72">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Award className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold">How it works</h3>
              </div>
              <ol className="text-sm text-[#94a3b8] space-y-3">
                <li className="flex gap-2"><span className="text-accent font-bold">1.</span> Take a course to bridge your skill gap.</li>
                <li className="flex gap-2"><span className="text-accent font-bold">2.</span> Upload your completion certificate.</li>
                <li className="flex gap-2"><span className="text-accent font-bold">3.</span> ZimForceX AI verifies your skill.</li>
                <li className="flex gap-2"><span className="text-accent font-bold">4.</span> Get matched to top-tier jobs automatically.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="container mx-auto px-6 max-w-5xl py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div key={course.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-accent/40 transition duration-300 flex flex-col group cursor-pointer">
                <div className="h-40 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-center p-6 text-center border-b border-white/5 relative">
                  <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {course.image_url ? (
                    <img src={course.image_url} alt={course.title} className="max-h-full object-contain" />
                  ) : (
                    <BookOpen className="w-16 h-16 text-slate-700" />
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="text-xs text-accent font-semibold uppercase tracking-wider mb-2">
                    {course.provider}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-[#94a3b8] mb-4 line-clamp-3 flex-1">
                    {course.description || "Learn in-demand skills and earn a verified certificate to boost your ZimForceX profile."}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {course.skills_taught.slice(0, 3).map((skill: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-[#94a3b8]">
                        {skill}
                      </span>
                    ))}
                    {course.skills_taught.length > 3 && (
                      <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-[#94a3b8]">
                        +{course.skills_taught.length - 3}
                      </span>
                    )}
                  </div>
                  
                  <a
                    href={course.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-accent hover:border-transparent transition duration-300 font-medium text-sm"
                  >
                    Start Course <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-[#94a3b8] mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-white mb-2">No courses found</h3>
            <p className="text-[#94a3b8]">Check back later or adjust your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
