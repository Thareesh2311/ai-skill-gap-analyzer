const path = require("path");
const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");

const Resume = require("../models/Resume");
const Company = require("../models/company");
const JobRole = require("../models/JobRole");

const uploadResume = async (req, res) => {
    try {
        console.log("Uploaded file:");
        console.log("Original name:", req.file?.originalname);
        console.log("MIME type:", req.file?.mimetype);
        console.log(
            "Extension:",
            path.extname(req.file?.originalname || "")
        );
        console.log("BODY:", req.body);
        console.log("FILE:", req.file);

        // =========================================
        // AUTH CHECK
        // =========================================

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized user."
            });
        }

        // =========================================
        // FILE CHECK
        // =========================================

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Resume file is required."
            });
        }

        // =========================================
        // GET COMPANY + ROLE
        // =========================================

        const { company, role } = req.body;

        if (!company || !role) {
            return res.status(400).json({
                success: false,
                message: "Company and role are required."
            });
        }

        // =========================================
        // FIND COMPANY
        // =========================================

        const companyDoc = await Company.findOne({
            name: {
                $regex: `^${company.trim()}$`,
                $options: "i"
            },
            isActive: true
        });

        if (!companyDoc) {
            return res.status(404).json({
                success: false,
                message: `Company '${company}' not found.`
            });
        }

        // =========================================
        // FIND JOB ROLE
        // =========================================

        const roleDoc = await JobRole.findOne({
            name: {
                $regex: `^${role.trim()}$`,
                $options: "i"
            },
            isActive: true
        });

        if (!roleDoc) {
            return res.status(404).json({
                success: false,
                message: `Job role '${role}' not found.`
            });
        }

        console.log("Company found:", companyDoc.name);
        console.log("Company ID:", companyDoc._id);

        console.log("Role found:", roleDoc.name);
        console.log("Role ID:", roleDoc._id);

        // =========================================
        // FILE INFORMATION
        // =========================================

        const extension = path
            .extname(req.file.originalname)
            .toLowerCase();

        console.log("File extension:", extension);

        // =========================================
        // EXTRACT TEXT
        // =========================================

        let extractedText = "";

        // -----------------------------------------
        // PDF
        // -----------------------------------------

        if (extension === ".pdf") {
            console.log("Processing PDF...");

            const fileBuffer = fs.readFileSync(
                req.file.path
            );

            const pdfData = await new PDFParse({
                data: fileBuffer
            }).getText();

            extractedText = pdfData.text || "";
        }

        // -----------------------------------------
        // DOCX
        // -----------------------------------------

        else if (extension === ".docx") {
            console.log("Processing DOCX...");

            const result = await mammoth.extractRawText({
                path: req.file.path
            });

            extractedText = result.value || "";
        }

        // -----------------------------------------
        // DOC
        // -----------------------------------------

        else if (extension === ".doc") {
            return res.status(400).json({
                success: false,
                message:
                    "Legacy .doc files are not currently supported. Please upload PDF or DOCX."
            });
        }

        // -----------------------------------------
        // UNSUPPORTED
        // -----------------------------------------

        else {
            return res.status(400).json({
                success: false,
                message: "Unsupported resume file type."
            });
        }

        console.log(
            "Extracted text length:",
            extractedText.length
        );

        // =========================================
        // CREATE RESUME
        // =========================================

        const resume = await Resume.create({
            user: req.user.id,

            // Store ObjectId references
            company: companyDoc._id,
            role: roleDoc._id,

            originalFileName:
                req.file.originalname,

            fileType:
                req.file.mimetype,

            fileSize:
                req.file.size,

            extractedText:
                extractedText,

            status: "processed"
        });

        console.log("Resume created successfully:");
        console.log("Resume ID:", resume._id);

        // =========================================
        // RESPONSE
        // =========================================

        return res.status(201).json({
            success: true,

            message:
                "Resume uploaded and processed successfully.",

            resumeId:
                resume._id,

            resume: {
                id:
                    resume._id,

                originalFileName:
                    resume.originalFileName,

                fileType:
                    resume.fileType,

                fileSize:
                    resume.fileSize,

                company: {
                    id:
                        companyDoc._id,

                    name:
                        companyDoc.name
                },

                role: {
                    id:
                        roleDoc._id,

                    name:
                        roleDoc.name
                },

                status:
                    resume.status
            }
        });

    } catch (error) {
        console.error(
            "Resume upload error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to upload resume.",

            error:
                error.message
        });
    }
};

module.exports = {
    uploadResume
};