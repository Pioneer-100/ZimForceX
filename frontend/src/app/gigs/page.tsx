"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Briefcase, MapPin, DollarSign, Clock, Filter, Search } from "lucide-react";

export default function GigsPage() {
  const [loading, setLoading] = useState(true);
  const [gigs, setGigs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadGigs() {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, posted_by_profile:profiles!posted_by(full_name, avatar_url)")
        .eq("status", "active")
        .eq("job_type", "contract")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setGigs(data);
      }
      setLoading(false);
    }
    loadGigs();
  }, []);

  const filteredGigs = gigs.filter((gig) =>
    gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gig.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 pt-24 pb-12">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-xl">
              <Clock className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-4xl font-extrabold text-white">Freelance & Gigs</h1>
          </div>
          <p className="text-[#94a3b8] text-lg max-w-2xl mb-8">
            Find flexible contract work and short-term projects to build your portfolio and earn on your own terms.
          </p>

          <div className="relative max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-[#94a3b8]" />
            </div>
            <input
              type="text"
              placeholder="Search gigs (e.g., UI Design, React MVP...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-white/5 text-white placeholder-[#94a3b8] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition duration-150 ease-in-out"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-5xl mt-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
          </div>
        ) : filteredGigs.length > 0 ? (
          <div className="space-y-4">
            {filteredGigs.map((gig) => (
              <Link key={gig.id} href={`/jobs/${gig.id}`} className="block">
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-green-400/40 transition duration-300 group">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-green-500/10 text-green-400 text-xs font-semibold px-2 py-1 rounded-full border border-green-500/20">
                          Contract Project
                        </span>
                        <span className="text-sm text-[#94a3b8]">
                          {new Date(gig.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white group-hover:text-green-300 transition duration-300 mb-1">
                        {gig.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-3">
                        {gig.posted_by_profile?.avatar_url ? (
                          <img src={gig.posted_by_profile.avatar_url} alt="Client" className="w-5 h-5 rounded-full" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-white/10" />
                        )}
                        <span className="text-sm text-[#94a3b8] font-medium">
                          {gig.posted_by_profile?.full_name || "Enterprise Client"}
                        </span>
                      </div>

                      <p className="text-sm text-[#94a3b8] line-clamp-2 mb-4 leading-relaxed max-w-2xl">
                        {gig.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3">
                        {gig.location && (
                          <div className="flex items-center gap-1 text-xs font-medium text-[#94a3b8] bg-white/5 px-2 py-1 rounded-md border border-white/5">
                            <MapPin className="w-3.5 h-3.5" />
                            {gig.location}
                          </div>
                        )}
                        {(gig.salary_min || gig.salary_max) && (
                          <div className="flex items-center gap-1 text-xs font-medium text-[#94a3b8] bg-white/5 px-2 py-1 rounded-md border border-white/5">
                            <DollarSign className="w-3.5 h-3.5" />
                            {gig.salary_min ? `${gig.currency}${gig.salary_min.toLocaleString()}` : ""}
                            {gig.salary_min && gig.salary_max ? " - " : ""}
                            {gig.salary_max ? `${gig.currency}${gig.salary_max.toLocaleString()}` : ""}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 flex items-center justify-center">
                      <div className="px-6 py-2 rounded-xl border border-green-500/30 text-green-400 font-semibold text-sm group-hover:bg-green-500/10 transition">
                        View Project
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
            <Briefcase className="w-12 h-12 text-[#94a3b8] mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-white mb-2">No gigs available</h3>
            <p className="text-[#94a3b8]">Check back soon for new freelance projects.</p>
          </div>
        )}
      </div>
    </div>
  );
}
