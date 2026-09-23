const mongoose = require("mongoose");
const questionSchema = new mongoose.Schema(
    {
        skill: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Skill",
            required: true
        },
        type: {
            type: String,
            enum: ["mcq", "coding", "sql"],
            default: "mcq"
        },
        difficulty: {
            type: String,
            enum: [
                "beginner",
                "intermediate",
                "advanced"
            ],
            required: true
        },
        question: {
            type: String,
            required: true
        },
        options: {
            type: [String],
            required: true
        },
        correctAnswer: {
            type: Number,
            required: true
        },
        starterCode: {
            type: String,
            default: ""
        },
        language: {
            type: String,
            default: "python"
        },
        expectedOutput: {
            type: String,
            default: ""
        },
        testCases: [
            {
                input: {
                    type: String,
                    default: ""
                },
                expectedOutput: {
                    type: String,
                    default: ""
                },
                isHidden: {
                    type: Boolean,
                    default: false
                }
            }
        ],
        databaseSchema: {
            type: String,
            default: ""
        },
        explanation: {
            type: String,
            default: ""
        },
        points: {
            type: Number,
            default: 1
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);
module.exports =
    mongoose.model("Question", questionSchema);