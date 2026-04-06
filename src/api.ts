/** Thin client for the server-side key-value store. */

type ServerResult<T> = { found: true; value: T } | { found: false; value: null };

export async function loadFromServer<T>(key: string): Promise<ServerResult<T>> {
  try {
    const res = await fetch(`/api/store/${key}`);
    console.log(`[FORGE] GET /api/store/${key} →`, res.status);
    if (res.status === 404) return { found: false, value: null };
    const value = await res.json() as T;
    return { found: true, value };
  } catch (err) {
    console.error(`[FORGE] fetch /api/store/${key} failed:`, err);
    return { found: false, value: null };
  }
}

export async function saveToServer(key: string, value: unknown): Promise<void> {
  try {
    await fetch(`/api/store/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    });
  } catch {
    // Network error — localStorage already has the data, ignore
  }
}
