const mongoose = require("mongoose");

const Assessment =
    require("../models/Assessment");

const AssessmentAttempt =
    require("../models/AssessmentAttempt");

const Question =
    require("../models/Question");

const CodingQuestion =
    require("../models/CodingQuestion");

const SQLQuestion =
    require("../models/SQLQuestion");


const {
    calculateSkillWisePerformance
} = require(
    "../services/assessmentAnalyticsService"
);


const {
    getFinalJobReadiness
} = require(
    "../services/finalJobReadinessService"
);


const {
    generateLearningPlanForResume,
    buildLearningRoadmap
} = require(
    "../services/learningRecommendationService"
);

const {
    getLiveYouTubeResources
} = require(
    "../services/youtubeResourceService"
);


const {
    getResourceById,
    getResourcesBySkill,
    searchResources,
    getRecommendedResources
} = require(
    "../services/learningResourceService"
);

const {
    syncLearningProgress,
    getLearningProgress,
    startSkillProgress,
    updateLearningItemProgress,
    markLearningResourceAccessed
} = require(
    "../services/learningProgressService"
);

/*
============================================================
HELPERS
============================================================
*/

const safeNumber = (
    value,
    fallback = 0
) => {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
};


const parsePositiveInteger = (
    value,
    fallback,
    maximum = 100
) => {

    const number =
        Number.parseInt(
            value,
            10
        );


    if (
        !Number.isFinite(number) ||
        number <= 0
    ) {

        return fallback;
    }


    return Math.min(
        number,
        maximum
    );
};


const parseBoolean = (
    value,
    fallback = false
) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return fallback;
    }


    if (
        typeof value ===
        "boolean"
    ) {

        return value;
    }


    return String(value)
        .trim()
        .toLowerCase() ===
        "true";
};


/*
============================================================
ERROR RESPONSE
============================================================
*/

const sendControllerError = (
    res,
    error,
    fallbackMessage
) => {

    console.error(
        fallbackMessage,
        error
    );


    const statusCode =
        Number(
            error?.statusCode
        ) || 500;


    return res
        .status(
            statusCode
        )
        .json({

            success:
                false,

            message:
                error?.message ||
                fallbackMessage,

            code:
                error?.code ||
                "LEARNING_CONTROLLER_ERROR"
        });
};


/*
============================================================
LOAD SKILL PERFORMANCE
============================================================

This reproduces only the small analytics section we need.

We deliberately select only:

    _id
    skill
    points
    difficulty

No coding hidden tests.
No SQL hidden test cases.
No expected answers.

============================================================
*/

