const crypto = require("crypto");

// Using a hash ensures the key is exactly 32 bytes regardless of .env input
const rawKey = process.env.CHAT_ENCRYPTION_KEY || "fallback_secret_32_chars_long_!!";
const KEY = crypto.createHash('sha256').update(String(rawKey)).digest();
const ALGORITHM = "aes-256-cbc";

exports.encrypt = (text) => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return { encryptedData: encrypted, iv: iv.toString("hex") };
  } catch (err) {
    console.error("Encryption Error:", err.message);
    throw err;
  }
};

exports.decrypt = (encryptedData, ivHex) => {
  try {
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    return "[Encrypted Message]";
  }
};