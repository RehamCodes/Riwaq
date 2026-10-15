// Shared helpers for the sample student and teacher directories.

export const schools = [
  "Riwaq Academy – Amman",
  "Riwaq Academy – Irbid",
  "Riwaq Academy – Zarqa",
];

export type Gender = "male" | "female";
export const genders: Gender[] = ["male", "female"];

// Stable pseudo-random number 0–(mod-1) for a key, so the sample sheets look
// the same on every visit.
export function pick(key: string, mod: number) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % mod;
}

export const pad = (n: number) => String(n).padStart(2, "0");

export const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

// A sample Jordanian mobile number for a key.
export function samplePhone(key: string) {
  return `+962 7${7 + pick(`${key}:p`, 3)} ${100 + pick(`${key}:p1`, 900)} ${1000 + pick(`${key}:p2`, 9000)}`;
}

// "2013-04-09" → "Apr 9, 2013".
export function formatDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
