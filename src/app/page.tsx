"use client";

import { useEffect, useState, useMemo } from "react";
import { LayoutDashboard, Wallet, TrendingUp, TrendingDown, Clock, Trash2, LogOut, Command, PieChart as ChartIcon, Eye, EyeOff, Plus, X, Download, Filter, Target, CreditCard, Settings, HelpCircle, User, BarChart3 } from "lucide-react";
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
    toast.success("Sesi diakhiri.");
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
    link.download = "Laporan_Nexus_Wealth.csv";
    link.click();
    toast.success("Dokumen CSV berhasil diunduh");
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

    return {
      balance: inc - exp,
      income: inc,
      expense: exp,
      chartData: Object.keys(catRecord).map(key => ({ name: key, value: catRecord[key] })),
      trendData: Object.keys(trendMap).map(key => ({ date: key, balance: trendMap[key] }))
    };
  }, [filteredTransactions]);

  const formatRupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);

  if (!session) {
    return (
      <div className={`flex min-h-screen items-center justify-center bg-[#0B0F19] p-4 ${jakarta.className}`}>
        <Toaster position="top-center" toastOptions={{ style: { background: '#1E293B', color: '#fff', borderRadius: '12px' } }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="w-full max-w-[420px] p-10 bg-slate-900/50 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-emerald-500/10 border border-slate-800">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
              <Command className="text-slate-900" size={32} />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Nexus Wealth.</h1>
            <p className="text-sm text-slate-400 mt-2 font-medium">Enterprise Financial Workspace</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alamat Surel</label>
              <input type="email" required className="w-full px-5 py-3.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium placeholder-slate-600" placeholder="nama@perusahaan.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="relative">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kata Sandi</label>
              <input type={showPassword ? "text" : "password"} required className="w-full pl-5 pr-12 py-3.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium placeholder-slate-600" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[34px] text-slate-500 hover:text-slate-300 transition-colors p-1">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button type="submit" disabled={isLoggingIn} className="w-full py-3.5 mt-2 bg-emerald-500 text-slate-950 font-extrabold rounded-xl hover:bg-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20">
              {isLoggingIn ? "Memproses..." : isSignUp ? "Daftar Akun Baru" : "Masuk ke Ruang Kerja"}
            </button>
          </form>
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-sm font-medium text-slate-400">
              {isSignUp ? "Sudah memiliki akses?" : "Pengguna baru?"}
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="ml-2 font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                {isSignUp ? "Masuk di sini" : "Mulai mendaftar"}
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
      
      {/* Modifikasi Ekstensif Bilah Samping */}
      <aside className="w-[280px] flex-shrink-0 bg-[#0B0F19] text-white flex flex-col border-r border-slate-800/50 relative z-30 shadow-2xl">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Command className="text-[#0B0F19]" size={20} />
          </div>
          <span className="text-xl font-extrabold tracking-tight">Nexus.</span>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 space-y-8 mt-2">
          <div>
            <p className="px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">Menu Utama</p>
            <nav className="space-y-1.5">
              <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-inner cursor-pointer">
                <LayoutDashboard size={20} />
                <span className="font-bold text-sm tracking-wide">Pusat Kendali</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all cursor-not-allowed group" title="Fitur dalam pengembangan">
                <BarChart3 size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm tracking-wide">Analisis Lanjutan</span>
                <span className="ml-auto text-[9px] font-extrabold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">PRO</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all cursor-not-allowed group" title="Fitur dalam pengembangan">
                <Target size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm tracking-wide">Target Finansial</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all cursor-not-allowed group" title="Fitur dalam pengembangan">
                <CreditCard size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm tracking-wide">Manajemen Kartu</span>
              </div>
            </nav>
          </div>

          <div>
            <p className="px-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">Preferensi</p>
            <nav className="space-y-1.5">
              <div className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer group">
                <Settings size={20} className="group-hover:rotate-45 transition-transform" />
                <span className="font-bold text-sm tracking-wide">Pengaturan Akun</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer group">
                <HelpCircle size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm tracking-wide">Pusat Bantuan</span>
              </div>
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800/50 bg-[#0B0F19]">
          <div className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg">
              <User size={18} className="text-[#0B0F19]" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">Administrator</p>
              <p className="text-[10px] font-medium text-slate-400 truncate">{session?.user?.email || "Mengautentikasi..."}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-transparent transition-all font-bold text-sm group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Akhiri Sesi</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50/50">
        <header className="h-24 flex items-center justify-between px-10 bg-white/60 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-20">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kinerja Finansial</h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">Laporan Waktu Nyata</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm hover:shadow-md">
              <Download size={16} />
              <span className="hidden md:inline">Unduh CSV</span>
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-sm shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 hover:-translate-y-0.5">
              <Plus size={18} />
              <span>Entri Baru</span>
            </button>
          </div>
        </header>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-10 pb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Ikhtisar Metrik</h2>
            <div className="relative group">
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 shadow-sm">
                <Filter size={16} />
                <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="bg-transparent outline-none cursor-pointer appearance-none pr-4">
                  <option value="all">Sepanjang Waktu</option>
                  <option value="month">Bulan Ini</option>
                  <option value="week">Minggu Ini</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: "Saldo Tersedia", amount: balance, icon: Wallet, color: "text-slate-900", bg: "bg-slate-100", sparkColor: "#0F172A" },
              { title: "Arus Masuk", amount: income, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50", sparkColor: "#10B981" },
              { title: "Beban Keluar", amount: expense, icon: TrendingDown, color: "text-red-500", bg: "bg-red-50", sparkColor: "#EF4444" }
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
               <h3 className="text-lg font-bold text-slate-800 tracking-tight">Pemetaan Alokasi</h3>
             </div>
             <div className="flex-1 min-h-[300px] w-full">
               {isLoading ? (
                 <div className="h-full w-full bg-slate-50 animate-pulse rounded-full scale-75"></div>
               ) : chartData.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400">
                   <ChartIcon size={48} className="mb-4 opacity-20" />
                   <p className="font-semibold text-sm">Belum ada metrik distribusi</p>
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
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Jejak Transaksi</h3>
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
                    <p className="font-semibold text-sm">Repositori data kosong</p>
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
                            <button onClick={() => handleDelete(trx.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all p-2 rounded-xl opacity-0 group-hover:opacity-100" title="Hapus">
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

        <AnimatePresence>
          {isModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl border border-white/20">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Entri Baru</h2>
                  <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddTransaction} className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Nominal (Gunakan Minus untuk Keluar)</label>
                    <input type="number" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-bold text-lg" placeholder="-50000" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Deskripsi Aktivitas</label>
                    <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-bold" placeholder="Makan Siang Klien" value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Kategori Klasifikasi</label>
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
                    {isSaving ? "Sinkronisasi..." : "Rekam ke Database"}
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