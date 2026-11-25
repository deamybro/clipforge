import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';

admin.initializeApp();

// Daily cleanup: delete all files in Storage older than 24 hours
export const dailyStorageCleanup = onSchedule('every 24 hours', async () => {
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles();
    const now = Date.now();
    const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours

    const deletePromises = files
      .filter((file) => {
        const metadata = file.metadata;
        const updated = metadata.updated ? new Date(metadata.updated).getTime() : 0;
        return now - updated > maxAgeMs;
      })
      .map((file) => file.delete());

    await Promise.allSettled(deletePromises);
    console.log(`Deleted ${deletePromises.length} old files.`);
  });
