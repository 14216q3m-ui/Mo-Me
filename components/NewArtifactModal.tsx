"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// เพิ่ม (newId: string) เข้าไปใน Type
export default function NewArtifactModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: (newId: string) => void }) {
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return alert("จิ๊กโก๋! ต้องมีชื่อบทความทรงจำนะ");
    setIsCreating(true);

    try {
      const { data, error } = await supabase
        .from('artifacts')
        .insert([{ 
            title: title,
            status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      setTitle("");
      onSuccess(data.id); // 🔥 ส่ง ID ที่สร้างใหม่กลับไปให้หน้าหลัก
      onClose();
    } catch (error: any) {
      alert("ล้มเหลว: " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-zinc-900 border border-white/10 w-full max-w-lg rounded-[4rem] p-12 space-y-12 shadow-[0_0_100px_rgba(255,255,0,0.05)]"
          >
            <div className="space-y-4 text-center">
              <h3 className="text-[10px] font-black tracking-[0.8em] text-[#FFFF00] uppercase italic">Begin New Journey</h3>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black">ประกาศจุดเริ่มต้นของตำนานบทใหม่</p>
            </div>

            <div className="space-y-8">
              <input 
                type="text" 
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ตั้งชื่อการเดินทางนี้..." 
                className="w-full bg-transparent border-b border-white/10 py-6 text-3xl text-white font-serif italic outline-none focus:border-[#FFFF00] transition-colors placeholder:text-zinc-800"
              />
            </div>

            <div className="flex flex-col gap-6 pt-6">
              <button 
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full bg-white text-black font-black py-6 rounded-full text-[10px] uppercase tracking-[0.4em] hover:bg-[#FFFF00] transition-all shadow-xl"
              >
                {isCreating ? "INSCRIBING..." : "START THE LEGACY"}
              </button>
              <button 
                onClick={onClose}
                className="text-zinc-700 text-[9px] uppercase font-black tracking-widest hover:text-zinc-400"
              >
                Not Today
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}