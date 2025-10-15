// /src/app/api/boutique/purchase/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.redirect('/boutique');
}
