"use client";
import { useState, useEffect, Suspense, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation"; 
import Navbar from "@/components/Navbar"; 

function MoMeContent() {
  const [activeCards, setActiveCards] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter(); 

  // --- 👤 ระบบระบุตัวตน (แบบบ้านๆ) ---
  useEffect(() => {
    const initUser = () => {
      let savedUser = localStorage.getItem("mo_me_user");
      if (!savedUser) {
        const name = prompt("ระบุตัวตนของคุณเพื่อเข้าสู่ Mo-Me (ภาษาอังกฤษเท่านั้น):");
        if (name) {
          const formatted = name.trim().toLowerCase();
          localStorage.setItem("mo_me_user", formatted);
          setCurrentUserId(formatted);
          window.location.reload(); // รีโหลดเพื่อให้โค้ดเริ่มทำงานด้วย ID ใหม่
        } else {
          // กรณีไม่ได้กรอก ให้เป็น guest ไว้ก่อนเพื่อไม่ให้แอปพัง
          setCurrentUserId("guest");
        }
      } else {
        setCurrentUserId(savedUser);
      }
    };
    initUser();
  }, []);

  // --- 📡 ดึงข้อมูล Cards ---
  const fetchEverything = useCallback(async () => {
    // 🚩 ดึง ID ล่าสุดจาก localStorage โดยตรงเพื่อความชัวร์
    const userId = localStorage.getItem("mo_me_user");
    if (!userId) return;

    const { data: cards, error: cardError } = await supabase
      .from('artifacts')
      .select('*')
      .eq('is_archived', false) 
      .eq('user_id', userId) // 🚩 ✅ กรองให้เห็นเฉพาะของตัวเอง
      .order('created_at', { ascending: false });
    
    if (cardError) {
      console.error("🔴 ดึง Cards พัง:", cardError);
      return;
    }
    setActiveCards(cards);
  }, []);

  useEffect(() => {
    if (!currentUserId) return; // รอให้มี ID ก่อนค่อยเริ่มดึงข้อมูล

    fetchEverything();
    
    // 🚩 ปรับ Real-time ให้เช็คเฉพาะข้อมูลที่มีการเปลี่ยนแปลง
    const channel = supabase
      .channel('feed-live')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'artifacts' }, 
        () => fetchEverything()
      )
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, fetchEverything]);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden relative selection:bg-[#FFFF00] selection:text-black">
      <Navbar isEditing={false} onBack={() => {}} />

      <motion.section 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="px-6 pb-32 pt-32 max-w-lg mx-auto space-y-12"
      >
        <div className="flex flex-col items-center mb-16 space-y-4">
           <h1 className="text-[10px] font-black tracking-[1em] text-zinc-600 uppercase">Chronicle Feed</h1>
           {/* แสดงชื่อ User นิดนึงให้รู้ว่า Login เป็นใคร */}
           <p className="text-[8px] text-[#FFFF00]/40 uppercase tracking-[0.3em]">Identity: {currentUserId}</p>
           <div className="h-[1px] w-12 bg-zinc-900" />
        </div>

        {activeCards.length === 0 ? (
          <div className="text-center py-20">
             <p className="text-[10px] text-zinc-600 uppercase tracking-widest">No inscriptions found for this identity.</p>
          </div>
        ) : (
          activeCards.map((card) => (
            <motion.div 
              key={card.id} 
              layoutId={`card-container-${card.id}`}
              whileHover={{ y: -10, transition: { duration: 0.4 } }}
              onClick={() => {
                router.push(`/archive/${card.id}`); 
              }}
              className="group relative w-full aspect-[4/5] rounded-[3rem] overflow-hidden bg-zinc-950 border border-white/[0.03] hover:border-[#FFFF00]/30 transition-all duration-700 cursor-pointer shadow-2xl"
            >
              <motion.img 
                layoutId={`card-image-${card.id}`}
                src={card.image_url} 
                className="absolute inset-0 w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-80 group-hover:scale-110 transition-all duration-1000 ease-out" 
                alt="" 
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
              
              <div className="absolute inset-0 p-12 flex flex-col justify-end items-center text-center">
                 <span className="text-[10px] font-black tracking-[0.5em] text-[#FFFF00]/40 uppercase mb-4 group-hover:text-[#FFFF00] transition-colors duration-500">
                   Inscribed
                 </span>
                 <motion.h2 
                  layoutId={`card-title-${card.id}`}
                  className="text-3xl md:text-5xl font-serif italic text-white leading-tight tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                 >
                  {card.text || "Untitled"}
                 </motion.h2>
                 
                 <div className="mt-6 h-[1px] w-0 group-hover:w-12 bg-[#FFFF00]/50 transition-all duration-700" />
              </div>
            </motion.div>
          ))
        )}
      </motion.section>
    </div>
  );
}

export default function MoMePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-[#FFFF00] tracking-[1em] text-[10px]">SYNCING FEED...</div>}>
      <MoMeContent />
    </Suspense>
  );
}