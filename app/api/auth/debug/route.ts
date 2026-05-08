import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// This is a debug endpoint - should be removed in production
export async function POST(request: Request) {
  const results: Record<string, unknown> = {};
  
  try {
    const body = await request.json();
    const token = body.token;
    
    // Check env vars availability
    results.JWT_SECRET_available = !!process.env.JWT_SECRET;
    results.JWT_SECRET_length = process.env.JWT_SECRET?.length ?? 0;
    results.JWT_SECRET_value = process.env.JWT_SECRET?.substring(0, 5) + '...';
    results.ADMIN_PASSWORD_available = !!process.env.ADMIN_PASSWORD;
    
    if (token) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
      results.secret_used_for_verify = process.env.JWT_SECRET ? 'from_env' : 'fallback_secret';
      
      try {
        const { payload } = await jwtVerify(token, secret);
        results.jwt_verify = 'SUCCESS';
        results.jwt_payload = payload;
      } catch (jwtErr: any) {
        results.jwt_verify = 'FAILED';
        results.jwt_error = jwtErr.message;
      }
    }
    
    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
