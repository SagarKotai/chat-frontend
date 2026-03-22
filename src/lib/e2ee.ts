const STORAGE_PRIVATE = 'chat:e2ee:private-jwk';
const STORAGE_PUBLIC = 'chat:e2ee:public-spki';
const STORAGE_DEVICE_ID = 'chat:e2ee:device-id';
const STORAGE_CREATED_AT = 'chat:e2ee:key-created-at';
const ROTATION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const fromBase64 = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const ensureCryptoSupport = (): void => {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('WebCrypto is not available');
  }
};

const generateDeviceId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getE2EEDeviceId = (): string => {
  const existing = localStorage.getItem(STORAGE_DEVICE_ID);
  if (existing) return existing;

  const created = generateDeviceId();
  localStorage.setItem(STORAGE_DEVICE_ID, created);
  return created;
};

export const ensureE2EEKeyPair = async (): Promise<{ publicKey: string; deviceId: string; rotated: boolean }> => {
  ensureCryptoSupport();

  const deviceId = getE2EEDeviceId();

  const existingPrivate = localStorage.getItem(STORAGE_PRIVATE);
  const existingPublic = localStorage.getItem(STORAGE_PUBLIC);
  const createdAt = Number(localStorage.getItem(STORAGE_CREATED_AT) ?? '0');
  const shouldRotate = !createdAt || Date.now() - createdAt > ROTATION_WINDOW_MS;

  if (existingPrivate && existingPublic && !shouldRotate) {
    return { publicKey: existingPublic, deviceId, rotated: false };
  }

  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt'],
  );

  const privateJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
  const publicSpki = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);

  localStorage.setItem(STORAGE_PRIVATE, JSON.stringify(privateJwk));
  localStorage.setItem(STORAGE_PUBLIC, toBase64(new Uint8Array(publicSpki)));
  localStorage.setItem(STORAGE_CREATED_AT, String(Date.now()));

  return { publicKey: toBase64(new Uint8Array(publicSpki)), deviceId, rotated: true };
};

export const encryptForPublicKey = async (publicKeyBase64: string, plaintext: string): Promise<string> => {
  ensureCryptoSupport();

  const keyBuffer = fromBase64(publicKeyBase64);
  const key = await window.crypto.subtle.importKey(
    'spki',
    keyBuffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  );

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    key,
    new TextEncoder().encode(plaintext),
  );

  return toBase64(new Uint8Array(encrypted));
};

export const decryptForCurrentUser = async (ciphertextBase64: string): Promise<string> => {
  ensureCryptoSupport();

  const privateJwkRaw = localStorage.getItem(STORAGE_PRIVATE);
  if (!privateJwkRaw) return '';

  const privateKey = await window.crypto.subtle.importKey(
    'jwk',
    JSON.parse(privateJwkRaw) as JsonWebKey,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt'],
  );

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    fromBase64(ciphertextBase64),
  );

  return new TextDecoder().decode(decrypted);
};
