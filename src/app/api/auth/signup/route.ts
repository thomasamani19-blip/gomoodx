
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // This route is deprecated. The signup logic has been moved to the client-side
  // useAuth hook for a more streamlined user creation flow within a single
  // Firebase transaction (Auth user + Firestore user doc).
  return NextResponse.json({
      status: 'error', 
      message: 'This API route is deprecated. Signup is handled client-side.' 
    }, 
    { status: 410 }
  );
}
