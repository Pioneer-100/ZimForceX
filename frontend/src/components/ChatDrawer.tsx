"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { MessageCircle, X, Send, User, ChevronLeft, Search } from "lucide-react";

export default function ChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRecipient, setActiveRecipient] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Fetch logged in session
    async function loadUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        // Fetch candidates in network to start chats
        const { data: profilesList } = await supabase
          .from("profiles")
          .select("*")
          .neq("id", currentUser.id)
          .limit(10);
        setProfiles(profilesList || []);
      }
    }
    loadUser();
  }, []);

  // 2. Load Chat History
  useEffect(() => {
    if (!user || !activeRecipient) return;

    async function loadHistory() {
      setLoading(true);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeRecipient.id}),and(sender_id.eq.${activeRecipient.id},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
      setLoading(false);
    }
    loadHistory();

    // 3. Realtime Messaging Client Hook
    const channel = supabase
      .channel(`chat_${activeRecipient.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload: any) => {
          const newMsg = payload.new;
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === activeRecipient.id) ||
            (newMsg.sender_id === activeRecipient.id && newMsg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRecipient, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activeRecipient) return;

    try {
      const messagePayload = {
        sender_id: user.id,
        receiver_id: activeRecipient.id,
        content: newMessage.trim(),
      };

      const { error } = await supabase
        .from("chat_messages")
        .insert(messagePayload);

      if (error) throw error;
      setNewMessage("");
    } catch (err: any) {
      console.error("Failed to send message:", err.message);
    }
  };

  const filteredProfiles = profiles.filter((p) =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Chat Bubble Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 bg-gradient-to-r from-accent to-purple-600 text-white rounded-full shadow-2xl hover:scale-105 transition flex items-center justify-center border border-white/10"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Slide-Up Chat Drawer Window */}
      {isOpen && (
        <div className="w-[360px] h-[480px] bg-[#0c1929]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
            {activeRecipient ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveRecipient(null)}
                  className="text-muted hover:text-white transition"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                    {activeRecipient.avatar_url ? (
                      <img
                        src={activeRecipient.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={16} className="text-muted" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white leading-tight">
                      {activeRecipient.full_name}
                    </div>
                    <div className="text-[10px] text-green-400 font-semibold uppercase tracking-wider">
                      Online
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <MessageCircle className="text-accent" size={18} /> Direct Messages
              </h3>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10">
            {activeRecipient ? (
              /* Chat Message Window */
              loading ? (
                <div className="h-full flex items-center justify-center text-xs text-muted">
                  Loading chats...
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isSelf = msg.sender_id === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                            isSelf
                              ? "bg-gradient-to-r from-accent to-purple-600 text-white rounded-tr-none"
                              : "bg-white/5 border border-white/10 text-white rounded-tl-none"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[9px] text-muted mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <MessageCircle className="text-[#334155] mb-2" size={32} />
                  <p className="text-xs text-muted">
                    No messages here yet. Send a wave to start the conversation!
                  </p>
                </div>
              )
            ) : (
              /* Profile Search & Selection List */
              <div className="space-y-4">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search people..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2.5 pl-10 bg-black/20 border border-white/10 rounded-xl text-white placeholder-muted focus:outline-none focus:border-accent text-xs"
                  />
                </div>

                <div className="space-y-2">
                  {filteredProfiles.length > 0 ? (
                    filteredProfiles.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setActiveRecipient(p)}
                        className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-white/10 transition border border-white/10"
                      >
                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {p.avatar_url ? (
                            <img
                              src={p.avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={18} className="text-muted" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-white truncate">
                            {p.full_name}
                          </div>
                          <div className="text-xs text-muted truncate capitalize">
                            {p.target_role || p.role?.replace("_", " ")}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-muted">
                      No matching connections found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chat Message Input Footer */}
          {activeRecipient && (
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white/5 border-t border-white/10 flex gap-2"
            >
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 p-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-muted focus:outline-none focus:border-accent text-xs"
              />
              <button
                type="submit"
                className="p-2.5 bg-accent hover:bg-purple-600 text-white rounded-xl transition flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