const loadSkillPerformance =
    async ({
        userId,
        resumeId
    }) => {

        /*
        --------------------------------------------------------
        ASSESSMENTS
        --------------------------------------------------------
        */

        const assessments =
            await Assessment
                .find({

                    user:
                        userId,

                    resume:
                        resumeId
                })
                .select(
                    [
                        "_id",
                        "type",
                        "mcqQuestions",
                        "codingQuestions",
                        "sqlQuestions"
                    ].join(" ")
                )
                .lean();


        if (
            assessments.length ===
            0
        ) {

            return [];
        }


        const assessmentIds =
            assessments
                .filter(
                    (assessment) =>
                        assessment?._id
                )
                .map(
                    (assessment) =>
                        assessment._id
                );


        /*
        --------------------------------------------------------
        COMPLETED ATTEMPTS
        --------------------------------------------------------
        */

        const attempts =
            await AssessmentAttempt
                .find({

                    user:
                        userId,

                    assessment: {
                        $in:
                            assessmentIds
                    },

                    status: {
                        $in: [
                            "submitted",
                            "evaluated"
                        ]
                    }
                })
                .sort({
                    submittedAt:
                        -1
                })
                .lean();


        if (
            attempts.length ===
            0
        ) {

            return [];
        }


        /*
        --------------------------------------------------------
        QUESTION IDS
        --------------------------------------------------------
        */

        const mcqIds =
            [];

        const codingIds =
            [];

        const sqlIds =
            [];


        assessments.forEach(
            (assessment) => {

                if (
                    Array.isArray(
                        assessment
                            ?.mcqQuestions
                    )
                ) {

                    mcqIds.push(
                        ...assessment
                            .mcqQuestions
                    );
                }


                if (
                    Array.isArray(
                        assessment
                            ?.codingQuestions
                    )
                ) {

                    codingIds.push(
                        ...assessment
                            .codingQuestions
                    );
                }


                if (
                    Array.isArray(
                        assessment
                            ?.sqlQuestions
                    )
                ) {

                    sqlIds.push(
                        ...assessment
                            .sqlQuestions
                    );
                }
            }
        );


        /*
        --------------------------------------------------------
        REMOVE DUPLICATES
        --------------------------------------------------------
        */

        const uniqueIds =
            (
                values
            ) => {

                return [
                    ...new Set(

                        values
                            .filter(
                                Boolean
                            )
                            .map(
                                (id) =>
                                    id.toString()
                            )
                    )
                ];
            };


        const uniqueMcqIds =
            uniqueIds(
                mcqIds
            );

        const uniqueCodingIds =
            uniqueIds(
                codingIds
            );

        const uniqueSqlIds =
            uniqueIds(
                sqlIds
            );


        /*
        --------------------------------------------------------
        LOAD QUESTION METADATA

        SECURITY:

        Do not load:
        - correct answers unless required
        - testCases
        - expectedQueryResult
        - hidden coding tests

        Skill analytics only needs question ownership,
        skill and points.
        --------------------------------------------------------
        */

        const [
            mcqQuestions,
            codingQuestions,
            sqlQuestions
        ] =
            await Promise.all([

                Question
                    .find({
                        _id: {
                            $in:
                                uniqueMcqIds
                        }
                    })
                    .select(
                        "_id skill points difficulty"
                    )
                    .populate(
                        "skill",
                        "name"
                    )
                    .lean(),


                CodingQuestion
                    .find({
                        _id: {
                            $in:
                                uniqueCodingIds
                        }
                    })
                    .select(
                        "_id skill points difficulty"
                    )
                    .populate(
                        "skill",
                        "name"
                    )
                    .lean(),


                SQLQuestion
                    .find({
                        _id: {
                            $in:
                                uniqueSqlIds
                        }
                    })
                    .select(
                        "_id skill points difficulty"
                    )
                    .populate(
                        "skill",
                        "name"
                    )
                    .lean()
            ]);


        const questions = [

            ...mcqQuestions,

            ...codingQuestions,

            ...sqlQuestions

        ].filter(
            (question) =>
                question &&
                question._id
        );


        if (
            questions.length ===
            0
        ) {

            return [];
        }


        /*
        --------------------------------------------------------
        CALCULATE SKILL ANALYTICS
        --------------------------------------------------------
        */

        try {

            const skillPerformance =
                calculateSkillWisePerformance({

                    attempts,

                    questions
                });


            return Array.isArray(
                skillPerformance
            )
                ? skillPerformance
                : [];


        } catch (
            error
        ) {

            console.error(
                "Learning skill performance calculation failed:",
                error
            );


            return [];
        }
    };


/*
============================================================
GET PERSONALIZED LEARNING PLAN
============================================================

GET
/api/learning/plan/:resumeId

============================================================
*/

const getLearningPlan =
    async (
        req,
        res
    ) => {

        try {

            const {
                resumeId
            } =
                req.params;


            /*
            --------------------------------------------------------
            VALIDATE ID
            --------------------------------------------------------
            */

            if (
                !resumeId ||
                !mongoose.Types.ObjectId
                    .isValid(
                        resumeId
                    )
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Valid resume ID is required."
                    });
            }


            /*
            --------------------------------------------------------
            QUERY OPTIONS
            --------------------------------------------------------
            */

            const maxSkills =
                parsePositiveInteger(
                    req.query
                        ?.maxSkills,
                    5,
                    10
                );


            const resourcesPerSkill =
                parsePositiveInteger(
                    req.query
                        ?.resourcesPerSkill,
                    6,
                    20
                );


            /*
            --------------------------------------------------------
            LOAD ASSESSMENT SKILL PERFORMANCE
            --------------------------------------------------------
            */

            const skillPerformance =
                await loadSkillPerformance({

                    userId:
                        req.user.id,

                    resumeId
                });


            /*
            --------------------------------------------------------
            FINAL JOB READINESS
            --------------------------------------------------------

            Readiness failure should not completely destroy the
            learning-plan endpoint.

            Example:
            user has uploaded resume but has not taken enough
            assessments yet.
            --------------------------------------------------------
            */

            let jobReadiness = {

                score:
                    0,

                level:
                    "Not Ready",

                resumeCoverage:
                    0,

                assessmentScore:
                    0
            };


            try {

                const readinessResult =
                    await getFinalJobReadiness({

                        userId:
                            req.user.id,

                        resumeId
                    });


                if (
                    readinessResult &&
                    typeof readinessResult ===
                        "object"
                ) {

                    jobReadiness =
                        readinessResult;
                }


            } catch (
                readinessError
            ) {

                console.warn(
                    "Learning plan readiness fallback:",
                    readinessError.message
                );
            }


            /*
            --------------------------------------------------------
            GENERATE PLAN
            --------------------------------------------------------
            */

            const learningPlan =
                await generateLearningPlanForResume({

                    userId:
                        req.user.id,

                    resumeId,

                    skillPerformance,

                    jobReadiness,

                    maxSkills,

                    resourcesPerSkill
                });


            /*
            --------------------------------------------------------
            RESPONSE
            --------------------------------------------------------
            */

            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "Personalized learning plan generated successfully.",

                    data:
                        learningPlan
                });


        } catch (
            error
        ) {

            return sendControllerError(
                res,
                error,
                "Failed to generate personalized learning plan."
            );
        }
    };


