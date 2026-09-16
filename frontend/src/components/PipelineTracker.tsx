"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Briefcase, MapPin, CheckCircle2, FileText, ArrowRight } from "lucide-react";

export default function PipelineTracker() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    async function loadApplications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("applications")
        .select("*, job:jobs(title, location, posted_by)")
        .eq("applicant_id", user.id);

      if (!error && data) {
        setApplications(data);
      }
      setLoading(false);
    }
    loadApplications();
  }, []);

  const getAppsByStage = (stage: string) => {
    return applications.filter((app) => {
      if (stage === "submitted") return app.status === "submitted";
      if (stage === "reviewed") return app.status === "reviewed";
      if (stage === "interview") return app.status === "interview" || app.status === "scheduled";
      if (stage === "accepted") return app.status === "accepted" || app.status === "offer";
      return false;
    });
  };

  const columns = [
    { id: "submitted", title: "Submitted", color: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
    { id: "reviewed", title: "Under Review", color: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
    { id: "interview", title: "Interviews", color: "text-purple-400 border-purple-500/20 bg-purple-500/5" },
    { id: "accepted", title: "Accepted / Offers", color: "text-green-400 border-green-500/20 bg-green-500/5" },
  ];

  if (loading) {
    return <div className="text-sm text-muted text-center py-10">Loading pipeline status...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <Briefcase className="text-accent" size={20} /> Application Pipeline
        </h3>
        <p className="text-xs text-muted">Track the interactive journey of your tech submissions in real time.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colApps = getAppsByStage(col.id);
          return (
            <div key={col.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col h-[320px] backdrop-blur-sm">
              {/* Column Header */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between font-bold text-xs uppercase tracking-wider mb-4 ${col.color}`}>
                <span>{col.title}</span>
                <span className="px-2 py-0.5 bg-white/10 rounded-full text-[10px]">{colApps.length}</span>
              </div>

              {/* Cards list */}
              <div className="flex-1 overflow-y-auto space-y-3 scrollbar-none pr-1">
                {colApps.length > 0 ? (
                  colApps.map((app) => (
                    <div key={app.id} className="p-3.5 bg-black/35 border border-white/5 rounded-xl space-y-2 hover:border-accent transition group cursor-pointer">
                      <h4 className="font-bold text-white text-xs leading-snug group-hover:text-blue-300 transition line-clamp-1">
                        {app.job?.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted">
                        <MapPin size={10} /> <span>{app.job?.location}</span>
                      </div>
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px]">
                        <span className="text-slate-400 font-medium">Applied {new Date(app.created_at).toLocaleDateString()}</span>
                        {col.id === "accepted" && (
                          <span className="text-green-400 flex items-center gap-0.5 font-bold">
                            <CheckCircle2 size={10} /> Offer Received
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-center p-4 border border-dashed border-white/5 rounded-xl opacity-30">
                    <span className="text-[10px] text-muted">No items</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
