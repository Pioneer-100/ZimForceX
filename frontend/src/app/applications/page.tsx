"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, User, Mail, Check, X, FileText, CheckCircle2 } from "lucide-react";

export default function ApplicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push("/jobs");
        return;
      }
      setUser(currentUser);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (!profileData || profileData.role !== "employer") {
        setLoading(false);
        return;
      }

      setProfile(profileData);
      await loadApplications(currentUser.id);
    }
    loadData();
  }, [router]);

  async function loadApplications(userId: string) {
    try {
      // 1. Fetch employer's job listings
      const { data: myJobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id")
        .eq("posted_by", userId);

      if (jobsError) throw jobsError;

      const jobIds = myJobs?.map((j) => j.id) || [];
      
      if (jobIds.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      // 2. Fetch applications matching those job IDs
      const { data: appData, error: appError } = await supabase
        .from("applications")
        .select(`
          *,
          applicant_profile:profiles!applicant_id(full_name, bio, skills, avatar_url),
          job:jobs!job_id(title)
        `)
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });

      if (appError) throw appError;

      setApplications(appData || []);
    } catch (err: any) {
      console.error("Error fetching applications:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(appId: string, newStatus: string) {
    setUpdatingId(appId);
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", appId);

      if (error) throw error;

      // Refresh applications from state locally
      setApplications(applications.map(app => 
        app.id === appId ? { ...app, status: newStatus } : app
      ));
    } catch (err: any) {
      console.error("Error updating status:", err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredApps = applications.filter((app) => {
    if (statusFilter === "all") return true;
    return app.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-[#94a3b8]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-4"></div>
        <p>Loading application documents...</p>
      </div>
    );
  }

  if (profile?.role !== "employer") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-[#94a3b8] mb-6 max-w-md">
          Only users with an **Employer** account can review submitted applications.
        </p>
        <Link href="/jobs" className="inline-flex items-center gap-2 text-accent hover:underline font-semibold">
          <ArrowLeft size={16} /> Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-10">
      <div className="container mx-auto px-6 max-w-5xl">
        
        {/* Back Link */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-white transition font-medium mb-8"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Received Applications</h1>
          <p className="text-[#94a3b8] mt-2">Manage applications, review cover letters, and select candidates.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {["all", "submitted", "reviewed", "accepted", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize border transition ${
                statusFilter === status
                  ? "bg-accent text-white border-accent"
                  : "bg-white/5 border-white/10 text-[#94a3b8] hover:bg-white/10 hover:text-white"
              }`}
            >
              {status === "all" ? "All Submissions" : status}
            </button>
          ))}
        </div>

        {/* Application Cards */}
        {filteredApps.length > 0 ? (
          <div className="space-y-6">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm relative overflow-hidden"
              >
                {/* Status Indicator Stripe */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  app.status === "accepted" ? "bg-green-500" :
                  app.status === "rejected" ? "bg-red-500" :
                  app.status === "reviewed" ? "bg-blue-500" :
                  "bg-yellow-500"
                }`}></div>

                {/* Candidate Overview */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center text-white">
                      {app.applicant_profile?.avatar_url ? (
                        <img src={app.applicant_profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-[#94a3b8]" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white leading-tight">
                        {app.applicant_profile?.full_name || "Anonymous Seeker"}
                      </h3>
                      <p className="text-xs text-[#94a3b8] mt-1.5">
                        Applied for: <strong className="text-blue-300 font-semibold">{app.job?.title}</strong>
                      </p>
                      <p className="text-xs text-[#475569] mt-1">
                        Submitted {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span className={`px-3 py-1 bg-white/5 border text-xs font-bold rounded-full capitalize ${
                    app.status === "accepted" ? "text-green-400 border-green-500/30 bg-green-500/10" :
                    app.status === "rejected" ? "text-red-400 border-red-500/30 bg-red-500/10" :
                    app.status === "reviewed" ? "text-blue-400 border-blue-500/30 bg-blue-500/10" :
                    "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
                  }`}>
                    {app.status}
                  </span>
                </div>

                {/* Seeker Bio */}
                {app.applicant_profile?.bio && (
                  <div className="mb-4">
                    <p className="text-sm text-[#94a3b8] leading-relaxed italic">
                      "{app.applicant_profile.bio}"
                    </p>
                  </div>
                )}

                {/* Candidate Skills Array */}
                {app.applicant_profile?.skills && app.applicant_profile.skills.length > 0 && (
                  <div className="mb-6">
                    <span className="text-[10px] uppercase font-bold text-white tracking-wider block mb-2">Claimed Skills Portfolio</span>
                    <div className="flex flex-wrap gap-1.5">
                      {app.applicant_profile.skills.map((skill: string) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 bg-white/5 border border-white/10 text-[#94a3b8] text-[11px] rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cover Letter Document */}
                {app.cover_letter && (
                  <div className="mb-6 p-4 bg-black/25 rounded-xl border border-white/5 space-y-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <FileText size={14} className="text-accent" />
                      Cover Letter
                    </span>
                    <p className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-wrap">
                      {app.cover_letter}
                    </p>
                  </div>
                )}

                {/* Employer Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
                  <span className="text-xs text-[#475569]">
                    Actions are committed immediately to the database.
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(app.id, "reviewed")}
                      disabled={updatingId === app.id || app.status === "reviewed"}
                      className="inline-flex items-center gap-1 px-4 py-2 border border-white/10 text-white rounded-xl hover:bg-white/5 text-xs font-bold transition disabled:opacity-50"
                    >
                      Mark Reviewed
                    </button>
                    <button
                      onClick={() => updateStatus(app.id, "rejected")}
                      disabled={updatingId === app.id || app.status === "rejected"}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 text-xs font-bold transition disabled:opacity-50"
                    >
                      <X size={14} />
                      Reject
                    </button>
                    <button
                      onClick={() => updateStatus(app.id, "accepted")}
                      disabled={updatingId === app.id || app.status === "accepted"}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500/20 text-xs font-bold transition disabled:opacity-50"
                    >
                      <Check size={14} />
                      Accept Candidate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
            <CheckCircle2 size={48} className="mx-auto text-[#475569] mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No applications found</h3>
            <p className="text-[#94a3b8] max-w-sm mx-auto text-sm">
              You haven't received any applications matching the selected status category yet.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
