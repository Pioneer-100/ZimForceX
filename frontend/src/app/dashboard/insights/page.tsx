"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart3, TrendingUp, Target, AlertCircle, Briefcase, Eye } from "lucide-react";

export default function InsightsDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [viewCount, setViewCount] = useState(0);
  const [missingSkills, setMissingSkills] = useState<{skill: string, count: number}[]>([]);
  const [targetJobsCount, setTargetJobsCount] = useState(0);

  useEffect(() => {
    async function loadInsights() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }
      setUser(currentUser);

      // Load Profile
      const { data: pData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();
      
      setProfile(pData);

      // Load Profile Views
      const { count: views } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", currentUser.id);
      
      setViewCount(views || 0);

      // Skill Gap Analysis
      if (pData?.target_role) {
        const { data: matchedJobs } = await supabase
          .from("jobs")
          .select("skills_required")
          .ilike("title", `%${pData.target_role}%`)
          .eq("status", "active");

        if (matchedJobs) {
          setTargetJobsCount(matchedJobs.length);
          
          const userSkills = pData.skills || [];
          const skillCounts: Record<string, number> = {};
          
          matchedJobs.forEach(job => {
            job.skills_required?.forEach((skill: string) => {
              if (!userSkills.includes(skill)) {
                skillCounts[skill] = (skillCounts[skill] || 0) + 1;
              }
            });
          });

          // Sort by frequency
          const sortedMissing = Object.entries(skillCounts)
            .map(([skill, count]) => ({ skill, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // top 5 missing skills

          setMissingSkills(sortedMissing);
        }
      }

      setLoading(false);
    }
    
    loadInsights();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#94a3b8]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-4"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-10">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <BarChart3 className="text-accent" size={32} />
            Actionable Insights
          </h1>
          <p className="text-[#94a3b8] mt-2">Analytics and recommendations to grow your career.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Stat Card 1 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                <Eye size={24} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#94a3b8]">Profile Views</h3>
                <div className="text-2xl font-bold text-white">{viewCount}</div>
              </div>
            </div>
            <div className="text-xs text-green-400 flex items-center gap-1">
              <TrendingUp size={12} /> +12% this week
            </div>
          </div>

          {/* Stat Card 2 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center">
                <Target size={24} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#94a3b8]">Target Role</h3>
                <div className="text-lg font-bold text-white capitalize line-clamp-1">
                  {profile?.target_role || "Not Set"}
                </div>
              </div>
            </div>
            <div className="text-xs text-[#94a3b8]">
              {targetJobsCount} active jobs found matching this role
            </div>
          </div>
        </div>

        {/* Skill Gaps Analysis */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-2">Skill Gap Analysis</h2>
          <p className="text-[#94a3b8] text-sm mb-6">
            Based on {targetJobsCount} active job listings for "{profile?.target_role || "your target role"}", here are the most requested skills you are currently missing from your profile.
          </p>

          {!profile?.target_role ? (
            <div className="p-6 border border-dashed border-white/20 rounded-xl text-center">
              <AlertCircle className="mx-auto text-amber-400 mb-2" size={32} />
              <h3 className="text-white font-bold mb-1">Set a Target Role</h3>
              <p className="text-sm text-[#94a3b8]">Update your profile to include a target role to unlock skill gap analysis.</p>
            </div>
          ) : missingSkills.length > 0 ? (
            <div className="space-y-4">
              {missingSkills.map((item, index) => {
                // Calculate a mock priority percentage based on count vs total jobs
                const percentage = Math.min(Math.round((item.count / targetJobsCount) * 100), 100);
                
                return (
                  <div key={item.skill} className="bg-black/20 border border-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white flex items-center gap-2">
                        {index + 1}. {item.skill}
                      </span>
                      <span className="text-xs font-semibold text-accent">Required in {percentage}% of roles</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div className="bg-gradient-to-r from-accent to-purple-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <p className="text-xs text-[#94a3b8] mt-2">
                      Recommendation: Take a short course on {item.skill} and upload the certificate to ZimForceX for AI verification.
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 border border-dashed border-green-500/30 bg-green-500/5 rounded-xl text-center">
              <CheckCircle2 className="mx-auto text-green-400 mb-2" size={32} />
              <h3 className="text-white font-bold mb-1">You are highly qualified!</h3>
              <p className="text-sm text-[#94a3b8]">Your profile skills match all the highly requested skills for your target role.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
