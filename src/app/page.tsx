"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Wallet, TrendingUp, TrendingDown, Clock, Trash2 } from "lucide-react";
import { TransactionModal } from "@/components/TransactionModal";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
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

  const handleDelete = async (id: string) => {
    const isConfirmed = window.confirm("Hapus transaksi ini secara permanen?");
    if (!isConfirmed) return;

    const { error } = await supabase.from("transactions").delete().eq("id", id);
    
    if (!error) {
      fetchTransactions();
    } else {
      console.error("Gagal menghapus data:", error);
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

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      
      {/* Panel Navigasi Kiri */}
      <aside className="w-64 bg-[#1A1A2E] text-white flex flex-col">
        <div className="p-6 text-2xl font-bold text-[#16C79A]">FinFlow.</div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#16C79A] text-white rounded-lg shadow-md">
            <LayoutDashboard size={20} />
            <span className="font-medium">Dasbor Utama</span>
          </div>
        </nav>
      </aside>

      {/* Area Konten Utama */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Bagian Atas / Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-slate-800">Ringkasan ArusKas</h1>
          <TransactionModal />
        </header>

        {/* Bagian Kartu Metrik */}
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

        {/* Bagian Daftar Riwayat Transaksi */}
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