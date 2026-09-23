const mongoose = require("mongoose");
require("dotenv").config();

const Skill =
    require("./models/Skill");

const LearningResource =
    require("./models/LearningResource");

const learningResources =
    require("../data/learningResources.json");


/*
============================================================
CONFIGURATION
============================================================
*/

const VALID_LEVELS =
    new Set([
        "beginner",
        "intermediate",
        "advanced",
        "all"
    ]);


const VALID_TYPES =
    new Set([
        "youtube",
        "documentation",
        "course",
        "practice",
        "article",
        "project",
        "interview"
    ]);


const VALID_SOURCES =
    new Set([
        "curated",
        "youtube-api",
        "external-api"
    ]);


/*
============================================================
SKILL ALIASES
============================================================

These help if your Skill collection uses slightly different
names.

Examples:

JSON:
    "Data Structures and Algorithms"

Database:
    "DSA"

Both can still resolve to the same skill.

You can add more aliases later.
============================================================
*/

const SKILL_ALIASES = {

    dsa:
        "data structures and algorithms",

    "data structures & algorithms":
        "data structures and algorithms",

    algorithms:
        "data structures and algorithms",

    node:
        "node.js",

    nodejs:
        "node.js",

    "node js":
        "node.js",

    reactjs:
        "react",

    "react.js":
        "react",

    javascript:
        "javascript",

    js:
        "javascript",

    python3:
        "python",

    "python 3":
        "python",

    mongodb:
        "mongodb",

    mongo:
        "mongodb",

    "powerbi":
        "power bi",

    "power-bi":
        "power bi",

    "data analytics":
        "data analysis",

    "data-analysis":
        "data analysis",

    visualization:
        "data visualization",

    "data visualisation":
        "data visualization",

    gitgithub:
        "git",

    github:
        "git"
};


/*
============================================================
NORMALIZE TEXT
============================================================
*/

const normalizeText = (
    value
) => {

    return String(
        value || ""
    )
        .trim()
        .replace(
            /\s+/g,
            " "
        );
};


/*
============================================================
NORMALIZE SKILL NAME
============================================================
*/

const normalizeSkillName = (
    value
) => {

    let normalized =
        normalizeText(
            value
        )
            .toLowerCase();


    if (
        SKILL_ALIASES[
            normalized
        ]
    ) {

        normalized =
            SKILL_ALIASES[
                normalized
            ];
    }


    return normalized;
};


/*
============================================================
NORMALIZE TAG
============================================================
*/

const normalizeTag = (
    value
) => {

    return normalizeText(
        value
    )
        .toLowerCase();
};


/*
============================================================
NORMALIZE STRING ARRAY
============================================================
*/

const normalizeStringArray = (
    value
) => {

    if (
        !Array.isArray(
            value
        )
    ) {

        return [];
    }


    return [
        ...new Set(

            value
                .map(
                    (item) =>
                        normalizeText(
                            item
                        )
                )
                .filter(
                    Boolean
                )
        )
    ];
};


/*
============================================================
NORMALIZE TAGS
============================================================
*/

const normalizeTags = (
    value
) => {

    if (
        !Array.isArray(
            value
        )
    ) {

        return [];
    }


    return [
        ...new Set(

            value
                .map(
                    normalizeTag
                )
                .filter(
                    Boolean
                )
        )
    ];
};


/*
============================================================
VALIDATE URL
============================================================
*/

const isValidHttpUrl = (
    value
) => {

    try {

        const parsed =
            new URL(
                value
            );


        return (
            parsed.protocol ===
                "http:" ||

            parsed.protocol ===
                "https:"
        );


    } catch (
        error
    ) {

        return false;
    }
};


/*
============================================================
CLAMP NUMBER
============================================================
*/

const clampNumber = (
    value,
    minimum,
    maximum,
    fallback
) => {

    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return fallback;
    }


    return Math.max(
        minimum,
        Math.min(
            maximum,
            number
        )
    );
};


/*
============================================================
CREATE SKILL LOOKUP
============================================================
*/

const createSkillLookup = (
    skills
) => {

    const lookup =
        new Map();


    skills.forEach(
        (skill) => {

            if (
                !skill?.name ||
                !skill?._id
            ) {

                return;
            }


            const normalizedName =
                normalizeSkillName(
                    skill.name
                );


            lookup.set(
                normalizedName,
                skill
            );


            /*
            Also map the literal database
            name without alias conversion.
            */

            lookup.set(

                normalizeText(
                    skill.name
                )
                    .toLowerCase(),

                skill
            );
        }
    );


    return lookup;
};


/*
============================================================
RESOLVE SKILL
============================================================
*/

