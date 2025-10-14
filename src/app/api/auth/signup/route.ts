// This file is now deprecated. The signup logic has been moved to the /src/hooks/use-auth.tsx file.
// This centralized approach improves security and simplifies state management by handling
// both Firebase Auth user creation and Firestore document creation in a single, client-driven flow.

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({
      status: 'error', 
      message: 'This API route is deprecated. Signup is handled client-side.' 
    }, 
    { status: 410 }
  );
}