/*
============================================================
GET RECOMMENDED RESOURCES FOR SKILL
============================================================

GET
/api/learning/recommendations/:skill

Examples:

/api/learning/recommendations/SQL?score=45

/api/learning/recommendations/SQL
    ?score=45
    &topics=joins,ctes,window%20functions

============================================================
*/

const getSkillRecommendations =
    async (
        req,
        res
    ) => {

        try {

            const {
                skill
            } =
                req.params;


            if (
                !skill ||
                !String(
                    skill
                ).trim()
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Skill is required."
                    });
            }


            /*
            --------------------------------------------------------
            SCORE
            --------------------------------------------------------
            */

            const currentScore =
                safeNumber(
                    req.query
                        ?.score,
                    0
                );


            /*
            --------------------------------------------------------
            TOPICS
            --------------------------------------------------------
            */

            const topics =

                typeof req.query
                    ?.topics ===
                    "string"

                    ? req.query
                        .topics
                        .split(",")
                        .map(
                            (topic) =>
                                topic.trim()
                        )
                        .filter(
                            Boolean
                        )

                    : [];


            /*
            --------------------------------------------------------
            PREFERRED TYPES
            --------------------------------------------------------
            */

            const preferredTypes =

                typeof req.query
                    ?.types ===
                    "string"

                    ? req.query
                        .types
                        .split(",")
                        .map(
                            (type) =>
                                type
                                    .trim()
                                    .toLowerCase()
                        )
                        .filter(
                            Boolean
                        )

                    : undefined;


            const totalLimit =
                parsePositiveInteger(
                    req.query
                        ?.limit,
                    10,
                    30
                );


            const includePaid =
                parseBoolean(
                    req.query
                        ?.includePaid,
                    false
                );


            /*
            --------------------------------------------------------
            RESOURCE RECOMMENDATION
            --------------------------------------------------------
            */

            const result =
                await getRecommendedResources({

                    skill,

                    currentScore,

                    topics,

                    preferredTypes,

                    totalLimit,

                    limitPerType:
                        2,

                    includePaid
                });


            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "Learning resources recommended successfully.",

                    data:
                        result
                });


        } catch (
            error
        ) {

            return sendControllerError(
                res,
                error,
                "Failed to recommend learning resources."
            );
        }
    };


/*
============================================================
GET ALL RESOURCES FOR SKILL
============================================================

GET
/api/learning/resources/skill/:skill

Examples:

/api/learning/resources/skill/SQL

/api/learning/resources/skill/SQL
    ?type=practice
    &level=intermediate

============================================================
*/

const getLearningResourcesBySkill =
    async (
        req,
        res
    ) => {

        try {

            const {
                skill
            } =
                req.params;


            const result =
                await getResourcesBySkill({

                    skill,

                    type:
                        req.query
                            ?.type ||
                        null,

                    level:
                        req.query
                            ?.level ||
                        null,

                    includePaid:
                        parseBoolean(
                            req.query
                                ?.includePaid,
                            false
                        ),

                    limit:
                        parsePositiveInteger(
                            req.query
                                ?.limit,
                            30,
                            100
                        )
                });


            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "Learning resources fetched successfully.",

                    data:
                        result
                });


        } catch (
            error
        ) {

            return sendControllerError(
                res,
                error,
                "Failed to fetch learning resources."
            );
        }
    };


