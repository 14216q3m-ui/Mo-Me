"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiMessageCircle, FiArrowRight } from "react-icons/fi"; 

export default function MemoryDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [artifact, setArtifact] = useState<any>(null);
  const [summariesWithImages, setSummariesWithImages] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [effort, setEffort] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false); 

  const [activeIndexes, setActiveIndexes] = useState<{ [key: string]: number }>({});

  // 🎯 ดึงชื่อจากเครื่อง
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem("mo_me_user") : null;

  const fetchData = useCallback(async () => {
    if (!id || !currentUserId) return; // 🚩 ต้องมีทั้ง ID และ UserID ถึงจะทำงาน

    try {
      // 1. ดึงความทรงจำหลัก (Artifact) - ต้องเช็คว่าเป็นของ User คนนี้จริงไหม
      const { data: artData } = await supabase
        .from("artifacts")
        .select("*")
        .eq("id", id)
        .eq("user_id", currentUserId) // 🚩 กั้นห้อง: ถ้าไม่ใช่เจ้าของจะหาไม่เจอ (Null)
        .maybeSingle();

      if (!artData) { 
        console.warn("Unauthorized or Not Found");
        router.push("/"); // 🚩 ถ้าไม่ใช่เจ้าของให้เด้งกลับหน้า Feed
        return; 
      }
      setArtifact(artData);
      
      // 2. ดึงสรุป (Summaries) - กรองเฉพาะของ User คนนี้
      const { data: summaries } = await supabase
        .from("post_updates")
        .select("*")
        .eq("post_id", id)
        .eq("user_id", currentUserId) // 🚩 กั้นห้อง
        .eq("content_type", "summary")
        .order("created_at", { ascending: true });

      // 3. ดึงรูปภาพประกอบ - กรองเฉพาะของ User คนนี้
      const { data: allImages } = await supabase
        .from("post_updates")
        .select("*")
        .eq("post_id", id)
        .eq("user_id", currentUserId) // 🚩 กั้นห้อง
        .not("image_url", "is", null)
        .order("created_at", { ascending: true });

      if (summaries) {
        const combined = summaries.map((s, index) => {
          const startTime = index === 0 ? "1970-01-01T00:00:00Z" : summaries[index - 1].created_at;
          const endTime = s.created_at;
          const imagesForThisFragment = allImages?.filter(chat => chat.created_at > startTime && chat.created_at <= endTime) || [];
          
          imagesForThisFragment.forEach(img => {
            if (img.image_url) {
              const link = new Image();
              link.src = img.image_url;
            }
          });

          return { ...s, images: imagesForThisFragment };
        });

        setSummariesWithImages(combined);
        const initialIndexes: { [key: string]: number } = {};
        combined.forEach(item => { if (item.images.length > 0) initialIndexes[item.id] = 0; });
        setActiveIndexes(initialIndexes);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [id, router, currentUserId]);

  useEffect(() => { if (id && currentUserId) fetchData(); }, [id, fetchData, currentUserId]);

  const handleTalkToBrother = () => {
    // 🚩 ส่ง Effort ไปคุยต่อ แต่ในหน้าแชทเดี๋ยวเราต้องดึง UserID มาใช้อีกทีตอนเซฟ
    router.push(`/brother-chat?id=${id}&effort=${effort}`);
  };

  const nextImg = (e: React.MouseEvent, itemId: string, max: number) => {
    e.stopPropagation();
    setActiveIndexes(prev => ({ ...prev, [itemId]: (prev[itemId] + 1) % max }));
  };
  const prevImg = (e: React.MouseEvent, itemId: string, max: number) => {
    e.stopPropagation();
    setActiveIndexes(prev => ({ ...prev, [itemId]: (prev[itemId] - 1 + max) % max }));
  };

  if (loading || !artifact) return <div className="min-h-screen bg-black flex items-center justify-center text-[#FFFF00] animate-pulse tracking-[1em] text-[10px]">SYNCING...</div>;

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-[#FFFF00] selection:text-black">
      <nav className="p-6 border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-md z-50 flex justify-between items-center">
        <button 
          onClick={() => router.push("/")} 
          className="text-[10px] tracking-[0.5em] text-zinc-500 hover:text-[#FFFF00] uppercase transition-all"
        >
          ← Back
        </button>
        <div className="flex flex-col items-end">
          <span className="text-[10px] tracking-[0.3em] text-zinc-600 uppercase font-mono opacity-50">ID: {id.slice(0,8)}</span>
          <span className="text-[7px] text-[#FFFF00]/40 uppercase tracking-widest">{currentUserId}</span>
        </div>
      </nav>

      {/* ... ส่วน UI อื่นๆ เหมือนเดิมทุกประการ ... */}
      <div className="max-w-screen-2xl mx-auto flex flex-col lg:flex-row min-h-screen">
        
        <div className="lg:w-[35%] lg:sticky lg:top-[80px] lg:h-[calc(100vh-80px)] p-12 flex flex-col justify-center border-r border-white/5 bg-zinc-950/20">
           <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-zinc-900">
              <img src={artifact.image_url} className="w-full h-full object-cover grayscale-[0.3]" alt="Root" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-8 left-8 right-8">
                <p className="text-[8px] text-[#FFFF00] uppercase tracking-[0.4em] mb-2 font-bold opacity-80">Root Memory Context</p>
                <h1 className="text-xl font-serif italic text-white/90 leading-relaxed">"{artifact.text}"</h1>
              </div>
           </div>

           <div className="mt-12 pt-8 border-t border-white/5 max-w-[320px] mx-auto w-full">
              <div className="mb-8">
                <div className="flex justify-between items-end mb-4 px-1">
                  <span className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase">Set Effort</span>
                  <span className="text-3xl font-serif italic text-[#FFFF00]">{effort}/10</span>
                </div>
                <input 
                  type="range" min="0" max="10" step="1" value={effort} 
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setEffort(val);
                    if (val > 0) setHasInteracted(true);
                  }}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-[#FFFF00]"
                />
              </div>

              <div className="relative h-[64px] w-full flex items-center justify-center">
                <AnimatePresence initial={false}>
                  {hasInteracted && effort > 0 ? (
                    <motion.button
                      key="active-btn"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      onClick={handleTalkToBrother}
                      className="absolute inset-0 w-full h-full bg-[#FFFF00] text-black rounded-2xl flex items-center justify-center gap-3 group hover:bg-white transition-colors shadow-[0_10px_30px_rgba(255,255,0,0.15)]"
                    >
                      <span className="font-black uppercase tracking-[0.2em] text-[10px]">Talk to Brother</span>
                      <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  ) : (
                    <motion.p 
                      key="idle-txt"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center text-[7px] text-zinc-600 text-center uppercase tracking-[0.3em] animate-pulse"
                    >
                      Slide to set effort & initiate contact
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
           </div>
        </div>

        <div className="lg:w-[65%] p-8 md:p-16 lg:pl-20 space-y-32 pb-60">
          <section>
            <div className="flex items-center gap-4 mb-20 opacity-30">
              <span className="text-[10px] font-black tracking-[0.7em] uppercase">Chronicle Archive</span>
              <div className="h-[1px] flex-1 bg-white" />
            </div>

            <div className="space-y-48">
              {summariesWithImages.map((item, idx) => {
                const images = item.images || [];
                const currentIndex = activeIndexes[item.id] || 0;

                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative pl-12 border-l border-[#FFFF00]/10 max-w-5xl">
                    <div className="absolute -left-[5.5px] top-0 w-[11px] h-[11px] rounded-full bg-[#FFFF00] shadow-[0_0_15px_#FFFF00]" />
                    <header className="mb-12 opacity-40 flex items-center gap-4">
                      <span className="text-[8px] font-bold uppercase tracking-[0.5em]">Fragment #{idx + 1}</span>
                      <div className="h-[1px] w-12 bg-white/10" />
                      <span className="text-[8px] uppercase tracking-[0.3em] font-mono">
                         {new Date(item.created_at).toLocaleDateString('th-TH')}
                      </span>
                    </header>

                    <div className={`grid grid-cols-1 ${images.length > 0 ? 'lg:grid-cols-2' : 'max-w-3xl'} gap-12`}>
                      {images.length > 0 && (
                        <div className="space-y-4 max-w-md relative group">
                           <div className="flex justify-between items-center mb-3">
                              <p className="text-[7px] text-[#FFFF00]/60 uppercase tracking-[0.4em] font-bold">Evidence</p>
                              {images.length > 1 && <span className="text-[7px] text-zinc-500 font-mono tracking-widest">{currentIndex + 1} / {images.length}</span>}
                           </div>
                           <div className="relative rounded-2xl overflow-hidden border border-[#FFFF00]/10 shadow-xl bg-zinc-900/50 p-1.5 ring-1 ring-white/5">
                              <div className="relative overflow-hidden rounded-xl bg-zinc-950 aspect-square">
                                <AnimatePresence initial={false}>
                                  <motion.img 
                                    key={images[currentIndex].id} 
                                    src={images[currentIndex].image_url} 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="absolute inset-0 w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0" 
                                    style={{ backfaceVisibility: "hidden" }}
                                  />
                                </AnimatePresence>
                                {images.length > 1 && (
                                  <div className="absolute inset-0 z-20 flex items-center justify-between px-2 pointer-events-none">
                                    <button onClick={(e) => prevImg(e, item.id, images.length)} className="pointer-events-auto w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white border border-white/10 hover:bg-[#FFFF00] hover:text-black transition-all">←</button>
                                    <button onClick={(e) => nextImg(e, item.id, images.length)} className="pointer-events-auto w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white border border-white/10 hover:bg-[#FFFF00] hover:text-black transition-all">→</button>
                                  </div>
                                )}
                              </div>
                           </div>
                        </div>
                      )}
                      <div className="relative flex flex-col justify-center max-w-3xl">
                        <div className="flex items-center gap-3 mb-6 opacity-60">
                           <div className="w-1.5 h-1.5 rounded-full bg-[#FFFF00]" />
                           <p className="text-[7px] text-zinc-400 uppercase tracking-[0.4em]">Guardian's Reflection</p>
                        </div>
                        <p className="font-serif italic text-zinc-100 leading-[1.8] text-xl md:text-2xl tracking-tight max-w-2xl">"{item.update_text}"</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}