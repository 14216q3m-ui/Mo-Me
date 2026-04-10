"use client";
import { useState, useMemo, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FiCamera, FiArrowLeft, FiLoader } from "react-icons/fi";

function InscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const today = new Date();
  const [day, setDay] = useState(today.getDate());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  // 🎯 ดึงชื่อจากเครื่อง (ใช้ทั้งตอน Edit และ Create)
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem("mo_me_user") : null;

  // 🎯 ดึงข้อมูลเก่ามาใส่กรณี Edit Mode (ต้องกรอง user_id ด้วยเพื่อความปลอดภัย)
  useEffect(() => {
    if (editId && currentUserId) {
      const fetchArtifact = async () => {
        const { data } = await supabase
          .from("artifacts")
          .select("*")
          .eq("id", editId)
          .eq("user_id", currentUserId) // 🚩 เช็คว่าเป็นเจ้าของตัวจริงไหม
          .single();

        if (data) {
          setText(data.text);
          setPreview(data.image_url);
          const d = new Date(data.created_at);
          setDay(d.getDate());
          setMonth(d.getMonth() + 1);
          setYear(d.getFullYear());
        }
      };
      fetchArtifact();
    }
  }, [editId, currentUserId]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 30 }, (_, i) => currentYear - i);
  }, []);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleCommit = async () => {
    if (!text.trim() || isSubmitting) return;
    if (!currentUserId) {
      alert("ไม่พบตัวตนของคุณ กรุณากลับไปหน้าหลักเพื่อตั้งชื่อก่อน");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedDate = new Date(year, month - 1, day).toISOString();
      let finalImageUrl = preview;

      if (file) {
        const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
        const { error: upError } = await supabase.storage.from('artifact-images').upload(fileName, file);
        if (upError) throw upError;
        const { data: { publicUrl } } = supabase.storage.from('artifact-images').getPublicUrl(fileName);
        finalImageUrl = publicUrl;
      }

      const payload = { 
        text, 
        image_url: finalImageUrl || "https://images.unsplash.com/photo-1550684848-fac1c5b4e853", 
        created_at: selectedDate,
        user_id: currentUserId // 🚩 แปะชื่อเจ้าของลงไปเสมอ
      };

      if (editId) {
        // อัปเดตเฉพาะอันที่เป็นของเรา
        await supabase.from("artifacts").update(payload).eq("id", editId).eq("user_id", currentUserId);
      } else {
        // สร้างใหม่พ่วง user_id
        await supabase.from("artifacts").insert([{ ...payload, is_archived: false }]);
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error committing memory.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="h-screen w-full bg-black text-white overflow-hidden relative flex flex-col px-8 py-10">
      <header className="flex justify-between items-center mb-6">
        <button onClick={() => router.back()} className="group flex items-center gap-2 text-[10px] font-black tracking-[0.3em] text-white/40 hover:text-white transition-all uppercase">
          <FiArrowLeft /> BACK
        </button>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black tracking-[0.4em] text-[#FFFF00]/40 italic uppercase">
            {editId ? "Edit Archive" : "Inscribe"}
          </span>
          {/* โชว์ชื่อนิสนึงให้จิ๊กโก๋อุ่นใจ */}
          <span className="text-[7px] text-zinc-700 uppercase tracking-widest">{currentUserId}</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full space-y-8">
        <section className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-serif italic tracking-tighter leading-none">
            {editId ? "แก้ไขความจริง" : "จารึกความจริง"}
          </h1>
          <div className="flex flex-wrap items-center gap-2 pt-2 border-l-2 border-[#FFFF00]/30 pl-8">
             <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mr-4">Occurred on :</span>
             <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-lg">
                <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="bg-transparent text-[11px] font-bold text-white outline-none px-2 py-1 appearance-none">
                  {days.map(d => <option key={d} value={d} className="bg-zinc-900">{d}</option>)}
                </select>
                <span className="text-zinc-700">/</span>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-transparent text-[11px] font-bold text-white outline-none px-2 py-1 appearance-none">
                  {months.map((m, i) => <option key={m} value={i + 1} className="bg-zinc-900">{m}</option>)}
                </select>
                <span className="text-zinc-700">/</span>
                <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-transparent text-[11px] font-bold text-[#FFFF00] outline-none px-2 py-1 appearance-none">
                  {years.map(y => <option key={y} value={y} className="bg-zinc-900">{y}</option>)}
                </select>
             </div>
          </div>
        </section>

        <textarea 
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="สิ่งที่เกิดขึ้น..."
          className="w-full bg-transparent border-l-2 border-zinc-800 focus:border-[#FFFF00] pl-8 py-4 text-3xl font-serif italic outline-none min-h-[140px] resize-none"
        />

        <label className="cursor-pointer group flex items-center gap-6 p-4 rounded-2xl border border-dashed border-zinc-800 hover:border-[#FFFF00]/50 transition-all w-fit">
          <input type="file" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if(f) { setFile(f); setPreview(URL.createObjectURL(f)); }
          }} accept="image/*" />
          <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden border border-white/5">
            {preview ? <img src={preview} className="w-full h-full object-cover" /> : <FiCamera size={20} className="text-zinc-500" />}
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black tracking-widest uppercase">{editId ? "Change Visual" : "Add Visual"}</p>
          </div>
        </label>
      </div>

      <footer className="mt-auto pt-8 border-t border-white/5 flex justify-end">
        <button onClick={handleCommit} disabled={isSubmitting} className="bg-[#FFFF00] text-black px-12 py-4 rounded-full font-black text-[11px] tracking-[0.2em] italic uppercase">
          {isSubmitting ? "Processing..." : (editId ? "Update Chronicle" : "Commit Memory")}
        </button>
      </footer>
    </main>
  );
}

export default function InscribePage() {
  return <Suspense><InscribeContent /></Suspense>;
}