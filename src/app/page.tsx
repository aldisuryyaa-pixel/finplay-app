"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { LayoutDashboard, Wallet, TrendingUp, TrendingDown, Clock, Trash2, LogOut, Command, PieChart as ChartIcon, Eye, EyeOff, Plus, X, Filter, Target, CalendarDays, Settings, HelpCircle, User, Sparkles, ShieldCheck, Menu as MenuIcon, Send, Mail, Moon, Sun, FileText, Fingerprint, Download, Calculator, BarChart3, Activity, ShieldAlert, Flame, Camera, Utensils, Car, Zap, Film, ShoppingBag, ArrowUpRight, AlertTriangle, LifeBuoy, Users, Award, Coins, Scale, CheckCircle2, Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useTheme } from "next-themes";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
};

const categoryIcons: Record<string, any> = {
  Makanan: Utensils,
  Transportasi: Car,
  Utilitas: Zap,
  Hiburan: Film,
  Belanja: ShoppingBag,
  Pemasukan: ArrowUpRight,
  Lainnya: HelpCircle
};

const budgetLimits: Record<string, number> = {
  Makanan: 2000000,
  Transportasi: 1000000,
  Utilitas: 1500000,
  Hiburan: 800000,
  Belanja: 2500000,
  Lainnya: 1000000
};

