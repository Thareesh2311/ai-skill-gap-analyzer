const Resume = require("../models/Resume");
const {
    extractSkills
} = require("../services/skillExtractionService");
// ANALYZE RESUME SKILLS
const analyzeResumeSkills = async (
    req,
    res
) => {
    try {
        const {
            resumeId
        } = req.params;
        // Find resume belonging to user
        const resume =
            await Resume.findOne({
                _id: resumeId,
                user: req.user.id
            });
        if (!resume) {
            return res.status(404).json({
                success: false,
                message:
                    "Resume not found"
            });
        }
        if (!resume.extractedText) {
            return res.status(400).json({
                success: false,
                message:
                    "Resume text is not available"
            });
        }
        // Run skill extraction
        const detectedSkills =
            await extractSkills(
                resume.extractedText
            );
        // Save skills
        resume.extractedSkills =
            detectedSkills;
        resume.status =
            "analyzed";
        await resume.save();
        res.status(200).json({
            success: true,
            message:
                "Resume skill analysis completed",
            data: {
                resumeId:
                    resume._id,
                totalSkills:
                    detectedSkills.length,
                skills:
                    detectedSkills
            }
        });
    } catch (error) {
        console.error(
            "Skill analysis error:",
            error
        );
        res.status(500).json({
            success: false,
            message:
                "Skill analysis failed",
            error:
                error.message
        });
    }
};
module.exports = {
    analyzeResumeSkills
};