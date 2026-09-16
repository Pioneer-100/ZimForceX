"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { 
  Search, MapPin, CheckCircle2, ShieldCheck, 
  Award, Filter, Briefcase, ChevronRight, User 
} from "lucide-react";

export default function EmployerSearchPage() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<any[]>([]);
  
  // Filter states
  const [roleQuery, setRoleQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyMentors, setOnlyMentors] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  async function fetchCandidates() {
    setLoading(true);
    try {
      // Fetch all public profile candidates
      const query = supabase
        .from("profiles")
        .select(`
          *,
          credentials!credentials_user_id_fkey(id, verification_status)
        `)
        .eq("is_public", true)
        .eq("role", "job_seeker");

      const { data, error } = await query;

      if (!error && data) {
        setCandidates(data);
      }
    } catch (err: any) {
      console.error("Error fetching talent:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Client-side filtering for interactive speed
  const filteredCandidates = candidates.filter((cand) => {
    const matchesRole = cand.target_role?.toLowerCase().includes(roleQuery.toLowerCase()) || 
                        cand.skills?.some((s: string) => s.toLowerCase().includes(roleQuery.toLowerCase())) ||
                        roleQuery === "";
    const matchesLocation = cand.location?.toLowerCase().includes(locationQuery.toLowerCase()) || 
                            locationQuery === "";
    
    // Check if user has at least one verified credential
    const hasVerified = cand.credentials?.some((c: any) => c.verification_status === "verified");
    const matchesVerified = !onlyVerified || hasVerified;

    const matchesMentors = !onlyMentors || cand.open_to_mentoring === true;

    return matchesRole && matchesLocation && matchesVerified && matchesMentors;
  });

  return (
    <main className="min-h-screen py-16">
      <div className="container mx-auto px-6 max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <ShieldCheck className="text-accent" size={32} />
              Talent Discovery Console
            </h1>
            <p className="text-muted mt-2">Filter and recruit top skills-verified tech candidates in Zimbabwe.</p>
          </div>
          <span className="text-xs px-3 py-1 bg-accent/20 text-blue-200 border border-accent/30 font-bold rounded-full uppercase tracking-wider">
            Employer Portal
          </span>
        </div>

        {/* Filter Controls Console */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#94a3b8] flex items-center gap-1">
              <Search size={14} /> Search Role / Skill
            </label>
            <input
              type="text"
              placeholder="e.g. React, Developer"
              value={roleQuery}
              onChange={(e) => setRoleQuery(e.target.value)}
              className="w-full p-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-muted focus:outline-none focus:border-accent text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#94a3b8] flex items-center gap-1">
              <MapPin size={14} /> Location Filter
            </label>
            <input
              type="text"
              placeholder="e.g. Harare"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="w-full p-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-muted focus:outline-none focus:border-accent text-xs"
            />
          </div>

          {/* Checks */}
          <div className="flex items-center gap-3 h-[42px] px-1">
            <label className="flex items-center gap-2 text-xs text-[#94a3b8] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="w-4 h-4 rounded bg-black/20 border-white/10 focus:ring-accent accent-accent"
              />
              <span>Verified Skills Only</span>
            </label>
          </div>

          <div className="flex items-center gap-3 h-[42px] px-1">
            <label className="flex items-center gap-2 text-xs text-[#94a3b8] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyMentors}
                onChange={(e) => setOnlyMentors(e.target.checked)}
                className="w-4 h-4 rounded bg-black/20 border-white/10 focus:ring-accent accent-accent"
              />
              <span>Open to Mentoring</span>
            </label>
          </div>
        </div>

        {/* Candidate Feed */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
          </div>
        ) : filteredCandidates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCandidates.map((cand) => {
              const candHasVerified = cand.credentials?.some((c: any) => c.verification_status === "verified");
              return (
                <div 
                  key={cand.id} 
                  className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm hover:border-white/20 transition duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0">
                        {cand.avatar_url ? (
                          <img src={cand.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="text-[#94a3b8]" size={20} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="font-extrabold text-white text-base truncate">{cand.full_name}</h3>
                          {candHasVerified && (
                            <span className="text-[10px] bg-green-500/10 border border-green-500/30 text-green-400 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5" title="Verified Professional">
                              <CheckCircle2 size={10} /> Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-accent font-semibold truncate capitalize mt-0.5">{cand.target_role || "Job Seeker"}</p>
                        {cand.location && (
                          <p className="text-[10px] text-muted flex items-center gap-0.5 mt-1">
                            <MapPin size={10} /> {cand.location}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted leading-relaxed line-clamp-2">{cand.bio || "No professional overview available."}</p>

                    {/* Skill Tags */}
                    {cand.skills && cand.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {cand.skills.slice(0, 4).map((skill: string) => (
                          <span key={skill} className="px-2 py-0.5 bg-white/5 border border-white/5 text-[#94a3b8] text-[10px] rounded-full">
                            {skill}
                          </span>
                        ))}
                        {cand.skills.length > 4 && (
                          <span className="px-2 py-0.5 text-muted text-[10px] font-medium">+{cand.skills.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    {cand.open_to_mentoring ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                        Open to Mentoring
                      </span>
                    ) : (
                      <span />
                    )}

                    <Link 
                      href={`/profile/${cand.id}`}
                      className="text-xs font-bold text-white hover:text-accent transition flex items-center gap-0.5"
                    >
                      View Profile <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
            <ShieldCheck className="w-12 h-12 text-[#94a3b8] mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-white mb-1">No candidates match filters</h3>
            <p className="text-sm text-muted">Try adjusting your role keywords or location queries.</p>
          </div>
        )}
      </div>
    </main>
  );
}
