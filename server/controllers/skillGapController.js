const Resume = require("../models/Resume");
const JobRequirement = require("../models/JobRequirement");
const {
    analyzeSkillGap
} = require("../services/skillGapService");
const analyzeSkillGapController = async (req, res) => {
    try {
        const { resumeId } = req.params;
        const resume = await Resume.findOne({
            _id: resumeId,
            user: req.user.id
        })
            .populate("company", "name")
            .populate("role", "name");
        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found"
            });
        }
        console.log("Resume found:");
        console.log("Company:", resume.company);
        console.log("Role:", resume.role);
        if (!resume.company) {
            return res.status(400).json({
                success: false,
                message:
                    "Company linked to this resume no longer exists. Please upload the resume again."
            });
        }
        if (!resume.role) {
            return res.status(400).json({
                success: false,
                message:
                    "Job role linked to this resume no longer exists. Please upload the resume again."
            });
        }
        if (
            !resume.extractedSkills ||
            resume.extractedSkills.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Resume skills have not been extracted yet"
            });
        }
        const companyName =
            resume.company.name;
        const roleName =
            resume.role.name;
        console.log("Company Name:", companyName);
        console.log("Role Name:", roleName);
        const jobRequirements =
            await JobRequirement.find({
                company: resume.company._id,
                role: resume.role._id
            })
                .populate("skill", "name");
        console.log(
            "Job Requirements Count:",
            jobRequirements.length
        );
        if (
            !jobRequirements ||
            jobRequirements.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    `Job requirements not found for ${companyName} - ${roleName}`
            });
        }
        console.log(
            "Job Requirements:",
            JSON.stringify(
                jobRequirements,
                null,
                2
            )
        );
        console.log(
            "Extracted Skills:",
            JSON.stringify(
                resume.extractedSkills,
                null,
                2
            )
        );
        const analysis =
            analyzeSkillGap(
                resume.extractedSkills,
                jobRequirements
            );
        console.log(
            "Skill Gap Analysis:",
            JSON.stringify(
                analysis,
                null,
                2
            )
        );
        resume.skillGapAnalysis = {
            company:
                companyName,
            role:
                roleName,
            coverageScore:
                analysis.coverageScore,
            matchedSkills:
                analysis.matchedSkills,
            missingSkills:
                analysis.missingSkills,
            analyzedAt:
                new Date()
        };
        resume.status = "analyzed";
        await resume.save();
        return res.status(200).json({
            success: true,
            message:
                "Skill gap analysis completed",
            data: {
                company:
                    companyName,
                role:
                    roleName,
                coverageScore:
                    analysis.coverageScore,
                matchedSkills:
                    analysis.matchedSkills,
                missingSkills:
                    analysis.missingSkills
            }
        });
    } catch (error) {
        console.error(
            "Skill gap analysis error:",
            error
        );
        return res.status(500).json({
            success: false,
            message:
                "Skill gap analysis failed",
            error:
                error.message
        });
    }
};
module.exports = {
    analyzeSkillGapController
};