const resolveSkill = (
    skillName,
    skillLookup
) => {

    const normalized =
        normalizeSkillName(
            skillName
        );


    /*
    Exact normalized match.
    */

    if (
        skillLookup.has(
            normalized
        )
    ) {

        return skillLookup.get(
            normalized
        );
    }


    /*
    Secondary comparison.

    Useful if aliases have transformed either side.
    */

    for (
        const [
            key,
            skill
        ]
        of skillLookup.entries()
    ) {

        if (
            normalizeSkillName(
                key
            ) ===
            normalized
        ) {

            return skill;
        }
    }


    return null;
};


/*
============================================================
VALIDATE RESOURCE
============================================================
*/

const validateResource = (
    item,
    index
) => {

    const errors =
        [];


    if (
        !normalizeText(
            item?.skill
        )
    ) {

        errors.push(
            "skill is missing"
        );
    }


    if (
        !normalizeText(
            item?.topic
        )
    ) {

        errors.push(
            "topic is missing"
        );
    }


    if (
        !normalizeText(
            item?.title
        )
    ) {

        errors.push(
            "title is missing"
        );
    }


    if (
        !normalizeText(
            item?.provider
        )
    ) {

        errors.push(
            "provider is missing"
        );
    }


    const url =
        normalizeText(
            item?.url
        );


    if (
        !url
    ) {

        errors.push(
            "url is missing"
        );

    } else if (
        !isValidHttpUrl(
            url
        )
    ) {

        errors.push(
            "url is invalid"
        );
    }


    const level =
        normalizeText(
            item?.level ||
            "beginner"
        )
            .toLowerCase();


    if (
        !VALID_LEVELS.has(
            level
        )
    ) {

        errors.push(
            `invalid level "${item?.level}"`
        );
    }


    const type =
        normalizeText(
            item?.type
        )
            .toLowerCase();


    if (
        !VALID_TYPES.has(
            type
        )
    ) {

        errors.push(
            `invalid type "${item?.type}"`
        );
    }


    const source =
        normalizeText(
            item?.source ||
            "curated"
        )
            .toLowerCase();


    if (
        !VALID_SOURCES.has(
            source
        )
    ) {

        errors.push(
            `invalid source "${item?.source}"`
        );
    }


    return {
        valid:
            errors.length ===
            0,

        errors,

        index
    };
};


/*
============================================================
BUILD DATABASE RESOURCE
============================================================
*/

const buildResourceDocument = (
    item,
    skill
) => {

    return {

        /*
        --------------------------------------------------------
        RELATIONSHIP
        --------------------------------------------------------
        */

        skill:
            skill._id,


        /*
        --------------------------------------------------------
        CORE RESOURCE DATA
        --------------------------------------------------------
        */

        topic:
            normalizeText(
                item.topic
            ),

        level:
            normalizeText(
                item.level ||
                "beginner"
            )
                .toLowerCase(),

        type:
            normalizeText(
                item.type
            )
                .toLowerCase(),

        title:
            normalizeText(
                item.title
            ),

        description:
            normalizeText(
                item.description
            ),

        provider:
            normalizeText(
                item.provider
            ),

        url:
            normalizeText(
                item.url
            ),


        /*
        --------------------------------------------------------
        MEDIA
        --------------------------------------------------------
        */

        thumbnailUrl:
            normalizeText(
                item.thumbnailUrl
            ),

        externalId:
            normalizeText(
                item.externalId
            ),


        /*
        --------------------------------------------------------
        SOURCE
        --------------------------------------------------------
        */

        source:
            normalizeText(
                item.source ||
                "curated"
            )
                .toLowerCase(),


        /*
        --------------------------------------------------------
        RESOURCE DETAILS
        --------------------------------------------------------
        */

        duration:
            normalizeText(
                item.duration
            ),

        language:
            normalizeText(
                item.language ||
                "English"
            ),

        isFree:
            item.isFree !==
            false,


        /*
        --------------------------------------------------------
        QUALITY
        --------------------------------------------------------
        */

        qualityScore:
            clampNumber(

                item.qualityScore,

                0,

                100,

                75
            ),


        /*
        --------------------------------------------------------
        TAGS
        --------------------------------------------------------
        */

        tags:
            normalizeTags(
                item.tags
            ),


        /*
        --------------------------------------------------------
        LEARNING INFORMATION
        --------------------------------------------------------
        */

        learningObjectives:
            normalizeStringArray(
                item.learningObjectives
            ),

        prerequisites:
            normalizeStringArray(
                item.prerequisites
            ),


        /*
        --------------------------------------------------------
        VERIFICATION
        --------------------------------------------------------

        IMPORTANT:

        This copies the verification status from our curated
        dataset.

        It does NOT make an external HTTP request to verify
        that the URL is currently live.

        Later we can build a URL verification service.
        --------------------------------------------------------
        */

        isVerified:
            Boolean(
                item.isVerified
            ),

        lastVerifiedAt:
            item.isVerified
                ? new Date()
                : null,


        /*
        --------------------------------------------------------
        ACTIVE
        --------------------------------------------------------
        */

        isActive:
            item.isActive !==
            false,


        /*
        --------------------------------------------------------
        METADATA
        --------------------------------------------------------
        */

        metadata:

            item.metadata &&
            typeof item.metadata ===
                "object" &&
            !Array.isArray(
                item.metadata
            )

                ? item.metadata

                : {}
    };
};


