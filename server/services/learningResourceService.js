const mongoose = require("mongoose");

const LearningResource =
    require("../models/LearningResource");

const Skill =
    require("../models/Skill");


/*
============================================================
LEARNING RESOURCE SERVICE
============================================================

Responsibilities:

1. Resolve Skill names / IDs
2. Determine suitable learning difficulty
3. Fetch only active + verified resources
4. Match resources against recommended topics
5. Rank resources using relevance + quality
6. Return a balanced mix of:
   - YouTube
   - Documentation
   - Courses
   - Practice
   - Articles
   - Projects
   - Interview preparation

============================================================
*/


/*
============================================================
CONSTANTS
============================================================
*/

const RESOURCE_TYPES = [
    "youtube",
    "documentation",
    "course",
    "practice",
    "article",
    "project",
    "interview"
];


const DEFAULT_RESOURCE_TYPE_ORDER = [
    "youtube",
    "documentation",
    "course",
    "practice",
    "project",
    "article",
    "interview"
];


const VALID_LEVELS =
    new Set([
        "beginner",
        "intermediate",
        "advanced",
        "all"
    ]);


/*
============================================================
SKILL ALIASES
============================================================

Keep this aligned with the aliases used by the seeder.

This protects us from differences such as:

DSA
Data Structures and Algorithms

Node
Node.js

PowerBI
Power BI
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

    js:
        "javascript",

    javascript:
        "javascript",

    python3:
        "python",

    "python 3":
        "python",

    mongo:
        "mongodb",

    mongodb:
        "mongodb",

    powerbi:
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

    github:
        "git",

    gitgithub:
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

    let name =
        normalizeText(
            value
        )
            .toLowerCase();


    if (
        SKILL_ALIASES[
            name
        ]
    ) {

        name =
            SKILL_ALIASES[
                name
            ];
    }


    return name;
};


/*
============================================================
NORMALIZE TOPICS
============================================================
*/

const normalizeTopics = (
    topics
) => {

    if (
        !Array.isArray(
            topics
        )
    ) {

        return [];
    }


    return [
        ...new Set(

            topics

                .map(
                    (topic) =>
                        normalizeText(
                            topic
                        )
                            .toLowerCase()
                )

                .filter(
                    Boolean
                )
        )
    ];
};


/*
============================================================
SAFE NUMBER
============================================================
*/

const safeNumber = (
    value,
    fallback = 0
) => {

    const number =
        Number(
            value
        );


    return Number.isFinite(
        number
    )
        ? number
        : fallback;
};


/*
============================================================
CLAMP SCORE
============================================================
*/

const clampScore = (
    value
) => {

    return Math.max(
        0,
        Math.min(
            100,
            safeNumber(
                value
            )
        )
    );
};


/*
============================================================
ESCAPE REGEX
============================================================
*/

const escapeRegex = (
    value
) => {

    return String(
        value || ""
    )
        .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );
};


/*
============================================================
CREATE SERVICE ERROR
============================================================
*/

const createServiceError = (
    message,
    statusCode = 500,
    code = "LEARNING_RESOURCE_ERROR"
) => {

    const error =
        new Error(
            message
        );


    error.statusCode =
        statusCode;

    error.code =
        code;


    return error;
};


/*
============================================================
DETERMINE LEARNING LEVEL FROM SCORE
============================================================

Example:

0 - 39
    beginner

40 - 69
    intermediate

70 - 100
    advanced

This represents which learning material should be useful
for the user's current performance.

============================================================
*/

const determineLearningLevel = (
    currentScore
) => {

    const score =
        clampScore(
            currentScore
        );


    if (
        score < 40
    ) {

        return "beginner";
    }


    if (
        score < 70
    ) {

        return "intermediate";
    }


    return "advanced";
};


/*
============================================================
ELIGIBLE RESOURCE LEVELS
============================================================

Intermediate learners can still receive selected beginner
material when it is highly relevant.

Advanced learners can receive intermediate prerequisites.

"all" is always available.
============================================================
*/

const getEligibleLevels = (
    level
) => {

    switch (
        level
    ) {

        case "advanced":

            return [
                "advanced",
                "intermediate",
                "all"
            ];


        case "intermediate":

            return [
                "intermediate",
                "beginner",
                "all"
            ];


        case "beginner":
        default:

            return [
                "beginner",
                "all"
            ];
    }
};


