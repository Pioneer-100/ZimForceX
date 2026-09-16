"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import AuthModal from "./AuthModal";
import { Menu, X, User, LogOut, LayoutDashboard, Settings, ChevronDown, Briefcase, GraduationCap } from "lucide-react";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [initialView, setInitialView] = useState<"login" | "signup">("login");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  
  // Hover states for opportunities/growth dropdowns
  const [oppHover, setOppHover] = useState(false);
  const [growthHover, setGrowthHover] = useState(false);

  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadSessionAndProfile() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        setProfile(profileData);
      } else {
        setProfile(null);
      }
    }
    loadSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      }
    );

    // Click outside handler for account menu
    const handleOutsideClick = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      authListener.subscription.unsubscribe();
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const openLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setInitialView("login");
    setShowModal(true);
    setMobileMenuOpen(false);
  };

  const openSignup = (e: React.MouseEvent) => {
    e.preventDefault();
    setInitialView("signup");
    setShowModal(true);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAccountMenuOpen(false);
    window.location.href = "/";
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#07111c]/80 backdrop-blur-md border-b border-white/10 py-4">
        <div className="container mx-auto px-6 max-w-5xl flex items-center justify-between">
          <Link href="/" className="font-extrabold text-2xl tracking-wide text-gradient inline-block hover:opacity-90 transition">
            ZimForceX
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {user ? (
              <>
                {/* Opportunities Dropdown (Jobs & Gigs) */}
                <div 
                  className="relative"
                  onMouseEnter={() => setOppHover(true)}
                  onMouseLeave={() => setOppHover(false)}
                >
                  <button className="flex items-center gap-1 text-[#94a3b8] hover:text-white transition text-sm font-semibold h-[40px]">
                    Opportunities <ChevronDown size={14} />
                  </button>
                  {oppHover && (
                    <div className="absolute left-0 mt-0 w-44 bg-[#0a1929]/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl p-2 flex flex-col gap-1">
                      <Link href="/jobs" className="flex items-center gap-2 p-2 text-sm text-[#94a3b8] hover:text-white rounded-lg hover:bg-white/5 transition">
                        <Briefcase size={14} /> Jobs
                      </Link>
                      <Link href="/gigs" className="flex items-center gap-2 p-2 text-sm text-[#94a3b8] hover:text-white rounded-lg hover:bg-white/5 transition">
                        <Briefcase size={14} className="text-green-400" /> Gigs
                      </Link>
                      {profile?.role === "employer" && (
                        <Link href="/jobs/post" className="flex items-center gap-2 p-2 text-sm text-[#94a3b8] hover:text-white rounded-lg hover:bg-white/5 transition border-t border-white/5 pt-2 mt-1">
                          Post Job
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {/* Growth Dropdown (Learning & Mentorship) */}
                <div 
                  className="relative"
                  onMouseEnter={() => setGrowthHover(true)}
                  onMouseLeave={() => setGrowthHover(false)}
                >
                  <button className="flex items-center gap-1 text-[#94a3b8] hover:text-white transition text-sm font-semibold h-[40px]">
                    Growth <ChevronDown size={14} />
                  </button>
                  {growthHover && (
                    <div className="absolute left-0 mt-0 w-44 bg-[#0a1929]/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl p-2 flex flex-col gap-1">
                      <Link href="/learning" className="flex items-center gap-2 p-2 text-sm text-[#94a3b8] hover:text-white rounded-lg hover:bg-white/5 transition">
                        <GraduationCap size={14} /> Learning
                      </Link>
                      <Link href="/mentorship" className="flex items-center gap-2 p-2 text-sm text-[#94a3b8] hover:text-white rounded-lg hover:bg-white/5 transition">
                        <User size={14} className="text-blue-400" /> Mentorship
                      </Link>
                    </div>
                  )}
                </div>

                <Link href="/network" className="text-[#94a3b8] hover:text-white transition text-sm font-semibold">
                  Network
                </Link>
                <Link href="/events" className="text-[#94a3b8] hover:text-white transition text-sm font-semibold">
                  Events
                </Link>
                <Link href="/community" className="text-[#94a3b8] hover:text-white transition text-sm font-semibold">
                  Community
                </Link>
                {profile?.role === "employer" && (
                  <Link href="/applications" className="text-[#94a3b8] hover:text-white transition text-sm font-semibold">
                    Applications
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/" className="text-[#94a3b8] hover:text-white transition text-sm font-medium">
                  Home
                </Link>
                <Link href="/#features" className="text-[#94a3b8] hover:text-white transition text-sm font-medium">
                  Features
                </Link>
              </>
            )}
          </nav>

          {/* Account Menu (Top Right) */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative" ref={accountMenuRef}>
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center hover:border-accent transition"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} className="text-[#94a3b8]" />
                  )}
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-[#0a1929]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 flex flex-col gap-1">
                    <div className="p-3 border-b border-white/5 mb-1">
                      <div className="text-sm font-bold text-white leading-tight truncate">{profile?.full_name || "Account"}</div>
                      <div className="text-[10px] text-muted truncate mt-0.5">{user.email}</div>
                    </div>
                    <Link 
                      href="/profile?tab=dashboard" 
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 text-sm text-[#94a3b8] hover:text-white rounded-xl hover:bg-white/5 transition"
                    >
                      <LayoutDashboard size={16} /> Dashboard
                    </Link>
                    <Link 
                      href="/profile?tab=profile" 
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 text-sm text-[#94a3b8] hover:text-white rounded-xl hover:bg-white/5 transition"
                    >
                      <User size={16} /> My Profile
                    </Link>
                    <Link 
                      href="/profile?tab=settings" 
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 text-sm text-[#94a3b8] hover:text-white rounded-xl hover:bg-white/5 transition"
                    >
                      <Settings size={16} /> Account Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 p-2 text-sm text-red-400 hover:text-red-300 rounded-xl hover:bg-red-500/5 transition border-t border-white/5 mt-1 pt-2"
                    >
                      <LogOut size={16} /> Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <button
                  onClick={openLogin}
                  className="px-4 py-2 border border-white/10 text-white rounded-lg hover:bg-white/5 transition font-semibold text-sm"
                >
                  Log in
                </button>
                <button
                  onClick={openSignup}
                  className="px-4 py-2 bg-gradient-to-r from-accent to-purple-600 text-white rounded-lg hover:opacity-90 transition font-semibold text-sm"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Hamburger Icon for Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#94a3b8] hover:text-white transition"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Side Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-[65px] z-40 bg-[#020617]/95 backdrop-blur-lg border-t border-white/10 flex flex-col p-6 overflow-y-auto">
            <nav className="flex flex-col gap-6 text-lg font-semibold">
              {user ? (
                <>
                  <div className="text-xs uppercase tracking-wider text-muted font-bold -mb-2">Opportunities</div>
                  <Link href="/jobs" onClick={() => setMobileMenuOpen(false)} className="text-[#94a3b8] hover:text-white transition pl-2">
                    Jobs
                  </Link>
                  <Link href="/gigs" onClick={() => setMobileMenuOpen(false)} className="text-[#94a3b8] hover:text-white transition pl-2">
                    Gigs
                  </Link>
                  {profile?.role === "employer" && (
                    <Link href="/jobs/post" onClick={() => setMobileMenuOpen(false)} className="text-[#94a3b8] hover:text-white transition pl-2">
                      Post Job
                    </Link>
                  )}

                  <div className="text-xs uppercase tracking-wider text-muted font-bold -mb-2 mt-2">Growth</div>
                  <Link href="/learning" onClick={() => setMobileMenuOpen(false)} className="text-[#94a3b8] hover:text-white transition pl-2">
                    Learning
                  </Link>
                  <Link href="/mentorship" onClick={() => setMobileMenuOpen(false)} className="text-[#94a3b8] hover:text-white transition pl-2">
                    Mentorship
                  </Link>

                  <div className="text-xs uppercase tracking-wider text-muted font-bold -mb-2 mt-2">General</div>
                  <Link href="/network" onClick={() => setMobileMenuOpen(false)} className="text-[#94a3b8] hover:text-white transition pl-2">
                    Network
                  </Link>
                  <Link href="/events" onClick={() => setMobileMenuOpen(false)} className="text-[#94a3b8] hover:text-white transition pl-2">
                    Events
                  </Link>
                  <Link href="/community" onClick={() => setMobileMenuOpen(false)} className="text-[#94a3b8] hover:text-white transition pl-2">
                    Community
                  </Link>
                  {profile?.role === "employer" && (
                    <Link href="/applications" onClick={() => setMobileMenuOpen(false)} className="text-[#94a3b8] hover:text-white transition pl-2">
                      Applications
                    </Link>
                  )}

                  <div className="flex flex-col gap-4 border-t border-white/10 pt-6 mt-4">
                    <Link href="/profile?tab=dashboard" onClick={() => setMobileMenuOpen(false)} className="w-full text-center px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition font-bold text-sm">
                      Dashboard
                    </Link>
                    <Link href="/profile?tab=profile" onClick={() => setMobileMenuOpen(false)} className="w-full text-center px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition font-bold text-sm">
                      My Profile
                    </Link>
                    <Link href="/profile?tab=settings" onClick={() => setMobileMenuOpen(false)} className="w-full text-center px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition font-bold text-sm">
                      Account Settings
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-center px-4 py-2.5 border border-red-500/20 text-red-400 hover:text-red-300 rounded-xl hover:bg-red-500/5 transition font-bold text-sm"
                    >
                      Log out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-[#94a3b8] hover:text-white transition">
                    Home
                  </Link>
                  <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="text-[#94a3b8] hover:text-white transition">
                    Features
                  </Link>
                  <div className="flex flex-col gap-4 border-t border-white/10 pt-6 mt-2">
                    <button
                      onClick={openLogin}
                      className="w-full px-4 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 transition font-bold text-base"
                    >
                      Log in
                    </button>
                    <button
                      onClick={openSignup}
                      className="w-full px-4 py-3 bg-gradient-to-r from-accent to-purple-600 text-white rounded-xl hover:opacity-90 transition font-bold text-base"
                    >
                      Get Started
                    </button>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {showModal && <AuthModal initialView={initialView} onClose={() => setShowModal(false)} />}
    </>
  );
}
