// Base64编码
export const base64Encode = str => bytesToBase64(new TextEncoder().encode(str));
// Base64解码
export const base64Decode = str => new TextDecoder().decode(base64ToBytes(str));
// 是否为Base64编码
export const isBase64 = str => /^[A-Za-z0-9+\/]*={0,2}$/.test(str);
// UUID
export const uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => ((Math.random() * 16) | 0).toString(16));

function bytesToBase64(bytes) {
  return btoa(new Uint8Array(bytes).reduce((data, byte) => data + String.fromCharCode(byte), ''));
}

function base64ToBytes(base64) {
  return new Uint8Array([...atob(base64)].map(char => char.charCodeAt(0)));
}