/*
============================================================
SEARCH LEARNING RESOURCES
============================================================

GET
/api/learning/resources/search

Examples:

?q=window functions

?q=python&type=youtube

?q=sql&skill=SQL&level=intermediate

============================================================
*/

const searchLearningResources =
    async (
        req,
        res
    ) => {

        try {

            const query =
                String(
                    req.query
                        ?.q ||
                    ""
                ).trim();


            const result =
                await searchResources({

                    query,

                    skill:
                        req.query
                            ?.skill ||
                        null,

                    type:
                        req.query
                            ?.type ||
                        null,

                    level:
                        req.query
                            ?.level ||
                        null,

                    includePaid:
                        parseBoolean(
                            req.query
                                ?.includePaid,
                            false
                        ),

                    limit:
                        parsePositiveInteger(
                            req.query
                                ?.limit,
                            20,
                            100
                        )
                });


            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "Learning resource search completed successfully.",

                    data:
                        result
                });


        } catch (
            error
        ) {

            return sendControllerError(
                res,
                error,
                "Failed to search learning resources."
            );
        }
    };


/*
============================================================
GET RESOURCE BY ID
============================================================

GET
/api/learning/resources/:resourceId

============================================================
*/

const getLearningResource =
    async (
        req,
        res
    ) => {

        try {

            const {
                resourceId
            } =
                req.params;


            const resource =
                await getResourceById(
                    resourceId
                );


            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "Learning resource fetched successfully.",

                    data:
                        resource
                });


        } catch (
            error
        ) {

            return sendControllerError(
                res,
                error,
                "Failed to fetch learning resource."
            );
        }
    };


/*
============================================================
GENERATE CUSTOM ROADMAP
============================================================

POST
/api/learning/roadmap

Useful later for:

- dashboard quick recommendations
- AI-generated topic lists
- testing recommendations
- custom learning plans

BODY:

{
    "skills": [
        {
            "skill": "SQL",
            "score": 45,
            "importance": 95,
            "requiredLevel": "Advanced"
        }
    ],

    "jobReadiness": {
        "score": 60
    },

    "targetRole": "Data Analyst",
    "targetCompany": "Accenture"
}

============================================================
*/

const generateCustomRoadmap =
    async (
        req,
        res
    ) => {

        try {

            const {
                skills,
                jobReadiness,
                targetRole,
                targetCompany
            } =
                req.body;


            if (
                !Array.isArray(
                    skills
                ) ||
                skills.length ===
                    0
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "At least one skill is required."
                    });
            }


            /*
            Prevent oversized requests.
            */

            const safeSkills =
                skills.slice(
                    0,
                    10
                );


            const result =
                await buildLearningRoadmap({

                    skills:
                        safeSkills,

                    jobReadiness:
                        jobReadiness &&
                        typeof jobReadiness ===
                            "object"

                            ? jobReadiness

                            : {},

                    targetRole:
                        String(
                            targetRole ||
                            ""
                        ).trim(),

                    targetCompany:
                        String(
                            targetCompany ||
                            ""
                        ).trim(),

                    resourcesPerSkill:
                        6
                });


            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "Learning roadmap generated successfully.",

                    data:
                        result
                });


        } catch (
            error
        ) {

            return sendControllerError(
                res,
                error,
                "Failed to generate learning roadmap."
            );
        }
    };
/*
============================================================
GET LIVE YOUTUBE LEARNING RESOURCES
============================================================

GET
/api/learning/youtube/:skill

Example:

/api/learning/youtube/SQL
    ?topics=JOINs,CTEs,Window Functions
    &level=intermediate
    &limit=6

============================================================
*/

