"use client";

// ไฟล์: app/components/PeakArchive.tsx
export default function PeakArchive({ records }: { records: any[] }) {
  if (!records || records.length === 0) return null;

  // 🕵️ เฟ้นหา "จุดสูงสุด" ของความพยายามในวันนี้
  const peak = records.reduce((prev, current) => 
    (prev.effort > current.effort) ? prev : current
  , records[0]);

  return (
    <div className="mb-12 p-8 rounded-[2.5rem] bg-slate-900/40 border border-amber-500/20 backdrop-blur-2xl relative overflow-hidden group shadow-2xl">
      {/* Aura Effect */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px]"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-amber-500 animate-pulse">🏛️</span>
          <span className="text-amber-500/50 text-[10px] font-bold uppercase tracking-[0.5em]">
            The Peak Archive
          </span>
          <div className="h-[1px] flex-grow bg-gradient-to-r from-amber-500/30 to-transparent"></div>
        </div>

        <h3 className="text-2xl md:text-4xl font-serif italic text-white mb-10 leading-relaxed tracking-tight">
          "{peak.text}"
        </h3>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-inner">
              <span className="text-amber-500 text-[11px] font-black tracking-widest uppercase">
                EFFORT: {peak.effort}%
              </span>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 mt-4">
            <p className="text-[10px] text-amber-500/40 uppercase tracking-[0.2em] mb-3 font-bold">Guardian's Essence:</p>
            <p className="text-amber-100/60 font-light italic leading-relaxed text-lg">
              {peak.whisper || "รอการเชื่อมต่อจดหมายเหตุ... (The Guardian is deep in meditation)"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}