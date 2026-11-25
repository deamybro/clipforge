import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase-admin';

export async function DELETE(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userId = decoded.uid;

    const bucket = adminStorage.bucket();
    const [files] = await bucket.getFiles({ prefix: `users/${userId}/` });
    await Promise.allSettled(files.map((file) => file.delete()));

    await adminDb.recursiveDelete(adminDb.collection('users').doc(userId));
    await adminAuth.deleteUser(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account deletion failed:', error);
    return NextResponse.json(
      { error: 'Account deletion failed. Sign in again and retry.' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
