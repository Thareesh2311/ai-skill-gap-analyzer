const multer = require("multer");
const path = require("path");
const fs = require("fs");
// Create uploads directory
const uploadDirectory = path.join(__dirname, "../uploads/resume");
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}
// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },
    filename: (req, file, cb) => {
        const uniqueName =
            `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});
// Allowed file types
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    const allowedExtensions = [
        ".pdf",
        ".docx"
    ];
    const extension =
        path.extname(file.originalname).toLowerCase();
    console.log("Uploaded file:");
    console.log("Original name:", file.originalname);
    console.log("MIME type:", file.mimetype);
    console.log("Extension:", extension);
    if (
        allowedMimeTypes.includes(file.mimetype) ||
        allowedExtensions.includes(extension)
    ) {
        cb(null, true);
    } else {
        cb(
            new Error("Only PDF and DOCX files are allowed"),
            false
        );
    }
};
// Multer configuration
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});
module.exports = upload;