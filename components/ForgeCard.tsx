"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCamera, FiSend, FiTrash2, FiArchive } from "react-icons/fi";

export default function ForgeCard({ cardData, onClose, onDelete, onArchive }: any) {
  const [effort, setEffort] = useState(5);
  const [logs, setLogs] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    if (!cardData?.id) return;
    const { data } = await supabase.from("post_updates").select("*").eq("post_id", cardData.id).order("created_at", { ascending: true });
    if (data) {
      setLogs(data);
      scrollToBottom();
    }
  };

  const handleSend = async () => {
    if ((!content.trim() && !selectedFile) || isSaving) return;
    setIsSaving(true);
    try {
      let imageUrl = null;
      if (selectedFile) {
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        await supabase.storage.from('artifact-images').upload(fileName, selectedFile);
        const { data } = supabase.storage.from('artifact-images').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }
      await fetch("/api/guardian/brother", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, postId: cardData.id, imageUrl, effort }),
      });
      setContent(""); setPreviewUrl(null); setSelectedFile(null);
      fetchLogs();
    } finally {
      setIsSaving(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, 150);
  };

  useEffect(() => {
    fetchLogs();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, [cardData?.id]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[50] bg-black flex flex-col w-full h-full text-zinc-400">
      
      {/* 🛠 Toolbar - เลเยอร์ 100 */}
      <div className="fixed top-10 left-10 z-[100] flex items-center gap-3 p-2 bg-zinc-900/30 backdrop-blur-xl rounded-full border border-white/5 shadow-2xl">
        <button onClick={() => confirm("จบการเดินทางใบนี้?") && onArchive()} className="p-3 rounded-full text-zinc-500 hover:text-[#FFFF00] transition-all"><FiArchive size={18} /></button>
        <button onClick={() => confirm("ลบจารึกนี้ถาวร?") && onDelete()} className="p-3 rounded-full text-zinc-500 hover:text-red-500 transition-all"><FiTrash2 size={18} /></button>
        <button onClick={onClose} className="p-3 rounded-full text-white hover:bg-white/10 transition-all"><FiX size={20} /></button>
      </div>

      <main ref={scrollRef} className="grow overflow-y-auto px-6 md:px-20 pt-32 pb-48 scrollbar-hide">
        <div className="max-w-4xl mx-auto space-y-24">
          <AnimatePresence mode="popLayout">
            {logs.map((log) => (
              <motion.article key={log.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group relative pl-6 border-l border-zinc-900 hover:border-[#FFFF00]/20 transition-all duration-1000">
                <div className="space-y-6 opacity-60 group-hover:opacity-100 transition-all">
                  <time className="text-[9px] font-black text-zinc-800 uppercase tracking-widest">{new Date(log.created_at).toLocaleTimeString('th-TH')} — {log.role === 'brother' ? 'พี่ชาย' : 'จิ๊กโก๋'}</time>
                  {log.image_url && <div className="rounded-3xl overflow-hidden border border-white/5 max-w-lg"><img src={log.image_url} alt="" className="w-full grayscale hover:grayscale-0 transition-all duration-1000" /></div>}
                  <p className={`text-xl md:text-3xl font-serif italic leading-relaxed ${log.role === 'brother' ? "text-[#FFFF00]" : "text-zinc-100"}`}>{log.role === 'brother' ? log.update_text : `"${log.update_text}"`}</p>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* ⌨️ Footer - ยก z-index ขึ้นเป็น 150 และปรับความชัดเจน */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 md:p-12 bg-gradient-to-t from-black via-black/90 to-transparent z-[150]">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* 🎯 Effort Standby UI */}
          <div className="flex flex-col gap-2 max-w-[200px] ml-4">
            <div className="flex justify-between items-end">
              <span className="text-[8px] font-black tracking-widest text-zinc-600 uppercase">Effort Today</span>
              <span className="text-lg font-serif italic text-[#FFFF00] leading-none">{effort}<span className="text-[10px] text-zinc-800 ml-1">/10</span></span>
            </div>
            <input 
              type="range" min="0" max="10" step="1" 
              value={effort} 
              onChange={(e) => setEffort(Number(e.target.value))}
              className="w-full h-[1px] bg-zinc-800 appearance-none cursor-pointer accent-[#FFFF00] block"
            />
          </div>

          <div className="relative bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-6 md:p-8 transition-all focus-within:border-[#FFFF00]/20 shadow-2xl">
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="พ่นมันออกมาจิ๊กโก๋..." 
              className="w-full bg-transparent border-none outline-none text-xl text-white font-serif italic placeholder:text-zinc-800 resize-none min-h-[60px]"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
            />
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-4">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if(f) { setSelectedFile(f); setPreviewUrl(URL.createObjectURL(f)); }
                }} />
                <button onClick={() => fileInputRef.current?.click()} className="text-zinc-600 hover:text-[#FFFF00] transition-colors"><FiCamera size={20} /></button>
                {previewUrl && <div className="w-8 h-8 rounded bg-cover border border-white/10" style={{ backgroundImage: `url(${previewUrl})` }} />}
              </div>
              <button disabled={isSaving} onClick={handleSend} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-[#FFFF00] transition-all">
                {isSaving ? "INSCRIBING..." : "SEND"} <FiSend size={12} />
              </button>
            </div>
          </div>

        </div>
      </footer>
    </motion.div>
  );
}