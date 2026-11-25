import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  apiKey?: string;
  createdAt: Timestamp;
}

export interface ClipMetadata {
  id?: string;
  userId: string;
  originalVideoName: string;
  inputMethod: 'upload' | 'link';
  sourceUrl?: string;
  clipTitle: string;
  hookScore: number;
  musicTrack: string;
  duration: number;
  createdAt: Timestamp | Date;
  storageRef?: string;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, {
    uid,
    createdAt: serverTimestamp(),
    ...data,
  }, { merge: true });
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, data as Record<string, unknown>);
}

export async function saveClipMetadata(clip: ClipMetadata): Promise<string> {
  const ref = doc(collection(db, 'users', clip.userId, 'clips'));
  await setDoc(ref, { ...clip, createdAt: serverTimestamp() });
  return ref.id;
}

export async function getUserClips(uid: string, limitCount = 20): Promise<ClipMetadata[]> {
  const q = query(
    collection(db, 'users', uid, 'clips'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ClipMetadata));
}

export async function deleteClipMetadata(uid: string, clipId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'clips', clipId));
}
