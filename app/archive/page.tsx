"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation"; // 🎯 1. เพิ่มตัวเปลี่ยนหน้า
import Navbar from "@/components/Navbar";

export default function ArchivePage() {
  const [archiveItems, setArchiveItems] = useState<any[]>([]);
  const router = useRouter(); // 🎯 2. เรียกใช้งาน router

  useEffect(() => {
    const fetchArchive = async () => {
      const { data } = await supabase
        .from('artifacts')
        .select('*')
        .eq('is_archived', true) 
        .order('created_at', { ascending: false });
      if (data) setArchiveItems(data);
    };
    fetchArchive();
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Navbar isEditing={false} />

      <main className="min-h-screen text-white relative font-sans pt-40 px-6 pb-20">
        <header className="max-w-4xl mx-auto mb-16 border-l-2 border-[#FFFF00] pl-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 mb-2">System Archive</h2>
          <h1 className="text-4xl font-serif italic text-white leading-tight">บันทึกวิญญาณที่ถูกสลักไว้</h1>
          <div className="h-[1px] w-12 bg-zinc-800 mt-4" />
        </header>

        <div className="max-w-4xl mx-auto grid grid-cols-1 gap-4">
          {archiveItems.length === 0 ? (
            <div className="py-20 text-center border border-white/5 rounded-3xl bg-zinc-900/10">
               <p className="text-zinc-700 uppercase tracking-[0.5em] text-[10px]">No archived artifacts found.</p>
            </div>
          ) : (
            archiveItems.map((item) => (
              <motion.div 
                key={item.id}
                onClick={() => router.push(`/archive/${item.id}`)} // 🎯 3. คลิกแล้ววิ่งไปหน้ารายละเอียด [id]
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ x: 12, backgroundColor: "rgba(24, 24, 27, 0.4)" }}
                className="group flex items-center justify-between p-6 bg-zinc-900/20 border border-white/5 rounded-2xl cursor-pointer hover:border-[#FFFF00]/30 transition-all duration-500"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-white/10 ring-4 ring-black shadow-2xl">
                    <img src={item.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                  </div>
                  
                  <div>
                    <p className="text-xl font-serif italic text-zinc-300 group-hover:text-white transition-colors">
                      "{item.text}"
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[8px] text-zinc-600 uppercase tracking-widest">
                        Archived — {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-zinc-800" />
                      <span className="text-[8px] text-[#FFFF00]/40 font-bold uppercase tracking-tighter">ID: {item.id.slice(0,8)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-zinc-700 text-[9px] font-black tracking-widest group-hover:text-[#FFFF00] group-hover:translate-x-1 transition-all">
                    VIEW ENTRY
                  </span>
                  <span className="text-[#FFFF00] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}