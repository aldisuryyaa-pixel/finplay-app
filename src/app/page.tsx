"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Wallet, TrendingUp, TrendingDown, Clock, Trash2, LogOut, Command, PieChart as ChartIcon, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { TransactionModal } from "@/components/TransactionModal";
import { supabase } from "@/lib/supabase";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authMessage, setAuthMessage] = useState({ type: "", text: "" });
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      let totalIncome = 0;
      let totalExpense = 0;
      let expensesByCategory: Record<string, number> = {};

      data.forEach((trx) => {
        const amount = Number(trx.amount);
        if (amount > 0) {
          totalIncome += amount;
        } else {
          totalExpense += Math.abs(amount);
          const cat = trx.category || 'Lainnya';
          expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Math.abs(amount);
        }
      });

      const pieData = Object.keys(expensesByCategory).map(key => ({
        name: key,
        value: expensesByCategory[key]
      }));

      setIncome(totalIncome);
      setExpense(totalExpense);
      setBalance(totalIncome - totalExpense);
      setTransactions(data);
      setChartData(pieData);
    }
    setIsLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthMessage({ type: "", text: "" });

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setAuthMessage({ type: "error", text: error.message });
      } else {
        setAuthMessage({ type: "success", text: "Registrasi berhasil! Silakan masuk." });
        setIsSignUp(false);
        setPassword("");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthMessage({ type: "error", text: "Kredensial tidak valid. Akses ditolak." });
      }
    }
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = window.confirm("Hapus transaksi ini secara permanen?");
    if (!isConfirmed) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) fetchTransactions();
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 p-4">
        <div className="w-full max-w-[420px] p-10 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-slate-900/20">
              <Command className="text-emerald-400" size={32} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Nexus Wealth.</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Enterprise Financial Workspace</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {authMessage.text && (
              <div className={`p-4 text-sm font-medium rounded-xl flex items-center gap-2 ${authMessage.type === "error" ? "text-red-600 bg-red-50 border border-red-100" : "text-emerald-600 bg-emerald-50 border border-emerald-100"}`}>
                {authMessage.type === "success" && <CheckCircle2 size={18} />}
                {authMessage.text}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Alamat Surel</label>
              <input
                type="email"
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Kata Sandi</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[34px] text-slate-400 hover:text-slate-600 transition-colors p-1"
                title={showPassword ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 mt-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/20 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/20"
            >
              {isLoggingIn ? "Memproses..." : isSignUp ? "Daftar Akun Baru" : "Masuk ke Ruang Kerja"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm font-medium text-slate-500">
              {isSignUp ? "Sudah memiliki akses?" : "Pengguna baru?"}
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setAuthMessage({ type: "", text: "" }); }}
                className="ml-2 font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                {isSignUp ? "Masuk di sini" : "Mulai mendaftar"}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <aside className="w-[280px] bg-slate-900 text-white flex flex-col border-r border-slate-800">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Command className="text-white" size={20} />
          </div>
          <span className="text-xl font-extrabold tracking-tight">Nexus Wealth.</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-2">
          <div className="flex items-center gap-3 px-4 py-3.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <LayoutDashboard size={20} />
            <span className="font-bold text-sm tracking-wide">Ringkasan Utama</span>
          </div>
        </nav>
        <div className="p-6">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold text-sm"
          >
            <LogOut size={18} />
            <span>Akhiri Sesi</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-20 flex items-center justify-between px-10 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Kinerja Finansial</h1>
          <TransactionModal />
        </header>

        <div className="p-10 pb-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="p-7 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between pb-6">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Saldo Tersedia</p>
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                  <Wallet className="text-slate-600" size={20} />
                </div>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                {isLoading ? "..." : formatRupiah(balance)}
              </h2>
            </div>
            <div className="p-7 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between pb-6">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Arus Masuk</p>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="text-emerald-500" size={20} />
                </div>
              </div>
              <h2 className="text-4xl font-black text-emerald-500 tracking-tight">
                {isLoading ? "..." : formatRupiah(income)}
              </h2>
            </div>
            <div className="p-7 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between pb-6">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Beban Keluar</p>
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <TrendingDown className="text-red-500" size={20} />
                </div>
              </div>
              <h2 className="text-4xl font-black text-red-500 tracking-tight">
                {isLoading ? "..." : formatRupiah(expense)}
              </h2>
            </div>
          </div>
        </div>

        <div className="px-10 pb-10 grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-7 flex flex-col h-[480px]">
             <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                 <ChartIcon className="text-blue-500" size={20} />
               </div>
               <h3 className="text-lg font-bold text-slate-800">Distribusi Alokasi</h3>
             </div>
             <div className="flex-1 min-h-[300px] w-full">
               {chartData.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400">
                   <ChartIcon size={48} className="mb-4 opacity-20" />
                   <p className="font-medium text-sm">Tidak ada metrik untuk dianalisis</p>
                 </div>
               ) : (
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={3} dataKey="value" stroke="none">
                       {chartData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip 
                       formatter={(value: any) => formatRupiah(value)} 
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     />
                     <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }} />
                   </PieChart>
                 </ResponsiveContainer>
               )}
             </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[480px] overflow-hidden">
             <div className="p-7 pb-4 bg-white sticky top-0 z-10 flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                  <Clock className="text-violet-500" size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Jejak Transaksi</h3>
             </div>
             <div className="px-7 pb-7 overflow-y-auto flex-1 scrollbar-hide">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                      <p className="text-sm font-medium">Menyinkronkan...</p>
                    </div>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Clock size={48} className="mb-4 opacity-20" />
                    <p className="font-medium text-sm">Repositori data masih kosong</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((trx) => (
                      <div key={trx.id} className="flex justify-between items-center p-5 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-md transition-all group">
                        <div>
                          <p className="font-extrabold text-slate-800 text-base">{trx.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wider rounded-md font-bold">{trx.category || "Lainnya"}</span>
                            <span className="text-xs font-medium text-slate-400">{formatDate(trx.created_at)}</span>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <p className={`font-black text-lg ${trx.amount > 0 ? "text-emerald-500" : "text-slate-800"}`}>
                            {trx.amount > 0 ? "+" : ""}{formatRupiah(trx.amount)}
                          </p>
                          <button
                            onClick={() => handleDelete(trx.id)}
                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all p-2 rounded-xl opacity-0 group-hover:opacity-100"
                            title="Hapus Transaksi"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </div>

      </main>
    </div>
  );
}