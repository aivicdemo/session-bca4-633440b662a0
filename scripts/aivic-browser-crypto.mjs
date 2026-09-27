export const randomUUID = () => globalThis.crypto.randomUUID();
export const randomBytes = (size) => {
  const bytes = new Uint8Array(size);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
};
export default { randomUUID, randomBytes };
