"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import ForgeCard from "@/components/ForgeCard";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (isRegister) {
      // ระบบสมัครสมาชิก (ตัดเรื่อง Hint ออกไปแล้ว)
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) {
        setMessage("สมัครไม่สำเร็จ: " + error.message);
      } else {
        setMessage("สมัครสมาชิกสำเร็จ! กรุณาเช็คอีเมลเพื่อยืนยัน");
      }
    } else {
      // ระบบเข้าสู่ระบบ
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else {
        router.push("/"); // เข้าสู่หน้าหลัก
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md p-10 input-glass-aura rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
        {/* แสงรัศมีสีทองหลังการ์ด */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#D4AF37]/10 blur-[100px]" />
        
        <div className="text-center mb-10">
          <h1 className="text-5xl font-playfair font-black text-white italic tracking-tighter">Mo-Me</h1>
          <p className="text-[#D4AF37] text-[10px] tracking-[0.5em] uppercase mt-4 opacity-70">
            {isRegister ? "JOIN THE LEGACY" : "AUTHENTICATING ACCESS"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 ml-4">Email Address</label>
              <input 
                type="email" 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 mt-1 text-white focus:border-[#D4AF37]/50 outline-none transition-all text-sm"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 ml-4">Secret Key</label>
              <input 
                type="password" 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 mt-1 text-white focus:border-[#D4AF37]/50 outline-none transition-all text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {message && (
            <p className="text-[10px] text-center text-[#D4AF37] tracking-widest bg-[#D4AF37]/10 py-3 rounded-full animate-pulse uppercase">
              {message}
            </p>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-gold-glow w-full h-14 rounded-full text-[11px] font-bold tracking-[0.2em] uppercase mt-4 transition-all active:scale-95"
          >
            {loading ? "PROCESSING..." : (isRegister ? "CREATE ACCOUNT" : "ENTER ARCHIVE")}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
          >
            {isRegister ? "Already have a key? Login" : "No key yet? Register Member"}
          </button>
        </div>
      </div>
    </div>
  );
}