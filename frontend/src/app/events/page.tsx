"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, MapPin, Users, Video, Plus, Check } from "lucide-react";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [rsvpStatus, setRsvpStatus] = useState<Record<string, string>>({}); // eventId -> status

  useEffect(() => {
    async function loadEvents() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Fetch upcoming events
      const { data, error } = await supabase
        .from("events")
        .select("*, organizer:profiles!organizer_id(full_name, avatar_url)")
        .order("event_date", { ascending: true });

      if (!error && data) {
        setEvents(data);
        
        // Fetch user RSVPs if logged in
        if (currentUser) {
          const { data: rsvps } = await supabase
            .from("event_attendees")
            .select("event_id, rsvp_status")
            .eq("user_id", currentUser.id);
            
          if (rsvps) {
            const statusMap: Record<string, string> = {};
            rsvps.forEach(r => { statusMap[r.event_id] = r.rsvp_status; });
            setRsvpStatus(statusMap);
          }
        }
      }
      setLoading(false);
    }
    loadEvents();
  }, []);

  const handleRSVP = async (eventId: string, status: string) => {
    if (!user) {
      alert("Please log in to RSVP.");
      return;
    }

    try {
      const currentStatus = rsvpStatus[eventId];
      
      if (currentStatus === status) {
        // Cancel RSVP
        await supabase.from("event_attendees").delete().match({ event_id: eventId, user_id: user.id });
        setRsvpStatus(prev => {
          const next = { ...prev };
          delete next[eventId];
          return next;
        });
      } else {
        // Upsert RSVP
        await supabase.from("event_attendees").upsert({
          event_id: eventId,
          user_id: user.id,
          rsvp_status: status
        });
        setRsvpStatus(prev => ({ ...prev, [eventId]: status }));
      }
    } catch (err: any) {
      console.error("RSVP Error:", err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#07111c] pb-20">
      <div className="bg-[#0a1929] border-b border-white/10 pt-24 pb-12">
        <div className="container mx-auto px-6 max-w-5xl flex justify-between items-end">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
                <Calendar className="w-8 h-8 text-blue-400" />
              </div>
              <h1 className="text-4xl font-extrabold text-white">Tech Events & Meetups</h1>
            </div>
            <p className="text-[#94a3b8] text-lg max-w-2xl">
              Discover local hackathons, virtual webinars, and networking events in Zimbabwe. Grow your network and your skills.
            </p>
          </div>
          <button className="hidden sm:flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl transition font-semibold">
            <Plus className="w-5 h-5" /> Host an Event
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-5xl mt-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const eventDate = new Date(event.event_date);
              const isGoing = rsvpStatus[event.id] === "going";
              
              return (
                <div key={event.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition duration-300 flex flex-col group">
                  <div className="h-48 bg-gradient-to-br from-slate-800 to-[#0a1929] relative border-b border-white/5">
                    {event.image_url ? (
                      <img src={event.image_url} alt="Event cover" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-30">
                        <Calendar className="w-16 h-16 text-white" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-[#07111c]/80 backdrop-blur-md rounded-lg p-2 text-center border border-white/10 shadow-xl">
                      <div className="text-xs font-bold text-accent uppercase">{eventDate.toLocaleString('default', { month: 'short' })}</div>
                      <div className="text-2xl font-black text-white leading-none my-1">{eventDate.getDate()}</div>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    
                    <p className="text-sm text-[#94a3b8] mb-6 line-clamp-3 flex-1">
                      {event.description}
                    </p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-accent" />
                        </div>
                        <span>{eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                          {event.event_type === 'online' ? <Video className="w-4 h-4 text-blue-400" /> : <MapPin className="w-4 h-4 text-red-400" />}
                        </div>
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                          {event.organizer?.avatar_url ? (
                            <img src={event.organizer.avatar_url} alt="Organizer" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Users className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        <span className="line-clamp-1 text-xs">By {event.organizer?.full_name || "Community"}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRSVP(event.id, "going")}
                      className={`w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                        isGoing 
                          ? 'bg-accent/20 text-accent hover:bg-accent/30 border border-accent/20' 
                          : 'bg-white/10 text-white hover:bg-white/20 border border-white/5'
                      }`}
                    >
                      {isGoing ? <><Check className="w-5 h-5"/> Going</> : "RSVP Now"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
            <Calendar className="w-12 h-12 text-[#94a3b8] mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-white mb-2">No upcoming events</h3>
            <p className="text-[#94a3b8]">Check back later or host your own community meetup.</p>
          </div>
        )}
      </div>
    </div>
  );
}
