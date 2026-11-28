const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(`ga4-aes:${secret}`));
  return await crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function deriveHmacKey(secret: string): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(`ga4-hmac:${secret}`));
  return await crypto.subtle.importKey('raw', hash, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function encryptSecret(plaintext: string, masterSecret: string): Promise<string> {
  if (!plaintext) return '';
  const key = await deriveAesKey(masterSecret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plaintext));
  return `${toBase64Url(iv)}.${toBase64Url(new Uint8Array(encrypted))}`;
}

export async function decryptSecret(cipherText: string, masterSecret: string): Promise<string> {
  if (!cipherText || !cipherText.includes('.')) return '';
  const [ivPart, dataPart] = cipherText.split('.');
  const key = await deriveAesKey(masterSecret);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64Url(ivPart) },
    key,
    fromBase64Url(dataPart)
  );
  return decoder.decode(decrypted);
}

export async function signOAuthState(payload: Record<string, unknown>, secret: string): Promise<string> {
  const key = await deriveHmacKey(secret);
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(sigBuf))}`;
}

export async function verifyOAuthState<T extends Record<string, unknown>>(
  stateToken: string,
  secret: string
): Promise<T | null> {
  if (!stateToken || !stateToken.includes('.')) return null;
  const parts = stateToken.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const key = await deriveHmacKey(secret);
  const valid = await crypto.subtle.verify('HMAC', key, fromBase64Url(sig), encoder.encode(body));
  if (!valid) return null;
  try {
    return JSON.parse(decoder.decode(fromBase64Url(body))) as T;
  } catch {
    return null;
  }
}
