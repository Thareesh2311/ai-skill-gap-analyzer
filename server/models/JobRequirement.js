const mongoose = require('mongoose');
const company = require('./company');
const jobRequirement = new mongoose.Schema(
    {
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
        skill: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Skill",
            required: true
        },
        importance: {
            type: Number,
            required: true,
            min: 1,
            max: 100
        },
        requiredLevel: {
            type: String,
            enum: [
                "Beginner",
                "Intermediate",
                "Advanced"
            ],
            default: "Intermediate"
        }
    },
    {
        timestamps: true
    }
);
jobRequirement.index(
    {
        company: 1,
        role: 1,
        skill: 1
    },
    {
        unique: true
    }
);
module.exports = mongoose.model("JobRequirement", jobRequirement);
