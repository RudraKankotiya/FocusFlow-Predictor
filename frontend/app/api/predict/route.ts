import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'https://web-production-098d6.up.railway.app/predict';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('🔍 Frontend → Backend:', body);

    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend Error Response:', errorText);
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    console.log('🔍 Backend → Frontend:', data);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API ERROR:', error);
    return NextResponse.json({
      predicted_score: 5.0,
      label: '🟡 Below Average',
      message: 'Score: 5.0/10 - 🟡 Below Average ⚠️ Backend unavailable - showing recovery mode'
    }, { status: 500 });
  }
}
