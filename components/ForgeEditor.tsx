"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCheckCircle, FiTrash2, FiZap } from "react-icons/fi";

interface LogData {
  id: string;
  created_at: string;
  update_text: string;
  content_type: string;
  display_image?: string;
  role: string;
  image_url?: string;
  parent_id?: string;
  metadata?: any;
}

export default function ForgeEditor({ cardData, isFocus, onClose }: any) {
  const router = useRouter();
  const [effort, setEffort] = useState(0); 
  const [logs, setLogs] = useState<LogData[]>([]);
  const [modalType, setModalType] = useState<"none" | "delete" | "complete">("none");

  const fetchLogs = useCallback(async () => {
    if (!cardData?.id) return;
    
    const { data, error } = await supabase
      .from("post_updates")
      .select("*")
      .eq("post_id", cardData.id)
      .order("created_at", { ascending: true });
    
    if (error) {
      console.error("🔴 Fetch Logs Error:", error);
      return;
    }

    if (data) {
      const summaries = data.filter(log => log.content_type === 'summary');
      const enrichedLogs = summaries.map(summary => {
        const sourceChat = summary.parent_id 
          ? data.find(log => log.id === summary.parent_id) 
          : null;

        return { 
          ...summary, 
          display_image: sourceChat?.image_url || sourceChat?.metadata?.image_url 
        };
      });
      setLogs(enrichedLogs.reverse());
    }
  }, [cardData.id]);

  useEffect(() => {
    if (isFocus && cardData?.id) {
      fetchLogs();
      const channel = supabase.channel(`forge-${cardData.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_updates', filter: `post_id=eq.${cardData.id}` }, () => fetchLogs())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isFocus, cardData.id, fetchLogs]);

  if (!isFocus) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] bg-[#050505] flex flex-col overflow-hidden text-zinc-400 font-sans antialiased"
    >
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_-20%,#111,transparent)] opacity-40 pointer-events-none" />

      {/* 🔝 Header */}
      <header className="relative z-30 px-8 md:px-20 pt-12 pb-8 flex justify-between items-end border-b border-white/[0.02]">
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter leading-none opacity-90">
          {cardData.text}<span className="text-[#FFFF00] opacity-60">.</span>
        </h1>
        
        <div className="flex flex-col items-end gap-5">
          <p className="text-[9px] font-bold tracking-[0.6em] text-zinc-700 uppercase">Chronicle Archive</p>
          <div className="flex items-center gap-1 bg-zinc-900/40 backdrop-blur-2xl p-1.5 rounded-full border border-white/5 shadow-2xl">
            <button onClick={() => setModalType("complete")} className="p-2.5 text-zinc-600 hover:text-green-500 transition-colors rounded-full hover:bg-zinc-800"><FiCheckCircle size={18} /></button>
            <button onClick={() => setModalType("delete")} className="p-2.5 text-zinc-600 hover:text-red-500 transition-colors rounded-full hover:bg-zinc-800"><FiTrash2 size={18} /></button>
            <div className="h-5 w-[1px] bg-zinc-800 mx-1" />
            <button onClick={onClose} className="p-2.5 text-white hover:rotate-90 transition-transform duration-500 rounded-full hover:bg-zinc-800"><FiX size={26} /></button>
          </div>
        </div>
      </header>

      {/* 📜 Timeline */}
      <main className="relative z-10 flex-1 overflow-y-auto px-8 md:px-32 py-16 scrollbar-hide pb-96">
        <div className="max-w-4xl mx-auto space-y-36">
          <AnimatePresence mode="popLayout">
            {logs.map((log) => {
              const dateObj = new Date(log.created_at);
              const day = dateObj.toLocaleDateString('th-TH', { day: '2-digit' });
              const month = dateObj.toLocaleDateString('th-TH', { month: 'long' });
              const year = dateObj.toLocaleDateString('th-TH', { year: 'numeric' });
              const hasImage = !!log.display_image;

              return (
                <motion.section 
                  key={log.id} 
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                  // 🎯 จัด Grid: ถ้าไม่มีรูป ให้ขยายพื้นที่ข้อความกินไปทางขวา
                  className={`grid grid-cols-1 ${hasImage ? 'md:grid-cols-[1fr_320px]' : 'w-full'} gap-12 items-start group`}
                >
                  <div className={`space-y-7 ${!hasImage ? 'max-w-4xl' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-[#FFFF00]/70" />
                      <div className="flex items-center border-l border-zinc-900/50 pl-5 text-zinc-600 uppercase">
                        <span className="text-[11px] font-mono font-medium tracking-[0.2em]">{day}</span>
                        <span className="text-[10px] font-sans font-bold tracking-[0.3em] mx-3 pt-[1px]">{month}</span>
                        <span className="text-[11px] font-mono font-medium tracking-[0.2em]">{year}</span>
                      </div>
                    </div>

                    {/* ✅ ขนาดตัวอักษรนิ่งเท่ากันทุกอัน */}
                    <p className="text-2xl md:text-3xl font-serif italic text-white/70 leading-[1.8] tracking-tight antialiased pr-10">
                      "{log.update_text}"
                    </p>
                  </div>

                  {hasImage && (
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] border border-white/[0.03] shadow-2xl grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 transform group-hover:scale-[1.01]">
                      <img src={log.display_image} alt="artifact" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                  )}
                </motion.section>
              );
            })}
          </AnimatePresence>
        </div>
      </main>

      {/* ⌨️ Footer Dock */}
      <footer className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-6">
        <div className="bg-zinc-950/60 backdrop-blur-3xl p-5 rounded-[2.5rem] border border-white/5 flex items-center justify-between gap-8 shadow-3xl">
          <div className="flex flex-col gap-2.5 w-full">
            <div className="flex justify-between items-end px-1 opacity-40 text-[9px] font-bold tracking-[0.3em] uppercase">
              <span>Effort Level</span>
              <span className="text-xl font-serif italic text-[#FFFF00]">{effort}/10</span>
            </div>
            <div className="relative h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${effort * 10}%` }} className="absolute inset-0 bg-[#FFFF00]/60" />
              <input type="range" min="0" max="10" step="1" value={effort} onChange={(e) => setEffort(Number(e.target.value))} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            </div>
          </div>

          <AnimatePresence>
            {effort > 0 && (
              <motion.button 
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} 
                onClick={() => router.push(`/brother-chat?id=${cardData.id}&effort=${effort}`)} 
                className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full hover:bg-[#FFFF00] transition-all"
              >
                <FiZap size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Inscribe</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {modalType !== "none" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[5000] bg-black/98 flex items-center justify-center p-8 backdrop-blur-md">
            <div className="max-w-xs w-full text-center space-y-12">
              <h2 className="text-2xl font-serif italic text-white/80">
                {modalType === 'delete' ? "ปล่อยวางความทรงจำ?" : "จารึกหน้าสุดท้าย?"}
              </h2>
              <div className="flex justify-center gap-16 pt-4 text-[10px] font-bold tracking-widest uppercase">
                <button onClick={() => setModalType("none")} className="text-zinc-600 hover:text-white transition-colors">ย้อนกลับ</button>
                <button 
                  onClick={async () => {
                    if (modalType === 'delete') await supabase.from("artifacts").delete().eq("id", cardData.id);
                    else await supabase.from("artifacts").update({ status: 'completed' }).eq("id", cardData.id);
                    window.location.reload();
                  }}
                  className={modalType === 'delete' ? 'text-red-500' : 'text-[#FFFF00]'}
                >ยืนยัน</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}