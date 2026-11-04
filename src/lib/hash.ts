/**
 * Small, fast, non-cryptographic string hash (djb2, 32-bit) rendered in base36.
 * Used to build deterministic notification identifiers — never for security.
 */
export function hashString(input: string): string {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(index)) | 0;
  }
  return (hash >>> 0).toString(36);
}
