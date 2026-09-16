"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";
import PipelineTracker from "@/components/PipelineTracker";
import { LayoutDashboard, User, Settings } from "lucide-react";

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = (tabParam && ["dashboard", "profile", "settings"].includes(tabParam)) ? tabParam : "dashboard";

  const handleTabChange = (tabId: string) => {
    router.push(`/profile?tab=${tabId}`);
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "profile", label: "My Profile", icon: User },
    { id: "settings", label: "Account Settings", icon: Settings },
  ];

  return (
    <main className="min-h-screen py-16">
      <div className="container mx-auto px-6 max-w-5xl space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Your Dashboard</h1>
          <p className="text-muted">Manage your skills-first profile, application pipeline, and account preferences.</p>
        </div>

        {/* Custom Glassmorphic Tabs Navigation */}
        <div className="flex border-b border-white/10 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition relative border-b-2 -mb-[2px] ${
                  isActive 
                    ? "text-white border-accent" 
                    : "text-[#94a3b8] border-transparent hover:text-white"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="mt-8">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <PipelineTracker />
            </div>
          )}

          {activeTab === "profile" && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-10 shadow-xl backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                <User className="text-accent" size={20} /> My Profile Settings
              </h3>
              <ProfileForm mode="profile" />
            </div>
          )}

          {activeTab === "settings" && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-10 shadow-xl backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                <Settings className="text-accent" size={20} /> Account Settings
              </h3>
              <ProfileForm mode="settings" />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="text-white text-center py-20">Loading page...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
