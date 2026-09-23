const mongoose = require("mongoose");

const testCaseResultSchema = new mongoose.Schema(
    {
        testCaseNumber: {
            type: Number,
            default: 0
        },
        passed: {
            type: Boolean,
            default: false
        },
        actual: {
            type: String,
            default: ""
        },
        expected: {
            type: String,
            default: ""
        },
        executionTime: {
            type: Number,
            default: 0
        },
        error: {
            type: String,
            default: ""
        },
        timedOut: {
            type: Boolean,
            default: false
        },
        isHidden: {
            type: Boolean,
            default: false
        }
    },
    {
        _id: false,
        strict: false
    }
);

const answerSchema = new mongoose.Schema(
    {
        question: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        answer: {
            type: String,
            default: ""
        },
        isCorrect: {
            type: Boolean,
            default: false
        },
        pointsEarned: {
            type: Number,
            default: 0
        },

        // Coding / SQL execution fields
        testCasesPassed: {
            type: Number,
            default: 0
        },
        totalTestCases: {
            type: Number,
            default: 0
        },
        executionTime: {
            type: Number,
            default: 0
        },
        error: {
            type: String,
            default: ""
        },
        timedOut: {
            type: Boolean,
            default: false
        },
        performance: {
            type: String,
            default: ""
        },
        language: {
            type: String,
            default: ""
        },
        testCaseResults: {
            type: [testCaseResultSchema],
            default: []
        }
    },
    {
        _id: false
    }
);

const assessmentAttemptSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        assessment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assessment",
            required: true
        },
        answers: {
            type: [answerSchema],
            default: []
        },
        score: {
            type: Number,
            default: 0
        },
        percentage: {
            type: Number,
            default: 0
        },
        aiInsights: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        startedAt: {
            type: Date
        },
        submittedAt: {
            type: Date
        },
        status: {
            type: String,
            enum: ["in-progress", "submitted", "evaluated"],
            default: "in-progress"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "AssessmentAttempt",
    assessmentAttemptSchema
);
