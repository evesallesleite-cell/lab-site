import { NextResponse } from 'next/server';

// Simple password protection - change this to your preferred passcode
const SITE_PASSWORD = 'eve123';

export const runtime = 'edge';

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }
  
  try {
    const body = await request.json();
    const { password } = body;

    if (password === SITE_PASSWORD) {
      const response = NextResponse.json({ success: true });
      
      // Set the access cookie for 1 year
      response.cookies.set('lab-access', SITE_PASSWORD, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: false,
        sameSite: 'lax',
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
