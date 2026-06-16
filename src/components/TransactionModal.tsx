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
        className="flex items-center gap-2 px-4 py-2 bg-[#1A1A2E] text-white rounded-lg hover:bg-[#2A2A4A] transition-colors font-medium"
      >
        <Plus size={20} />
        <span>Tambah Transaksi</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Transaksi Baru</h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Gunakan minus untuk pengeluaran)</label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16C79A]"
                  placeholder="Contoh: -50000 atau 100000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16C79A]"
                  placeholder="Contoh: Makan Siang"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16C79A]"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-4 bg-[#16C79A] text-white font-medium rounded-lg hover:bg-[#12A57F] transition-colors disabled:opacity-50"
              >
                {isLoading ? "Menyimpan..." : "Simpan Data"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};