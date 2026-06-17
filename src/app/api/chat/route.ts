import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Kunci API tidak ditemukan pada peladen.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Bertindaklah sebagai analis finansial korporat tingkat lanjut. Berikan respons analitik yang tajam, profesional, dan ringkas.
    Konteks Metrik Saat Ini: Saldo Tersedia (Rp ${body.context.balance}), Total Arus Masuk (Rp ${body.context.income}), Total Beban (Rp ${body.context.expense}).
    Instruksi: ${body.prompt}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal melakukan komputasi bahasa.' }, { status: 500 });
  }
}