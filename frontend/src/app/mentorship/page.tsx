"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Users, GraduationCap, MapPin, Briefcase, Calendar, CheckCircle, Clock } from "lucide-react";

export default function MentorshipPage() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    async function loadMentorshipData() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Fetch mentors
      const { data: mentorsData } = await supabase
        .from("profiles")
        .select("*")
        .eq("open_to_mentoring", true)
        .neq("id", currentUser?.id); // Exclude self
      
      if (mentorsData) setMentors(mentorsData);

      // Fetch active sessions if logged in
      if (currentUser) {
        const { data: sessionsData } = await supabase
          .from("mentorship_sessions")
          .select("*, mentor:profiles!mentor_id(full_name, avatar_url, role), mentee:profiles!mentee_id(full_name, avatar_url, role)")
          .or(`mentor_id.eq.${currentUser.id},mentee_id.eq.${currentUser.id}`)
          .order("created_at", { ascending: false });
        
        if (sessionsData) setSessions(sessionsData);
      }
      setLoading(false);
    }
    loadMentorshipData();
  }, []);

  const requestMentorship = async (mentorId: string) => {
    if (!user) {
      setMessage({ text: "Please log in to request mentorship.", type: "error" });
      return;
    }

    try {
      const { error } = await supabase.from("mentorship_sessions").insert({
        mentor_id: mentorId,
        mentee_id: user.id,
        status: "pending"
      });

      if (error) throw error;
      
      setMessage({ text: "Mentorship request sent successfully!", type: "success" });
      
      // Refresh sessions
      const { data: sessionsData } = await supabase
        .from("mentorship_sessions")
        .select("*, mentor:profiles!mentor_id(full_name, avatar_url, role), mentee:profiles!mentee_id(full_name, avatar_url, role)")
        .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      
      if (sessionsData) setSessions(sessionsData);
      
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const updateSessionStatus = async (sessionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("mentorship_sessions")
        .update({ status: newStatus })
        .eq("id", sessionId);

      if (error) throw error;
      
      setSessions(sessions.map(s => s.id === sessionId ? { ...s, status: newStatus } : s));
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 pt-24 pb-12">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-accent/20 to-purple-500/20 rounded-xl">
              <GraduationCap className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-4xl font-extrabold text-white">Mentor Directory</h1>
          </div>
          <p className="text-[#94a3b8] text-lg max-w-2xl">
            Accelerate your career by connecting with verified industry leaders in Zimbabwe. Book 1-on-1 sessions, get resume feedback, and navigate your career path with expert guidance.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-5xl mt-12">
        {message.text && (
          <div className={`p-4 rounded-xl mb-8 border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
            {message.text}
          </div>
        )}

        {/* My Sessions (if any) */}
        {user && sessions.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-accent" /> My Sessions
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              {sessions.map((session) => {
                const isMentor = session.mentor_id === user.id;
                const otherParty = isMentor ? session.mentee : session.mentor;
                
                return (
                  <div key={session.id} className="p-6 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-white/[0.02] transition">
                    <div className="flex items-center gap-4">
                      {otherParty.avatar_url ? (
                        <img src={otherParty.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-white/10" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                          <Users className="w-6 h-6 text-[#94a3b8]" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold">{otherParty.full_name || "Anonymous User"}</span>
                          <span className="text-xs text-[#94a3b8] bg-white/5 px-2 py-0.5 rounded">
                            {isMentor ? "Mentee" : "Mentor"}
                          </span>
                        </div>
                        <p className="text-sm text-accent">{session.status.charAt(0).toUpperCase() + session.status.slice(1)}</p>
                      </div>
                    </div>
                    
                    {isMentor && session.status === "pending" && (
                      <div className="flex gap-2">
                        <button onClick={() => updateSessionStatus(session.id, "accepted")} className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-sm transition">Accept</button>
                        <button onClick={() => updateSessionStatus(session.id, "declined")} className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm transition">Decline</button>
                      </div>
                    )}
                    {session.status === "accepted" && (
                      <button onClick={() => updateSessionStatus(session.id, "completed")} className="px-4 py-2 bg-accent/20 text-accent hover:bg-accent/30 rounded-lg text-sm transition">Mark Completed</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mentor Directory */}
        <h2 className="text-2xl font-bold text-white mb-6">Available Mentors</h2>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
          </div>
        ) : mentors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => {
              const hasRequested = sessions.some(s => s.mentor_id === mentor.id && s.mentee_id === user?.id);
              
              return (
                <div key={mentor.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-accent/40 transition duration-300 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    {mentor.avatar_url ? (
                      <img src={mentor.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-white/10">
                        <Users className="w-8 h-8 text-[#94a3b8]" />
                      </div>
                    )}
                    <span className="bg-accent/10 text-accent text-xs font-semibold px-2 py-1 rounded-full border border-accent/20">
                      Top Mentor
                    </span>
                  </div>
                  
                  <Link href={`/profile/${mentor.id}`} className="text-xl font-bold text-white hover:text-blue-300 transition line-clamp-1 mb-1">
                    {mentor.full_name || "Anonymous User"}
                  </Link>
                  
                  <div className="flex items-center gap-2 text-sm text-[#94a3b8] mb-3">
                    <Briefcase className="w-4 h-4" />
                    <span className="line-clamp-1">{mentor.target_role || mentor.role}</span>
                  </div>
                  
                  {mentor.location && (
                    <div className="flex items-center gap-2 text-sm text-[#94a3b8] mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>{mentor.location}</span>
                    </div>
                  )}
                  
                  <p className="text-sm text-[#94a3b8] line-clamp-3 mb-6 flex-1">
                    {mentor.bio || "No bio provided. But they are open to mentoring!"}
                  </p>
                  
                  <button
                    onClick={() => requestMentorship(mentor.id)}
                    disabled={hasRequested || !user}
                    className={`w-full py-3 rounded-xl font-semibold transition ${
                      hasRequested 
                        ? 'bg-white/10 text-[#94a3b8] cursor-not-allowed' 
                        : 'bg-gradient-to-r from-accent to-purple-600 text-white hover:opacity-90'
                    }`}
                  >
                    {hasRequested ? (
                      <span className="flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4"/> Request Pending</span>
                    ) : (
                      "Request Mentorship"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
            <Users className="w-12 h-12 text-[#94a3b8] mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-white mb-2">No mentors available yet</h3>
            <p className="text-[#94a3b8]">Check back later as professionals opt-in to mentoring.</p>
          </div>
        )}
      </div>
    </div>
  );
}
