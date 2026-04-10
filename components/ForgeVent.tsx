import React, { useState } from 'react';

export const ForgeVent = () => {
  const [ventText, setVentText] = useState("");
  const [effort, setEffort] = useState(5);

  const handleScribe = async () => {
    // 1. ส่งข้อมูลไปที่ Database (Table: posts)
    // 2. เมื่อสำเร็จ ให้เรียก API /api/guardian-brief เพื่อให้ Guardian ตอบกลับ
    console.log("จิ๊กโก๋กำลังสลักความจริง:", ventText, "ระดับความเหนื่อย:", effort);
    // ... Logic ส่งข้อมูล ...
  };

  return (
    <div className="bg-stone-900 p-6 rounded-xl border border-stone-800 shadow-2xl">
      <h3 className="text-stone-400 font-medium mb-4 text-sm tracking-widest uppercase">ช่องจารึกความห่วยประจำวัน</h3>
      
      <textarea 
        className="w-full bg-transparent border-none text-stone-200 placeholder-stone-600 focus:ring-0 resize-none h-32"
        placeholder="วันนี้มันเฮงซวยยังไง... ระบายมันออกมาให้หมดจิ๊กโก๋"
        value={ventText}
        onChange={(e) => setVentText(e.target.value)}
      />

      <div className="mt-4 flex items-center justify-between border-t border-stone-800 pt-4">
        <div className="flex items-center gap-4">
          <span className="text-xs text-stone-500 italic">ระดับความทุ่มเท (Effort): {effort}/10</span>
          <input 
            type="range" min="1" max="10" 
            className="accent-stone-400 w-24 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer"
            value={effort}
            onChange={(e) => setEffort(parseInt(e.target.value))}
          />
        </div>

        <button 
          onClick={handleScribe}
          className="bg-stone-100 text-stone-950 px-6 py-2 rounded-full font-bold text-xs hover:bg-white transition-all shadow-lg active:scale-95"
        >
          สลักความจริง
        </button>
      </div>
    </div>
  );
};