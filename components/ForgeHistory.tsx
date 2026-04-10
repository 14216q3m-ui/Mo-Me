"use client";
import { motion } from "framer-motion";

export default function ForgeHistory({ updates, isPreview = false, previewData = null }: any) {
  return (
    <div className="space-y-12 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-900">
      {/* ส่วนพรีวิว (จะโผล่มาตอนกำลังพิมพ์) */}
      {isPreview && previewData && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="relative ml-12 group border-b border-[#FFFF00]/10 pb-10 mb-10">
          <div className="absolute -left-[36px] top-4 w-1.5 h-1.5 rounded-full bg-[#FFFF00] shadow-[0_0_10px_#FFFF00]" />
          <div className="space-y-4">
            <span className="text-[7px] text-[#FFFF00] uppercase italic font-bold tracking-[0.4em]">FORGING NOW...</span>
            <div className="bg-zinc-900/40 border border-[#FFFF00]/20 p-6 rounded-[2.5rem]">
              <p className="text-white font-light italic text-sm leading-relaxed whitespace-pre-wrap">"{previewData.text || "..."}"</p>
              {previewData.image && <img src={previewData.image} className="mt-6 rounded-3xl w-full max-h-[400px] object-cover opacity-60" alt="preview" />}
            </div>
          </div>
        </motion.div>
      )}

      {/* ข้อมูลจริงจาก Database */}
      {updates.map((update: any) => (
        <motion.div key={update.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="relative ml-12 group">
          <div className="absolute -left-[36px] top-4 w-1.5 h-1.5 rounded-full bg-zinc-800 group-hover:bg-[#FFFF00] transition-all" />
          <div className="space-y-4">
            <span className="text-[7px] text-zinc-600 uppercase italic font-bold tracking-[0.4em]">
              {new Date(update.update_date || update.created_at).toLocaleDateString()}
            </span>
            <div className="bg-zinc-900/20 border border-white/[0.02] p-6 rounded-[2.5rem] group-hover:border-white/5 transition-all">
              <p className="text-zinc-300 font-light italic text-sm leading-relaxed whitespace-pre-wrap">"{update.update_text || update.content}"</p>
              {(update.image_url || update.media_url) && (
                <img src={update.image_url || update.media_url} className="mt-6 rounded-3xl w-full max-h-[400px] object-cover border border-white/5 grayscale hover:grayscale-0 transition-all duration-1000" alt="update" />
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}