const themeAccents: Record<string, { primary: string, text: string, bgLight: string, border: string, fill: string }> = {
  emerald: { primary: "bg-emerald-500 hover:bg-emerald-600", text: "text-emerald-500 dark:text-emerald-400", bgLight: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-500/20", fill: "#34D399" },
  sapphire: { primary: "bg-blue-500 hover:bg-blue-600", text: "text-blue-500 dark:text-blue-400", bgLight: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-500/20", fill: "#38BDF8" },
  amethyst: { primary: "bg-purple-500 hover:bg-purple-600", text: "text-purple-500 dark:text-purple-400", bgLight: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-500/20", fill: "#C084FC" },
  amber: { primary: "bg-amber-500 hover:bg-amber-600", text: "text-amber-500 dark:text-amber-400", bgLight: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-500/20", fill: "#FBBF24" }
};

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [accentKey, setAccentClass] = useState<string>("emerald");
  const [showNotifHub, setShowNotifHub] = useState(false);

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

  const [filterCategory, setFilterCategory] = useState("Semua");
  const [filterType, setFilterType] = useState("Semua");

  const [calcPrincipal, setCalcPrincipal] = useState("10000000");
  const [calcMonthly, setCalcMonthly] = useState("1000000");
  const [calcRate, setCalcRate] = useState("6");
  const [calcYears, setCalcYears] = useState("5");
  const [calcResult, setCalcResult] = useState<number | null>(null);

  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, type: "trx"|"goal"|"bill"}>({isOpen: false, type: "trx"});
  const [formData, setFormData] = useState({ amount: "", title: "", category: "Makanan", targetAmount: "", dueDate: "", isShared: false });
  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([{ role: "ai", text: "Koneksi API Generatif Siaga. Mesin siap merumuskan skenario komputasi finansial kompleks." }]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [portfolio, setPortfolio] = useState({ saham: 12500000, emas: 6000000, reksadana: 8500000, utang: 2500000 });
  const [splitBill, setSplitBill] = useState({ total: "300000", persons: "3", note: "Makan Malam Bersama" });

  const categories = ["Makanan", "Transportasi", "Utilitas", "Hiburan", "Belanja", "Pemasukan", "Lainnya"];
  const COLORS = ['#38BDF8', '#34D399', '#818CF8', '#FBBF24', '#F87171', '#C084FC', '#94A3B8'];

  const currentAccent = useMemo(() => themeAccents[accentKey] || themeAccents.emerald, [accentKey]);

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

  const totalNetWorth = useMemo(() => {
    const totalAssets = balance + portfolio.saham + portfolio.emas + portfolio.reksadana;
    return totalAssets - portfolio.utang;
  }, [balance, portfolio]);

  const streakDays = useMemo(() => {
    if (transactions.length === 0) return 0;
    const uniqueDates = Array.from(new Set(transactions.map(t => new Date(t.created_at).toISOString().slice(0, 10)))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let streak = 0;
    let checkDate = new Date();
    const todayStr = checkDate.toISOString().slice(0, 10);
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = checkDate.toISOString().slice(0, 10);
    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) return 0;
    let currentExpected = new Date(uniqueDates[0]);
    for (let i = 0; i < uniqueDates.length; i++) {
      if (uniqueDates[i] === currentExpected.toISOString().slice(0, 10)) {
        streak++;
        currentExpected.setDate(currentExpected.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [transactions]);

  const budgetAlerts = useMemo(() => {
    const expenses: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.amount < 0) {
        const cat = t.category || "Lainnya";
        expenses[cat] = (expenses[cat] || 0) + Math.abs(t.amount);
      }
    });
    return Object.keys(budgetLimits).map(cat => {
      const currentSpent = expenses[cat] || 0;
      const limit = budgetLimits[cat];
      const ratio = (currentSpent / limit) * 100;
      return { category: cat, spent: currentSpent, limit, ratio, isViolated: ratio >= 80 };
    }).filter(b => b.isViolated);
  }, [transactions]);

  const financialHealth = useMemo(() => {
    if (income === 0) return { label: "Inisialisasi Data Jaringan", color: "text-slate-400 border-slate-800", bg: "bg-gradient-to-br from-slate-500/10 to-transparent", icon: Activity, desc: "Sistem membutuhkan input pemasukan aktif." };
    const savingsRate = (balance / income) * 100;
    if (savingsRate >= 35) return { label: "Financial Guru (Sangat Sehat)", color: "text-emerald-400 border-emerald-500/20", bg: "bg-gradient-to-br from-emerald-500/15 via-transparent to-transparent", icon: Sparkles, desc: "Alokasi tabungan sangat prima (>35%)." };
    if (savingsRate >= 10) return { label: "Budget Builder (Cukup Sehat)", color: "text-sky-400 border-sky-500/20", bg: "bg-gradient-to-br from-sky-500/15 via-transparent to-transparent", icon: Target, desc: "Aliran dana internal stabil." };
    return { label: "Defisit Sistem (Status Waspada)", color: "text-rose-400 border-rose-500/20", bg: "bg-gradient-to-br from-rose-500/15 via-transparent to-transparent", icon: ShieldAlert, desc: "Rasio beban pengeluaran kritis." };
  }, [balance, income]);

  const aiCoachInsight = useMemo(() => {
    if (transactions.length < 3) return "Data tidak mencukupi untuk membuat proyeksi logaritma. Terus lakukan input log harian.";
    const dailyAvg = expense / Math.max(streakDays, 1);
    const daysLeft = 30 - new Date().getDate();
    const estimatedDeficit = dailyAvg * daysLeft;
    const projectEndBalance = balance - estimatedDeficit;
    if (projectEndBalance < 0) return `⚠️ Peringatan AI Coach: Kecepatan belanja harian Anda tinggi. Diproyeksikan defisit ${formatRupiah(Math.abs(projectEndBalance))} di akhir bulan.`;
    return `💡 Insight AI Coach: Bagus! Sisa dana Anda diproyeksikan aman bersisa sekitar ${formatRupiah(projectEndBalance)} di akhir bulan.`;
  }, [balance, expense, transactions, streakDays]);

  const financialRank = useMemo(() => {
    if (income === 0) return { title: "Unranked", desc: "Isi pemasukan jaringan", badgeColor: "bg-slate-500/10 text-slate-400" };
    const rate = (balance / income) * 100;
    if (rate >= 40) return { title: "Wealth Master 👑", desc: "Rasio tabungan >40%. Penguasa finansial mutlak.", badgeColor: "bg-amber-500/10 text-amber-400" };
    if (rate >= 15) return { title: "Budget Warrior ⚔️", desc: "Rasio tabungan aman di kisaran 15%-40%.", badgeColor: "bg-sky-500/10 text-sky-400" };
    return { title: "Novice Saver 🛡️", desc: "Rasio tabungan kritis di bawah 15%. Perkuat pertahanan.", badgeColor: "bg-rose-500/10 text-rose-400" };
  }, [balance, income]);

  const rankProgress = useMemo(() => {
    if (income === 0) return 0;
    const rate = (balance / income) * 100;
    if (rate >= 40) return 100;
    if (rate >= 15) return ((rate - 15) / (40 - 15)) * 100;
    return Math.max(0, (rate / 15) * 100);
  }, [balance, income]);

  const dynamicMissions = useMemo(() => {
    const totalInvestments = portfolio.saham + portfolio.emas + portfolio.reksadana;
    return [
      { id: 1, title: "Misi 1: Jaga Keutuhan Streak", desc: "Catat log finansial minimal 3 hari berturut-turut.", status: streakDays >= 3 },
      { id: 2, title: "Misi 2: Benteng Pagu Alokasi", desc: "Nol pelanggaran anggaran batas 80% kategori pengeluaran.", status: budgetAlerts.length === 0 },
      { id: 3, title: "Misi 3: Proteksi Portofolio Makro", desc: "Miliki akumulasi total aset investasi di atas Rp10.000.000.", status: totalInvestments > 10000000 },
      { id: 4, title: "Misi 4: Thrift Warrior (Penyelamat Kas)", desc: "Pertahankan rasio pengeluaran bulanan di bawah 50% dari total pemasukan.", status: income > 0 && (expense / income) < 0.5 },
      { id: 5, title: "Misi 5: Rajah Likuiditas Premium", desc: "Pertahankan saldo bersih dompet personal di atas Rp5.000.000.", status: balance > 5000000 }
    ];
  }, [streakDays, budgetAlerts, portfolio, income, expense, balance]);

  const assetDistributionPercentages = useMemo(() => {
    const totalAssets = Math.max(1, balance + portfolio.saham + portfolio.emas + portfolio.reksadana);
    return {
      kas: (balance / totalAssets) * 100,
      saham: (portfolio.saham / totalAssets) * 100,
      emas: (portfolio.emas / totalAssets) * 100,
      reksadana: (portfolio.reksadana / totalAssets) * 100
    };
  }, [balance, portfolio]);

  const dynamicNotifications = useMemo(() => {
    const notifs = [{ id: "pwa-ready", text: "Nexus PWA Jaringan Siaga. Aplikasi siap diinstal ke layar utama HP.", isAlert: false }];
    if (streakDays > 0) notifs.push({ id: "streak-active", text: `Hebat! Anda mempertahankan ${streakDays} hari kedisiplinan pencatatan.`, isAlert: false });
    if (budgetAlerts.length > 0) notifs.push({ id: "budget-warn", text: `⚠️ Alokasi Kritis! Anggaran ${budgetAlerts[0].category} menembus batas aman 80%.`, isAlert: true });
    return notifs;
  }, [streakDays, budgetAlerts]);

  const trendChartData = useMemo(() => {
    if (transactions.length === 0) return [{ name: "Mulai", Saldo: 0 }];
    const sorted = [...transactions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    let cumulative = 0;
    return sorted.map(t => {
      cumulative += Number(t.amount);
      return { name: new Date(t.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }), Saldo: cumulative };
    });
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchCat = filterCategory === "Semua" || t.category === filterCategory;
      const matchType = filterType === "Semua" || (filterType === "Pemasukan" && t.amount > 0) || (filterType === "Pengeluaran" && t.amount < 0);
      return matchCat && matchType;
    });
  }, [transactions, filterCategory, filterType]);

  useEffect(() => { 
    setMounted(true); 
    if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function() {
          console.log('Nexus PWA Protokol Siaga Aktif.');
        });
      });
    }
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (session) {
          supabase.auth.signOut();
          toast.error("Protokol Keamanan: Sesi berakhir otomatis.");
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

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Mohon isi alamat surel untuk instruksi pemulihan.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) toast.error(error.message);
    else toast.success("Protokol pemulihan dikirim menuju kotak masuk surel.");
  };

  const exportToPDF = async () => {
    const element = document.getElementById("report-area");
    if (!element) {
      toast.error("Gagal menemukan area ringkasan laporan.");
      return;
    }
    const loadingToast = toast.loading("Sedang merender lembar dokumen visual...");
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: theme === 'dark' ? '#0B0F19' : '#F8FAFC',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Laporan_Finansial_Nexus_${new Date().toISOString().slice(0,10)}.pdf`);
      toast.dismiss(loadingToast);
      toast.success("Dokumen PDF berhasil diekstraksi.");
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Gagal mengekstraksi dokumen visual.");
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.error("Tidak ada data transaksi untuk diekspor.");
      return;
    }
    const headers = ["ID", "Deskripsi", "Nominal", "Kategori", "Tanggal Dibuat\n"];
    const rows = transactions.map(t => [
      t.id,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      t.category || "Lainnya",
      t.created_at
    ].join(","));
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Transaksi_Nexus_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Dokumen CSV berhasil diekspor.");
  };

  const loadTesseractEngine = () => {
    return new Promise((resolve, reject) => {
      if (typeof window !== "undefined" && (window as any).Tesseract) {
        return resolve((window as any).Tesseract);
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
      script.onload = () => {
        if ((window as any).Tesseract) resolve((window as any).Tesseract);
        else reject(new Error("Gagal menginisialisasi modul OCR."));
      };
      script.onerror = () => reject(new Error("Gagal memuat repositori OCR CDN."));
      document.body.appendChild(script);
    });
  };

  const triggerOcrScanner = async (file: File) => {
    setIsScanning(true);
    const toastId = toast.loading("Mengaktifkan Mesin AI OCR & memindai citra nota...");
    try {
      const tesseract: any = await loadTesseractEngine();
      const result = await tesseract.recognize(file, "eng");
      const text = result.data.text;
      const lines = text.split("\n").map((l: string) => l.trim()).filter(Boolean);
      let detectedTitle = lines[0] || "Transaksi Ekstraksi OCR";
      if (detectedTitle.length < 3 && lines[1]) detectedTitle = lines[1];

      let detectedAmount = 0;
      const targetLine = lines.find((l: string) => {
        const lower = l.toLowerCase();
        return lower.includes("total") || lower.includes("jumlah") || lower.includes("rp");
      });
      if (targetLine) {
        const digits = targetLine.replace(/[^0-9]/g, "");
        if (digits) detectedAmount = Number(digits);
      }
      if (!detectedAmount) {
        const allMatches = text.match(/\d+/g);
        if (allMatches) {
          const cleanNums = allMatches.map(Number).filter((n: number) => n > 1000 && n < 5000000);
          if (cleanNums.length > 0) detectedAmount = Math.max(...cleanNums);
        }
      }

      setFormData({
        amount: detectedAmount ? `-${detectedAmount}` : "-50000",
        title: detectedTitle.substring(0, 25),
        category: "Makanan",
        targetAmount: "",
        dueDate: "",
        isShared: false
      });
      toast.success("AI OCR Sukses: Data struk berhasil diekstraksi!");
    } catch (err) {
      toast.error("Gagal menganalisis citra nota fisik.");
    } finally {
      toast.dismiss(toastId);
      setIsScanning(false);
    }
  };

  const calculateWealthPlanner = (e: React.FormEvent) => {
    e.preventDefault();
    const P = Number(calcPrincipal) || 0;
    const PMT = Number(calcMonthly) || 0;
    const r = (Number(calcRate) || 0) / 100 / 12;
    const t = (Number(calcYears) || 0) * 12;

    let total = P * Math.pow(1 + r, t);
    for (let i = 1; i <= t; i++) {
      total += PMT * Math.pow(1 + r, t - i);
    }
    setCalcResult(total);
    toast.success("Komputasi akumulasi aset selesai kalkulasi.");
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
      const res = await supabase.from("transactions").insert([{ amount: Number(formData.amount), description: formData.title + (formData.isShared ? " [Shared]" : ""), category: formData.category }]);
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
      setFormData({ amount: "", title: "", category: "Makanan", targetAmount: "", dueDate: "", isShared: false });
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

  const executeSplitBillShare = () => {
    const costPerPerson = Math.floor(Number(splitBill.total) / Math.max(Number(splitBill.persons), 1));
    const msg = encodeURIComponent(`Halo teman-teman, ini rincian patungan untuk [${splitBill.note}].\n\nTotal Tagihan: ${formatRupiah(Number(splitBill.total))}\nDibagi: ${splitBill.persons} Orang\nPatungan Per Orang: *${formatRupiah(costPerPerson)}*\n\nBisa ditransfer ke rekening Aldy ya. Terima kasih! \n_Sent via Nexus Wealth v4.0_`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, "_blank");
    toast.success("Tautan WhatsApp dikirim.");
  };

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
        body: JSON.stringify({ prompt: userText, context: { balance, income, expense, totalNetWorth } })
      });
      const data = await res.json();
      if (data.reply) setChatHistory([...newChat, { role: "ai", text: data.reply }]);
      else throw new Error();
    } catch (err) {
      setChatHistory([...newChat, { role: "ai", text: `Respons Darurat Core Engine: Struktur portfolio kekayaan bersih total terdeteksi di nilai ${formatRupiah(totalNetWorth)}.` }]);
    }
    setIsAiThinking(false);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const MenuItem = ({ name, icon: Icon }: { name: string, icon: any }) => {
    const isActive = activeMenu === name;
    return (
      <div onClick={() => { setActiveMenu(name); setIsSidebarOpen(false); }} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all cursor-pointer border ${isActive ? `${currentAccent.bgLight} ${currentAccent.text} ${currentAccent.border} shadow-inner` : "text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-white"}`}>
        <Icon size={18} />
        <span className="text-sm font-bold">{name}</span>
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0B0F19] text-white">
      <div className="p-8 flex items-center gap-3 cursor-pointer" onClick={() => setActiveMenu("Pusat Kendali")}>
        <div className={`w-10 h-10 ${currentAccent.primary} rounded-xl flex items-center justify-center shadow-lg transition-colors duration-300`}><Command className="text-slate-900" size={20} /></div>
        <span className="text-xl font-black tracking-tighter text-white">Nexus</span>
      </div>
      <div className="flex-1 px-4 space-y-8 mt-2 overflow-y-auto scrollbar-hide">
        <div>
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Infrastruktur Inti</p>
          <nav className="space-y-1.5">
            <MenuItem name="Pusat Kendali" icon={LayoutDashboard} />
            <MenuItem name="Asisten AI" icon={Sparkles} />
            <MenuItem name="Portofolio Aset" icon={Scale} />
            <MenuItem name="Misi Finansial" icon={Award} />
            <MenuItem name="Split & Shared" icon={Users} />
            <MenuItem name="Target Finansial" icon={Target} />
            <MenuItem name="Tagihan Berkala" icon={CalendarDays} />
            <MenuItem name="Perencana Finansial" icon={Calculator} />
            <MenuItem name="Pusat Pengaduan" icon={LifeBuoy} />
          </nav>
        </div>
        <div>
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Preferensi Sistem</p>
          <nav className="space-y-1.5">
            <MenuItem name="Pengaturan Akun" icon={Settings} />
          </nav>
        </div>
      </div>
      <div className="p-6 border-t border-slate-800/50 flex flex-col gap-5">
        <button onClick={() => supabase.auth.signOut()} className="flex items-center justify-center gap-2 w-full py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all"><LogOut size={14} /> Selesai Sesi</button>
        <div className="text-center"><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center justify-center gap-1.5"><Fingerprint size={12}/> Hak Cipta © 2026 Aldys</p></div>
      </div>
    </div>
  );

  if (!mounted) return null;

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] p-6">
        <Toaster position="top-right" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[400px] p-10 bg-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] border border-slate-800 shadow-2xl relative">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><Command className="text-slate-950" size={32} /></div>
            <h1 className="text-3xl font-black text-white tracking-tighter">NEXUS WEALTH</h1>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <input type="email" required className="w-full pl-6 pr-12 py-4 bg-slate-950 border border-slate-800 text-white rounded-2xl focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="Alamat Surel" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required className="w-full pl-6 pr-20 py-4 bg-slate-950 border border-slate-800 text-white rounded-2xl focus:ring-2 focus:ring-emerald-500/50 outline-none" placeholder="Kata Sandi" value={password} onChange={e => setPassword(e.target.value)} />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-emerald-500 transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <button className="w-full py-4 bg-emerald-500 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-sm">{isLoggingIn ? "Otentikasi..." : isSignUp ? "Registrasi Jaringan" : "Inisialisasi Akses"}</button>
          </form>
          <div className="flex items-center justify-between mt-6 px-1">
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-slate-500 text-xs font-bold hover:text-emerald-400 transition-colors">{isSignUp ? "Gunakan Kredensial" : "Akses Baru"}</button>
            {!isSignUp && <button type="button" onClick={handleResetPassword} className="text-slate-500 text-xs font-bold hover:text-emerald-400 transition-colors">Lupa Sandi?</button>}
          </div>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={toggleSidebar} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[40] lg:hidden" />
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 w-[280px] z-[50] lg:hidden shadow-2xl"><SidebarContent /></motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 lg:h-24 flex items-center justify-between px-4 sm:px-6 lg:px-10 bg-white/70 dark:bg-[#0B0F19]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="lg:hidden p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl"><MenuIcon size={20} /></button>
            <h1 className="text-xl lg:text-2xl font-black tracking-tight">{activeMenu}</h1>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-4">
            <div className="relative">
              <button onClick={() => setShowNotifHub(!showNotifHub)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white relative">
                <Bell size={18} />
                {dynamicNotifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />}
              </button>
              <AnimatePresence>
                {showNotifHub && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-3 w-72 sm:w-80 bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-2.5">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">Pusat Notifikasi Jaringan</p>
                    <hr className="border-slate-100 dark:border-slate-800" />
                    {dynamicNotifications.map(n => (
                      <div key={n.id} className={`p-3 rounded-xl text-xs font-medium leading-relaxed border ${n.isAlert ? 'bg-rose-500/5 text-rose-400 border-rose-500/10' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-transparent'}`}>
                        {n.text}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {activeMenu === "Pusat Kendali" && (
              <>
                <button onClick={exportToCSV} className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold text-xs shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Download size={16} /> CSV</button>
                <button onClick={exportToPDF} className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold text-xs shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><FileText size={16} /> PDF</button>
              </>
            )}
            {activeMenu !== "Asisten AI" && activeMenu !== "Pengaturan Akun" && activeMenu !== "Perencana Finansial" && activeMenu !== "Pusat Pengaduan" && activeMenu !== "Portofolio Aset" && activeMenu !== "Misi Finansial" && activeMenu !== "Split & Shared" && (
              <button onClick={() => setModalConfig({ isOpen: true, type: activeMenu === "Target Finansial" ? "goal" : activeMenu === "Tagihan Berkala" ? "bill" : "trx" })} className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 ${currentAccent.primary} text-slate-950 rounded-2xl font-bold text-xs lg:text-sm shadow-xl shadow-slate-900/10 transition-all duration-300 hover:scale-105`}><Plus size={16} /> <span>Entri Modul</span></button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          {activeMenu === "Pusat Kendali" && (
            <div id="report-area">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 lg:space-y-8">
                
                <div className="p-5 rounded-2xl sm:rounded-[2rem] border border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent flex items-start gap-4">
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl shrink-0"><Sparkles size={22} className="animate-pulse" /></div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider opacity-60">Predictive AI Coach v3.5 Proaktif</span>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">{aiCoachInsight}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className={`p-5 bg-gradient-to-br from-${accentKey === 'emerald' ? 'emerald' : accentKey === 'sapphire' ? 'blue' : accentKey === 'amethyst' ? 'purple' : 'amber'}-500/10 to-transparent rounded-2xl border ${currentAccent.border} col-span-2 sm:col-span-2`}>
                    <div className="flex items-center justify-between mb-4"><div className={`p-2 ${currentAccent.bgLight} ${currentAccent.text} rounded-xl`}><Scale size={18} /></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kekayaan Bersih (Net Worth)</span></div>
                    <h2 className={`text-2xl sm:text-4xl font-black tracking-tight ${currentAccent.text}`}>{formatRupiah(totalNetWorth)}</h2>
                  </div>

                  <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-100 dark:border-slate-800 col-span-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Dompet Personal</span>
                    <h2 className="text-lg sm:text-xl font-black text-slate-700 dark:text-white mt-2">{formatRupiah(balance)}</h2>
                  </div>
                  
                  <div className={`p-5 rounded-2xl border col-span-1 ${financialRank.badgeColor}`}>
                    <span className="text-[9px] font-black uppercase tracking-widest block">Pangkat Finansial</span>
                    <h2 className="text-sm sm:text-base font-black mt-2 truncate">{financialRank.title}</h2>
                  </div>
                </div>

                {budgetAlerts.length > 0 && (
                  <div className="space-y-2">
                    {budgetAlerts.map(b => (
                      <div key={b.category} className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center gap-3 animate-pulse">
                        <AlertTriangle size={18} className="shrink-0" />
                        <p className="text-xs font-black">Peringatan Anggaran: Sektor <span className="underline">{b.category}</span> menembus {b.ratio.toFixed(0)}%!</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase">Arus Masuk</span>
                    <h2 className="text-xl font-black text-emerald-500 mt-1">{formatRupiah(income)}</h2>
                  </div>
                  <div className="p-5 bg-rose-50 dark:bg-rose-500/5 rounded-2xl border border-rose-500/10">
                    <span className="text-[10px] font-bold text-rose-500 uppercase">Beban Pengeluaran</span>
                    <h2 className="text-xl font-black text-rose-500 mt-1">{formatRupiah(expense)}</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-slate-100 dark:border-slate-800 h-[380px] flex flex-col">
                    <h3 className="text-sm font-black mb-4 flex items-center gap-2"><ChartIcon size={16} /> Pemetaan Alokasi</h3>
                    <div className="flex-1 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} cx="50%" cy="50%" innerRadius="65%" outerRadius="95%" paddingAngle={4} dataKey="value" stroke="none" cornerRadius={8} isAnimationActive={false}>
                            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: theme === 'dark' ? '#1E293B' : '#FFF' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-slate-100 dark:border-slate-800 h-[380px] overflow-hidden flex flex-col">
                    <h3 className="text-sm font-black mb-4 flex items-center gap-2"><Clock size={16} /> Log Historis</h3>
                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-hide">
                      {filteredTransactions.slice(0, 10).map(t => (
                        <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-extrabold text-sm truncate">{t.description}</p>
                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5 text-[10px] font-bold text-slate-400 uppercase">
                              <span className="text-emerald-500 dark:text-emerald-400">{t.category}</span>
                              <span>•</span>
                              <span className="text-slate-400 dark:text-slate-500 tracking-tighter">
                                {new Date(t.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} • {new Date(t.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2 shrink-0">
                            <p className={`font-black text-sm ${t.amount > 0 ? "text-emerald-500" : "text-rose-500"}`}>{t.amount > 0 ? "+" : ""}{formatRupiah(t.amount)}</p>
                            <button onClick={() => deleteRecord("transactions", t.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1"><Trash2 size={14}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-black mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-blue-500" /> Analisis Logaritma Tren Saldo</h3>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendChartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={currentAccent.fill} stopOpacity={0.15}/><stop offset="95%" stopColor={currentAccent.fill} stopOpacity={0}/></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1E293B' : '#E2E8F0'} />
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: theme === 'dark' ? '#1E293B' : '#FFF' }} />
                        <Area type="monotone" dataKey="Saldo" stroke={currentAccent.fill} strokeWidth={2.5} fill="url(#colorSaldo)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </motion.div>
            </div>
          )}

          {activeMenu === "Portofolio Aset" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
              <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 text-center">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Total Simpanan Profil</p>
                <h2 className={`text-3xl sm:text-5xl font-black ${currentAccent.text} mt-2 tracking-tight`}>{formatRupiah(totalNetWorth)}</h2>
                
                <div className="mt-6 space-y-2">
                  <div className="flex h-3 rounded-full overflow-hidden bg-slate-800">
                    <div style={{ width: `${assetDistributionPercentages.kas}%` }} className="bg-emerald-400 transition-all duration-500" />
                    <div style={{ width: `${assetDistributionPercentages.saham}%` }} className="bg-blue-400 transition-all duration-500" />
                    <div style={{ width: `${assetDistributionPercentages.emas}%` }} className="bg-amber-400 transition-all duration-500" />
                    <div style={{ width: `${assetDistributionPercentages.reksadana}%` }} className="bg-purple-400 transition-all duration-500" />
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] font-black uppercase text-slate-400">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-400 block" /> Kas ({assetDistributionPercentages.kas.toFixed(0)}%)</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-400 block" /> Saham ({assetDistributionPercentages.saham.toFixed(0)}%)</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-400 block" /> Emas ({assetDistributionPercentages.emas.toFixed(0)}%)</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-purple-400 block" /> Reksadana ({assetDistributionPercentages.reksadana.toFixed(0)}%)</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{ label: "Simpanan Saham (IDX)", val: portfolio.saham, key: "saham" }, { label: "Logam Mulia / Emas", val: portfolio.emas, key: "emas" }, { label: "Reksa Dana Makro", val: portfolio.reksadana, key: "reksadana" }, { label: "Liabilitas Utang / Kredit", val: portfolio.utang, key: "utang", isDebt: true }].map(asset => (
                  <div key={asset.key} className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex-1 mr-2">
                      <p className="text-xs font-black text-slate-400 uppercase">{asset.label}</p>
                      <input type="number" className="bg-transparent font-black text-lg text-slate-900 dark:text-white outline-none mt-1 w-full" value={asset.val} onChange={e => setPortfolio({...portfolio, [asset.key]: Number(e.target.value) || 0})} />
                    </div>
                    <div className={`p-2.5 rounded-xl text-xs font-bold shrink-0 ${asset.isDebt ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}><Coins size={16}/></div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeMenu === "Misi Finansial" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl mx-auto">
              <div className={`p-6 rounded-3xl border ${financialHealth.bg} ${financialHealth.color}`}>
                <p className="text-xs font-black uppercase tracking-wider">Status Lencana Pangkat Ksatria Dompet</p>
                <h3 className="text-2xl font-black mt-2">{financialRank.title}</h3>
                <p className="text-xs font-medium opacity-80 mt-1">{financialRank.desc}</p>
                
                <div className="mt-4 space-y-1">
                  <div className="w-full h-2 bg-slate-800/60 dark:bg-slate-900/40 rounded-full overflow-hidden">
                    <div style={{ width: `${rankProgress}%` }} className="h-full bg-current transition-all duration-500" />
                  </div>
                  <p className="text-right text-[9px] font-black uppercase tracking-wider opacity-75">{rankProgress.toFixed(0)}% Menuju Pangkat Selanjutnya</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0F172A] p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                <h3 className="text-base font-black flex items-center gap-2"><Award className="text-emerald-400" /> Misi Berhadiah Pangkat Mingguan (5 Aktif)</h3>
                
                {dynamicMissions.map(m => (
                  <div key={m.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate flex items-center gap-2">
                        {m.status && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                        {m.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{m.desc}</p>
                    </div>
                    <span className={`text-xs font-black px-3 py-1 rounded-full shrink-0 ${m.status ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                      {m.status ? "Selesai" : "Proses"}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeMenu === "Split & Shared" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-white dark:bg-[#0F172A] p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-black mb-2 flex items-center gap-2"><Users className="text-blue-400"/> Mesin Split Bill Otomatis</h3>
                  <p className="text-xs text-slate-400 leading-normal mb-4">Membagi pengeluaran setelah kongko secara presisi dan menghasilkan WhatsApp link.</p>
                  <div className="space-y-3">
                    <div><label className="text-[10px] font-black text-slate-400 uppercase">Total Nilai Tagihan (Rp)</label><input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-bold outline-none text-sm" value={splitBill.total} onChange={e => setSplitBill({...splitBill, total: e.target.value})} /></div>
                    <div><label className="text-[10px] font-black text-slate-400 uppercase">Jumlah Anggota Patungan (Orang)</label><input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-bold outline-none text-sm" value={splitBill.persons} onChange={e => setSplitBill({...splitBill, persons: e.target.value})} /></div>
                    <div><label className="text-[10px] font-black text-slate-400 uppercase">Keterangan Nota</label><input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-bold outline-none text-sm" value={splitBill.note} onChange={e => setSplitBill({...splitBill, note: e.target.value})} /></div>
                  </div>
                </div>
                <button onClick={executeSplitBillShare} className="w-full py-3 bg-blue-500 text-white font-black rounded-xl text-xs uppercase tracking-widest mt-4">Kirim Tagihan Ke WhatsApp</button>
              </div>

              <div className="bg-white dark:bg-[#0F172A] p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-black mb-2 flex items-center gap-2"><Wallet className="text-purple-400"/> Dompet Bersama (Shared Wallet)</h3>
                  <p className="text-xs text-slate-400 leading-normal mb-6">Mengatur pengeluaran bulanan bersama pasangan atau keluarga.</p>
                  <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
                    <p className="text-xs font-bold text-purple-400">Status Modul Akun Joint-Pouch: <span className="underline">TERKONEKSI</span></p>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">Setiap entri transaksi yang Anda tandai sebagai "Shared" saat pengisian data akan otomatis dikonsolidasikan ke dalam log pemetaan bersama pasangan.</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">Keamanan Data Finansial Sosial Terenkripsi</div>
              </div>
            </motion.div>
          )}

          {activeMenu === "Asisten AI" && (
            <div className="h-full bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden transition-colors">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0"><Sparkles className="text-slate-900" size={20} /></div>
                <div><h2 className="text-base sm:text-lg font-black">Nexus Core Engine API</h2><p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Model Generatif Eksternal Terhubung</p></div>
              </div>
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex items-end gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-slate-900 dark:bg-emerald-500" : "bg-emerald-500"}`}>
                      {msg.role === "user" ? <User size={12} className="text-white dark:text-slate-900" /> : <Command size={12} className="text-slate-900" />}
                    </div>
                    <div className={`p-3.5 rounded-xl max-w-[85%] text-xs sm:text-sm ${msg.role === "user" ? "bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-900 rounded-br-none" : "bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-bl-none font-medium"}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAiThinking && (
                  <div className="flex items-end gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"><Command size={12} className="text-slate-900 animate-spin" /></div>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-bl-none text-slate-400 text-xs font-bold animate-pulse">Mentransmisikan paket data...</div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
                <form onSubmit={handleAiChat} className="flex gap-2">
                  <input type="text" className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-xs sm:text-sm" placeholder="Kirim instruksi analitik ke model AI..." value={chatInput} onChange={e => setChatInput(e.target.value)} disabled={isAiThinking} />
                  <button type="submit" disabled={isAiThinking || !chatInput} className="w-10 sm:w-12 flex items-center justify-center bg-emerald-500 text-slate-900 rounded-xl hover:bg-emerald-400 transition-colors shrink-0"><Send size={16} /></button>
                </form>
              </div>
            </div>
          )}

          {activeMenu === "Perencana Finansial" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
              <div className="xl:col-span-1 bg-white dark:bg-[#0F172A] p-5 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <h3 className="text-base sm:text-lg font-black mb-4 sm:mb-6 flex items-center gap-2"><Calculator className="text-emerald-500" /> Simulasi Aset</h3>
                <form onSubmit={calculateWealthPlanner} className="space-y-4">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase">Modal Awal Eksisting (Rp)</label><input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-bold outline-none text-sm" value={calcPrincipal} onChange={e => setCalcPrincipal(e.target.value)} /></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase">Investasi Rutin Bulanan (Rp)</label><input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-bold outline-none text-sm" value={calcMonthly} onChange={e => setCalcMonthly(e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-black text-slate-400 uppercase">Imbal Hasil / Tahun (%)</label><input type="number" step="0.1" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-bold outline-none text-sm" value={calcRate} onChange={e => setCalcRate(e.target.value)} /></div>
                    <div><label className="text-[10px] font-black text-slate-400 uppercase">Durasi Waktu (Tahun)</label><input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-bold outline-none text-sm" value={calcYears} onChange={e => setCalcYears(e.target.value)} /></div>
                  </div>
                  <button type="submit" className={`w-full py-3.5 ${currentAccent.primary} text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-slate-900/10 transition-colors`}>Eksekusi Analisis</button>
                </form>
              </div>
              <div className="xl:col-span-2 bg-white dark:bg-[#0F172A] p-5 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors min-h-[340px]">
                <div><h3 className="text-base sm:text-lg font-black mb-2 flex items-center gap-2"><BarChart3 className="text-blue-500" /> Hasil Proyeksi Logaritma</h3><p className="text-xs text-slate-400 font-medium leading-relaxed">Kalkulasi dihitung menggunakan rumus asumsi bunga majemuk bulanan terkapitalisasi secara berkelanjutan.</p></div>
                <div className="my-auto py-6 text-center">
                  {calcResult !== null ? (
                    <div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estimasi Nilai Masa Depan</p><h2 className="text-2xl sm:text-4xl font-black text-emerald-500 tracking-tight">{formatRupiah(calcResult)}</h2></div>
                  ) : (
                    <p className="text-slate-400 font-bold text-xs sm:text-sm">Masukkan variabel parameter di panel kiri untuk memicu komputasi.</p>
                  )}
                </div>
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] font-bold text-amber-600 dark:text-amber-400 leading-normal">Catatan Proyeksi: Angka di atas merupakan hasil simulasi matematis murni.</div>
              </div>
            </motion.div>
          )}

          {activeMenu === "Pusat Pengaduan" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-8 shadow-sm transition-colors max-w-2xl mx-auto">
              <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
                <div className="p-3.5 bg-rose-500/10 text-rose-500 rounded-full mb-4 animate-pulse"><AlertTriangle size={28} /></div>
                <h2 className="text-lg sm:text-2xl font-black tracking-tight">Pusat Pengaduan & Dukungan Teknis</h2>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-2 leading-relaxed max-w-md">Jika mendeteksi adanya bug atau gangguan operasional, silakan hubungi kanal bantuan berikut.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><Send size={18} /></div>
                  <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">WhatsApp Bantuan Instan</p><p className="text-sm font-bold text-slate-900 dark:text-white">089646658395</p></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl"><User size={18} /></div>
                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Instagram Official</p><p className="text-sm font-bold text-slate-900 dark:text-white">@aldysry_</p></div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><HelpCircle size={18} /></div>
                    <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Facebook Jaringan</p><p className="text-sm font-bold text-slate-900 dark:text-white">Aldy Surya</p></div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Surel Resmi (Dukungan Pelaku Usaha)</p>
                  <div className="space-y-1.5">
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><Mail size={14} className="text-slate-400"/> help@nexuswealth.id</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><Mail size={14} className="text-slate-400"/> aldisuryyaa@gmail.com</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeMenu === "Pengaturan Akun" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-white dark:bg-[#0F172A] p-5 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <h3 className="text-base sm:text-lg font-black mb-4 flex items-center gap-2"><Sparkles className="text-amber-500" /> Kustomisasi Palet Aksen Dasbor</h3>
                <p className="text-xs text-slate-400 mb-4 font-medium">Ubah skema warna penentu seluruh navigasi, tombol primer, dan elemen visual mikro platform.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
                  {[{ key: "emerald", name: "Emerald Hex", border: "border-emerald-500", dot: "bg-emerald-500" }, { key: "sapphire", name: "Sapphire Neon", border: "border-blue-500", dot: "bg-blue-500" }, { key: "amethyst", name: "Amethyst Glow", border: "border-purple-500", dot: "bg-purple-500" }, { key: "amber", name: "Amber Gold", border: "border-amber-500", dot: "bg-amber-500" }].map(opt => (
                    <button key={opt.key} onClick={() => setAccentClass(opt.key)} className={`p-4 rounded-xl border-2 flex items-center gap-2.5 font-black text-xs transition-all ${accentKey === opt.key ? `${opt.border} bg-slate-50 dark:bg-slate-800 shadow-md scale-102` : 'border-slate-200 dark:border-slate-800 text-slate-400'}`}>
                      <span className={`w-3 h-3 rounded-full ${opt.dot} block shrink-0`} />
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-[#0F172A] p-5 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <h3 className="text-base sm:text-lg font-black mb-4 sm:mb-6 flex items-center gap-2"><Settings className="text-slate-400" /> Preferensi Visual Mode</h3>
                <div className="flex items-center gap-3">
                  <button onClick={() => setTheme('light')} className={`flex items-center gap-2 px-4 py-3 rounded-xl font-black text-xs border-2 transition-all ${theme === 'light' ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-slate-200 dark:border-slate-800 text-slate-500'}`}><Sun size={16} /> Light</button>
                  <button onClick={() => setTheme('dark')} className={`flex items-center gap-2 px-4 py-3 rounded-xl font-black text-xs border-2 transition-all ${theme === 'dark' ? 'border-white bg-slate-800 text-white' : 'border-slate-200 dark:border-slate-800 text-slate-500'}`}><Moon size={16} /> Dark</button>
                </div>
              </div>
              
              <div className="bg-white dark:bg-[#0F172A] p-5 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                <h3 className="text-base sm:text-lg font-black mb-4 sm:mb-6 flex items-center gap-2"><ShieldCheck className="text-emerald-500" /> Kredensial Keamanan Modul</h3>
                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase">Modifikasi Kata Sandi</label><input type="password" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none text-sm" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
                  <button disabled={isUpdatingProfile} className={`px-5 py-3 ${currentAccent.primary} text-slate-950 font-black rounded-xl text-[11px] uppercase tracking-widest shadow-lg shadow-slate-900/20 transition-colors`}>{isUpdatingProfile ? "Sinkronisasi..." : "Terapkan Sandi"}</button>
                </form>
              </div>
            </motion.div>
          )}

          {activeMenu === "Target Finansial" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {goals.length === 0 ? (
                <div className="text-center p-16 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-100 dark:border-slate-800"><Target className="mx-auto text-slate-200 dark:text-slate-700 mb-3" size={48}/><p className="font-bold text-slate-400 text-xs">Parameter target jika nol.</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goals.map(g => {
                    const progress = Math.min((g.current_amount / g.target_amount) * 100, 100);
                    return (
                      <div key={g.id} className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative group overflow-hidden transition-colors">
                        <button onClick={() => deleteRecord("goals", g.id)} className="absolute top-5 right-5 text-slate-400 hover:text-red-500 z-10 p-1"><Trash2 size={16}/></button>
                        <h3 className="text-lg font-black mb-1 pr-6 truncate">{g.title}</h3>
                        <p className="text-xs font-bold text-slate-500 mb-4">{formatRupiah(g.current_amount)} / {formatRupiah(g.target_amount)}</p>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={`h-full ${currentAccent.primary}`} /></div>
                        <p className="text-right text-[9px] font-black text-emerald-500 mt-1.5">{progress.toFixed(1)}% TERCAPAI</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeMenu === "Tagihan Berkala" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-[#0F172A] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
              {bills.length === 0 ? (
                <div className="text-center p-8"><CalendarDays className="mx-auto text-slate-200 dark:text-slate-700 mb-3" size={48}/><p className="font-bold text-slate-400 text-xs">Tidak ada beban tagihan terjadwal.</p></div>
              ) : (
                <div className="space-y-3">
                  {bills.map(b => (
                    <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 group transition-colors">
                      <div className="mb-2 sm:mb-0">
                        <h4 className="font-black text-sm">{b.title}</h4>
                        <div className="flex items-center gap-3 mt-1"><span className="text-[9px] font-bold uppercase text-slate-500 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">Tempo: {new Date(b.next_due_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}</span><span className="text-[9px] font-black uppercase text-emerald-500">{b.category}</span></div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4"><p className="font-black text-base">{formatRupiah(b.amount)}</p><button onClick={() => deleteRecord("recurring_bills", b.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={16}/></button></div>
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
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-md p-6 sm:p-10 rounded-2xl shadow-2xl relative overflow-hidden transition-colors dark:bg-[#0F172A]">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-black">{modalConfig.type === "trx" ? "Injeksi Log Transaksi" : modalConfig.type === "goal" ? "Inisialisasi Target" : "Konfigurasi Tagihan"}</h2>
                <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} className="p-1.5 bg-slate-100 rounded-lg dark:bg-slate-800"><X size={16} /></button>
              </div>

              {modalConfig.type === "trx" && (
                <>
                  <input type="file" id="ocr-camera-input" accept="image/*" capture="environment" className="hidden" onChange={(e) => { if (e.target.files && e.target.files.length > 0) triggerOcrScanner(e.target.files[0]); }} />
                  <button type="button" onClick={() => document.getElementById("ocr-camera-input")?.click()} disabled={isScanning} className="w-full mb-4 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center gap-2 text-blue-400 hover:from-blue-500/20 hover:to-purple-500/20 transition-all text-xs font-black uppercase tracking-wider">
                    <Camera size={14} className={isScanning ? "animate-spin" : ""} />
                    {isScanning ? "Pemindaian OCR Jaringan..." : "Buka Kamera & Foto Struk via AI"}
                  </button>
                </>
              )}

              <form className="space-y-4" onSubmit={submitForm}>
                {modalConfig.type === "trx" && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold flex items-center gap-1.5"><Users size={14}/> Sinkronisasi Dompet Bersama?</span>
                    <input type="checkbox" className="w-4 h-4 text-emerald-500" checked={formData.isShared} onChange={e => setFormData({...formData, isShared: e.target.checked})} />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Identifikator Data</label>
                  <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 dark:bg-slate-800 dark:border-slate-700" placeholder="Contoh: Makan Siang, Gaji" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                
                {modalConfig.type === "goal" ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase">Nilai Akhir Target</label>
                      <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-base outline-none focus:border-emerald-500 dark:bg-slate-800 dark:border-slate-700" placeholder="Contoh: 15000000" value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase">Deposit Awal</label>
                      <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm outline-none focus:border-emerald-500 dark:bg-slate-800 dark:border-slate-700" placeholder="Contoh: 500000" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Nilai Nominal</label>
                    <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-base outline-none focus:border-emerald-500 dark:bg-slate-800 dark:border-slate-700" placeholder="Contoh: 50000 atau -25000" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                  </div>
                )}

                {modalConfig.type !== "goal" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Sektor Alokasi Kategori</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {categories.map(c => {
                        const IconComponent = categoryIcons[c] || HelpCircle;
                        const isSelected = formData.category === c;
                        return (
                          <button type="button" key={c} onClick={() => setFormData({...formData, category: c})} className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all outline-none ${isSelected ? `${currentAccent.bgLight} ${currentAccent.border} ${currentAccent.text} shadow-sm scale-105` : "bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700"}`}>
                            <IconComponent size={14} />
                            <span className="text-[9px] font-bold tracking-tight">{c}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {modalConfig.type === "bill" && (
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Tenggat Waktu Wajib</label><input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-emerald-500 dark:bg-slate-800 dark:border-slate-700 text-sm" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} /></div>
                )}
                <button type="submit" disabled={isSaving} className={`w-full py-4 mt-2 ${currentAccent.primary} text-slate-950 font-black rounded-2xl shadow-xl text-xs uppercase tracking-widest transition-colors duration-300`}>{isSaving ? "Sinkronisasi..." : "Transmisikan Konfigurasi"}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}