/*
============================================================
RESOLVE SKILL
============================================================

Accepts:

1. MongoDB ObjectId
2. Object:
   {
       _id,
       name
   }

3. Skill name:
   "SQL"

4. Alias:
   "DSA"

============================================================
*/

const resolveSkill =
    async (
        skillInput
    ) => {

        if (
            !skillInput
        ) {

            throw createServiceError(
                "Skill is required.",
                400,
                "SKILL_REQUIRED"
            );
        }


        /*
        --------------------------------------------------------
        OBJECT INPUT
        --------------------------------------------------------
        */

        if (
            typeof skillInput ===
                "object" &&
            skillInput !==
                null
        ) {

            const objectId =

                skillInput._id ||
                skillInput.id;


            if (
                objectId &&
                mongoose.Types.ObjectId
                    .isValid(
                        objectId
                    )
            ) {

                const skill =
                    await Skill
                        .findOne({

                            _id:
                                objectId,

                            isActive: {
                                $ne:
                                    false
                            }
                        })
                        .select(
                            "_id name"
                        )
                        .lean();


                if (
                    skill
                ) {

                    return skill;
                }
            }


            if (
                skillInput.name
            ) {

                return resolveSkill(
                    skillInput.name
                );
            }
        }


        /*
        --------------------------------------------------------
        OBJECT ID INPUT
        --------------------------------------------------------
        */

        if (
            mongoose.Types.ObjectId
                .isValid(
                    String(
                        skillInput
                    )
                )
        ) {

            const skill =
                await Skill
                    .findOne({

                        _id:
                            skillInput,

                        isActive: {
                            $ne:
                                false
                        }
                    })
                    .select(
                        "_id name"
                    )
                    .lean();


            if (
                skill
            ) {

                return skill;
            }
        }


        /*
        --------------------------------------------------------
        NAME INPUT
        --------------------------------------------------------
        */

        const requestedName =
            normalizeSkillName(
                skillInput
            );


        if (
            !requestedName
        ) {

            throw createServiceError(
                "Skill name is invalid.",
                400,
                "INVALID_SKILL"
            );
        }


        /*
        Fetch skills and perform alias-aware comparison.

        Number of Skills in this project is small enough that
        this is safe and protects against naming differences.
        */

        const skills =
            await Skill
                .find({

                    isActive: {
                        $ne:
                            false
                    }
                })
                .select(
                    "_id name"
                )
                .lean();


        const skill =
            skills.find(
                (item) => {

                    return (
                        normalizeSkillName(
                            item.name
                        ) ===
                        requestedName
                    );
                }
            );


        if (
            !skill
        ) {

            throw createServiceError(
                `Skill "${skillInput}" was not found.`,
                404,
                "SKILL_NOT_FOUND"
            );
        }


        return skill;
    };


/*
============================================================
TOPIC MATCH SCORE
============================================================
*/

const calculateTopicMatchScore = (
    resource,
    topics
) => {

    if (
        !topics.length
    ) {

        return 0;
    }


    const resourceTopic =
        normalizeText(
            resource?.topic
        )
            .toLowerCase();


    const title =
        normalizeText(
            resource?.title
        )
            .toLowerCase();


    const description =
        normalizeText(
            resource?.description
        )
            .toLowerCase();


    const tags =
        Array.isArray(
            resource?.tags
        )
            ? resource.tags
                .map(
                    (tag) =>
                        normalizeText(
                            tag
                        )
                            .toLowerCase()
                )

            : [];


    let score =
        0;


    topics.forEach(
        (topic) => {

            /*
            Exact resource topic.
            */

            if (
                resourceTopic ===
                topic
            ) {

                score +=
                    35;

                return;
            }


            /*
            Resource topic contains recommended topic.
            */

            if (
                resourceTopic.includes(
                    topic
                ) ||
                topic.includes(
                    resourceTopic
                )
            ) {

                score +=
                    25;
            }


            /*
            Tag match.
            */

            if (
                tags.some(
                    (tag) =>
                        tag ===
                            topic ||
                        tag.includes(
                            topic
                        ) ||
                        topic.includes(
                            tag
                        )
                )
            ) {

                score +=
                    15;
            }


            /*
            Title match.
            */

            if (
                title.includes(
                    topic
                )
            ) {

                score +=
                    10;
            }


            /*
            Description match.
            */

            if (
                description.includes(
                    topic
                )
            ) {

                score +=
                    5;
            }
        }
    );


    return Math.min(
        score,
        60
    );
};


