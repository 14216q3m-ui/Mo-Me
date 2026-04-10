"use client";
export default function ForgeLogItem({ log, isLatest = false }: any) {
  return (
    <div className={`relative pl-10 border-l ${isLatest ? 'border-[#FFFF00]' : 'border-zinc-800'} group pb-12`}>
      {/* Dot เชื่อมเส้น */}
      <div className={`absolute left-[-5px] top-2 w-2.5 h-2.5 rounded-full ${isLatest ? 'bg-[#FFFF00] shadow-[0_0_10px_#FFFF00]' : 'bg-zinc-700'}`} />
      
      <div className="space-y-6">
        {/* Header: Date & Effort */}
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black tracking-[0.3em] text-zinc-500 uppercase">
            FORGED ON {new Date(log.created_at || Date.now()).toLocaleDateString('th-TH')}
          </span>
          <div className="text-[9px] font-black text-[#FFFF00] border border-[#FFFF00]/30 px-3 py-1 rounded-full bg-[#FFFF00]/5">
            EFFORT: {log.effort_value}%
          </div>
        </div>

        {/* Content: Emotional Reflect */}
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Personal Echo</p>
            <p className="text-zinc-200 italic text-lg font-serif leading-relaxed">"{log.content}"</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-[8px] font-black text-[#FFFF00]/50 uppercase tracking-widest">Guardian's Reflection</p>
            <p className="text-zinc-500 italic text-sm">การเดินทางที่มั่นคงมักทิ้งร่องรอยที่ชัดเจนเสมอ...</p>
          </div>
        </div>

        {/* Media */}
        {log.media_url && (
          <div className="relative aspect-video rounded-[2rem] overflow-hidden border border-white/5 bg-zinc-900 group-hover:border-[#FFFF00]/20 transition-all duration-500">
            <img src={log.media_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700" alt="Forge evidence" />
          </div>
        )}

        {/* Actions: ลบ/แก้ไข */}
        <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="text-[8px] font-black text-zinc-600 hover:text-white uppercase tracking-widest">Edit</button>
          <button className="text-[8px] font-black text-red-900 hover:text-red-500 uppercase tracking-widest">Delete</button>
        </div>
      </div>
    </div>
  );
}