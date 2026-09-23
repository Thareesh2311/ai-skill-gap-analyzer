const mongoose = require("mongoose");


/*
============================================================
LEARNING RESOURCE SCHEMA
============================================================

A LearningResource represents one trusted learning resource
that can be recommended to a user based on:

- Skill gaps
- Assessment performance
- Difficulty level
- Job readiness
- Learning priorities

Examples:

SQL
    → YouTube video
    → SQLBolt practice
    → PostgreSQL documentation
    → LeetCode Database

Python
    → Python Docs
    → freeCodeCamp course
    → HackerRank practice

============================================================
*/


const learningResourceSchema =
    new mongoose.Schema(
        {

            /*
            ========================================================
            SKILL
            ========================================================

            Links the resource to your existing Skill collection.

            Example:
                SQL
                Python
                React
                Machine Learning
            */

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
            ========================================================
            TOPIC
            ========================================================

            A resource can target a specific topic.

            Examples:
                JOINs
                Window Functions
                Pandas
                React Hooks
                Classification
            */

            topic: {

                type:
                    String,

                required:
                    true,

                trim:
                    true,

                maxlength:
                    150
            },


            /*
            ========================================================
            LEVEL
            ========================================================

            Difficulty / learning level of the resource.
            */

            level: {

                type:
                    String,

                enum: [
                    "beginner",
                    "intermediate",
                    "advanced",
                    "all"
                ],

                default:
                    "beginner",

                index:
                    true
            },


            /*
            ========================================================
            RESOURCE TYPE
            ========================================================

            Allows frontend grouping such as:

                YouTube
                Documentation
                Courses
                Practice
                Projects
            */

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
                    "interview"
                ],

                required:
                    true,

                index:
                    true
            },


            /*
            ========================================================
            TITLE
            ========================================================
            */

            title: {

                type:
                    String,

                required:
                    true,

                trim:
                    true,

                maxlength:
                    250
            },


            /*
            ========================================================
            DESCRIPTION
            ========================================================
            */

            description: {

                type:
                    String,

                default:
                    "",

                trim:
                    true,

                maxlength:
                    1500
            },


            /*
            ========================================================
            PROVIDER
            ========================================================

            Examples:

                freeCodeCamp
                Google
                Microsoft
                PostgreSQL
                HackerRank
                LeetCode
                MDN
                Kaggle
            */

            provider: {

                type:
                    String,

                required:
                    true,

                trim:
                    true,

                maxlength:
                    150
            },


            /*
            ========================================================
            RESOURCE URL
            ========================================================
            */

            url: {

                type:
                    String,

                required:
                    true,

                trim:
                    true,

                validate: {

                    validator:
                        function (
                            value
                        ) {

                            try {

                                const parsedURL =
                                    new URL(
                                        value
                                    );


                                return (
                                    parsedURL
                                        .protocol ===
                                        "http:" ||

                                    parsedURL
                                        .protocol ===
                                        "https:"
                                );


                            } catch (
                                error
                            ) {

                                return false;
                            }
                        },

                    message:
                        "Learning resource URL must be a valid HTTP or HTTPS URL."
                }
            },


            /*
            ========================================================
            THUMBNAIL
            ========================================================

            Primarily useful for YouTube resources.

            Can also support course thumbnails later.
            */

            thumbnailUrl: {

                type:
                    String,

                default:
                    "",

                trim:
                    true
            },


            /*
            ========================================================
            EXTERNAL RESOURCE ID
            ========================================================

            Useful later for YouTube Data API.

            Example:

                videoId
                courseId
                articleId
            */

            externalId: {

                type:
                    String,

                default:
                    "",

                trim:
                    true
            },


            /*
            ========================================================
            SOURCE
            ========================================================

            curated
                → manually verified resources

            youtube-api
                → discovered from YouTube API

            external-api
                → future provider APIs
            */

            source: {

                type:
                    String,

                enum: [
                    "curated",
                    "youtube-api",
                    "external-api"
                ],

                default:
                    "curated"
            },


            /*
            ========================================================
            DURATION
            ========================================================

            Stored as readable text for flexible resources.

            Examples:

                "45 minutes"
                "3 hours"
                "2 weeks"
                "Self paced"
            */

            duration: {

                type:
                    String,

                default:
                    "",

                trim:
                    true,

                maxlength:
                    100
            },


            /*
            ========================================================
            LANGUAGE
            ========================================================
            */

            language: {

                type:
                    String,

                default:
                    "English",

                trim:
                    true,

                maxlength:
                    50
            },


            /*
            ========================================================
            FREE RESOURCE
            ========================================================
            */

            isFree: {

                type:
                    Boolean,

                default:
                    true
            },


            /*
            ========================================================
            QUALITY SCORE
            ========================================================

            Internal recommendation ranking score.

            Example:

                90 = highly recommended
                70 = good
                50 = acceptable

            This should NOT be interpreted as the user's score.
            */

            qualityScore: {

                type:
                    Number,

                default:
                    75,

                min:
                    0,

                max:
                    100,

                index:
                    true
            },


            /*
            ========================================================
            TAGS
            ========================================================

            Examples:

                sql
                joins
                window-functions
                data-analysis
            */

            tags: {

                type: [
                    String
                ],

                default:
                    []
            },


            /*
            ========================================================
            LEARNING OBJECTIVES
            ========================================================

            What the learner should gain from this resource.
            */

            learningObjectives: {

                type: [
                    String
                ],

                default:
                    []
            },


            /*
            ========================================================
            PREREQUISITES
            ========================================================
            */

            prerequisites: {

                type: [
                    String
                ],

                default:
                    []
            },


            /*
            ========================================================
            VERIFIED RESOURCE
            ========================================================

            Prevents unverified / hallucinated links from being
            recommended as trusted resources.
            */

            isVerified: {

                type:
                    Boolean,

                default:
                    false,

                index:
                    true
            },


            /*
            ========================================================
            LAST VERIFIED
            ========================================================

            Later we can periodically check URLs and update this.
            */

            lastVerifiedAt: {

                type:
                    Date,

                default:
                    null
            },


            /*
            ========================================================
            ACTIVE
            ========================================================

            Allows disabling broken or outdated resources without
            deleting historical data.
            */

            isActive: {

                type:
                    Boolean,

                default:
                    true,

                index:
                    true
            },


            /*
            ========================================================
            RESOURCE METADATA
            ========================================================

            Flexible field for future integrations.

            YouTube example:

            {
                channelTitle: "...",
                publishedAt: "...",
                viewCount: 100000
            }

            Course example:

            {
                instructor: "...",
                certificateAvailable: true
            }
            */

            metadata: {

                type:
                    mongoose.Schema.Types.Mixed,

                default:
                    {}
            }
        },


        /*
        ============================================================
        OPTIONS
        ============================================================
        */

        {
            timestamps:
                true
        }
    );