/*
============================================================
LEVEL MATCH SCORE
============================================================
*/

const calculateLevelScore = (
    resourceLevel,
    targetLevel
) => {

    if (
        resourceLevel ===
        targetLevel
    ) {

        return 25;
    }


    if (
        resourceLevel ===
        "all"
    ) {

        return 18;
    }


    /*
    Prerequisite resources.
    */

    if (
        targetLevel ===
            "intermediate" &&
        resourceLevel ===
            "beginner"
    ) {

        return 9;
    }


    if (
        targetLevel ===
            "advanced" &&
        resourceLevel ===
            "intermediate"
    ) {

        return 12;
    }


    return 0;
};


/*
============================================================
TYPE MATCH SCORE
============================================================
*/

const calculateTypeScore = (
    resourceType,
    preferredTypes
) => {

    if (
        !preferredTypes.length
    ) {

        return 0;
    }


    const index =
        preferredTypes.indexOf(
            resourceType
        );


    if (
        index === -1
    ) {

        return 0;
    }


    /*
    Earlier preferred types receive more weight.
    */

    return Math.max(
        3,
        12 - index * 2
    );
};


/*
============================================================
CALCULATE RESOURCE RANK
============================================================
*/

const calculateResourceRank = (
    resource,
    {
        targetLevel,
        topics,
        preferredTypes
    }
) => {

    /*
    Quality represents our curated internal ranking.
    Scale it so it does not overpower relevance.
    */

    const qualityScore =
        clampScore(
            resource?.qualityScore
        ) * 0.35;


    const topicScore =
        calculateTopicMatchScore(
            resource,
            topics
        );


    const levelScore =
        calculateLevelScore(
            resource?.level,
            targetLevel
        );


    const typeScore =
        calculateTypeScore(
            resource?.type,
            preferredTypes
        );


    const verifiedBonus =
        resource?.isVerified
            ? 10
            : 0;


    const freeBonus =
        resource?.isFree
            ? 3
            : 0;


    return Number(
        (
            qualityScore +
            topicScore +
            levelScore +
            typeScore +
            verifiedBonus +
            freeBonus
        )
        .toFixed(
            2
        )
    );
};


/*
============================================================
PUBLIC RESOURCE FORMAT
============================================================

Do not return unnecessary internal MongoDB fields.

============================================================
*/

const formatResource = (
    resource
) => {

    return {

        id:
            resource._id,

        skill:
            resource.skill,

        topic:
            resource.topic,

        level:
            resource.level,

        type:
            resource.type,

        title:
            resource.title,

        description:
            resource.description || "",

        provider:
            resource.provider,

        url:
            resource.url,

        thumbnailUrl:
            resource.thumbnailUrl || "",

        externalId:
            resource.externalId || "",

        duration:
            resource.duration || "",

        language:
            resource.language || "English",

        isFree:
            resource.isFree !==
            false,

        qualityScore:
            safeNumber(
                resource.qualityScore,
                0
            ),

        tags:
            Array.isArray(
                resource.tags
            )
                ? resource.tags
                : [],

        learningObjectives:
            Array.isArray(
                resource.learningObjectives
            )
                ? resource.learningObjectives
                : [],

        prerequisites:
            Array.isArray(
                resource.prerequisites
            )
                ? resource.prerequisites
                : [],

        source:
            resource.source || "curated",

        metadata:
            resource.metadata || {}
    };
};


/*
============================================================
BALANCED RESOURCE SELECTION
============================================================

Instead of returning:

YouTube
YouTube
YouTube
YouTube
YouTube

we try to return:

YouTube
Documentation
Course
Practice
Project

============================================================
*/

