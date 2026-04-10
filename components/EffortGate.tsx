// components/EffortGate.tsx
export const EffortGate = ({ onConfirm, currentEffort, setEffort }: any) => {
  return (
    <div className="p-6 bg-[#111] border border-white/10 rounded-2xl mb-4 animate-in fade-in zoom-in duration-300">
      <h3 className="text-white/80 text-sm mb-4 font-medium text-center">วันนี้มึงทุ่มเทกับเรื่องนี้แค่ไหน? (1-10)</h3>
      <div className="flex justify-between gap-1 mb-6">
        {[...Array(10)].map((_, i) => (
          <button
            key={i}
            onClick={() => setEffort(i + 1)}
            className={`flex-1 h-12 rounded-md transition-all ${
              currentEffort >= i + 1 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-white/5'
            }`}
          />
        ))}
      </div>
      <button 
        onClick={onConfirm}
        disabled={!currentEffort}
        className="w-full py-3 bg-white text-black font-bold rounded-xl disabled:opacity-30 transition-all active:scale-95"
      >
        ตกลง พี่ชายรอฟังอยู่
      </button>
    </div>
  );
};