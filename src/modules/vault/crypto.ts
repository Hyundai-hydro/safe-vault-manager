import { VaultData } from "./types";

export interface EncryptedVaultFile {
  v: number; // version
  s: string; // salt (base64)
  iv: string; // iv (base64)
  ct: string; // ciphertext (base64)
}

const VERSION = 1;

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function fromB64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveAesKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 250_000,
      hash: "SHA-256",
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptVault(data: VaultData, password: string): Promise<EncryptedVaultFile> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt);
  const plaintext = enc.encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

  return {
    v: VERSION,
    s: toB64(salt.buffer),
    iv: toB64(iv.buffer),
    ct: toB64(ciphertext),
  };
}

export async function decryptVault(file: EncryptedVaultFile, password: string): Promise<VaultData> {
  if (!file || typeof file !== "object") throw new Error("Nieprawidłowy plik sejfu");
  const salt = fromB64(file.s);
  const iv = fromB64(file.iv);
  const key = await deriveAesKey(password, salt);
  try {
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, fromB64(file.ct));
    const json = dec.decode(plaintext);
    const data = JSON.parse(json) as VaultData;
    if (!data.entries) throw new Error("Pusty lub uszkodzony sejf");
    return data;
  } catch (e) {
    throw new Error("Nieprawidłowe hasło lub uszkodzony plik sejfu");
  }
}