const selectBalancedResources = (
    rankedResources,
    {
        preferredTypes,
        totalLimit,
        limitPerType
    }
) => {

    const selected =
        [];


    const selectedIds =
        new Set();


    /*
    Preferred order first.
    */

    preferredTypes.forEach(
        (type) => {

            const matching =
                rankedResources

                    .filter(
                        (item) =>
                            item.type ===
                            type
                    )

                    .slice(
                        0,
                        limitPerType
                    );


            matching.forEach(
                (resource) => {

                    const id =
                        String(
                            resource._id
                        );


                    if (
                        selectedIds.has(
                            id
                        )
                    ) {

                        return;
                    }


                    if (
                        selected.length >=
                        totalLimit
                    ) {

                        return;
                    }


                    selected.push(
                        resource
                    );


                    selectedIds.add(
                        id
                    );
                }
            );
        }
    );


    /*
    Fill any remaining slots using overall score.
    */

    if (
        selected.length <
        totalLimit
    ) {

        rankedResources.forEach(
            (resource) => {

                if (
                    selected.length >=
                    totalLimit
                ) {

                    return;
                }


                const id =
                    String(
                        resource._id
                    );


                if (
                    selectedIds.has(
                        id
                    )
                ) {

                    return;
                }


                selected.push(
                    resource
                );


                selectedIds.add(
                    id
                );
            }
        );
    }


    /*
    Keep final selected resources ordered by rank.
    */

    return selected.sort(
        (a, b) =>
            safeNumber(
                b.relevanceScore
            ) -
            safeNumber(
                a.relevanceScore
            )
    );
};


/*
============================================================
GROUP RESOURCES BY TYPE
============================================================
*/

const groupResourcesByType = (
    resources
) => {

    const grouped = {

        youtube:
            [],

        documentation:
            [],

        course:
            [],

        practice:
            [],

        article:
            [],

        project:
            [],

        interview:
            []
    };


    resources.forEach(
        (resource) => {

            if (
                grouped[
                    resource.type
                ]
            ) {

                grouped[
                    resource.type
                ].push(
                    resource
                );
            }
        }
    );


    return grouped;
};


/*
============================================================
GET RECOMMENDED RESOURCES
============================================================

Main function.

Example:

getRecommendedResources({
    skill: "SQL",
    currentScore: 45,
    topics: [
        "Joins",
        "Window Functions",
        "CTEs"
    ]
});

============================================================
*/