/*
============================================================
NORMALIZE DATA BEFORE SAVE
============================================================
*/

learningResourceSchema.pre(
    "save",

    function (
        next
    ) {

        /*
        --------------------------------------------------------
        Normalize tags
        --------------------------------------------------------
        */

        if (
            Array.isArray(
                this.tags
            )
        ) {

            this.tags =
                [
                    ...new Set(

                        this.tags

                            .map(
                                (tag) =>
                                    String(
                                        tag
                                    )
                                        .trim()
                                        .toLowerCase()
                            )

                            .filter(
                                Boolean
                            )
                    )
                ];
        }


        /*
        --------------------------------------------------------
        Normalize topic
        --------------------------------------------------------
        */

        if (
            this.topic
        ) {

            this.topic =
                this.topic.trim();
        }


        /*
        --------------------------------------------------------
        Normalize provider
        --------------------------------------------------------
        */

        if (
            this.provider
        ) {

            this.provider =
                this.provider.trim();
        }


        next();
    }
);


/*
============================================================
INDEXES
============================================================
*/


/*
------------------------------------------------------------
Primary recommendation lookup

Example:

SQL + intermediate + practice + active + verified
------------------------------------------------------------
*/

learningResourceSchema.index(
    {
        skill:
            1,

        level:
            1,

        type:
            1,

        isVerified:
            1,

        isActive:
            1,

        qualityScore:
            -1
    }
);


/*
------------------------------------------------------------
Topic lookup
------------------------------------------------------------
*/

learningResourceSchema.index(
    {
        skill:
            1,

        topic:
            1,

        isActive:
            1
    }
);


/*
------------------------------------------------------------
Tag search
------------------------------------------------------------
*/

learningResourceSchema.index(
    {
        tags:
            1
    }
);


/*
------------------------------------------------------------
Prevent exact same URL being inserted repeatedly.

Using unique URL gives us a clean resource catalog.

If later you intentionally need the same URL associated
with multiple skills, we can switch this to a compound
index instead.
------------------------------------------------------------
*/

learningResourceSchema.index(
    {
        url:
            1
    },

    {
        unique:
            true
    }
);


/*
------------------------------------------------------------
YouTube / external API lookup
------------------------------------------------------------
*/

learningResourceSchema.index(
    {
        source:
            1,

        externalId:
            1
    }
);


/*
============================================================
STATIC: FIND RECOMMENDED RESOURCES
============================================================

This gives us a useful reusable query immediately.

Later learningResourceService.js will contain the more
advanced ranking logic.
============================================================
*/

learningResourceSchema.statics.findRecommendedResources =
    async function ({
        skillId,
        level,
        type,
        limit = 10
    }) {

        const filter = {

            skill:
                skillId,

            isActive:
                true,

            isVerified:
                true
        };


        /*
        --------------------------------------------------------
        Difficulty
        --------------------------------------------------------

        "all" resources should always be eligible.
        */

        if (
            level
        ) {

            filter.level = {

                $in: [
                    level,
                    "all"
                ]
            };
        }


        /*
        --------------------------------------------------------
        Type
        --------------------------------------------------------
        */

        if (
            type
        ) {

            filter.type =
                type;
        }


        return this
            .find(
                filter
            )
            .sort({

                qualityScore:
                    -1,

                createdAt:
                    -1
            })
            .limit(
                Math.min(
                    Number(
                        limit
                    ) || 10,

                    50
                )
            )
            .lean();
    };


/*
============================================================
STATIC: FIND BY TOPIC
============================================================
*/

learningResourceSchema.statics.findByTopic =
    async function ({
        skillId,
        topic,
        limit = 10
    }) {

        if (
            !skillId ||
            !topic
        ) {

            return [];
        }


        return this
            .find({

                skill:
                    skillId,

                topic: {

                    $regex:
                        topic,

                    $options:
                        "i"
                },

                isActive:
                    true,

                isVerified:
                    true
            })
            .sort({

                qualityScore:
                    -1
            })
            .limit(
                Math.min(
                    Number(
                        limit
                    ) || 10,

                    50
                )
            )
            .lean();
    };


/*
============================================================
EXPORT
============================================================
*/

module.exports =
    mongoose.model(
        "LearningResource",
        learningResourceSchema
    );