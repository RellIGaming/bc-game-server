import CryptoJS from "crypto-js";

export const AES_KEY = "68b074393ec7c5a975856a90bd6fdf47";

export function encrypt(data) {
  const key = CryptoJS.enc.Utf8.parse(AES_KEY);

  return CryptoJS.AES.encrypt(
    JSON.stringify(data),
    key,
    {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }
  ).toString();
}

export function decrypt(cipherText) {
  try {
    const key = CryptoJS.enc.Utf8.parse(AES_KEY);

    const bytes = CryptoJS.AES.decrypt(cipherText, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });

    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

    console.log("DECRYPT RAW:", decryptedText); // 👈 VERY IMPORTANT

    if (!decryptedText) {
      throw new Error("Decryption failed (empty result)");
    }

    return JSON.parse(decryptedText);
  } catch (err) {
    console.error("DECRYPT ERROR:", err.message);
    throw err;
  }
}