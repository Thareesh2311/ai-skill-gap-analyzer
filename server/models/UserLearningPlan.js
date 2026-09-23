const mongoose =
    require("mongoose");


/*
============================================================
TOPIC PROGRESS
============================================================
*/

const topicProgressSchema =
    new mongoose.Schema(
        {
            key: {
                type:
                    String,

                required:
                    true,

                trim:
                    true
            },

            name: {
                type:
                    String,

                required:
                    true,

                trim:
                    true
            },

            isActive: {
                type:
                    Boolean,

                default:
                    true
            },

            isCompleted: {
                type:
                    Boolean,

                default:
                    false
            },

            completedAt: {
                type:
                    Date,

                default:
                    null
            }
        },
        {
            _id:
                false
        }
    );


/*
============================================================
RESOURCE PROGRESS
============================================================
*/

const resourceProgressSchema =
    new mongoose.Schema(
        {
            key: {
                type:
                    String,

                required:
                    true,

                trim:
                    true
            },

            resourceId: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref:
                    "LearningResource",

                default:
                    null
            },

            title: {
                type:
                    String,

                required:
                    true,

                trim:
                    true
            },

            url: {
                type:
                    String,

                default:
                    "",

                trim:
                    true
            },

            type: {
                type:
                    String,

                enum: [
                    "youtube",
                    "documentation",
                    "course",
                    "practice",
                    "article",
                    "project",
                    "interview",
                    "resource"
                ],

                default:
                    "resource"
            },

            source: {
                type:
                    String,

                enum: [
                    "curated",
                    "youtube-api",
                    "external-api",
                    "unknown"
                ],

                default:
                    "unknown"
            },

            isActive: {
                type:
                    Boolean,

                default:
                    true
            },

            isCompleted: {
                type:
                    Boolean,

                default:
                    false
            },

            completedAt: {
                type:
                    Date,

                default:
                    null
            },

            lastAccessedAt: {
                type:
                    Date,

                default:
                    null
            }
        },
        {
            _id:
                false
        }
    );


/*
============================================================
PROJECT PROGRESS
============================================================
*/

const projectProgressSchema =
    new mongoose.Schema(
        {
            key: {
                type:
                    String,

                required:
                    true,

                trim:
                    true
            },

            title: {
                type:
                    String,

                required:
                    true,

                trim:
                    true
            },

            description: {
                type:
                    String,

                default:
                    "",

                trim:
                    true
            },

            isActive: {
                type:
                    Boolean,

                default:
                    true
            },

            isCompleted: {
                type:
                    Boolean,

                default:
                    false
            },

            completedAt: {
                type:
                    Date,

                default:
                    null
            }
        },
        {
            _id:
                false
        }
    );


/*
============================================================
PROGRESS SUMMARY
============================================================
*/

const progressSummarySchema =
    new mongoose.Schema(
        {
            topicPercentage: {
                type:
                    Number,

                default:
                    0,

                min:
                    0,

                max:
                    100
            },

            resourcePercentage: {
                type:
                    Number,

                default:
                    0,

                min:
                    0,

                max:
                    100
            },

            projectPercentage: {
                type:
                    Number,

                default:
                    0,

                min:
                    0,

                max:
                    100
            },

            overallPercentage: {
                type:
                    Number,

                default:
                    0,

                min:
                    0,

                max:
                    100
            },

            completedItems: {
                type:
                    Number,

                default:
                    0
            },

            totalItems: {
                type:
                    Number,

                default:
                    0
            }
        },
        {
            _id:
                false
        }
    );


/*
============================================================
USER LEARNING PLAN
============================================================
*/

const userLearningPlanSchema =
    new mongoose.Schema(
        {
            user: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref:
                    "User",

                required:
                    true,

                index:
                    true
            },

            resume: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref:
                    "Resume",

                required:
                    true,

                index:
                    true
            },

            skill: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref:
                    "Skill",

                required:
                    true,

                index:
                    true
            },

            /*
            Snapshot so historical progress still has a
            readable skill name if taxonomy changes.
            */

            skillName: {
                type:
                    String,

                required:
                    true,

                trim:
                    true
            },

            status: {
                type:
                    String,

                enum: [
                    "not-started",
                    "in-progress",
                    "completed"
                ],

                default:
                    "not-started",

                index:
                    true
            },

            topics: {
                type: [
                    topicProgressSchema
                ],

                default:
                    []
            },

            resources: {
                type: [
                    resourceProgressSchema
                ],

                default:
                    []
            },

            projects: {
                type: [
                    projectProgressSchema
                ],

                default:
                    []
            },

            progress: {
                type:
                    progressSummarySchema,

                default:
                    () => ({})
            },

            startedAt: {
                type:
                    Date,

                default:
                    null
            },

            completedAt: {
                type:
                    Date,

                default:
                    null
            },

            lastActivityAt: {
                type:
                    Date,

                default:
                    null
            },

            isActive: {
                type:
                    Boolean,

                default:
                    true,

                index:
                    true
            }
        },
        {
            timestamps:
                true
        }
    );


/*
============================================================
INDEXES
============================================================
*/

userLearningPlanSchema.index(
    {
        user:
            1,

        resume:
            1,

        skill:
            1
    },
    {
        unique:
            true
    }
);


userLearningPlanSchema.index(
    {
        user:
            1,

        resume:
            1,

        isActive:
            1,

        status:
            1
    }
);


/*
============================================================
EXPORT
============================================================
*/

module.exports =
    mongoose.model(
        "UserLearningPlan",
        userLearningPlanSchema
    );