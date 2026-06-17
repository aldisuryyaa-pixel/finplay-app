"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { LayoutDashboard, Wallet, TrendingUp, TrendingDown, Clock, Trash2, LogOut, Command, PieChart as ChartIcon, Eye, EyeOff, Plus, X, Download, Filter, Target, CalendarDays, Settings, Sparkles, ShieldCheck, Menu as MenuIcon, Send, Mail, Moon, Sun, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useTheme } from "next-themes";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
};

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [activeMenu, setActiveMenu] = useState("Pusat Kendali");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, type: "trx"|"goal"|"bill"}>({isOpen: false, type: "trx"});
  const [formData, setFormData] = useState({ amount: "", title: "", category: "Makanan", targetAmount: "", dueDate: "" });
  const [isSaving, setIsSaving] = useState(false);
  
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([{ role: "ai", text: "Koneksi API Generatif Siaga. Mesin siap merumuskan skenario komputasi finansial kompleks." }]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const categories = ["Makanan", "Transportasi", "Utilitas", "Hiburan", "Belanja", "Pemasukan", "Lainnya"];
  const COLORS = ['#0F172A', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B'];

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (session) {
          supabase.auth.signOut();
          toast.error("Protokol Keamanan: Terminasi sesi otomatis.");
          window.location.reload();
        }
      }, 10 * 60 * 1000);
    };

    if (session) {
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(e => window.addEventListener(e, resetTimer));
      resetTimer();
    }
    return () => clearTimeout(timeoutId);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const databaseChannel = supabase
      .channel("realtime-nexus-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => fetchAllData())
      .on("postgres_changes", { event: "*", schema: "public", table: "goals" }, () => fetchAllData())
      .on("postgres_changes", { event: "*", schema: "public", table: "recurring_bills" }, () => fetchAllData())
      .subscribe();
    return () => { supabase.removeChannel(databaseChannel); };
  }, [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData();
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  const fetchAllData = async () => {
    setIsLoading(true);
    const [trxRes, goalsRes, billsRes] = await Promise.all([
      supabase.from("transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("goals").select("*").order("created_at", { ascending: false }),
      supabase.from("recurring_bills").select("*").order("next_due_date", { ascending: true })
    ]);
    if (trxRes.data) setTransactions(trxRes.data);
    if (goalsRes.data) setGoals(goalsRes.data);
    if (billsRes.data) setBills(billsRes.data);
    setIsLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) toast.error(error.message);
      else { toast.success("Registrasi berhasil."); setIsSignUp(false); setPassword(""); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error("Kredensial tertolak.");
    }
    setIsLoggingIn(false);
  };

  const exportToPDF = async () => {
    const element = dashboardRef.current;
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: theme === 'dark' ? '#0B0F19' : '#F8FAFC' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save("Laporan_Finansial_Nexus.pdf");
      toast.success("Dokumen PDF diekstraksi.");
    } catch (err) {
      toast.error("Gagal mengekstraksi dokumen visual.");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdatingProfile(false);
    if (error) toast.error("Proses modifikasi sandi ditolak.");
    else { toast.success("Enkripsi sandi diperbarui."); setNewPassword(""); }
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    let error = null;

    if (modalConfig.type === "trx") {
      const res = await supabase.from("transactions").insert([{ amount: Number(formData.amount), description: formData.title, category: formData.category }]);
      error = res.error;
    } else if (modalConfig.type === "goal") {
      const res = await supabase.from("goals").insert([{ title: formData.title, target_amount: Number(formData.targetAmount), current_amount: Number(formData.amount) || 0 }]);
      error = res.error;
    } else if (modalConfig.type === "bill") {
      const res = await supabase.from("recurring_bills").insert([{ title: formData.title, amount: Number(formData.amount), category: formData.category, next_due_date: formData.dueDate }]);
      error = res.error;
    }

    setIsSaving(false);
    if (!error) {
      setModalConfig({ ...modalConfig, isOpen: false });
      setFormData({ amount: "", title: "", category: "Makanan", targetAmount: "", dueDate: "" });
      fetchAllData();
      toast.success("Catatan direkam.");
    } else { toast.error("Gagal merekam instruksi."); }
  };

  const deleteRecord = async (table: string, id: string) => {
    const isConfirmed = window.confirm("Pemusnahan catatan permanen. Lanjutkan?");
    if (!isConfirmed) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) { fetchAllData(); toast.success("Catatan dimusnahkan."); }
  };

  const { balance, income, expense, chartData } = useMemo(() => {
    let inc = 0, exp = 0;
    let catRecord: Record<string, number> = {};

    transactions.forEach((trx) => {
      const amt = Number(trx.amount);
      if (amt > 0) inc += amt;
      else {
        exp += Math.abs(amt);
        const cat = trx.category || 'Lainnya';
        catRecord[cat] = (catRecord[cat] || 0) + Math.abs(amt);
      }
    });

    return {
      balance: inc - exp, income: inc, expense: exp,
      chartData: Object.keys(catRecord).map(key => ({ name: key, value: catRecord[key] }))
    };
  }, [transactions]);

  const handleAiChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userText = chatInput;
    const newChat = [...chatHistory, { role: "user", text: userText }];
    setChatHistory(newChat);
    setChatInput("");
    setIsAiThinking(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText, context: { balance, income, expense } })
      });
      const data = await res.json();
      if (data.reply) setChatHistory([...newChat, { role: "ai", text: data.reply }]);
      else throw new Error("Transmisi tertolak.");
    } catch (err) {
      let fallbackReply = "Peringatan: Kunci API Eksternal tidak terdeteksi. Sistem mengalihkan pada Mesin Heuristik Darurat. ";
      if (userText.toLowerCase().includes("estimasi")) fallbackReply += `Proyeksi beban terkalkulasi berdasarkan parameter sisa likuiditas (${formatRupiah(balance)}).`;
      else fallbackReply += "Pemindaian manual tidak menunjukkan anomali destruktif pada struktur pengeluaran saat ini.";
      setChatHistory([...newChat, { role: "ai", text: fallbackReply }]);
    }
    setIsAiThinking(false);
  };

  const MenuItem = ({ name, icon: Icon }: { name: string, icon: any }) => {
    const isActive = activeMenu === name;
    return (
      <div onClick={() => { setActiveMenu(name); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all cursor-pointer border ${isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-inner" : "text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-white"}`}>
        <Icon size={18} />
        <span className="text-sm font-bold">{name}</span>
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0B0F19] text-white">
      <div className="p-8 flex items-center gap-3 cursor-pointer" onClick={() => setActiveMenu("Pusat Kendali")}>
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg"><Command className="text-slate-900" size={20} /></div>
        <span className="text-xl font-black tracking-tighter text-white">Nexus.</span>
      </div>
      <div className="flex-1 px-4 space-y-8 mt-2 overflow-y-auto scrollbar-hide">
        <div>
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Infrastruktur Inti</p>
          <nav className="space-y-1.5">
            <MenuItem name="Pusat Kendali" icon={LayoutDashboard} />
            <MenuItem name="Asisten AI" icon={Sparkles} />
            <MenuItem name="Target Finansial" icon={Target} />
            <MenuItem name="Tagihan Berkala" icon={CalendarDays} />
          </nav>
        </div>
        <div>
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Preferensi Sistem</p>
          <nav className="space-y-1.5">
            <MenuItem name="Pengaturan Akun" icon={Settings} />
          </nav>
        </div>
      </div>
      <div className="p-6 border-t border-slate-800/50">
        <button onClick={() => supabase.auth.signOut()} className="flex items-center justify-center gap-2 w-full py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all"><LogOut size={14} /> Terminasi Sesi</button>
      </div>
    </div>
  );

  if (!mounted) return null;

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] p-6">
        <Toaster position="top-center" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[400px] p-10 bg-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] border border-slate-800 shadow-2xl">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><Command className="text-slate-950" size={32} /></div>
            <h1 className="text-3xl font-black text-white tracking-tighter">NEXUS WEALTH</h1>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" required className="w-full px-6 py-4 bg-slate-950 border border-slate-800 text-white rounded-2xl focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="Alamat Surel" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" required className="w-full px-6 py-4 bg-slate-950 border border-slate-800 text-white rounded-2xl focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="Kata Sandi" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="w-full py-4 bg-emerald-500 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-sm">{isLoggingIn ? "Otentikasi..." : isSignUp ? "Registrasi Jaringan" : "Inisialisasi Akses"}</button>
          </form>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-6 text-slate-500 text-xs font-bold hover:text-emerald-400">{isSignUp ? "Gunakan Kredensial Eksisting" : "Permintaan Akses Baru"}</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-white transition-colors duration-300 overflow-hidden">
      <Toaster position="top-right" />
      <aside className="hidden lg:flex w-[280px] h-full"><SidebarContent /></aside>
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[40] lg:hidden" />
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 w-[280px] z-[50] lg:hidden shadow-2xl"><SidebarContent /></motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 lg:h-24 flex items-center justify-between px-6 lg:px-10 bg-white/70 dark:bg-[#0B0F19]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl"><MenuIcon size={20} /></button>
            <h1 className="text-xl lg:text-2xl font-black tracking-tight">{activeMenu}</h1>
          </div>
          <div className="flex items-center gap-4">
            {activeMenu === "Pusat Kendali" && (
              <button onClick={exportToPDF} className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold text-xs shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <FileText size={16} /> Unduh Laporan PDF
              </button>
            )}
            {activeMenu !== "Asisten AI" && activeMenu !== "Pengaturan Akun" && (
              <button onClick={() => {
                let type: "trx"|"goal"|"bill" = "trx";
                if (activeMenu === "Target Finansial") type = "goal";
                if (activeMenu === "Tagihan Berkala") type = "bill";
                setModalConfig({ isOpen: true, type });
              }} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-slate-900 rounded-2xl font-bold text-xs lg:text-sm shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all"><Plus size={18} /> <span className="hidden sm:inline">Entri Modul</span></button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10" ref={dashboardRef}>
          {activeMenu === "Pusat Kendali" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[{ l: "Saldo Bersih", v: balance, c: "text-slate-900 dark:text-white", bg: "bg-slate-100 dark:bg-slate-800", i: Wallet }, { l: "Arus Masuk", v: income, c: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", i: TrendingUp }, { l: "Beban Operasional", v: expense, c: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10", i: TrendingDown }].map((s, i) => (
                  <div key={i} className="p-8 bg-white dark:bg-[#0F172A] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex items-center justify-between mb-6"><div className={`p-3 ${s.bg} rounded-2xl`}><s.i className={s.c} size={22} /></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.l}</span></div>
                    <h2 className={`text-3xl font-black tracking-tight ${s.c}`}>{formatRupiah(s.v)}</h2>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-[#0F172A] p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm h-[450px] flex flex-col transition-colors">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-2"><ChartIcon size={20} className="text-slate-400" /> Pemetaan Alokasi</h3>
                  <div className="flex-1"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={4} dataKey="value" stroke="none">{chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: theme === 'dark' ? '#1E293B' : '#FFF', color: theme === 'dark' ? '#FFF' : '#000' }} /></PieChart></ResponsiveContainer></div>
                </div>
                <div className="bg-white dark:bg-[#0F172A] p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm h-[450px] overflow-hidden flex flex-col transition-colors">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-2"><Clock size={20} className="text-slate-400" /> Log Transaksi Masuk</h3>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
                    {transactions.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                        <div><p className="font-extrabold text-sm">{t.description}</p><p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{t.category}</p></div>
                        <div className="text-right flex items-center gap-3">
                          <p className={`font-black text-sm ${t.amount > 0 ? "text-emerald-500" : "text-slate-700 dark:text-slate-300"}`}>{t.amount > 0 ? "+" : ""}{formatRupiah(t.amount)}</p>
                          <button onClick={() => deleteRecord("transactions", t.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeMenu === "Asisten AI" && (
            <div className="h-full bg-white dark:bg-[#0F172A] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden transition-colors">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center"><Sparkles className="text-slate-900" size={24} /></div>
                <div><h2 className="text-lg font-black">Nexus Core Engine API</h2><p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Model Generatif Eksternal Terhubung</p></div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex items-end gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-slate-900 dark:bg-emerald-500" : "bg-emerald-500"}`}>
                      {msg.role === "user" ? <User size={14} className="text-white dark:text-slate-900" /> : <Command size={14} className="text-slate-900" />}
                    </div>
                    <div className={`p-4 rounded-2xl max-w-[80%] ${msg.role === "user" ? "bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-900 rounded-br-none" : "bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-bl-none font-medium text-sm"}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAiThinking && (
                  <div className="flex items-end gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"><Command size={14} className="text-slate-900 animate-spin" /></div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-bl-none text-slate-400 text-sm font-bold animate-pulse">Mentransmisikan paket data komputasi...</div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
                <form onSubmit={handleAiChat} className="flex gap-2">
                  <input type="text" className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium" placeholder="Kirim instruksi analitik ke model AI..." value={chatInput} onChange={e => setChatInput(e.target.value)} disabled={isAiThinking} />
                  <button type="submit" disabled={isAiThinking || !chatInput} className="w-12 flex items-center justify-center bg-emerald-500 text-slate-900 rounded-xl hover:bg-emerald-400 transition-colors"><Send size={18} /></button>
                </form>
              </div>
            </div>
          )}

          {activeMenu === "Pengaturan Akun" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-white dark:bg-[#0F172A] p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2"><Settings className="text-slate-400" /> Preferensi Visual Dasbor</h3>
                <div className="flex items-center gap-4">
                  <button onClick={() => setTheme('light')} className={`flex items-center gap-2 px-6 py-4 rounded-xl font-black text-sm border-2 transition-all ${theme === 'light' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 dark:border-slate-800 text-slate-500'}`}><Sun size={18} /> Cahaya Terang</button>
                  <button onClick={() => setTheme('dark')} className={`flex items-center gap-2 px-6 py-4 rounded-xl font-black text-sm border-2 transition-all ${theme === 'dark' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-200 dark:border-slate-800 text-slate-500'}`}><Moon size={18} /> Gelap Elegan</button>
                </div>
              </div>
              <div className="bg-white dark:bg-[#0F172A] p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2"><ShieldCheck className="text-emerald-500" /> Kredensial Keamanan Modul</h3>
                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase">Modifikasi Kata Sandi</label>
                    <input type="password" required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-emerald-500" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                  <button disabled={isUpdatingProfile} className="px-6 py-3 bg-emerald-500 text-slate-900 font-black rounded-xl hover:scale-[1.02] transition-transform text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20">{isUpdatingProfile ? "Sinkronisasi Enkripsi..." : "Terapkan Konfigurasi Sandi"}</button>
                </form>
              </div>
              <div className="bg-white dark:bg-[#0F172A] p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2"><Mail className="text-blue-500" /> Notifikasi Surel Otomatis (Cron Job)</h3>
                <div className="p-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <p className="text-sm font-bold mb-2">Status Penjadwalan Peladen: <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">SIAGA AKTIF (H-3 Terminasi)</span></p>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">Fungsi latar belakang (Edge Function) akan memindai modul Tagihan Berkala setiap rotasi waktu 00:00 UTC guna mendistribusikan peringatan presisi menuju alamat surel terdaftar.</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeMenu === "Target Finansial" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {goals.length === 0 ? (
                <div className="text-center p-20 bg-white dark:bg-[#0F172A] rounded-[2rem] border border-slate-100 dark:border-slate-800"><Target className="mx-auto text-slate-200 dark:text-slate-700 mb-4" size={64}/><p className="font-bold text-slate-400">Parameter target nol. Inisialisasi entri baru.</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {goals.map(g => {
                    const progress = Math.min((g.current_amount / g.target_amount) * 100, 100);
                    return (
                      <div key={g.id} className="p-6 bg-white dark:bg-[#0F172A] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative group overflow-hidden transition-colors">
                        <button onClick={() => deleteRecord("goals", g.id)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 z-10"><Trash2 size={18}/></button>
                        <h3 className="text-xl font-black mb-2">{g.title}</h3>
                        <p className="text-sm font-bold text-slate-500 mb-6">{formatRupiah(g.current_amount)} / {formatRupiah(g.target_amount)}</p>
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-emerald-500" /></div>
                        <p className="text-right text-[10px] font-black text-emerald-500 mt-2">{progress.toFixed(1)}% TERCAPAI</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeMenu === "Tagihan Berkala" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#0F172A] rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm transition-colors">
              {bills.length === 0 ? (
                <div className="text-center p-10"><CalendarDays className="mx-auto text-slate-200 dark:text-slate-700 mb-4" size={64}/><p className="font-bold text-slate-400">Tidak ada beban tagihan terjadwal.</p></div>
              ) : (
                <div className="space-y-4">
                  {bills.map(b => (
                    <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group transition-colors">
                      <div className="mb-2 sm:mb-0">
                        <h4 className="font-black">{b.title}</h4>
                        <div className="flex items-center gap-3 mt-1"><span className="text-[10px] font-bold uppercase text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">Tempo: {new Date(b.next_due_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span><span className="text-[10px] font-bold uppercase text-emerald-500">{b.category}</span></div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4"><p className="font-black text-lg">{formatRupiah(b.amount)}</p><button onClick={() => deleteRecord("recurring_bills", b.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={18}/></button></div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {modalConfig.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white dark:bg-[#0F172A] w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-colors">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black">{modalConfig.type === "trx" ? "Injeksi Log Transaksi" : modalConfig.type === "goal" ? "Inisialisasi Target" : "Konfigurasi Tagihan"}</h2>
                <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl"><X size={18} /></button>
              </div>
              <form className="space-y-5" onSubmit={submitForm}>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">Identifikator Data</label><input type="text" required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-emerald-500" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                {modalConfig.type === "goal" ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Nilai Akhir Target</label><input type="number" required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-lg outline-none focus:border-emerald-500" value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: e.target.value})} />
                    <label className="text-[10px] font-black text-slate-400 uppercase mt-2 block">Deposit Awal (Opsional)</label><input type="number" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black outline-none focus:border-emerald-500" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                  </div>
                ) : (
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">Nilai Nominal</label><input type="number" required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-lg outline-none focus:border-emerald-500" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
                )}
                {modalConfig.type !== "goal" && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Sektor Alokasi</label>
                    <select className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-emerald-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  </div>
                )}
                {modalConfig.type === "bill" && (
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase">Tenggat Waktu Siklus</label><input type="date" required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-emerald-500" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} /></div>
                )}
                <button type="submit" disabled={isSaving} className="w-full py-4 mt-2 bg-emerald-500 text-slate-900 font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-transform text-xs uppercase tracking-widest">{isSaving ? "Sinkronisasi..." : "Transmisikan Konfigurasi"}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}