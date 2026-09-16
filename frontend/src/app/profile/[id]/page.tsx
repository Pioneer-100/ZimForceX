"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, User, MapPin, CheckCircle2, ShieldCheck, 
  Award, Globe, Briefcase, Mail, Phone 
} from "lucide-react";

// Custom Brand SVGs
const LinkedInIcon = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const GitHubIcon = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function PublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [endorsements, setEndorsements] = useState<any[]>([]);
  const [workExperiences, setWorkExperiences] = useState<any[]>([]);
  
  // Power state for endorsing
  const [canEndorse, setCanEndorse] = useState(false);
  const [isEndorsing, setIsEndorsing] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfileData() {
      setLoading(true);
      
      const { data: { user: cUser } } = await supabase.auth.getUser();
      setCurrentUser(cUser);

      // Fetch Profile
      const { data: pData, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (pError || !pData || (!pData.is_public && cUser?.id !== id)) {
        setLoading(false);
        return;
      }
      setProfile(pData);

      // Fetch Credentials
      const { data: credData } = await supabase
        .from("credentials")
        .select("*")
        .eq("user_id", id)
        .eq("verification_status", "verified");
      setCredentials(credData || []);

      // Fetch Work Experiences Relational Table
      const { data: experiencesData } = await supabase
        .from("work_experiences")
        .select("*")
        .eq("user_id", id)
        .order("start_date", { ascending: false });
      setWorkExperiences(experiencesData || []);

      // Fetch Endorsements
      await fetchEndorsements();

      // Check if can endorse (if logged in and not looking at own profile)
      if (cUser && cUser.id !== id) {
        // Log profile view
        supabase.from("profile_views").insert({ viewer_id: cUser.id, profile_id: id }).then();

        // Check endorsement power using RPC or raw query
        const { data: powerData } = await supabase.rpc("can_endorse", { 
          endorser: cUser.id, 
          endorsee: id 
        });
        setCanEndorse(!!powerData);
      }

      setLoading(false);
    }
    
    if (id) {
      loadProfileData();
    }
  }, [id]);

  async function fetchEndorsements() {
    const { data } = await supabase
      .from("skill_endorsements")
      .select("*, endorser:profiles!endorser_id(full_name, avatar_url, experience_level)")
      .eq("endorsee_id", id);
    setEndorsements(data || []);
  }

  async function handleEndorse(skill: string) {
    if (!currentUser || !canEndorse) return;
    setIsEndorsing(skill);
    try {
      const { error } = await supabase
        .from("skill_endorsements")
        .insert({
          endorser_id: currentUser.id,
          endorsee_id: id,
          skill: skill
        });
      
      if (!error) {
        await fetchEndorsements();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEndorsing(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#94a3b8]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-4"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <ShieldCheck size={64} className="text-[#475569] mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
        <p className="text-[#94a3b8] mb-6">This profile may be private or does not exist.</p>
        <Link href="/network" className="px-6 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition">
          Return to Network
        </Link>
      </div>
    );
  }

  const hasVerifiedCreds = credentials.length > 0;
  const experiences = workExperiences;

  return (
    <main className="min-h-screen py-10">
      <div className="container mx-auto px-6 max-w-5xl">
        <Link href="/network" className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-white transition font-medium mb-8">
          <ArrowLeft size={18} /> Back to Network
        </Link>

        {/* Header Section */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm mb-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-[#94a3b8]" />
            )}
          </div>
          
          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-extrabold text-white">{profile.full_name}</h1>
              {hasVerifiedCreds && (
                <span className="px-2 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded flex items-center gap-1 text-xs uppercase tracking-wider font-bold" title="Identity & Credentials Verified">
                  <CheckCircle2 size={12} /> Verified
                </span>
              )}
              {profile.open_to_mentoring && (
                <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded flex items-center gap-1 text-xs uppercase tracking-wider font-bold">
                  Open to Mentoring
                </span>
              )}
            </div>
            
            <h2 className="text-lg text-accent font-medium mb-4 capitalize">
              {profile.target_role || profile.role?.replace("_", " ")} • {profile.experience_level}
            </h2>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#94a3b8]">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={16} /> {profile.location}
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-1">
                  <Mail size={16} /> {profile.email}
                </div>
              )}
              {profile.phone_number && (
                <div className="flex items-center gap-1">
                  <Phone size={16} /> {profile.phone_number}
                </div>
              )}
            </div>
          </div>

          {/* Social Icons Header Block */}
          <div className="flex items-center gap-3 self-start md:self-center mt-4 md:mt-0 bg-black/15 p-3 rounded-2xl border border-white/5">
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noreferrer" className="text-muted hover:text-white transition p-2 bg-white/5 rounded-lg border border-white/5">
                <Globe size={18} />
              </a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="text-muted hover:text-white transition p-2 bg-white/5 rounded-lg border border-white/5">
                <LinkedInIcon size={18} className="text-muted hover:text-white" />
              </a>
            )}
            {profile.github_url && (
              <a href={profile.github_url} target="_blank" rel="noreferrer" className="text-muted hover:text-white transition p-2 bg-white/5 rounded-lg border border-white/5">
                <GitHubIcon size={18} className="text-muted hover:text-white" />
              </a>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* About / Bio */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">About</h3>
              <p className="text-[#94a3b8] leading-relaxed whitespace-pre-wrap">
                {profile.bio || "No bio provided."}
              </p>
            </div>

            {/* Past Work Experiences */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Past Work Experiences</h3>
              {experiences.length > 0 ? (
                <div className="space-y-6">
                  {experiences.map((exp: any) => (
                    <div key={exp.id || Math.random()} className="flex gap-4">
                      <div className="p-3 bg-accent/10 border border-accent/20 text-accent rounded-2xl h-fit">
                        <Briefcase size={20} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-base">{exp.role}</h4>
                        <p className="text-sm text-blue-300 font-semibold">{exp.company}</p>
                        <p className="text-xs text-[#94a3b8]">{exp.start_date} — {exp.end_date}</p>
                        {exp.description && (
                          <p className="text-sm text-muted leading-relaxed mt-2 whitespace-pre-wrap">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#94a3b8] italic">No work experiences listed yet.</p>
              )}
            </div>

            {/* Skills & Endorsements */}
            {profile.show_skills !== false && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Skills & Endorsements</h3>
                
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="space-y-4">
                    {profile.skills.map((skill: string) => {
                      const skillEndorsements = endorsements.filter(e => e.skill === skill);
                      const hasEndorsed = skillEndorsements.some(e => e.endorser_id === currentUser?.id);
                      
                      return (
                        <div key={skill} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-black/20 rounded-xl border border-white/5">
                          <div>
                            <div className="font-semibold text-white mb-1 flex items-center gap-2">
                              {skill}
                              {skillEndorsements.length > 0 && (
                                <span className="px-1.5 py-0.5 bg-accent/20 text-blue-200 text-xs rounded-full font-bold flex items-center gap-1">
                                  <Award size={12} /> {skillEndorsements.length}
                                </span>
                              )}
                            </div>
                            
                            {skillEndorsements.length > 0 && (
                              <div className="flex -space-x-2 mt-2">
                                {skillEndorsements.slice(0, 5).map((e) => (
                                  <div key={e.id} className="w-6 h-6 rounded-full border border-black bg-white/10 overflow-hidden" title={e.endorser.full_name}>
                                    {e.endorser.avatar_url ? (
                                      <img src={e.endorser.avatar_url} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                      <User size={12} className="m-auto h-full text-white/50" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {canEndorse && !hasEndorsed && (
                            <button
                              onClick={() => handleEndorse(skill)}
                              disabled={isEndorsing === skill}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
                            >
                              {isEndorsing === skill ? "..." : "+ Endorse"}
                            </button>
                          )}
                          {canEndorse && hasEndorsed && (
                            <span className="text-xs font-bold text-accent px-3 py-1.5">Endorsed</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[#94a3b8] italic">No skills listed yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {hasVerifiedCreds && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Verified Credentials</h3>
                <div className="space-y-4">
                  {credentials.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <div className="mt-1 text-green-400 flex-shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white leading-tight">{c.title}</div>
                        <div className="text-xs text-[#94a3b8] mt-1">{c.issuing_organization}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {profile.show_connections !== false && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Network</h3>
                <p className="text-sm text-[#94a3b8]">
                  Connections are private, but you can interact with {profile.full_name.split(' ')[0]} via the Network hub.
                </p>
                <div className="mt-4">
                   <Link href="/network" className="text-sm text-accent hover:underline font-bold">Go to Network</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