/*
============================================================
SEED LEARNING RESOURCES
============================================================
*/

const seedLearningResources =
    async () => {

        let connected =
            false;


        try {

            /*
            ========================================================
            CHECK ENVIRONMENT
            ========================================================
            */

            if (
                !process.env
                    .MONGODB_URI
            ) {

                throw new Error(
                    "MONGODB_URI is missing from the environment."
                );
            }


            /*
            ========================================================
            CONNECT
            ========================================================
            */

            console.log(
                "\n========================================"
            );

            console.log(
                "LEARNING RESOURCE SEED"
            );

            console.log(
                "========================================\n"
            );


            await mongoose.connect(
                process.env.MONGODB_URI
            );


            connected =
                true;


            console.log(
                "✅ MongoDB connected\n"
            );


            /*
            ========================================================
            CHECK JSON
            ========================================================
            */

            if (
                !Array.isArray(
                    learningResources
                )
            ) {

                throw new Error(
                    "learningResources.json must contain a JSON array."
                );
            }


            console.log(
                `Resources in JSON: ${learningResources.length}`
            );


            /*
            ========================================================
            LOAD SKILLS
            ========================================================
            */

            const skills =
                await Skill.find({

                    /*
                    Include existing skills where
                    isActive is either true or absent.
                    */

                    isActive: {
                        $ne:
                            false
                    }
                })
                .select(
                    "_id name isActive"
                )
                .lean();


            if (
                skills.length ===
                0
            ) {

                throw new Error(
                    "No active skills were found. Seed your skills before learning resources."
                );
            }


            console.log(
                `Skills available: ${skills.length}\n`
            );


            const skillLookup =
                createSkillLookup(
                    skills
                );


            /*
            ========================================================
            STATISTICS
            ========================================================
            */

            const stats = {

                inserted:
                    0,

                updated:
                    0,

                skipped:
                    0,

                failed:
                    0,

                missingSkills:
                    new Set(),

                seededSkills:
                    new Set()
            };


            /*
            ========================================================
            PROCESS RESOURCES
            ========================================================
            */

            for (
                let index = 0;
                index <
                    learningResources.length;
                index++
            ) {

                const item =
                    learningResources[
                        index
                    ];


                const itemNumber =
                    index + 1;


                /*
                ----------------------------------------------------
                BASIC VALIDATION
                ----------------------------------------------------
                */

                const validation =
                    validateResource(
                        item,
                        index
                    );


                if (
                    !validation.valid
                ) {

                    stats.skipped++;


                    console.log(
                        `\n⚠️  [${itemNumber}] SKIPPED`
                    );

                    console.log(
                        `Title: ${item?.title || "Unknown"}`
                    );

                    console.log(
                        "Reason:",
                        validation.errors.join(
                            ", "
                        )
                    );


                    continue;
                }


                /*
                ----------------------------------------------------
                FIND SKILL
                ----------------------------------------------------
                */

                const skill =
                    resolveSkill(
                        item.skill,
                        skillLookup
                    );


                if (
                    !skill
                ) {

                    stats.skipped++;


                    stats
                        .missingSkills
                        .add(
                            item.skill
                        );


                    console.log(
                        `\n⚠️  [${itemNumber}] SKIPPED`
                    );

                    console.log(
                        `Resource: ${item.title}`
                    );

                    console.log(
                        `Skill not found: ${item.skill}`
                    );


                    continue;
                }


                /*
                ----------------------------------------------------
                BUILD RESOURCE
                ----------------------------------------------------
                */

                const resourceData =
                    buildResourceDocument(
                        item,
                        skill
                    );


                try {

                    /*
                    ------------------------------------------------
                    CHECK EXISTING RESOURCE

                    URL is unique in LearningResource.js.
                    ------------------------------------------------
                    */

                    const existingResource =
                        await LearningResource
                            .findOne({

                                url:
                                    resourceData.url
                            })
                            .select(
                                "_id url"
                            )
                            .lean();


                    /*
                    ------------------------------------------------
                    UPSERT

                    runValidators is important because this seed
                    must obey LearningResource.js validation.

                    We normalize tags ourselves because save
                    middleware does not reliably apply to update
                    operations.
                    ------------------------------------------------
                    */

                    await LearningResource
                        .findOneAndUpdate(

                            {
                                url:
                                    resourceData.url
                            },

                            {
                                $set:
                                    resourceData,

                                $setOnInsert: {

                                    createdAt:
                                        new Date()
                                }
                            },

                            {
                                new:
                                    true,

                                upsert:
                                    true,

                                runValidators:
                                    true,

                                setDefaultsOnInsert:
                                    true
                            }
                        );


                    /*
                    ------------------------------------------------
                    STATS
                    ------------------------------------------------
                    */

                    if (
                        existingResource
                    ) {

                        stats.updated++;


                        console.log(
                            `🔄 [${itemNumber}] Updated: ${resourceData.title}`
                        );

                    } else {

                        stats.inserted++;


                        console.log(
                            `✅ [${itemNumber}] Inserted: ${resourceData.title}`
                        );
                    }


                    stats
                        .seededSkills
                        .add(
                            skill.name
                        );


                } catch (
                    resourceError
                ) {

                    stats.failed++;


                    console.error(
                        `\n❌ [${itemNumber}] FAILED`
                    );

                    console.error(
                        `Resource: ${item.title}`
                    );

                    console.error(
                        `Skill: ${item.skill}`
                    );

                    console.error(
                        `Error: ${resourceError.message}`
                    );
                }
            }


            /*
            ========================================================
            DATABASE TOTAL
            ========================================================
            */

            const totalDatabaseResources =
                await LearningResource
                    .countDocuments({
                        isActive:
                            true
                    });


            const verifiedResources =
                await LearningResource
                    .countDocuments({

                        isActive:
                            true,

                        isVerified:
                            true
                    });


            /*
            ========================================================
            RESULT SUMMARY
            ========================================================
            */

            console.log(
                "\n========================================"
            );

            console.log(
                "LEARNING RESOURCE SEED COMPLETE"
            );

            console.log(
                "========================================"
            );


            console.log(
                `Inserted: ${stats.inserted}`
            );

            console.log(
                `Updated:  ${stats.updated}`
            );

            console.log(
                `Skipped:  ${stats.skipped}`
            );

            console.log(
                `Failed:   ${stats.failed}`
            );


            console.log(
                "\nDatabase:"
            );

            console.log(
                `Active resources:   ${totalDatabaseResources}`
            );

            console.log(
                `Verified resources: ${verifiedResources}`
            );


            /*
            ========================================================
            SEEDED SKILLS
            ========================================================
            */

            const seededSkills =
                Array.from(
                    stats.seededSkills
                )
                    .sort();


            if (
                seededSkills.length >
                0
            ) {

                console.log(
                    "\nResources available for:"
                );


                seededSkills.forEach(
                    (skillName) => {

                        console.log(
                            `  ✓ ${skillName}`
                        );
                    }
                );
            }


            /*
            ========================================================
            MISSING SKILLS
            ========================================================
            */

            const missingSkills =
                Array.from(
                    stats.missingSkills
                )
                    .sort();


            if (
                missingSkills.length >
                0
            ) {

                console.log(
                    "\n⚠️ Resources skipped because these Skill documents do not exist:"
                );


                missingSkills.forEach(
                    (skillName) => {

                        console.log(
                            `  - ${skillName}`
                        );
                    }
                );


                console.log(
                    "\nAdd those skills to skills.json / MongoDB and rerun this seeder."
                );
            }


            console.log(
                "\n========================================\n"
            );


            /*
            ========================================================
            EXIT STATUS
            ========================================================

            Individual bad resources do not destroy the successfully
            seeded ones, but failures produce a non-zero exit code.
            */

            if (
                stats.failed >
                0
            ) {

                process.exitCode =
                    1;
            }


        } catch (
            error
        ) {

            console.error(
                "\n❌ LEARNING RESOURCE SEED ERROR"
            );

            console.error(
                error
            );


            process.exitCode =
                1;


        } finally {

            /*
            ========================================================
            DISCONNECT
            ========================================================
            */

            if (
                connected
            ) {

                try {

                    await mongoose.disconnect();


                    console.log(
                        "MongoDB disconnected"
                    );


                } catch (
                    disconnectError
                ) {

                    console.error(
                        "MongoDB disconnect error:",
                        disconnectError.message
                    );
                }
            }
        }
    };


/*
============================================================
RUN
============================================================
*/

seedLearningResources();