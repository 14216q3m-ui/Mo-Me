"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function GuardianIntro({ onFinish }: { onFinish: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [report, setReport] = useState<{message: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getReport() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setReport({ message: "ยินดีต้อนรับนักเดินทาง... เริ่มต้นจารึกตัวตนของคุณ" });
            setLoading(false);
            return;
        }
        const res = await fetch(`/api/guardian-brief?userId=${user.id}`);
        const data = await res.json();
        setReport(data);
      } catch (err) {
        setReport({ message: "ความทรงจำในอดีตกำลังเรียงตัวใหม่... เข้าไปดูด้วยตาตัวเองเถอะ" });
      } finally {
        setLoading(false);
      }
    }
    getReport();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // รอให้ Animation จาง (1.2s) จบก่อนค่อยสั่งเปิดหน้าหลัก
    setTimeout(() => {
      onFinish();
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[999] bg-black flex items-center justify-center p-8 cursor-pointer"
        >
          <div className="max-w-md w-full space-y-10 text-center relative z-10">
            <motion.div 
              animate={{ opacity: [0.2, 0.6, 0.2] }} 
              transition={{ repeat: Infinity, duration: 3 }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-[9px] tracking-[1.5em] text-[#FFFF00] font-black uppercase ml-4">The Guardian</span>
              <div className="h-[1px] w-20 bg-[#FFFF00]/20" />
            </motion.div>

            <div className="min-h-[100px] flex items-center justify-center">
              {loading ? (
                <span className="text-[10px] tracking-[0.5em] text-zinc-700 animate-pulse uppercase">Reading Memories...</span>
              ) : (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg md:text-xl font-serif italic text-zinc-300 leading-relaxed drop-shadow-sm"
                >
                  "{report?.message}"
                </motion.p>
              )}
            </div>

            <motion.p 
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              className="text-[8px] tracking-[0.6em] text-zinc-700 uppercase font-bold pt-12"
            >
              Tap to enter the forge
            </motion.p>
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,0,0.03)_0%,_transparent_100%)] pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}