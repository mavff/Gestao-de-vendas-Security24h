'use client';

const DEFAULT_API_BASE_URL = 'http://localhost:3001';

function resolveBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!value) return DEFAULT_API_BASE_URL;
  return value.replace(/\/+$/, '');
}

export interface PhotoUploadMeta {
  entityType: string;
  entityId: string;
  pontoId?: string;
}

/** Resolve a stored photo token to a renderable <img src>.
 *  Accepts:
 *   - "data:image/..."      → returns as-is (legacy base64)
 *   - "photo:<uuid>"        → returns GET /photos/<uuid>
 *   - "<uuid>"              → returns GET /photos/<uuid>
 *   - anything else         → returns as-is
 */
export function photoSrc(token: string): string {
  if (!token) return token;
  if (token.startsWith('data:')) return token;
  if (token.startsWith('photo:')) return `${resolveBaseUrl()}/photos/${token.slice(6)}`;
  return token;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function postFormData(path: string, form: FormData): Promise<{ id: string }> {
  const base = resolveBaseUrl();
  const token = typeof window !== 'undefined' ? localStorage.getItem('sec24h_token') : null;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, { method: 'POST', headers, body: form });

  if (res.status === 401 && typeof window !== 'undefined') {
    const refresh = localStorage.getItem('sec24h_refresh');
    if (refresh) {
      const r = await fetch(`${base}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (r.ok) {
        const { accessToken } = await r.json() as { accessToken: string };
        localStorage.setItem('sec24h_token', accessToken);
        const retry = await fetch(`${base}${path}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form,
        });
        if (!retry.ok) throw new Error(`Upload failed: HTTP ${retry.status}`);
        return retry.json();
      }
    }
  }

  if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
  return res.json();
}

/** Upload a base64/dataURL image. Returns the opaque token "photo:<uuid>"
 *  that should be stored in place of the original base64 string. */
export async function uploadBase64Photo(dataUrl: string, meta: PhotoUploadMeta): Promise<string> {
  if (!dataUrl.startsWith('data:')) {
    // Already a token or URL — return unchanged.
    return dataUrl;
  }
  const blob = dataUrlToBlob(dataUrl);
  const form = new FormData();
  form.append('file', blob, 'photo.jpg');
  form.append('entityType', meta.entityType);
  form.append('entityId', meta.entityId);
  if (meta.pontoId) form.append('pontoId', meta.pontoId);

  const { id } = await postFormData('/photos/upload', form);
  return `photo:${id}`;
}

/** Upload a signed contract (PDF/JPG/PNG) for a venda. Backend writes
 *  `contratoUrl` + `contratoAssinadoEm` atomically and returns the updated row. */
export async function uploadContrato(vendaId: string, file: File): Promise<{ contratoUrl: string; contratoAssinadoEm: string }> {
  const base = resolveBaseUrl();
  const form = new FormData();
  form.append('file', file, file.name);

  async function doFetch(jwt: string | null): Promise<Response> {
    const headers: Record<string, string> = {};
    if (jwt) headers['Authorization'] = `Bearer ${jwt}`;
    return fetch(`${base}/vendas/${encodeURIComponent(vendaId)}/contrato`, {
      method: 'POST', headers, body: form,
    });
  }

  let token = typeof window !== 'undefined' ? localStorage.getItem('sec24h_token') : null;
  let res = await doFetch(token);

  if (res.status === 401 && typeof window !== 'undefined') {
    const refresh = localStorage.getItem('sec24h_refresh');
    if (refresh) {
      const r = await fetch(`${base}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (r.ok) {
        const { accessToken } = await r.json() as { accessToken: string };
        localStorage.setItem('sec24h_token', accessToken);
        // Rebuild FormData (original was consumed)
        const form2 = new FormData();
        form2.append('file', file, file.name);
        res = await fetch(`${base}/vendas/${encodeURIComponent(vendaId)}/contrato`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form2,
        });
      }
    }
  }

  if (!res.ok) throw new Error(`Upload contrato falhou: HTTP ${res.status}`);
  const venda = await res.json() as { contratoUrl: string; contratoAssinadoEm: string };
  return { contratoUrl: venda.contratoUrl, contratoAssinadoEm: venda.contratoAssinadoEm };
}

export async function deletePhotoToken(token: string): Promise<void> {
  if (!token.startsWith('photo:')) return;
  const base = resolveBaseUrl();
  const jwt = typeof window !== 'undefined' ? localStorage.getItem('sec24h_token') : null;
  await fetch(`${base}/photos/${token.slice(6)}`, {
    method: 'DELETE',
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
  });
}
