"use client";

import { useEffect, useState, useMemo } from "react";
import { LayoutDashboard, Wallet, TrendingUp, TrendingDown, Clock, Trash2, LogOut, Command, PieChart as ChartIcon, Eye, EyeOff, Plus, X, Download, Filter, Target, CreditCard, Settings, HelpCircle, User, BarChart3, Construction, Sparkles, ShieldCheck, Menu as MenuIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Navigasi & Mobile State
  const [activeMenu, setActiveMenu] = useState("Pusat Kendali");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Makanan");
  const [isSaving, setIsSaving] = useState(false);
  
  const categories = ["Makanan", "Transportasi", "Utilitas", "Hiburan", "Belanja", "Pemasukan", "Lainnya"];
  const COLORS = ['#0F172A', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B'];

  const [aiAnalysis, setAiAnalysis] = useState<string[]>([]);

  // Keamanan: Session Timeout (10 Menit)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (session) {
          supabase.auth.signOut();
          toast.error("Sesi berakhir demi keamanan.");
          window.location.reload();
        }
      }, 10 * 60 * 1000);
    };

    if (session) {
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(e => 
        window.addEventListener(e, resetTimer)
      );
      resetTimer();
    }
    return () => clearTimeout(timeoutId);
  }, [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchTransactions();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchTransactions();
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setTransactions(data);
    setIsLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) toast.error(error.message);
      else { toast.success("Registrasi berhasil!"); setIsSignUp(false); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error("Akses ditolak.");
    }
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesi keluar.");
  };

  const { balance, income, expense, chartData, trendData } = useMemo(() => {
    let inc = 0, exp = 0;
    let catRecord: Record<string, number> = {};
    let trendMap: Record<string, number> = {};

    const filtered = transactions.filter(t => {
      if (timeFilter === "all") return true;
      const date = new Date(t.created_at);
      const now = new Date();
      if (timeFilter === "month") return date.getMonth() === now.getMonth();
      return true;
    });

    filtered.forEach((trx) => {
      const amt = Number(trx.amount);
      const dateKey = new Date(trx.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' });
      trendMap[dateKey] = (trendMap[dateKey] || 0) + amt;
      if (amt > 0) inc += amt;
      else {
        exp += Math.abs(amt);
        const cat = trx.category || 'Lainnya';
        catRecord[cat] = (catRecord[cat] || 0) + Math.abs(amt);
      }
    });

    // Logika Simulasi AI Mendalam
    const insights = [];
    if (inc > exp * 2) insights.push("Rasio tabungan sangat sehat (Surplus > 50%). Pertimbangkan investasi instrumen agresif.");
    if (exp > inc * 0.8) insights.push("WASPADA: Pengeluaran mendekati 80% pemasukan. AI merekomendasikan pengetatan kategori hiburan.");
    const highest = Object.keys(catRecord).reduce((a, b) => catRecord[a] > catRecord[b] ? a : b, "");
    if (highest) insights.push(`Sektor "${highest}" menjadi penyedot modal utama. Reduksi 15% pada sektor ini akan menstabilkan saldo bulan depan.`);
    setAiAnalysis(insights.length ? insights : ["Data belum cukup untuk analisis prediktif."]);

    return {
      balance: inc - exp, income: inc, expense: exp,
      chartData: Object.keys(catRecord).map(key => ({ name: key, value: catRecord[key] })),
      trendData: Object.keys(trendMap).map(key => ({ date: key, balance: trendMap[key] }))
    };
  }, [transactions, timeFilter]);

  const formatRupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0B0F19] text-white">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
          <Command className="text-slate-900" size={20} />
        </div>
        <span className="text-xl font-black tracking-tighter text-white">Nexus.</span>
        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto p-2 bg-slate-800 rounded-lg">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 px-4 space-y-8 mt-2 overflow-y-auto">
        <div>
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Core Engine</p>
          <nav className="space-y-1.5">
            {[
              { n: "Pusat Kendali", i: LayoutDashboard },
              { n: "Asisten AI", i: Sparkles },
              { n: "Analisis Lanjutan", i: BarChart3, pro: true },
              { n: "Target Finansial", i: Target }
            ].map(item => (
              <div 
                key={item.n}
                onClick={() => { setActiveMenu(item.n); setIsSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all cursor-pointer border ${activeMenu === item.n ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]" : "text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-white"}`}
              >
                <item.i size={18} />
                <span className="text-sm font-bold">{item.n}</span>
                {item.pro && <span className="ml-auto text-[8px] bg-slate-800 px-1.5 py-0.5 rounded text-emerald-500">PRO</span>}
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-6 border-t border-slate-800/50">
        <div className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-900 text-xs">AD</div>
          <div className="flex-1 overflow-hidden">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter truncate">{session?.user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all">
          <LogOut size={14} /> Akhiri Sesi
        </button>
      </div>
    </div>
  );

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] p-6">
        <Toaster position="top-center" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-[400px] p-10 bg-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] border border-slate-800 shadow-2xl">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
              <Command className="text-slate-950" size={32} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter">NEXUS WEALTH</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Enterprise Access</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" required className="w-full px-6 py-4 bg-slate-950 border border-slate-800 text-white rounded-2xl focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required className="w-full px-6 py-4 bg-slate-950 border border-slate-800 text-white rounded-2xl focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-4.5 text-slate-600 hover:text-emerald-400">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button className="w-full py-4 bg-emerald-500 text-slate-950 font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-sm">
              {isLoggingIn ? "Authenticating..." : isSignUp ? "Create Account" : "Access Portal"}
            </button>
          </form>

          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-6 text-slate-500 text-xs font-bold hover:text-emerald-400 transition-colors">
            {isSignUp ? "Already have access? Log in" : "New observer? Request access"}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden relative">
      <Toaster position="top-right" />

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-[280px] h-full">
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile (Off-canvas) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[40] lg:hidden" />
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 w-[280px] z-[50] lg:hidden shadow-2xl">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Responsif */}
        <header className="h-20 lg:h-24 flex items-center justify-between px-6 lg:px-10 bg-white/70 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <MenuIcon size={20} />
            </button>
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">{activeMenu}</h1>
              <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status: Operational</p>
            </div>
          </div>

          {activeMenu === "Pusat Kendali" && (
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-xs lg:text-sm hover:scale-105 transition-all shadow-xl shadow-slate-900/20">
              <Plus size={18} /> <span className="hidden sm:inline">Entri Baru</span>
            </button>
          )}
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          {activeMenu === "Pusat Kendali" ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {/* Insight AI Section */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-3xl border border-emerald-500/20 shadow-2xl flex items-start gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                  <Sparkles size={24} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-emerald-400 text-xs font-black uppercase tracking-[0.2em] mb-2">Nexus Smart Insight</h3>
                  <div className="space-y-2">
                    {aiAnalysis.map((txt, i) => (
                      <p key={i} className="text-slate-300 text-sm font-medium leading-relaxed">• {txt}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { l: "Saldo Bersih", v: balance, c: "text-slate-900", bg: "bg-slate-100", i: Wallet },
                  { l: "Pemasukan", v: income, c: "text-emerald-500", bg: "bg-emerald-50", i: TrendingUp },
                  { l: "Pengeluaran", v: expense, c: "text-red-500", bg: "bg-red-50", i: TrendingDown }
                ].map((s, i) => (
                  <div key={i} className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`p-3 ${s.bg} rounded-2xl group-hover:scale-110 transition-transform`}>
                        <s.i className={s.c} size={22} />
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{s.l}</span>
                    </div>
                    <h2 className={`text-3xl font-black tracking-tight ${s.c}`}>{formatRupiah(s.v)}</h2>
                  </div>
                ))}
              </div>

              {/* Charts & History */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm h-[450px] flex flex-col">
                  <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                    <ChartIcon size={20} className="text-slate-400" /> Alokasi Dana
                  </h3>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={4} dataKey="value" stroke="none">
                          {chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm h-[450px] overflow-hidden flex flex-col">
                  <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 sticky top-0 bg-white">
                    <Clock size={20} className="text-slate-400" /> Histori Terbaru
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
                    {transactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                        <div>
                          <p className="font-extrabold text-slate-800 text-sm">{t.description}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{t.category || "General"}</p>
                        </div>
                        <p className={`font-black text-sm ${t.amount > 0 ? "text-emerald-500" : "text-slate-800"}`}>
                          {t.amount > 0 ? "+" : ""}{formatRupiah(t.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-8">
                <Construction size={40} className="text-slate-200" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">Modul {activeMenu}</h2>
              <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
                Unit pengolah data untuk fitur ini sedang dalam fase enkapsulasi dan sinkronisasi server utama.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modal Modern */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <Command size={200} />
              </div>
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Entri Data</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:text-slate-900">
                  <X size={20} />
                </button>
              </div>
              <form className="space-y-6 relative z-10" onSubmit={async (e) => {
                e.preventDefault();
                setIsSaving(true);
                const { error } = await supabase.from("transactions").insert([{ amount: Number(amount), description, category }]);
                setIsSaving(false);
                if (!error) { setIsModalOpen(false); setAmount(""); setDescription(""); fetchTransactions(); toast.success("Data Tersimpan"); }
              }}>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal</label>
                  <input type="number" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-black text-lg" placeholder="-50000" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deskripsi</label>
                  <input type="text" required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold" placeholder="Contoh: Belanja Bulanan" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</label>
                  <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none cursor-pointer font-bold" value={category} onChange={e => setCategory(e.target.value)}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button disabled={isSaving} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xs">
                  {isSaving ? "Synchronizing..." : "Konfirmasi Entri"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}