"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const TransactionModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Makanan");
  const [isLoading, setIsLoading] = useState(false);

  const categories = ["Makanan", "Transportasi", "Utilitas", "Hiburan", "Belanja", "Pemasukan", "Lainnya"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.from("transactions").insert([
      {
        amount: Number(amount),
        description,
        category,
      },
    ]);

    setIsLoading(false);
    if (!error) {
      setIsOpen(false);
      setAmount("");
      setDescription("");
      setCategory("Makanan");
      window.location.reload();
    } else {
      console.error("Gagal menyimpan data:", error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-sm shadow-lg shadow-slate-900/20"
      >
        <Plus size={18} />
        <span>Tambah Transaksi</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-slate-100 transform transition-all">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Transaksi Baru</h2>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nominal Angka</label>
                <input
                  type="number"
                  required
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
                  placeholder="Contoh: -50000 (Gunakan minus untuk beban)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Keterangan Catatan</label>
                <input
                  type="text"
                  required
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
                  placeholder="Contoh: Makan Siang Klien"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Kategori Alokasi</label>
                <div className="relative">
                  <select
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium appearance-none"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 focus:ring-4 focus:ring-emerald-500/20 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/30"
              >
                {isLoading ? "Menyimpan Data..." : "Rekam Transaksi"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};