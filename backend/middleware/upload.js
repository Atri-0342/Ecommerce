const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ FIX 1: Change path to just "uploads". 
// Static files are usually served from /uploads. Putting them in /proofs 
// makes the URL harder to manage if your Express static config only points to /uploads.
const uploadPath = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // ✅ FIX 2: Removed "DEALER_PROOF_" prefix.
    // Result: 1777104687499-download.jpg
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type! Only PDF, Word, and Images are allowed."), false);
    }
  }
});

module.exports = upload;