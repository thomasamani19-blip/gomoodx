// This file is deprecated in favor of create-escort and create-establishment
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    return NextResponse.json({ status: 'error', message: "This endpoint is deprecated." }, { status: 410 });
}
