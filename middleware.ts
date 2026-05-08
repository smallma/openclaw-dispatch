import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Static files or public routes (login/logout)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/login' ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  // 2. Worker APIs Check via Bearer Token
  if (pathname.startsWith('/api/worker')) {
    const authHeader = request.headers.get('Authorization');
    const expectedToken = process.env.WORKER_SECRET;

    if (!expectedToken) {
      console.error('[Middleware] WORKER_SECRET is not defined');
      return NextResponse.json({ error: 'Internal server configuration error' }, { status: 500 });
    }

    // 👇 請加入這兩行，我們要把字串包在括號裡，這樣連隱藏的空白都看得到！
    console.log(`[Middleware] 收到: [${authHeader}]`);
    console.log(`[Middleware] 預期: [Bearer ${expectedToken}]`);

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized worker' }, { status: 401 });
    }

    return NextResponse.next();
  }

  // 3. Web UI and Dashboard API Check via Cookie
  const jwtSecretRaw = process.env.JWT_SECRET;
  const token = request.cookies.get('openclaw_session')?.value;

  console.log(`[Middleware] pathname=${pathname} host=${request.headers.get('host')}`);
  console.log(`[Middleware] JWT_SECRET available=${!!jwtSecretRaw} length=${jwtSecretRaw?.length ?? 0}`);
  console.log(`[Middleware] Cookie token present=${!!token} length=${token?.length ?? 0}`);

  const JWT_SECRET = new TextEncoder().encode(jwtSecretRaw || 'secret');

  try {
    if (!token) throw new Error('No token found');
    await jwtVerify(token, JWT_SECRET);
    console.log(`[Middleware] JWT verify SUCCESS for ${pathname}`);
    return NextResponse.next();
  } catch (error: any) {
    console.log(`[Middleware] JWT verify FAILED for ${pathname}: ${error.message}`);

    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.redirect(new URL('/login', request.url));
  }
}
