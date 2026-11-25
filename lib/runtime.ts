export const isLocalDevMode = process.env.NEXT_PUBLIC_LOCAL_DEV_MODE === 'true';

export function isServerLocalDevMode(): boolean {
  return process.env.LOCAL_DEV_MODE === 'true' || isLocalDevMode;
}
