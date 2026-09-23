const mongoose = require("mongoose");
const extractedSkillSchema = new mongoose.Schema({
    skill: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    matchedText: {
        type: String,
        default: ""
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 1
    }
},
{
    _id: false
}
);
const skillGapSchema = new mongoose.Schema({
    skill: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    importance: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: [
            "missing",
            "matched"
        ],
        required: true
    }
    },
{
    _id: false
});
const resumeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true
        },
        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "JobRole",
            required: true
        },
        originalFileName: {
            type: String,
            required: true
        },
        fileType: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number,
            required: true
        },
        extractedText: {
            type: String,
            default: ""
        },
        extractedSkills: {
            type: [extractedSkillSchema],
            default: []
        },
        status: {
            type: String,
            enum: [
                "uploaded",
                "processed",
                "analyzed",
                "failed"
            ],
            default: "uploaded"
        },
        skillGapAnalysis: {
            company: {
                type: String,
            },
            role: {
                type: String,
            },
            coverageScore: {
                type: Number,
                default: 0
            },
            matchedSkills: {
                type: [skillGapSchema],
                default: []
            },
            missingSkills: {
                type: [skillGapSchema],
                default: []
            },
            analyzedAt: {
                type: Date
            }
        }
    },
    {
        timestamps: true
    }
);
module.exports = mongoose.model("Resume", resumeSchema);