// This endpoint is deprecated. Contact is now free and direct via messaging.
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    return NextResponse.json({ status: 'error', message: "This endpoint is deprecated." }, { status: 410 });
}

    