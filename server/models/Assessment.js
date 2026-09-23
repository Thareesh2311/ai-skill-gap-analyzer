const mongoose = require("mongoose");

// ============================================================
// ASSESSMENT SCHEMA
// ============================================================

const assessmentSchema =
    new mongoose.Schema(
        {
            // ----------------------------------------------------
            // USER
            // ----------------------------------------------------

            user: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "User",

                required: true
            },

            // ----------------------------------------------------
            // RESUME
            // ----------------------------------------------------

            resume: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "Resume",

                required: true
            },

            // ----------------------------------------------------
            // COMPANY
            // ----------------------------------------------------

            company: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "Company",

                required: true
            },

            // ----------------------------------------------------
            // ROLE
            // ----------------------------------------------------

            role: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "JobRole",

                required: true
            },

            // ----------------------------------------------------
            // TYPE
            // ----------------------------------------------------

            type: {
                type: String,

                enum: [
                    "mcq",
                    "coding",
                    "sql"
                ],

                required: true
            },

            // ----------------------------------------------------
            // SKILLS
            // ----------------------------------------------------

            skills: [
                {
                    type:
                        mongoose.Schema.Types.ObjectId,

                    ref: "Skill"
                }
            ],

            // ----------------------------------------------------
            // MCQ QUESTIONS
            // ----------------------------------------------------

            mcqQuestions: [
                {
                    type:
                        mongoose.Schema.Types.ObjectId,

                    ref: "Question"
                }
            ],

            // ----------------------------------------------------
            // CODING QUESTIONS
            // ----------------------------------------------------

            codingQuestions: [
                {
                    type:
                        mongoose.Schema.Types.ObjectId,

                    ref: "CodingQuestion"
                }
            ],

            // ----------------------------------------------------
            // SQL QUESTIONS
            // ----------------------------------------------------

            sqlQuestions: [
                {
                    type:
                        mongoose.Schema.Types.ObjectId,

                    ref: "SQLQuestion"
                }
            ],

            // ----------------------------------------------------
            // TOTAL QUESTIONS
            // ----------------------------------------------------

            totalQuestion: {
                type: Number,

                default: 0,

                min: 0
            },

            // ----------------------------------------------------
            // STATUS
            // ----------------------------------------------------

            status: {
                type: String,

                enum: [
                    "created",
                    "started",
                    "completed",
                    "evaluated"
                ],

                default: "created"
            },

            // ----------------------------------------------------
            // STARTED
            // ----------------------------------------------------

            startedAt: {
                type: Date
            },

            // ----------------------------------------------------
            // COMPLETED
            // ----------------------------------------------------

            completedAt: {
                type: Date
            },

            // ----------------------------------------------------
            // SCORE
            // ----------------------------------------------------

            score: {
                type: Number,

                default: 0,

                min: 0,

                max: 100
            }
        },

        {
            timestamps: true
        }
    );

// ============================================================
// INDEXES
// ============================================================

assessmentSchema.index({
    user: 1,
    createdAt: -1
});

assessmentSchema.index({
    user: 1,
    type: 1
});

// ============================================================
// EXPORT
// ============================================================

module.exports =
    mongoose.model(
        "Assessment",
        assessmentSchema
    );