const getYouTubeLearningResources =
    async (
        req,
        res
    ) => {

        try {

            const {
                skill
            } =
                req.params;


            if (
                !skill ||
                !String(
                    skill
                ).trim()
            ) {

                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "Skill is required."
                    });
            }


            const topics =
                String(
                    req.query
                        ?.topics ||
                    ""
                )
                    .split(",")
                    .map(
                        (
                            topic
                        ) =>
                            topic.trim()
                    )
                    .filter(
                        Boolean
                    );


            const limit =
                parsePositiveInteger(
                    req.query
                        ?.limit,
                    6,
                    12
                );


            const level =
                req.query
                    ?.level ||
                "all";


            const forceRefresh =
                parseBoolean(
                    req.query
                        ?.refresh,
                    false
                );


            const result =
                await getLiveYouTubeResources({

                    skill,

                    topics,

                    level,

                    limit,

                    forceRefresh
                });


            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "YouTube learning resources loaded successfully.",

                    data:
                        result
                });


        } catch (
            error
        ) {

            return sendControllerError(
                res,
                error,
                "Unable to load YouTube learning resources."
            );
        }
    };

    /*
============================================================
GET LEARNING PROGRESS
============================================================
*/

const getUserLearningProgress =
    async (
        req,
        res
    ) => {

        try {

            const {
                resumeId
            } =
                req.params;


            const result =
                await getLearningProgress({
                    userId:
                        req.user.id,

                    resumeId
                });


            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Learning progress loaded successfully.",

                    data:
                        result
                });


        } catch (
            error
        ) {

            return sendControllerError(
                res,
                error,
                "Unable to load learning progress."
            );
        }
    };


/*
============================================================
SYNC ROADMAP PROGRESS
============================================================
*/

const syncUserLearningProgress =
    async (
        req,
        res
    ) => {

        try {

            const {
                resumeId
            } =
                req.params;


            const skills =
                Array.isArray(
                    req.body
                        ?.skills
                )

                    ? req.body.skills

                    : [];


            const result =
                await syncLearningProgress({
                    userId:
                        req.user.id,

                    resumeId,

                    skills
                });


            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Learning progress synchronized successfully.",

                    data:
                        result
                });


        } catch (
            error
        ) {

            return sendControllerError(
                res,
                error,
                "Unable to synchronize learning progress."
            );
        }
    };


/*
============================================================
START SKILL
============================================================
*/

const startUserLearningSkill =
    async (
        req,
        res
    ) => {

        try {

            const {
                resumeId,
                skill
            } =
                req.params;


            const result =
                await startSkillProgress({
                    userId:
                        req.user.id,

                    resumeId,

                    skill
                });


            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Learning skill started successfully.",

                    data:
                        result
                });


        } catch (
            error
        ) {

            return sendControllerError(
                res,
                error,
                "Unable to start learning progress."
            );
        }
    };


/*
============================================================
UPDATE TOPIC / RESOURCE / PROJECT
============================================================
*/

const updateUserLearningItem =
    async (
        req,
        res
    ) => {

        try {

            const {
                resumeId,
                skill
            } =
                req.params;


            const {
                itemType,
                key,
                completed,
                item
            } =
                req.body;


            if (
                typeof completed !==
                "boolean"
            ) {

                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        message:
                            "completed must be true or false."
                    });
            }


            const result =
                await updateLearningItemProgress({
                    userId:
                        req.user.id,

                    resumeId,

                    skill,

                    itemType,

                    key,

                    completed,

                    item:
                        item || {}
                });


            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Learning progress updated successfully.",

                    data:
                        result
                });


        } catch (
            error
        ) {

            return sendControllerError(
                res,
                error,
                "Unable to update learning progress."
            );
        }
    };


/*
============================================================
RESOURCE ACCESSED
============================================================
*/

const accessUserLearningResource =
    async (
        req,
        res
    ) => {

        try {

            const {
                resumeId,
                skill
            } =
                req.params;


            const {
                key,
                item
            } =
                req.body;


            const result =
                await markLearningResourceAccessed({
                    userId:
                        req.user.id,

                    resumeId,

                    skill,

                    key,

                    item:
                        item || {}
                });


            return res
                .status(200)
                .json({
                    success:
                        true,

                    message:
                        "Learning resource access recorded.",

                    data:
                        result
                });


        } catch (
            error
        ) {

            return sendControllerError(
                res,
                error,
                "Unable to record learning resource access."
            );
        }
    };

/*
============================================================
EXPORTS
============================================================
*/

module.exports = {
    getLearningPlan,
    getSkillRecommendations,
    getLearningResourcesBySkill,
    searchLearningResources,
    getLearningResource,
    generateCustomRoadmap,
    getYouTubeLearningResources,

    getUserLearningProgress,
    syncUserLearningProgress,
    startUserLearningSkill,
    updateUserLearningItem,
    accessUserLearningResource
};