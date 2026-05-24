"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Search, MapPin, Briefcase, DollarSign, Calendar, SlidersHorizontal, Plus } from "lucide-react";

export default function JobsPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Load user session
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();
        setProfile(profileData);
      }

      await loadJobs();
    }
    loadData();
  }, []);

  async function loadJobs() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, posted_by_profile:profiles!posted_by(full_name, bio)")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err: any) {
      console.error("Error loading jobs:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Filtered jobs computed client-side
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.posted_by_profile?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.skills_required || []).some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = jobType ? job.job_type === jobType : true;
    const matchesLevel = experienceLevel ? job.experience_level === experienceLevel : true;
    const matchesLocation = locationFilter
      ? job.location.toLowerCase().includes(locationFilter.toLowerCase())
      : true;

    return matchesSearch && matchesType && matchesLevel && matchesLocation;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setJobType("");
    setExperienceLevel("");
    setLocationFilter("");
  };

  return (
    <main className="min-h-screen py-10">
      <div className="container mx-auto px-6 max-w-5xl">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">Find Opportunities</h1>
            <p className="text-[#94a3b8] mt-2">Discover skills-first jobs matching your verified credentials.</p>
          </div>
          {profile?.role === "employer" && (
            <Link
              href="/jobs/post"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:opacity-90 transition font-bold shadow-lg shadow-green-500/10 text-sm self-start sm:self-center"
            >
              <Plus size={18} />
              Post a Job
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Desktop Sidebar Filters */}
          <div className="hidden lg:block bg-white/5 border border-white/10 rounded-2xl p-6 h-fit backdrop-blur-sm sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-accent" />
                Filters
              </h2>
              {(jobType || experienceLevel || locationFilter || searchQuery) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-accent hover:underline font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Job Type</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full p-3 bg-[#07111c] border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent text-sm"
                >
                  <option value="">All Types</option>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="remote">Remote</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full p-3 bg-[#07111c] border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent text-sm"
                >
                  <option value="">All Levels</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Location</label>
                <input
                  type="text"
                  placeholder="e.g., Harare, Remote"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full p-3 bg-[#07111c] border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent text-sm placeholder:text-[#475569]"
                />
              </div>
            </div>
          </div>

          {/* Main Job Feed */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#94a3b8]" size={20} />
              <input
                type="text"
                placeholder="Search jobs by title, skills, description, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-accent placeholder:text-[#475569] backdrop-blur-sm transition-all focus:ring-1 focus:ring-accent/50"
              />
            </div>

            {/* Mobile Filters Trigger */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden w-full flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl text-white font-semibold text-sm hover:bg-white/10 transition"
            >
              <SlidersHorizontal size={18} />
              {showMobileFilters ? "Hide Filters" : "Show Filters"}
            </button>

            {/* Mobile Filters Dropdown */}
            {showMobileFilters && (
              <div className="lg:hidden p-5 bg-card border border-white/10 rounded-2xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <h3 className="font-bold text-white">Filter Results</h3>
                  <button onClick={clearFilters} className="text-xs text-accent">Clear all</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Job Type</label>
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="w-full p-2 bg-[#07111c] border border-white/10 rounded-lg text-white text-xs focus:outline-none"
                    >
                      <option value="">All Types</option>
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Experience Level</label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full p-2 bg-[#07111c] border border-white/10 rounded-lg text-white text-xs focus:outline-none"
                    >
                      <option value="">All Levels</option>
                      <option value="entry">Entry Level</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#94a3b8] mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g., Bulawayo"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full p-2 bg-[#07111c] border border-white/10 rounded-lg text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Listings Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#94a3b8]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-4"></div>
                <p>Loading matching career options...</p>
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="block">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-accent/40 transition duration-300 backdrop-blur-sm group cursor-pointer relative overflow-hidden">
                      {/* Interactive Gradient Background on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition duration-300 mb-1">
                            {job.title}
                          </h3>
                          <p className="text-sm text-[#94a3b8] font-medium mb-3">
                            {job.posted_by_profile?.full_name || "Enterprise collaborator"}
                          </p>

                          <p className="text-sm text-[#94a3b8] line-clamp-2 mb-4 leading-relaxed max-w-xl">
                            {job.description}
                          </p>

                          {/* Detail Pill Badges */}
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/5 border border-white/10 text-white rounded-full text-xs capitalize font-semibold">
                              <Briefcase size={12} className="text-accent" />
                              {job.job_type.replace("_", " ")}
                            </span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/5 border border-white/10 text-white rounded-full text-xs capitalize font-semibold">
                              <Calendar size={12} className="text-accent" />
                              {job.experience_level}
                            </span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/5 border border-white/10 text-white rounded-full text-xs font-semibold">
                              <MapPin size={12} className="text-accent" />
                              {job.location}
                            </span>
                          </div>

                          {/* Skill Tags */}
                          {job.skills_required && job.skills_required.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {job.skills_required.slice(0, 5).map((skill: string) => (
                                <span
                                  key={skill}
                                  className="px-2 py-0.5 bg-accent/10 border border-accent/20 text-[#a5b4fc] text-[11px] rounded font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                              {job.skills_required.length > 5 && (
                                <span className="px-2 py-0.5 bg-white/5 text-[#94a3b8] text-[11px] rounded font-medium">
                                  +{job.skills_required.length - 5} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Salary & Date Area */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                          <div className="flex items-center text-white font-bold text-lg">
                            <DollarSign size={18} className="text-green-400" />
                            {job.salary_min && job.salary_max ? (
                              <span>
                                {job.currency} {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-sm font-semibold text-[#94a3b8]">Salary Negotiable</span>
                            )}
                          </div>
                          <span className="text-xs text-[#475569] md:mt-2">
                            Posted {new Date(job.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                <Search size={48} className="mx-auto text-[#475569] mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No matching jobs found</h3>
                <p className="text-[#94a3b8] mb-6 max-w-sm mx-auto">
                  Try adjusting your keywords, locations, or status filters to explore other roles.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2.5 bg-accent text-white rounded-xl hover:bg-indigo-600 transition font-semibold text-sm"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
