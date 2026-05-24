"use client";
import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, MapPin, Briefcase, DollarSign, Calendar, CheckCircle2, User, Building } from "lucide-react";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params);

  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [hasApplied, setHasApplied] = useState(false);
  
  // Application Drawer
  const [coverLetter, setCoverLetter] = useState("");
  const [message, setMessage] = useState({ text: "", type: "info" });

  useEffect(() => {
    async function loadData() {
      // Get user session
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        // Fetch user role
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        setProfile(profileData);

        // Fetch application status
        const { data: appData } = await supabase
          .from("applications")
          .select("id")
          .eq("job_id", jobId)
          .eq("applicant_id", currentUser.id)
          .single();

        if (appData) {
          setHasApplied(true);
        }
      }

      // Fetch job details
      await fetchJobDetails();
    }
    loadData();
  }, [jobId]);

  async function fetchJobDetails() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, posted_by_profile:profiles!posted_by(full_name, bio, avatar_url)")
        .eq("id", jobId)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (err: any) {
      console.error("Error fetching job details:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setMessage({ text: "Please log in to submit your application.", type: "error" });
      return;
    }
    if (!coverLetter.trim()) {
      setMessage({ text: "Please write a cover letter to apply.", type: "error" });
      return;
    }

    setApplying(true);
    setMessage({ text: "", type: "info" });

    try {
      const { error } = await supabase
        .from("applications")
        .insert({
          job_id: jobId,
          applicant_id: user.id,
          cover_letter: coverLetter.trim(),
          status: "submitted",
        });

      if (error) throw error;

      setHasApplied(true);
      setCoverLetter("");
      setMessage({ text: "Your application has been successfully submitted!", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-[#94a3b8]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-4"></div>
        <p>Loading opportunity parameters...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">Job listing not found</h2>
        <p className="text-[#94a3b8] mb-6">This job listing may have been closed or expired.</p>
        <Link href="/jobs" className="inline-flex items-center gap-2 text-accent hover:underline font-semibold">
          <ArrowLeft size={16} /> Back to Listings
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-10">
      <div className="container mx-auto px-6 max-w-5xl">
        
        {/* Back Button */}
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-white transition font-medium mb-8"
        >
          <ArrowLeft size={18} />
          Back to all jobs
        </Link>

        {message.text && (
          <div className={`p-4 rounded-xl mb-8 text-sm text-center border ${
            message.type === "error"
              ? "bg-red-500/20 text-red-200 border-red-500/30"
              : "bg-green-500/20 text-green-200 border-green-500/30"
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Job Details Block */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent to-purple-600"></div>

              <h1 className="text-3xl font-extrabold text-white mb-2">{job.title}</h1>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#94a3b8] mb-6">
                <span className="font-semibold text-white">{job.posted_by_profile?.full_name || "Enterprise Collaborator"}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} className="text-accent" />
                  {job.location}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar size={14} className="text-accent" />
                  Posted {new Date(job.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Job Specification Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-6 border-b border-white/10 mb-6">
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-center">
                  <span className="text-xs text-[#94a3b8] block mb-1">Salary Range</span>
                  <span className="font-bold text-white text-sm flex items-center justify-center gap-0.5">
                    <DollarSign size={14} className="text-green-400" />
                    {job.salary_min && job.salary_max
                      ? `${job.currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                      : "Negotiable"
                    }
                  </span>
                </div>
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-center">
                  <span className="text-xs text-[#94a3b8] block mb-1">Contract Type</span>
                  <span className="font-bold text-white text-sm capitalize flex items-center justify-center gap-1.5">
                    <Briefcase size={14} className="text-accent" />
                    {job.job_type.replace("_", " ")}
                  </span>
                </div>
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-center col-span-2 sm:col-span-1">
                  <span className="text-xs text-[#94a3b8] block mb-1">Experience Level</span>
                  <span className="font-bold text-white text-sm capitalize">
                    {job.experience_level}
                  </span>
                </div>
              </div>

              {/* Job Description Content */}
              <div className="space-y-4 mb-8">
                <h2 className="text-xl font-bold text-white">About the Position</h2>
                <div className="text-[#94a3b8] text-sm leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </div>
              </div>

              {/* Required Skills */}
              {job.skills_required && job.skills_required.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Required Skills Portfolio</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills_required.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-accent/10 border border-accent/20 text-[#a5b4fc] text-xs rounded-full font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Employer Info Card */}
            {job.posted_by_profile && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Building size={18} className="text-accent" />
                  About the Employer
                </h3>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {job.posted_by_profile.avatar_url ? (
                      <img src={job.posted_by_profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="text-[#94a3b8]" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">{job.posted_by_profile.full_name}</h4>
                    <p className="text-sm text-[#94a3b8] mt-1 leading-relaxed">{job.posted_by_profile.bio || "No company description provided."}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Area — Actions Drawer */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm sticky top-24">
              
              {hasApplied ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-400">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Application Submitted</h3>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    You have successfully applied to this job listing. The employer will review your profile and contact you soon.
                  </p>
                </div>
              ) : profile?.role === "employer" ? (
                <div className="text-center py-6">
                  <h3 className="text-lg font-bold text-white mb-2">Employer Account</h3>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    You are currently logged in as an employer. Only job seekers can apply to job listings.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4">
                  <h3 className="text-lg font-bold text-white mb-2">Submit Application</h3>
                  <p className="text-xs text-[#94a3b8] mb-4">
                    Send your verified skills and supporting certificates to this employer.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-2">Cover Letter *</label>
                    <textarea
                      rows={6}
                      required
                      placeholder="Introduce yourself and explain why your skills match this position..."
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      className="w-full p-3 bg-[#07111c] border border-white/10 rounded-xl text-white placeholder:text-[#475569] text-xs focus:outline-none focus:border-accent resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={applying || !coverLetter.trim()}
                    className="w-full py-3 bg-gradient-to-r from-accent to-purple-600 hover:opacity-90 text-white rounded-xl font-bold text-sm tracking-wide transition shadow-lg disabled:opacity-50"
                  >
                    {applying ? "Submitting application..." : "Apply Now"}
                  </button>
                  <p className="text-[10px] text-center text-[#475569]">
                    Clicking apply sends your skills profile and matching verified certificates automatically.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
