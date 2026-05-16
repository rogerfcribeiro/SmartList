import { signOut } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST() {
  await signOut({ redirect: false });
  return new NextResponse(null, { status: 204 });
}