const getRecommendedResources =
    async ({
        skill,
        skillId,
        skillName,

        currentScore = 0,

        level = null,

        topics = [],

        preferredTypes =
            DEFAULT_RESOURCE_TYPE_ORDER,

        totalLimit = 10,

        limitPerType = 2,

        includePaid = false
    }) => {

        /*
        --------------------------------------------------------
        RESOLVE SKILL
        --------------------------------------------------------
        */

        const resolvedSkill =
            await resolveSkill(

                skill ||
                skillId ||
                skillName
            );


        /*
        --------------------------------------------------------
        SCORE / LEVEL
        --------------------------------------------------------
        */

        const score =
            clampScore(
                currentScore
            );


        let targetLevel =
            level
                ? normalizeText(
                    level
                )
                    .toLowerCase()

                : determineLearningLevel(
                    score
                );


        if (
            !VALID_LEVELS.has(
                targetLevel
            ) ||
            targetLevel ===
                "all"
        ) {

            targetLevel =
                determineLearningLevel(
                    score
                );
        }


        const eligibleLevels =
            getEligibleLevels(
                targetLevel
            );


        /*
        --------------------------------------------------------
        NORMALIZE TOPICS
        --------------------------------------------------------
        */

        const normalizedTopics =
            normalizeTopics(
                topics
            );


        /*
        --------------------------------------------------------
        RESOURCE TYPES
        --------------------------------------------------------
        */

        const normalizedPreferredTypes =
            Array.isArray(
                preferredTypes
            )

                ? preferredTypes

                    .map(
                        (type) =>
                            normalizeText(
                                type
                            )
                                .toLowerCase()
                    )

                    .filter(
                        (type) =>
                            RESOURCE_TYPES
                                .includes(
                                    type
                                )
                    )

                : DEFAULT_RESOURCE_TYPE_ORDER;


        const finalPreferredTypes =
            normalizedPreferredTypes
                .length > 0

                ? [
                    ...new Set(
                        normalizedPreferredTypes
                    )
                ]

                : DEFAULT_RESOURCE_TYPE_ORDER;


        /*
        --------------------------------------------------------
        LIMITS
        --------------------------------------------------------
        */

        const safeTotalLimit =
            Math.min(
                30,
                Math.max(
                    1,
                    safeNumber(
                        totalLimit,
                        10
                    )
                )
            );


        const safeLimitPerType =
            Math.min(
                10,
                Math.max(
                    1,
                    safeNumber(
                        limitPerType,
                        2
                    )
                )
            );


        /*
        --------------------------------------------------------
        DATABASE FILTER
        --------------------------------------------------------
        */

        const query = {

            skill:
                resolvedSkill._id,

            isActive:
                true,

            isVerified:
                true,

            level: {
                $in:
                    eligibleLevels
            }
        };


        if (
            !includePaid
        ) {

            query.isFree =
                true;
        }


        /*
        --------------------------------------------------------
        LOAD CANDIDATES
        --------------------------------------------------------

        We intentionally load more than the final limit so the
        ranking algorithm has enough candidates.
        --------------------------------------------------------
        */

        const candidates =
            await LearningResource
                .find(
                    query
                )
                .sort({

                    qualityScore:
                        -1,

                    createdAt:
                        -1
                })
                .limit(
                    100
                )
                .lean();


        /*
        --------------------------------------------------------
        RANK RESOURCES
        --------------------------------------------------------
        */

        const ranked =
            candidates

                .map(
                    (resource) => {

                        return {

                            ...resource,

                            relevanceScore:
                                calculateResourceRank(
                                    resource,
                                    {
                                        targetLevel,
                                        topics:
                                            normalizedTopics,

                                        preferredTypes:
                                            finalPreferredTypes
                                    }
                                )
                        };
                    }
                )

                .sort(
                    (a, b) => {

                        /*
                        Relevance first.
                        */

                        const relevanceDifference =

                            safeNumber(
                                b.relevanceScore
                            ) -

                            safeNumber(
                                a.relevanceScore
                            );


                        if (
                            relevanceDifference !==
                            0
                        ) {

                            return relevanceDifference;
                        }


                        /*
                        Quality as tie breaker.
                        */

                        return (

                            safeNumber(
                                b.qualityScore
                            ) -

                            safeNumber(
                                a.qualityScore
                            )
                        );
                    }
                );


        /*
        --------------------------------------------------------
        BALANCED SELECTION
        --------------------------------------------------------
        */

        const balanced =
            selectBalancedResources(
                ranked,
                {
                    preferredTypes:
                        finalPreferredTypes,

                    totalLimit:
                        safeTotalLimit,

                    limitPerType:
                        safeLimitPerType
                }
            );


        /*
        --------------------------------------------------------
        FORMAT
        --------------------------------------------------------
        */

        const resources =
            balanced.map(
                (resource) => {

                    return {

                        ...formatResource(
                            resource
                        ),

                        relevanceScore:
                            resource
                                .relevanceScore
                    };
                }
            );


        /*
        --------------------------------------------------------
        GROUP
        --------------------------------------------------------
        */

        const byType =
            groupResourcesByType(
                resources
            );


        /*
        --------------------------------------------------------
        RESPONSE
        --------------------------------------------------------
        */

        return {

            skill: {

                id:
                    resolvedSkill._id,

                name:
                    resolvedSkill.name
            },

            currentScore:
                score,

            learningLevel:
                targetLevel,

            recommendedTopics:
                normalizedTopics,

            totalResources:
                resources.length,

            resources,

            byType
        };
    };


/*
============================================================
GET RESOURCES FOR MULTIPLE SKILLS
============================================================

Example input:

[
    {
        skill: "SQL",
        currentScore: 45,
        topics: [
            "JOINs",
            "Window Functions"
        ]
    },

    {
        skill: "Power BI",
        currentScore: 35,
        topics: [
            "DAX"
        ]
    }
]

============================================================
*/

