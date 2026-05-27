"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, UserPlus, Users, Search, Check, X, Clock, HelpCircle, MapPin } from "lucide-react";

export default function NetworkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  
  // Tabs: 'discover', 'connections', 'pending'
  const [activeTab, setActiveTab] = useState("discover");

  // Data states
  const [allConnections, setAllConnections] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mentoringFilter, setMentoringFilter] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

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

      setProfile(profileData);

      await loadConnections(currentUser.id);
      await searchUsers(currentUser.id, "");
      setLoading(false);
    }
    loadData();
  }, [router]);

  async function loadConnections(userId: string) {
    try {
      const { data, error } = await supabase
        .from("connections")
        .select(`
          *,
          sender_profile:profiles!sender_id(*, credentials(verification_status)),
          receiver_profile:profiles!receiver_id(*, credentials(verification_status))
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      if (error) throw error;
      setAllConnections(data || []);
    } catch (err: any) {
      console.error("Error loading connections:", err.message);
    }
  }

  async function searchUsers(userId: string, query: string, mentoringOnly: boolean = false) {
    try {
      let req = supabase
        .from("profiles")
        .select(`*, credentials(verification_status)`)
        .eq("is_public", true)
        .neq("id", userId)
        .limit(20);

      if (query.trim()) {
        req = req.or(`full_name.ilike.%${query}%,bio.ilike.%${query}%`);
      }
      
      if (mentoringOnly) {
        req = req.eq("open_to_mentoring", true);
      }

      const { data, error } = await req;
      if (error) throw error;
      setSearchResults(data || []);
    } catch (err: any) {
      console.error("Error searching profiles:", err.message);
    }
  }

  useEffect(() => {
    if (user && activeTab === "discover") {
      searchUsers(user.id, searchQuery, mentoringFilter);
    }
  }, [mentoringFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      searchUsers(user.id, searchQuery, mentoringFilter);
    }
  };

  // Helper: Find connection record between current user and a target user
  const getConnectionRecord = (targetUserId: string) => {
    return allConnections.find(
      (c) =>
        (c.sender_id === user.id && c.receiver_id === targetUserId) ||
        (c.sender_id === targetUserId && c.receiver_id === user.id)
    );
  };

  async function sendConnectionRequest(targetId: string) {
    if (!user) return;
    setActionId(targetId);
    try {
      const { error } = await supabase.from("connections").insert({
        sender_id: user.id,
        receiver_id: targetId,
        status: "pending",
      });

      if (error) throw error;
      await loadConnections(user.id);
    } catch (err: any) {
      console.error("Error connecting:", err.message);
    } finally {
      setActionId(null);
    }
  }

  async function respondToConnection(connectionId: string, accept: boolean) {
    if (!user) return;
    setActionId(connectionId);
    try {
      if (accept) {
        const { error } = await supabase
          .from("connections")
          .update({ status: "accepted" })
          .eq("id", connectionId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("connections")
          .delete()
          .eq("id", connectionId);
        if (error) throw error;
      }
      await loadConnections(user.id);
    } catch (err: any) {
      console.error("Error responding to connection:", err.message);
    } finally {
      setActionId(null);
    }
  }

  // Segmenting Connections
  const connectedProfiles = allConnections
    .filter((c) => c.status === "accepted")
    .map((c) => (c.sender_id === user?.id ? c.receiver_profile : c.sender_profile));

  const pendingReceived = allConnections.filter(
    (c) => c.status === "pending" && c.receiver_id === user?.id
  );

  const pendingSent = allConnections.filter(
    (c) => c.status === "pending" && c.sender_id === user?.id
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-[#94a3b8]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-4"></div>
        <p>Loading network graph...</p>
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">Professional Network</h1>
            <p className="text-[#94a3b8] mt-2">Connect with industry peers, showcase skills, and grow relationships.</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 mb-8">
          <button
            onClick={() => setActiveTab("discover")}
            className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition ${
              activeTab === "discover"
                ? "border-accent text-white"
                : "border-transparent text-[#94a3b8] hover:text-white"
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setActiveTab("connections")}
            className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === "connections"
                ? "border-accent text-white"
                : "border-transparent text-[#94a3b8] hover:text-white"
            }`}
          >
            Connections
            <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs font-bold text-white">
              {connectedProfiles.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === "pending"
                ? "border-accent text-white"
                : "border-transparent text-[#94a3b8] hover:text-white"
            }`}
          >
            Pending Requests
            {(pendingReceived.length > 0) && (
              <span className="px-2 py-0.5 bg-amber-500 text-black rounded-full text-xs font-bold animate-pulse">
                {pendingReceived.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Contents: DISCOVER */}
        {activeTab === "discover" && (
          <div className="space-y-6">
            <form onSubmit={handleSearchSubmit} className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#94a3b8]" size={20} />
              <input
                type="text"
                placeholder="Search profiles by name, bio, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-accent placeholder:text-[#475569] backdrop-blur-sm transition-all focus:ring-1 focus:ring-accent/50 text-sm"
              />
            </form>
            <div className="flex items-center gap-2 mb-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-[#94a3b8] hover:text-white transition">
                <input 
                  type="checkbox" 
                  checked={mentoringFilter} 
                  onChange={(e) => setMentoringFilter(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-accent focus:ring-accent/50"
                />
                Open to Mentoring
              </label>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((p) => {
                  const conn = getConnectionRecord(p.id);
                  let actionBtn = null;

                  if (actionId === p.id) {
                    actionBtn = (
                      <span className="text-xs text-[#475569] animate-pulse">...</span>
                    );
                  } else if (!conn) {
                    actionBtn = (
                      <button
                        onClick={() => sendConnectionRequest(p.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:opacity-90 text-white rounded-lg text-xs font-bold transition"
                      >
                        <UserPlus size={14} /> Connect
                      </button>
                    );
                  } else if (conn.status === "accepted") {
                    actionBtn = (
                      <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Check size={12} /> Connected
                      </span>
                    );
                  } else if (conn.status === "pending" && conn.sender_id === user.id) {
                    actionBtn = (
                      <span className="px-3 py-1 bg-white/5 border border-white/10 text-[#94a3b8] rounded-lg text-xs font-bold flex items-center gap-1">
                        <Clock size={12} /> Sent
                      </span>
                    );
                  } else if (conn.status === "pending" && conn.receiver_id === user.id) {
                    actionBtn = (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => respondToConnection(conn.id, true)}
                          className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                          title="Accept Request"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => respondToConnection(conn.id, false)}
                          className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                          title="Decline Request"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={p.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {p.avatar_url ? (
                              <img src={p.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <Users size={20} className="text-[#94a3b8]" />
                            )}
                          </div>
                          {actionBtn}
                        </div>

                        <h3 className="font-bold text-white text-base leading-tight mb-0.5 flex items-center gap-2">
                          <Link href={`/profile/${p.id}`} className="hover:text-accent transition">{p.full_name || "Professional"}</Link>
                          {p.credentials && p.credentials.length > 0 && (
                            <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded text-[9px] uppercase tracking-wider font-bold" title="AI Verified Credentials">
                              Verified
                            </span>
                          )}
                        </h3>
                        <span className="text-[10px] text-accent uppercase font-bold tracking-wider capitalize block mb-3">
                          {p.role?.replace("_", " ")}
                        </span>
                        
                        {p.bio && (
                          <p className="text-xs text-[#94a3b8] line-clamp-2 leading-relaxed mb-4">
                            "{p.bio}"
                          </p>
                        )}

                        {p.location && (
                          <div className="flex items-center gap-1 text-[11px] text-[#475569] mb-4">
                            <MapPin size={12} className="text-accent" />
                            {p.location}
                          </div>
                        )}
                      </div>

                      {p.skills && p.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 border-t border-white/5 pt-4">
                          {p.skills.slice(0, 3).map((skill: string) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 bg-white/5 border border-white/10 text-[#94a3b8] text-[10px] rounded"
                            >
                              {skill}
                            </span>
                          ))}
                          {p.skills.length > 3 && (
                            <span className="px-2 py-0.5 text-[#475569] text-[10px] font-bold">
                              +{p.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                <HelpCircle size={48} className="mx-auto text-[#475569] mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No profiles discovered</h3>
                <p className="text-sm text-[#94a3b8]">Type search keywords to find specific career collaborators.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab Contents: CONNECTIONS */}
        {activeTab === "connections" && (
          <div>
            {connectedProfiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connectedProfiles.map((p: any) => {
                  const conn = getConnectionRecord(p.id);
                  return (
                    <div
                      key={p.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {p.avatar_url ? (
                              <img src={p.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <Users size={20} className="text-[#94a3b8]" />
                            )}
                          </div>
                          <button
                            onClick={() => conn && respondToConnection(conn.id, false)}
                            className="px-2.5 py-1 border border-red-500/30 hover:bg-red-500/15 text-red-400 rounded-lg text-[10px] font-bold transition"
                          >
                            Disconnect
                          </button>
                        </div>

                        <h3 className="font-bold text-white text-base leading-tight mb-0.5 flex items-center gap-2">
                          <Link href={`/profile/${p.id}`} className="hover:text-accent transition">{p.full_name || "Professional"}</Link>
                          {p.credentials && p.credentials.length > 0 && (
                            <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded text-[9px] uppercase tracking-wider font-bold" title="AI Verified Credentials">
                              Verified
                            </span>
                          )}
                        </h3>
                        <span className="text-[10px] text-accent uppercase font-bold tracking-wider capitalize block mb-3">
                          {p.role?.replace("_", " ")}
                        </span>
                        
                        {p.bio && (
                          <p className="text-xs text-[#94a3b8] line-clamp-2 leading-relaxed mb-4">
                            "{p.bio}"
                          </p>
                        )}
                      </div>

                      {p.skills && p.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 border-t border-white/5 pt-4">
                          {p.skills.slice(0, 3).map((skill: string) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 bg-white/5 border border-white/10 text-[#94a3b8] text-[10px] rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                <Users size={48} className="mx-auto text-[#475569] mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No active connections</h3>
                <p className="text-sm text-[#94a3b8] mb-6">Explore the discover tab to establish professional relationships.</p>
                <button
                  onClick={() => setActiveTab("discover")}
                  className="px-6 py-2.5 bg-accent text-white rounded-xl hover:opacity-90 transition font-semibold text-sm"
                >
                  Find Connections
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab Contents: PENDING */}
        {activeTab === "pending" && (
          <div className="space-y-8">
            {/* Received Requests */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Clock size={18} className="text-amber-400" />
                Received Connection Invites
              </h2>

              {pendingReceived.length > 0 ? (
                <div className="space-y-4">
                  {pendingReceived.map((req) => {
                    const p = req.sender_profile;
                    return (
                      <div
                        key={req.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-black/20 rounded-xl border border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {p?.avatar_url ? (
                              <img src={p.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <Users size={16} className="text-[#94a3b8]" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{p?.full_name || "Professional"}</h4>
                            <p className="text-xs text-[#94a3b8] line-clamp-1">{p?.bio || "Professional network collaborator."}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => respondToConnection(req.id, true)}
                            disabled={actionId === req.id}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => respondToConnection(req.id, false)}
                            disabled={actionId === req.id}
                            className="px-4 py-2 bg-white/5 border border-white/10 text-[#94a3b8] hover:bg-white/10 rounded-xl text-xs font-bold transition disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#94a3b8] italic">No pending connection requests received.</p>
              )}
            </div>

            {/* Sent Requests */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Clock size={18} className="text-[#94a3b8]" />
                Sent Invites
              </h2>

              {pendingSent.length > 0 ? (
                <div className="space-y-4">
                  {pendingSent.map((req) => {
                    const p = req.receiver_profile;
                    return (
                      <div
                        key={req.id}
                        className="flex items-center justify-between gap-4 p-4 bg-black/20 rounded-xl border border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {p?.avatar_url ? (
                              <img src={p.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <Users size={16} className="text-[#94a3b8]" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{p?.full_name || "Professional"}</h4>
                            <p className="text-xs text-[#94a3b8] line-clamp-1">{p?.bio || "Professional network collaborator."}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => respondToConnection(req.id, false)}
                          disabled={actionId === req.id}
                          className="px-3 py-1.5 border border-red-500/30 hover:bg-red-500/15 text-red-400 rounded-lg text-xs font-bold transition disabled:opacity-50"
                        >
                          Cancel request
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#94a3b8] italic">No pending sent connection requests.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
