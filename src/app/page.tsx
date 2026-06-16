"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Wallet, TrendingUp, TrendingDown, Clock, Trash2, LogOut, Lock } from "lucide-react";
import { TransactionModal } from "@/components/TransactionModal";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

      data.forEach((trx) => {
        const amount = Number(trx.amount);
        if (amount > 0) {
          totalIncome += amount;
        } else {
          totalExpense += Math.abs(amount);
        }
      });

      setIncome(totalIncome);
      setExpense(totalExpense);
      setBalance(totalIncome - totalExpense);
      setTransactions(data);
    }
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError("Kredensial tidak valid. Akses ditolak.");
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
    
    if (!error) {
      fetchTransactions();
    }
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
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-slate-100">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#1A1A2E] rounded-2xl flex items-center justify-center mb-4 shadow-md">
              <Lock className="text-[#16C79A]" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">WealthFlow Portal</h1>
            <p className="text-sm text-slate-500 mt-2">Sistem Manajemen Keuangan Personal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 text-sm text-[#E74C3C] bg-red-50 border border-red-100 rounded-lg text-center">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Surel</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16C79A]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kata Sandi</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16C79A]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 mt-6 bg-[#1A1A2E] text-white font-medium rounded-lg hover:bg-[#2A2A4A] transition-colors disabled:opacity-50"
            >
              {isLoggingIn ? "Mengautentikasi..." : "Masuk ke Dasbor"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      
      {/* Panel Navigasi Kiri */}
      <aside className="w-64 bg-[#1A1A2E] text-white flex flex-col">
        <div className="p-6 text-2xl font-bold text-[#16C79A]">WealthFlow.</div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#16C79A] text-white rounded-lg shadow-md">
            <LayoutDashboard size={20} />
            <span className="font-medium">Dasbor Utama</span>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-medium"
          >
            <LogOut size={18} />
            <span>Keluar Akses</span>
          </button>
        </div>
      </aside>

      {/* Area Konten Utama */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-slate-800">Ringkasan Keuangan</h1>
          <TransactionModal />
        </header>

        <div className="p-8 pb-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between pb-4">
                <p className="text-sm font-medium text-slate-500">Total Saldo Bersih</p>
                <Wallet className="text-slate-700" size={20} />
              </div>
              <h2 className="text-3xl font-bold text-[#1A1A2E]">
                {isLoading ? "Memuat..." : formatRupiah(balance)}
              </h2>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between pb-4">
                <p className="text-sm font-medium text-slate-500">Total Pemasukan</p>
                <TrendingUp className="text-[#16C79A]" size={20} />
              </div>
              <h2 className="text-3xl font-bold text-[#16C79A]">
                {isLoading ? "Memuat..." : formatRupiah(income)}
              </h2>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between pb-4">
                <p className="text-sm font-medium text-slate-500">Total Pengeluaran</p>
                <TrendingDown className="text-[#E74C3C]" size={20} />
              </div>
              <h2 className="text-3xl font-bold text-[#E74C3C]">
                {isLoading ? "Memuat..." : formatRupiah(expense)}
              </h2>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <Clock className="text-slate-400" size={20} />
              <h3 className="text-lg font-bold text-slate-800">Riwayat Transaksi Terbaru</h3>
            </div>
            <div className="p-6">
              {isLoading ? (
                <p className="text-center text-slate-500 py-4">Memuat data...</p>
              ) : transactions.length === 0 ? (
                <p className="text-center text-slate-500 py-4">Belum ada catatan transaksi.</p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((trx) => (
                    <div key={trx.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-50 bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                      <div>
                        <p className="font-semibold text-slate-700 text-lg">{trx.description}</p>
                        <p className="text-sm text-slate-500 mt-1">{formatDate(trx.created_at)}</p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <p className={`font-bold text-lg ${trx.amount > 0 ? "text-[#16C79A]" : "text-[#E74C3C]"}`}>
                          {trx.amount > 0 ? "+" : ""}{formatRupiah(trx.amount)}
                        </p>
                        <button
                          onClick={() => handleDelete(trx.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-2 opacity-0 group-hover:opacity-100"
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