const getResourcesForSkills =
    async ({
        skills = [],
        resourcesPerSkill = 6,
        limitPerType = 2,
        includePaid = false
    }) => {

        if (
            !Array.isArray(
                skills
            )
        ) {

            throw createServiceError(
                "Skills must be an array.",
                400,
                "INVALID_SKILLS"
            );
        }


        const results =
            [];


        for (
            const item
            of skills
        ) {

            try {

                const result =
                    await getRecommendedResources({

                        skill:
                            item?.skill ||
                            item?.skillId ||
                            item?.skillName ||
                            item?.name,

                        currentScore:
                            item?.currentScore ??
                            item?.score ??
                            item?.percentage ??
                            0,

                        level:
                            item?.level,

                        topics:
                            item?.topics ||
                            item?.recommendedTopics ||
                            [],

                        preferredTypes:
                            item?.preferredTypes ||
                            DEFAULT_RESOURCE_TYPE_ORDER,

                        totalLimit:
                            resourcesPerSkill,

                        limitPerType,

                        includePaid
                    });


                results.push({
                    success:
                        true,

                    ...result
                });


            } catch (
                error
            ) {

                /*
                One missing skill should not destroy
                recommendations for every other skill.
                */

                results.push({

                    success:
                        false,

                    skill:

                        item?.skill ||
                        item?.skillName ||
                        item?.name ||
                        "",

                    message:
                        error.message,

                    code:
                        error.code ||
                        "RESOURCE_LOOKUP_FAILED",

                    resources:
                        [],

                    byType: {
                        youtube:
                            [],
                        documentation:
                            [],
                        course:
                            [],
                        practice:
                            [],
                        article:
                            [],
                        project:
                            [],
                        interview:
                            []
                    }
                });
            }
        }


        return results;
    };


/*
============================================================
GET RESOURCE BY ID
============================================================
*/

const getResourceById =
    async (
        resourceId
    ) => {

        if (
            !mongoose.Types.ObjectId
                .isValid(
                    resourceId
                )
        ) {

            throw createServiceError(
                "Invalid learning resource ID.",
                400,
                "INVALID_RESOURCE_ID"
            );
        }


        const resource =
            await LearningResource
                .findOne({

                    _id:
                        resourceId,

                    isActive:
                        true,

                    isVerified:
                        true
                })
                .populate(
                    "skill",
                    "name"
                )
                .lean();


        if (
            !resource
        ) {

            throw createServiceError(
                "Learning resource not found.",
                404,
                "RESOURCE_NOT_FOUND"
            );
        }


        return formatResource(
            resource
        );
    };


/*
============================================================
GET ALL RESOURCES FOR A SKILL
============================================================
*/

const getResourcesBySkill =
    async ({
        skill,
        type = null,
        level = null,
        includePaid = false,
        limit = 30
    }) => {

        const resolvedSkill =
            await resolveSkill(
                skill
            );


        const filter = {

            skill:
                resolvedSkill._id,

            isActive:
                true,

            isVerified:
                true
        };


        /*
        --------------------------------------------------------
        TYPE FILTER
        --------------------------------------------------------
        */

        if (
            type
        ) {

            const normalizedType =
                normalizeText(
                    type
                )
                    .toLowerCase();


            if (
                RESOURCE_TYPES.includes(
                    normalizedType
                )
            ) {

                filter.type =
                    normalizedType;
            }
        }


        /*
        --------------------------------------------------------
        LEVEL FILTER
        --------------------------------------------------------
        */

        if (
            level
        ) {

            const normalizedLevel =
                normalizeText(
                    level
                )
                    .toLowerCase();


            if (
                VALID_LEVELS.has(
                    normalizedLevel
                )
            ) {

                filter.level = {

                    $in: [
                        normalizedLevel,
                        "all"
                    ]
                };
            }
        }


        if (
            !includePaid
        ) {

            filter.isFree =
                true;
        }


        const resources =
            await LearningResource
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
                        Math.max(
                            safeNumber(
                                limit,
                                30
                            ),
                            1
                        ),
                        100
                    )
                )
                .lean();


        return {

            skill: {

                id:
                    resolvedSkill._id,

                name:
                    resolvedSkill.name
            },

            totalResources:
                resources.length,

            resources:
                resources.map(
                    formatResource
                ),

            byType:
                groupResourcesByType(
                    resources.map(
                        formatResource
                    )
                )
        };
    };


