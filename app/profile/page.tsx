"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, avgEffort: 0 });
  const [bio, setBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [whisper, setWhisper] = useState<any>(null); // ✨ ความทรงจำที่ Guardian เลือกมาให้
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  async function fetchProfileData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setProfile(user);
      setBio(user.user_metadata?.bio || "");
      
      const { data: posts } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order('created_at', { ascending: false });

      if (posts && posts.length > 0) {
        // 1. คำนวณ Stats (เก็บไว้ใช้ในเชิงสถิติจางๆ)
        const total = posts.length;
        const avg = posts.reduce((acc: number, curr: any) => acc + (curr.effort_level || 0), 0) / (total || 1);
        setStats({ total, avgEffort: Math.round(avg) });

        // 2. ✨ Guardian's Logic: สุ่มหยิบความทรงจำในอดีต (ที่ไม่ใช่โพสต์ล่าสุด)
        // เพื่อสร้างความรู้สึก "เชื่อมโยงตัวตนในอดีต"
        const pastPosts = posts.slice(1); // ตัดโพสต์ล่าสุดออก
        const randomPast = pastPosts.length > 0 
          ? pastPosts[Math.floor(Math.random() * pastPosts.length)]
          : posts[0];
        setWhisper(randomPast);
      }
    }
    setLoading(false);
  }

  const handleSaveBio = async () => {
    const { error } = await supabase.auth.updateUser({
      data: { bio: bio }
    });
    if (!error) setIsEditingBio(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-[#FFFF00] animate-pulse uppercase tracking-[1em] text-[10px]">
      Synchronizing with Guardian...
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden p-6 md:p-12 selection:bg-[#FFFF00] selection:text-black">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_100%,_rgba(20,20,20,1)_0%,_rgba(0,0,0,1)_100%)] -z-10" />

      {/* 🧭 Top Nav */}
      <nav className="max-w-4xl mx-auto w-full flex justify-between items-center mb-16 md:mb-24">
        <button onClick={() => router.push("/archive")} className="text-[10px] tracking-[0.5em] text-zinc-600 hover:text-[#FFFF00] uppercase transition-all duration-500">← Records</button>
        <div className="flex flex-col items-center">
          <h1 className="text-[11px] font-black tracking-[0.8em] uppercase italic text-zinc-500">Identity</h1>
          <div className="w-12 h-[1px] bg-zinc-800 mt-2" />
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className="text-[9px] text-zinc-700 hover:text-red-900 uppercase tracking-widest italic transition-colors">Logout</button>
      </nav>

      <div className="max-w-2xl mx-auto space-y-20 pb-20">
        
        {/* 👤 Identity Header & Bio */}
        <section className="flex flex-col items-center text-center space-y-10">
          <div className="relative group">
            <div className="absolute -inset-6 bg-[#FFFF00]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000" />
            <div className="w-36 h-36 rounded-full border border-white/5 p-1.5 relative bg-black/50 backdrop-blur-xl">
              <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 border border-[#FFFF00]/10">
                <img 
                  src={profile?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/micah/svg?seed=${profile?.email}`} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-110"
                  alt="Avatar"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 w-full max-w-sm">
            <div className="space-y-2">
              <h2 className="text-4xl font-extralight italic tracking-tight text-zinc-100">
                {profile?.user_metadata?.display_name || profile?.email?.split('@')[0]}
              </h2>
              <p className="text-[8px] text-zinc-600 uppercase tracking-[0.6em] font-medium">Authorized Memory Keeper</p>
            </div>

            {/* ✨ Interactive Bio (Manifesto) */}
            <div className="relative min-h-[40px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {isEditingBio ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full space-y-3">
                    <input 
                      autoFocus value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      onBlur={handleSaveBio}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveBio()}
                      className="bg-transparent border-b border-[#FFFF00]/30 text-center text-sm italic text-zinc-200 outline-none w-full py-2"
                      placeholder="Define your essence..."
                    />
                  </motion.div>
                ) : (
                  <motion.p 
                    onClick={() => setIsEditingBio(true)}
                    className="text-[15px] text-zinc-400 font-light italic leading-relaxed cursor-pointer hover:text-[#FFFF00]/80 transition-all duration-500 px-8"
                  >
                    {bio || "“Define your essence here...”"}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* 🛡️ THE GUARDIAN'S WHISPER (The Soul of Mo-Me) */}
        <AnimatePresence>
          {whisper && (
            <motion.section 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-10 rounded-[3rem] bg-zinc-900/10 border border-[#FFFF00]/5 overflow-hidden group shadow-2xl"
            >
              {/* Ambient Background Effect */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#FFFF00]/5 blur-[100px] rounded-full" />
              
              <div className="relative space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FFFF00] animate-pulse shadow-[0_0_8px_#FFFF00]" />
                  <span className="text-[9px] font-black tracking-[0.4em] text-[#FFFF00]/50 uppercase italic">Guardian's Whisper</span>
                </div>

                <div className="space-y-5">
                  <p className="text-[11px] text-zinc-500 uppercase tracking-[0.2em] leading-relaxed italic">
                    "ในวันที่คุณอาจจะหลงลืม... ผมขอหยิบความพยายามนี้มาวางตรงหน้าคุณอีกครั้ง"
                  </p>
                  
                  <div className="pl-6 border-l border-zinc-800 py-2">
                    <p className="text-2xl font-light italic text-zinc-200 leading-snug">"{whisper.text}"</p>
                    <div className="mt-4 flex items-center gap-4 text-[8px] text-zinc-600 uppercase tracking-widest font-bold">
                      <span>{new Date(whisper.created_at).toLocaleDateString()}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-800" />
                      <span className="text-[#FFFF00]/40">Effort: {whisper.effort_level}%</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => router.push(`/archive/${whisper.id}`)}
                  className="group flex items-center gap-3 text-[9px] text-[#FFFF00]/60 hover:text-[#FFFF00] transition-all uppercase font-bold tracking-widest"
                >
                  Return to this moment <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* 📊 Artifact Stats (Subtle) */}
        <section className="grid grid-cols-2 gap-6">
          <div className="bg-zinc-900/10 border border-white/[0.02] p-8 rounded-[2.5rem] text-center space-y-2 group hover:border-white/5 transition-all">
            <span className="text-[8px] uppercase text-zinc-600 tracking-[0.4em] block">Records Logged</span>
            <span className="text-3xl font-extralight italic text-zinc-400 group-hover:text-white transition-colors">{stats.total}</span>
          </div>
          <div className="bg-zinc-900/10 border border-white/[0.02] p-8 rounded-[2.5rem] text-center space-y-2 group hover:border-white/5 transition-all">
            <span className="text-[8px] uppercase text-zinc-600 tracking-[0.4em] block">Mean Effort</span>
            <span className="text-3xl font-extralight italic text-zinc-400 group-hover:text-white transition-colors">{stats.avgEffort}%</span>
          </div>
        </section>

        {/* 📜 Terminal Footer */}
        <footer className="pt-10 text-center space-y-6">
          <div className="flex items-center justify-center gap-4 opacity-20">
             <div className="w-8 h-[1px] bg-white" />
             <div className="text-[10px] font-black tracking-[1em] uppercase">Mo-Me</div>
             <div className="w-8 h-[1px] bg-white" />
          </div>
          <p className="text-[8px] text-zinc-700 uppercase tracking-[0.3em] italic max-w-[250px] mx-auto leading-relaxed">
            "You were witnessed. <br/> Your effort remains here forever."
          </p>
        </footer>
      </div>
    </main>
  );
}