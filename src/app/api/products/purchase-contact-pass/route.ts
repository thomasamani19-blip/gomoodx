
// This file is deprecated. The logic has been changed to initiate a conversation instead of a purchase.
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    return NextResponse.json({ status: 'error', message: "This endpoint is deprecated." }, { status: 410 });
}