/*
============================================================
SEARCH LEARNING RESOURCES
============================================================

Future Learning.jsx search bar can use this.

Example:

searchResources({
    query: "window functions",
    type: "youtube"
});

============================================================
*/

const searchResources =
    async ({
        query = "",
        skill = null,
        type = null,
        level = null,
        includePaid = false,
        limit = 20
    }) => {

        const search =
            normalizeText(
                query
            );


        const filter = {

            isActive:
                true,

            isVerified:
                true
        };


        /*
        --------------------------------------------------------
        FREE
        --------------------------------------------------------
        */

        if (
            !includePaid
        ) {

            filter.isFree =
                true;
        }


        /*
        --------------------------------------------------------
        SKILL
        --------------------------------------------------------
        */

        let resolvedSkill =
            null;


        if (
            skill
        ) {

            resolvedSkill =
                await resolveSkill(
                    skill
                );


            filter.skill =
                resolvedSkill._id;
        }


        /*
        --------------------------------------------------------
        TYPE
        --------------------------------------------------------
        */

        if (
            type
        ) {

            const normalizedType =
                normalizeText(
                    type
                )
                    .toLowerCase();


            if (
                RESOURCE_TYPES.includes(
                    normalizedType
                )
            ) {

                filter.type =
                    normalizedType;
            }
        }


        /*
        --------------------------------------------------------
        LEVEL
        --------------------------------------------------------
        */

        if (
            level
        ) {

            const normalizedLevel =
                normalizeText(
                    level
                )
                    .toLowerCase();


            if (
                VALID_LEVELS.has(
                    normalizedLevel
                )
            ) {

                filter.level = {

                    $in: [
                        normalizedLevel,
                        "all"
                    ]
                };
            }
        }


        /*
        --------------------------------------------------------
        TEXT SEARCH
        --------------------------------------------------------
        */

        if (
            search
        ) {

            const regex =
                new RegExp(
                    escapeRegex(
                        search
                    ),
                    "i"
                );


            filter.$or = [

                {
                    title:
                        regex
                },

                {
                    topic:
                        regex
                },

                {
                    description:
                        regex
                },

                {
                    provider:
                        regex
                },

                {
                    tags:
                        regex
                }
            ];
        }


        const resources =
            await LearningResource
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
                        Math.max(
                            safeNumber(
                                limit,
                                20
                            ),
                            1
                        ),
                        100
                    )
                )
                .populate(
                    "skill",
                    "name"
                )
                .lean();


        return {

            query:
                search,

            skill:
                resolvedSkill
                    ? {
                        id:
                            resolvedSkill._id,

                        name:
                            resolvedSkill.name
                    }
                    : null,

            total:
                resources.length,

            resources:
                resources.map(
                    formatResource
                )
        };
    };


/*
============================================================
CHECK RESOURCE AVAILABILITY FOR SKILL
============================================================

Useful before the AI recommends a skill.

============================================================
*/

const hasResourcesForSkill =
    async (
        skill
    ) => {

        try {

            const resolvedSkill =
                await resolveSkill(
                    skill
                );


            const count =
                await LearningResource
                    .countDocuments({

                        skill:
                            resolvedSkill._id,

                        isActive:
                            true,

                        isVerified:
                            true
                    });


            return {
                available:
                    count > 0,

                count,

                skill: {
                    id:
                        resolvedSkill._id,

                    name:
                        resolvedSkill.name
                }
            };


        } catch (
            error
        ) {

            return {

                available:
                    false,

                count:
                    0,

                skill:
                    skill || null,

                error:
                    error.message
            };
        }
    };


/*
============================================================
EXPORTS
============================================================
*/

module.exports = {

    /*
    Main recommendation functions.
    */

    getRecommendedResources,

    getResourcesForSkills,


    /*
    Resource browsing.
    */

    getResourceById,

    getResourcesBySkill,

    searchResources,


    /*
    Availability.
    */

    hasResourcesForSkill,


    /*
    Helpers required by the next recommendation service.
    */

    resolveSkill,

    determineLearningLevel,

    getEligibleLevels,

    normalizeSkillName,


    /*
    Constants.
    */

    RESOURCE_TYPES,

    DEFAULT_RESOURCE_TYPE_ORDER
};