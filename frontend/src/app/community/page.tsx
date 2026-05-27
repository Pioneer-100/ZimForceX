"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { MessageSquare, ThumbsUp, MessageCircle, Clock, Plus, Tag } from "lucide-react";

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadPosts() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      const { data, error } = await supabase
        .from("forum_posts")
        .select("*, author:profiles!author_id(full_name, avatar_url, role)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPosts(data);
      }
      setLoading(false);
    }
    loadPosts();
  }, []);

  const handleUpvote = async (postId: string, currentUpvotes: number) => {
    if (!user) {
      alert("Please log in to upvote.");
      return;
    }
    
    // Optimistic update
    setPosts(posts.map(p => p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p));
    
    try {
      await supabase
        .from("forum_posts")
        .update({ upvotes: currentUpvotes + 1 })
        .eq("id", postId);
    } catch (err: any) {
      console.error("Upvote failed:", err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#07111c] pb-20">
      <div className="bg-[#0a1929] border-b border-white/10 pt-24 pb-12">
        <div className="container mx-auto px-6 max-w-5xl flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                <MessageSquare className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-4xl font-extrabold text-white">Community Forum</h1>
            </div>
            <p className="text-[#94a3b8] text-lg max-w-2xl">
              Discuss industry trends, ask for career advice, and share knowledge with other verified professionals in Zimbabwe.
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-purple-600 hover:opacity-90 text-white rounded-xl transition font-semibold shadow-lg shadow-accent/20">
            <Plus className="w-5 h-5" /> New Discussion
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-5xl mt-12 flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition duration-300 flex gap-6 group">
                  <div className="flex flex-col items-center gap-2">
                    <button 
                      onClick={() => handleUpvote(post.id, post.upvotes)}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-accent text-[#94a3b8] transition"
                    >
                      <ThumbsUp className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-white text-lg">{post.upvotes}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 text-sm text-[#94a3b8]">
                      {post.author?.avatar_url ? (
                        <img src={post.author.avatar_url} alt="Author" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">
                          {post.author?.full_name?.charAt(0) || "U"}
                        </div>
                      )}
                      <span className="font-semibold text-white">{post.author?.full_name || "Anonymous"}</span>
                      <span className="opacity-50">•</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2 cursor-pointer group-hover:text-blue-300 transition">
                      {post.title}
                    </h3>
                    <p className="text-[#94a3b8] line-clamp-2 mb-4 leading-relaxed">
                      {post.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {post.tags.map((tag: string, i: number) => (
                          <span key={i} className="flex items-center gap-1 text-xs font-medium text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                            <Tag className="w-3 h-3" /> {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#94a3b8] hover:text-white cursor-pointer transition">
                        <MessageCircle className="w-4 h-4" />
                        <span>Discuss</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
              <MessageSquare className="w-12 h-12 text-[#94a3b8] mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium text-white mb-2">No discussions yet</h3>
              <p className="text-[#94a3b8]">Be the first to start a conversation in the community.</p>
            </div>
          )}
        </div>
        
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4">Trending Topics</h3>
            <div className="flex flex-wrap gap-2">
              {['#ReactJS', '#RemoteWork', '#Salaries', '#Interviews', '#TechZW', '#Startups'].map((tag, i) => (
                <span key={i} className="text-sm text-[#94a3b8] bg-white/5 hover:bg-white/10 hover:text-white cursor-pointer transition px-3 py-1.5 rounded-lg border border-white/5">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-accent/10 to-purple-600/10 border border-accent/20 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-2">Community Guidelines</h3>
            <ul className="text-sm text-[#94a3b8] space-y-2 list-disc list-inside">
              <li>Be respectful and professional</li>
              <li>Share knowledge generously</li>
              <li>No spam or self-promotion</li>
              <li>Verify your skills to build trust</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
