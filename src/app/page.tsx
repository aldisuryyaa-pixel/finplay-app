"use client";

import { useEffect, useState, useMemo } from "react";
import { LayoutDashboard, Wallet, TrendingUp, TrendingDown, Clock, Trash2, LogOut, Command, PieChart as ChartIcon, Eye, EyeOff, Plus, X, Download, Filter, Target, CreditCard, Settings, HelpCircle, User, BarChart3, Construction, Sparkles, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [activeMenu, setActiveMenu] = useState("Pusat Kendali");

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

  const [aiMessage, setAiMessage] = useState("Menyinkronkan parameter finansial...");

  // Sistem Keamanan Pemutus Sesi Otomatis (Session Timeout)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (session) {
          supabase.auth.signOut();
          toast.error("Protokol Keamanan: Sesi diakhiri otomatis karena ketiadaan interaksi (10 Menit).", { duration: 8000 });
          window.location.reload();
        }
      }, 10 * 60 * 1000); 
    };

    if (session) {
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('keypress', resetTimer);
      window.addEventListener('scroll', resetTimer);
      window.addEventListener('click', resetTimer);
      resetTimer();
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
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
      else {
        toast.success("Registrasi berhasil! Silakan masuk.");
        setIsSignUp(false);
        setPassword("");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error("Kredensial tidak valid.");
    }
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesi diakhiri secara manual.");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus transaksi ini permanen?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) {
      fetchTransactions();
      toast.success("Transaksi dihapus");
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const { error } = await supabase.from("transactions").insert([
      { amount: Number(amount), description, category },
    ]);
    setIsSaving(false);
    if (!error) {
      setIsModalOpen(false);
      setAmount("");
      setDescription("");
      setCategory("Makanan");
      fetchTransactions();
      toast.success("Transaksi direkam!");
    } else {
      toast.error("Gagal merekam data.");
    }
  };

  const exportToCSV = () => {
    const headers = ["Tanggal,Deskripsi,Kategori,Nominal,Tipe"];
    const csvData = filteredTransactions.map(t => 
      `${new Date(t.created_at).toLocaleDateString("id-ID")},"${t.description}","${t.category || "Lainnya"}",${Math.abs(t.amount)},${t.amount > 0 ? "Pemasukan" : "Pengeluaran"}`
    );
    const blob = new Blob([[...headers, ...csvData].join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Laporan_Kinerja_Finansial.csv";
    link.click();
    toast.success("Dokumen diekspor secara aman.");
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (timeFilter === "all") return true;
      const date = new Date(t.created_at);
      const now = new Date();
      if (timeFilter === "month") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (timeFilter === "week") return date >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return true;
    });
  }, [transactions, timeFilter]);

  const formatRupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);

  const { balance, income, expense, chartData, trendData } = useMemo(() => {
    let inc = 0, exp = 0;
    let catRecord: Record<string, number> = {};
    let trendMap: Record<string, number> = {};

    [...filteredTransactions].reverse().forEach((trx) => {
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

    // Otomatisasi Logika Kecerdasan Buatan Heuristik
    if (filteredTransactions.length === 0) {
      setAiMessage("Repositori data kosong. Algoritma memerlukan sampel transaksi riil untuk membentuk model prediksi finansial.");
    } else if (exp === 0) {
      setAiMessage("Arus kas sangat stabil. Tidak ada beban pengeluaran dominan yang terdeteksi pada periode analisis ini.");
    } else {
      const highestCat = Object.keys(catRecord).reduce((a, b) => catRecord[a] > catRecord[b] ? a : b);
      setAiMessage(`Analisis mendeteksi akumulasi beban tertinggi pada sektor "${highestCat}" sebesar ${formatRupiah(catRecord[highestCat])}. Restrukturisasi alokasi pada sektor ini direkomendasikan untuk mencegah anomali defisit anggaran.`);
    }

    return {
      balance: inc - exp,
      income: inc,
      expense: exp,
      chartData: Object.keys(catRecord).map(key => ({ name: key, value: catRecord[key] })),
      trendData: Object.keys(trendMap).map(key => ({ date: key, balance: trendMap[key] }))
    };
  }, [filteredTransactions]);

  const MenuItem = ({ name, icon: Icon, isPro }: { name: string, icon: any, isPro?: boolean }) => {
    const isActive = activeMenu === name;
    return (
      <div onClick={() => setActiveMenu(name)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer group ${isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner" : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"}`}>
        <Icon size={20} className={!isActive ? "group-hover:scale-110 transition-transform" : ""} />
        <span className="font-bold text-sm tracking-wide">{name}</span>
        {isPro && <span className="ml-auto text-[9px] font-extrabold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">PRO</span>}
      </div>
    );
  };

  if (!session) {
    return (
      <div className={`flex min-h-screen items-center justify-center bg-[#0B0F19] p-4 ${jakarta.className}`}>
        <Toaster position="top-center" toastOptions={{ style: { background: '#1E293B', color: '#fff', borderRadius: '12px' } }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="w-full max-w-[420px] p-10 bg-slate-900/50 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-emerald-500/10 border border-slate-800 relative overflow-hidden">
          
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Enkripsi Aktif</span>
          </div>

          <div className="flex flex-col items-center mb-10 mt-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
              <Command className="text-slate-900" size={32} />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Nexus Wealth.</h1>
            <p className="text-sm text-slate-400 mt-2 font-medium">Enterprise Financial Workspace</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Akses Surel</label>
              <input type="email" required className="w-full px-5 py-3.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium placeholder-slate-600" placeholder="nama@perusahaan.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="relative">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Token Sandi</label>
              <input type={showPassword ? "text" : "password"} required className="w-full pl-5 pr-12 py-3.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium placeholder-slate-600" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[34px] text-slate-500 hover:text-slate-300 transition-colors p-1">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button type="submit" disabled={isLoggingIn} className="w-full py-3.5 mt-2 bg-emerald-500 text-slate-950 font-extrabold rounded-xl hover:bg-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20">
              {isLoggingIn ? "Mengautentikasi..." : isSignUp ? "Registrasi Sistem" : "Otorisasi Masuk"}
            </button>
          </form>
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-sm font-medium text-slate-400">
              {isSignUp ? "Sudah terdaftar dalam jaringan?" : "Membutuhkan otorisasi baru?"}
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="ml-2 font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                {isSignUp ? "Masuk portal" : "Mulai registrasi"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen bg-[#F8FAFC] ${jakarta.className} relative selection:bg-emerald-500/30`}>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1E293B', color: '#fff', borderRadius: '12px', fontWeight: 600 } }} />
      
      <aside className="w-[280px] flex-shrink-0 bg-[#0B0F19] text-white flex flex-col border-r border-slate-800/50 relative z-30 shadow-2xl">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 cursor-pointer" onClick={() => setActiveMenu("Pusat Kendali")}>
            <Command className="text-[#0B0F19]" size={20} />
          </div>
          <span className="text-xl font-extrabold tracking-tight cursor-pointer" onClick={() => setActiveMenu("Pusat Kendali")}>Nexus.</span>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 space-y-8 mt-2">
          <div>
            <p className="px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">Menu Utama</p>
            <nav className="space-y-1.5">
              <MenuItem name="Pusat Kendali" icon={LayoutDashboard} />
              <MenuItem name="Asisten AI" icon={Sparkles} />
              <MenuItem name="Analisis Lanjutan" icon={BarChart3} isPro />
              <MenuItem name="Target Finansial" icon={Target} />
            </nav>
          </div>

          <div>
            <p className="px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">Preferensi Sistem</p>
            <nav className="space-y-1.5">
              <MenuItem name="Keamanan 2FA" icon={ShieldCheck} />
              <MenuItem name="Pengaturan Akun" icon={Settings} />
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800/50 bg-[#0B0F19]">
          <div className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-slate-800/30 border border-slate-700/50 transition-colors cursor-default">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg">
              <User size={18} className="text-[#0B0F19]" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">Administrator</p>
              <p className="text-[10px] font-medium text-slate-400 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-transparent transition-all font-bold text-sm group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Kunci & Akhiri Sesi</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50/50">
        <header className="h-24 flex items-center justify-between px-10 bg-white/60 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-20">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{activeMenu}</h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">{activeMenu === "Pusat Kendali" ? "Laporan Metrik Waktu Nyata" : "Status Modul Fungsional"}</p>
          </div>
          {activeMenu === "Pusat Kendali" && (
            <div className="flex items-center gap-4">
              <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm hover:shadow-md">
                <Download size={16} />
                <span className="hidden md:inline">Unduh Ekspor</span>
              </button>
              <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-sm shadow-lg shadow-slate-900/20 hover:-translate-y-0.5">
                <Plus size={18} />
                <span>Entri Cepat</span>
              </button>
            </div>
          )}
        </header>

        {activeMenu === "Pusat Kendali" ? (
          <>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-10 pt-8">
              <div className="p-5 bg-gradient-to-r from-emerald-900 to-slate-900 rounded-2xl border border-emerald-500/30 shadow-xl flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <Sparkles className="text-emerald-400" size={20} />
                </div>
                <div>
                  <h3 className="text-emerald-400 font-bold text-sm tracking-wide mb-1 flex items-center gap-2">
                    Nexus Analitik Heuristik <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] uppercase rounded-full">Daring</span>
                  </h3>
                  <p className="text-slate-300 text-sm font-medium leading-relaxed">{aiMessage}</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-10 pb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800">Ikhtisar Algoritma</h2>
                <div className="relative group">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 shadow-sm">
                    <Filter size={16} />
                    <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="bg-transparent outline-none cursor-pointer appearance-none pr-4">
                      <option value="all">Siklus Penuh</option>
                      <option value="month">Siklus Bulanan</option>
                      <option value="week">Siklus Mingguan</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {[
                  { title: "Likuiditas Tersedia", amount: balance, icon: Wallet, color: "text-slate-900", bg: "bg-slate-100", sparkColor: "#0F172A" },
                  { title: "Arus Masuk Tercatat", amount: income, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50", sparkColor: "#10B981" },
                  { title: "Beban Operasional", amount: expense, icon: TrendingDown, color: "text-red-500", bg: "bg-red-50", sparkColor: "#EF4444" }
                ].map((stat, i) => (
                  <motion.div key={i} whileHover={{ y: -4 }} className="relative overflow-hidden p-7 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                    <div className="flex items-center justify-between pb-6 relative z-10">
                      <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">{stat.title}</p>
                      <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                        <stat.icon className={stat.color} size={20} />
                      </div>
                    </div>
                    <h2 className={`text-4xl font-black tracking-tight relative z-10 ${stat.color}`}>
                      {isLoading ? <div className="h-10 w-3/4 bg-slate-100 animate-pulse rounded-lg"></div> : formatRupiah(stat.amount)}
                    </h2>
                    {!isLoading && trendData.length > 1 && i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 pointer-events-none">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData}>
                            <Line type="monotone" dataKey="balance" stroke={stat.sparkColor} strokeWidth={3} dot={false} isAnimationActive={true} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="px-10 pb-10 grid gap-6 md:grid-cols-2">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-7 flex flex-col h-[480px] hover:shadow-lg transition-shadow">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                     <ChartIcon className="text-blue-500" size={20} />
                   </div>
                   <h3 className="text-lg font-bold text-slate-800 tracking-tight">Distribusi Vektoral</h3>
                 </div>
                 <div className="flex-1 min-h-[300px] w-full">
                   {isLoading ? (
                     <div className="h-full w-full bg-slate-50 animate-pulse rounded-full scale-75"></div>
                   ) : chartData.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-slate-400">
                       <ChartIcon size={48} className="mb-4 opacity-20" />
                       <p className="font-semibold text-sm">Pemetaan distribusi kosong</p>
                     </div>
                   ) : (
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie data={chartData} cx="50%" cy="50%" innerRadius={85} outerRadius={120} paddingAngle={4} dataKey="value" stroke="none">
                           {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                         </Pie>
                         <Tooltip formatter={(value: any) => formatRupiah(value)} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                         <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 700, color: '#475569' }} />
                       </PieChart>
                     </ResponsiveContainer>
                   )}
                 </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[480px] overflow-hidden hover:shadow-lg transition-shadow">
                 <div className="p-7 pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                      <Clock className="text-violet-500" size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">Log Transaksi Aktif</h3>
                 </div>
                 <div className="px-7 pb-7 overflow-y-auto flex-1 scrollbar-hide">
                    {isLoading ? (
                      <div className="space-y-4 mt-2">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="h-20 w-full bg-slate-50 animate-pulse rounded-2xl"></div>
                        ))}
                      </div>
                    ) : filteredTransactions.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <Clock size={48} className="mb-4 opacity-20" />
                        <p className="font-semibold text-sm">Arsip log kosong</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        <div className="space-y-3">
                          {filteredTransactions.map((trx, idx) => (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={trx.id} className="flex justify-between items-center p-5 rounded-2xl border border-slate-100/80 bg-white hover:border-slate-300 hover:shadow-md transition-all group">
                              <div>
                                <p className="font-extrabold text-slate-800 text-base">{trx.description}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] uppercase tracking-widest rounded-md font-bold">{trx.category || "Lainnya"}</span>
                                  <span className="text-xs font-semibold text-slate-400">{new Date(trx.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-4">
                                <p className={`font-black text-lg ${trx.amount > 0 ? "text-emerald-500" : "text-slate-900"}`}>
                                  {trx.amount > 0 ? "+" : ""}{formatRupiah(trx.amount)}
                                </p>
                                <button onClick={() => handleDelete(trx.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all p-2 rounded-xl opacity-0 group-hover:opacity-100" title="Cabut Log">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </AnimatePresence>
                    )}
                 </div>
              </div>
            </motion.div>
          </>
        ) : activeMenu === "Asisten AI" ? (
          <div className="p-10 flex-1 flex flex-col">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex-1 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                 <Sparkles size={240} />
              </div>
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                   <Sparkles className="text-white" size={28} />
                 </div>
                 <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">Konsol Interaksi Heuristik</h2>
                   <p className="text-sm font-bold text-slate-500">Mesin Pemroses Bahasa Finansial</p>
                 </div>
              </div>

              <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 p-6 overflow-y-auto space-y-5">
                 <div className="flex items-start gap-4">
                   <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-md">
                     <Command className="text-white" size={14} />
                   </div>
                   <div className="bg-white p-5 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 max-w-[80%]">
                     <p className="text-sm text-slate-700 font-medium leading-relaxed">{aiMessage}</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-4 flex-row-reverse">
                   <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center shrink-0 shadow-md">
                     <User className="text-white" size={14} />
                   </div>
                   <div className="bg-slate-900 p-5 rounded-2xl rounded-tr-none shadow-sm max-w-[80%]">
                     <p className="text-sm text-white font-medium leading-relaxed">Instruksikan model generatif untuk memberikan estimasi ketahanan saldo minggu depan.</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-4">
                   <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-md">
                     <Command className="text-white" size={14} />
                   </div>
                   <div className="bg-white p-5 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 max-w-[80%]">
                     <p className="text-sm text-slate-700 font-medium leading-relaxed">Fungsionalitas dialog proaktif dan injeksi perintah kustom sedang diproses oleh arsitektur antarmuka pemrograman aplikasi (API) pada peladen pusat. Saluran komunikasi dua arah ini akan dibuka secara penuh pada tahap finalisasi integrasi jaringan berikutnya.</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 max-w-lg w-full">
               <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-slate-100/50">
                  {activeMenu === "Keamanan 2FA" ? <ShieldCheck size={40} className="text-emerald-500" /> : <Construction size={40} className="text-slate-300" />}
               </div>
               <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Status Modul: {activeMenu}</h2>
               <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                 {activeMenu === "Keamanan 2FA" 
                   ? "Mekanisme penguncian sesi otomatis (Session Timeout) telah beroperasi penuh di latar belakang. Konfigurasi verifikasi multi-faktor (MFA) eksternal masih menunggu pembaruan kebijakan pada dasbor peladen utama Supabase."
                   : "Infrastruktur inti untuk ekstensi fungsional ini sedang dalam tahap enkapsulasi dan akan tersedia untuk distribusi pada siklus kompilasi selanjutnya."}
               </p>
               <button onClick={() => setActiveMenu("Pusat Kendali")} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-extrabold shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all hover:-translate-y-1">
                 Kembali ke Terminal Utama
               </button>
            </motion.div>
          </div>
        )}

        <AnimatePresence>
          {isModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl border border-white/20">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Injeksi Log Data</h2>
                  <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddTransaction} className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Nilai Vektoral (Minus = Beban)</label>
                    <input type="number" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-bold text-lg" placeholder="-50000" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Identifikator Log</label>
                    <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-bold" placeholder="Pembelian Lisensi" value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Sektor Distribusi</label>
                    <div className="relative">
                      <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-bold appearance-none cursor-pointer" value={category} onChange={(e) => setCategory(e.target.value)}>
                        {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-slate-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                  <button type="submit" disabled={isSaving} className="w-full py-4 mt-4 bg-slate-900 text-white font-extrabold rounded-2xl hover:bg-slate-800 hover:-translate-y-1 focus:ring-4 focus:ring-slate-900/20 transition-all disabled:opacity-50 shadow-xl shadow-slate-900/20">
                    {isSaving ? "Sinkronisasi Enkripsi..." : "Transmisikan Log"}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}