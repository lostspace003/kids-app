// Password hashing with scrypt (node:crypto — no external dependency).
// Stored form: scrypt$<saltHex>$<hashHex>.
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEYLEN);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith("scrypt$")) return false;
  const [, saltHex, hashHex] = stored.split("$");
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, salt, KEYLEN);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
