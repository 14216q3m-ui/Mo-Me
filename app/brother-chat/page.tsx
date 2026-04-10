"use client";
import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiZap, FiCamera, FiX } from "react-icons/fi";
import { Memory } from "@/lib/guardian/memory";

function BrotherChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const postId = searchParams.get("id");
  const effort = searchParams.get("effort");

  // 🎯 ดึงชื่อจากเครื่อง
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem("mo_me_user") : null;

  const [logs, setLogs] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImages, setSelectedImages] = useState<any[]>([]); 
  const [cardTitle, setCardTitle] = useState("ทั่วไป");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCardInfo = useCallback(async () => {
    if (!postId || !currentUserId) return;
    const { data } = await supabase
      .from('artifacts')
      .select('text')
      .eq('id', postId)
      .eq('user_id', currentUserId) // 🚩 เช็คสิทธิ์
      .single();
    if (data?.text) setCardTitle(data.text);
  }, [postId, currentUserId]);

  const updateDailyMemory = async (currentLogs: any[]) => {
    try {
      // 🚩 เปลี่ยนจากใช้ supabase.auth เป็นใช้ชื่อเล่นที่เราตั้งไว้
      if (!currentUserId || currentLogs.length === 0 || !postId) return;
      
      const historyText = currentLogs.map(log => `${log.role === 'brother' ? 'พี่' : 'น้อง'}: ${log.update_text}`).join("\n");
      const summary = await Memory.generateDailySummary(historyText);
      
      // 🚩 เซฟสรุปลง Archive โดยใช้ currentUserId ของเรา
      if (summary) {
        await Memory.saveToArchive(currentUserId, summary, effort ? Number(effort) : 5, postId);
      }
    } catch (err) { console.error("Memory Error:", err); }
  };

  const fetchSessionLogs = useCallback(async () => {
    if (!postId || !currentUserId) return;
    try {
      const { data: lastSummary } = await supabase
        .from("post_updates")
        .select("created_at")
        .eq("post_id", postId)
        .eq("user_id", currentUserId) // 🚩 กั้นห้อง
        .eq("content_type", "summary")
        .order("created_at", { ascending: false })
        .limit(1);

      const lastSummaryTime = lastSummary?.[0]?.created_at;

      let query = supabase
        .from("post_updates")
        .select("*")
        .eq("post_id", postId)
        .eq("user_id", currentUserId) // 🚩 กั้นห้อง
        .eq("content_type", "chat") 
        .order("created_at", { ascending: true });

      if (lastSummaryTime) {
        query = query.gt("created_at", lastSummaryTime);
      }

      const { data, error } = await query;
      if (!error && data) {
        setLogs(data); 
        scrollToBottom();
        return data;
      }
    } catch (err) { console.error("Fetch logs error:", err); }
  }, [postId, currentUserId]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior });
    }, 100);
  };

  useEffect(() => {
    if (!postId) {
      router.push('/');
      return;
    }
    const initChat = async () => {
      setIsSaving(true);
      try {
        await fetchCardInfo();
        // ส่ง userId ไปที่ API ด้วยเพื่อให้ฝั่ง Server รู้ว่าใครคุย
        await fetch("/api/guardian/brother", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            message: "เริ่มการสนทนาใหม่", 
            postId, 
            effort: effort ? Number(effort) : 5, 
            mode: 'greeting',
            userId: currentUserId // 🚩 ส่งชื่อไป
          }),
        });
        await fetchSessionLogs();
      } catch (err) { console.error(err); } finally { setIsSaving(false); }
    };
    if (currentUserId) initChat();
  }, [postId, fetchCardInfo, fetchSessionLogs, effort, router, currentUserId]);

  const handleSend = async () => {
    if ((!content.trim() && selectedImages.length === 0) || isSaving || !postId || !currentUserId) return;
    const messageToSend = content;
    const imagesToProcess = [...selectedImages];
    setContent(""); setSelectedImages([]); setIsSaving(true);

    try {
      if (messageToSend.trim()) {
        await supabase.from("post_updates").insert({
          post_id: postId, 
          role: 'user', 
          update_text: messageToSend, 
          content_type: 'chat', 
          user_id: currentUserId, // 🚩 แปะชื่อเจ้าของ
          created_at: new Date().toISOString()
        });
        await fetchSessionLogs(); 
      }

      if (imagesToProcess.length > 0) {
        for (const img of imagesToProcess) {
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const { error: uploadError } = await supabase.storage.from("artifacts").upload(`chat-evidence/${fileName}`, img.file);
          if (uploadError) continue;
          const { data: urlData } = supabase.storage.from("artifacts").getPublicUrl(`chat-evidence/${fileName}`);
          await supabase.from("post_updates").insert({
            post_id: postId, 
            role: 'user', 
            update_text: "", 
            image_url: urlData.publicUrl, 
            content_type: 'chat', 
            user_id: currentUserId, // 🚩 แปะชื่อเจ้าของ
            created_at: new Date().toISOString()
          });
        }
        await fetchSessionLogs();
      }

      const res = await fetch("/api/guardian/brother", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: messageToSend, 
          postId, 
          effort: effort ? Number(effort) : 5, 
          mode: 'chat',
          userId: currentUserId // 🚩 ส่งชื่อไปให้ AI บันทึกคำตอบเป็นชื่อเรา
        }),
      });

      if (res.ok) {
        await fetchSessionLogs(); 
      }
    } catch (err) { console.error(err); } finally { setIsSaving(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setSelectedImages(prev => [...prev, { file, previewUrl: URL.createObjectURL(file) }]);
      reader.readAsDataURL(file);
    });
  };

  const handleExit = async () => {
    setIsSaving(true);
    try {
      if (postId && logs.length > 0) await updateDailyMemory(logs);
      await fetch("/api/guardian/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          postId, 
          effort: effort ? Number(effort) : 5,
          userId: currentUserId // 🚩
        }),
      });
      router.push('/'); 
    } catch (err) { router.push('/'); } finally { setIsSaving(false); }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 flex flex-col relative">
      <nav className="p-6 md:p-10 flex justify-between items-center fixed top-0 w-full bg-[#050505]/80 backdrop-blur-md z-[100] border-b border-white/5">
        <button onClick={handleExit} disabled={isSaving} className="text-zinc-600 hover:text-white flex items-center gap-2 transition-all group">
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
            {isSaving ? "Inscribing..." : "Exit & Inscribe"}
          </span>
        </button>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 bg-zinc-900/50 px-4 py-1.5 rounded-full border border-white/5">
            <FiZap className="text-[#FFFF00] animate-pulse" size={10} />
            <span className="text-xs font-serif italic text-white/90">Effort {effort || 0}/10</span>
          </div>
          <span className="text-[7px] text-[#FFFF00]/40 uppercase tracking-widest">{currentUserId}</span>
        </div>
      </nav>

      {/* ... ส่วน Main และ Footer เหมือนเดิม ... */}
      <main className="relative z-0 flex-1 px-6 md:px-24 pt-40 pb-96 max-w-4xl mx-auto w-full">
        <div className="space-y-24">
          <AnimatePresence mode="popLayout">
            {logs.map((log) => (
              <motion.div key={log.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${log.role === 'brother' ? 'items-start' : 'items-end'}`}>
                <div className={`max-w-[85%] sm:max-w-[70%] space-y-4 ${log.role === 'brother' ? 'text-left' : 'text-right'}`}>
                  <span className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase opacity-50">{log.role === 'brother' ? '— The Elder' : `${currentUserId} —`}</span>
                  {log.update_text && (
                    <p className={`text-xl md:text-3xl font-serif leading-relaxed tracking-tight ${log.role === 'brother' ? 'text-[#FFFF00]' : 'text-zinc-100 italic opacity-90'}`}>
                      {log.role === 'brother' ? log.update_text : `"${log.update_text}"`}
                    </p>
                  )}
                  {log.image_url && <img src={log.image_url} className="mt-8 rounded-2xl border border-white/10 grayscale hover:grayscale-0 transition-all" alt="evidence" />}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-8 md:p-12 bg-gradient-to-t from-black via-black/80 to-transparent z-[100] pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <div className="flex flex-wrap gap-4 mb-6">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-[#FFFF00]/30 shadow-lg">
                <img src={img.previewUrl} className="w-full h-full object-cover" />
                <button onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-black/80 text-white rounded-full p-1 scale-75"><FiX /></button>
              </div>
            ))}
          </div>
          <div className="relative bg-[#0A0A0A]/95 p-6 rounded-[2.2rem] border border-white/10 shadow-2xl backdrop-blur-xl">
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="พ่นมันออกมา..." className="w-full bg-transparent border-none outline-none text-2xl text-white font-serif italic h-16 resize-none" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
            <div className="flex justify-between items-center mt-4">
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-zinc-600 hover:text-white transition-colors"><FiCamera size={22} /></button>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" multiple />
              <button disabled={isSaving} onClick={handleSend} className="bg-[#FFFF00] text-black px-10 py-3 rounded-full font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"> {isSaving ? "SYNCING" : "COMMIT"} </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function BrotherChatPage() {
  return <Suspense fallback={<div className="min-h-screen bg-black" />}><BrotherChatContent /></Suspense>;
}