import { NextResponse } from 'next/server';

// Simple password protection - change this to your preferred passcode
const SITE_PASSWORD = 'lab2024';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password === SITE_PASSWORD) {
      const response = NextResponse.json({ success: true });
      
      // Set the access cookie for 1 year
      response.cookies.set('lab-access', SITE_PASSWORD, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: false, // Allow JavaScript access for easier debugging
        sameSite: 'lax',
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}