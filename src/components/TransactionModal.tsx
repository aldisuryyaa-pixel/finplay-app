"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function TransactionModal() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !description) return;
    setIsLoading(true);

    const { error } = await supabase
      .from("transactions")
      .insert([{ amount: parseFloat(amount), description: description }]);

    setIsLoading(false);

    if (!error) {
      setAmount("");
      setDescription("");
      setIsOpen(false);
      // Halaman akan dimuat ulang secara otomatis untuk memperbarui data
      window.location.reload();
    } else {
      console.error("Gagal menyimpan data:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#1A1A2E] text-white hover:bg-[#2A2A4A] gap-2">
          <Plus size={16} /> Tambah Transaksi
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">Catat Transaksi Baru</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-600">Nominal (Rp)</label>
            <Input 
              type="number" 
              placeholder="Contoh: 50000" 
              className="border-slate-300"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-600">Keterangan</label>
            <Input 
              placeholder="Contoh: Makan Siang" 
              className="border-slate-300"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button 
            className="bg-[#16C79A] text-white hover:bg-[#12A882] mt-2"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Menyimpan..." : "Simpan Transaksi"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}