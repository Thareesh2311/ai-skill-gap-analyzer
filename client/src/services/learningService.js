import api from "./api";


/*
============================================================
LEARNING SERVICE
============================================================

Connects React frontend with:

/api/learning

Backend routes:

GET  /plan/:resumeId
POST /roadmap
GET  /recommendations/:skill
GET  /resources/search
GET  /resources/skill/:skill
GET  /resources/:resourceId

============================================================
*/


/*
============================================================
HELPERS
============================================================
*/

const buildQueryString = (
    params = {}
) => {

    const searchParams =
        new URLSearchParams();


    Object.entries(
        params
    ).forEach(
        ([key, value]) => {

            /*
            Ignore undefined / null / empty values.
            */

            if (
                value === undefined ||
                value === null ||
                value === ""
            ) {

                return;
            }


            /*
            Arrays become comma-separated values.

            Example:

            topics: [
                "JOINs",
                "CTEs"
            ]

            becomes:

            topics=JOINs,CTEs
            */

            if (
                Array.isArray(
                    value
                )
            ) {

                if (
                    value.length ===
                    0
                ) {

                    return;
                }


                searchParams.set(
                    key,
                    value.join(",")
                );


                return;
            }


            /*
            Normal values.
            */

            searchParams.set(
                key,
                String(value)
            );
        }
    );


    const query =
        searchParams.toString();


    return query
        ? `?${query}`
        : "";
};


/*
============================================================
GET PERSONALIZED LEARNING PLAN
============================================================

GET
/api/learning/plan/:resumeId

Example:

getLearningPlan(
    resumeId,
    {
        maxSkills: 5,
        resourcesPerSkill: 6
    }
)

============================================================
*/

const getLearningPlan =
    async (
        resumeId,
        options = {}
    ) => {

        if (
            !resumeId
        ) {

            throw new Error(
                "Resume ID is required."
            );
        }


        const query =
            buildQueryString({

                maxSkills:
                    options.maxSkills,

                resourcesPerSkill:
                    options.resourcesPerSkill
            });


        const response =
            await api.get(
                `/learning/plan/${resumeId}${query}`
            );


        return response.data;
    };


/*
============================================================
GENERATE CUSTOM LEARNING ROADMAP
============================================================

POST
/api/learning/roadmap

Example:

generateRoadmap({
    skills: [
        {
            skill: "SQL",
            score: 45,
            importance: 90,
            requiredLevel: "Advanced"
        }
    ],

    jobReadiness: {
        score: 60
    },

    targetRole:
        "Data Analyst",

    targetCompany:
        "Accenture"
});

============================================================
*/

const generateRoadmap =
    async ({
        skills = [],
        jobReadiness = {},
        targetRole = "",
        targetCompany = ""
    } = {}) => {

        if (
            !Array.isArray(
                skills
            ) ||
            skills.length ===
                0
        ) {

            throw new Error(
                "At least one skill is required to generate a roadmap."
            );
        }


        const response =
            await api.post(
                "/learning/roadmap",
                {

                    skills,

                    jobReadiness,

                    targetRole,

                    targetCompany
                }
            );


        return response.data;
    };


/*
============================================================
GET RECOMMENDED RESOURCES FOR ONE SKILL
============================================================

GET
/api/learning/recommendations/:skill

Example:

getSkillRecommendations(
    "SQL",
    {
        score: 45,

        topics: [
            "JOINs",
            "CTEs"
        ],

        types: [
            "youtube",
            "practice",
            "documentation"
        ],

        limit: 8,

        includePaid: false
    }
);

============================================================
*/

const getSkillRecommendations =
    async (
        skill,
        options = {}
    ) => {

        if (
            !skill
        ) {

            throw new Error(
                "Skill is required."
            );
        }


        const query =
            buildQueryString({

                score:
                    options.score,

                topics:
                    options.topics,

                types:
                    options.types,

                limit:
                    options.limit,

                includePaid:
                    options.includePaid
            });


        const response =
            await api.get(

                `/learning/recommendations/${encodeURIComponent(
                    skill
                )}${query}`
            );


        return response.data;
    };


/*
============================================================
GET RESOURCES FOR SKILL
============================================================

GET
/api/learning/resources/skill/:skill

Example:

getResourcesBySkill(
    "SQL",
    {
        type:
            "practice",

        level:
            "intermediate",

        includePaid:
            false,

        limit:
            20
    }
);

============================================================
*/

const getResourcesBySkill =
    async (
        skill,
        options = {}
    ) => {

        if (
            !skill
        ) {

            throw new Error(
                "Skill is required."
            );
        }


        const query =
            buildQueryString({

                type:
                    options.type,

                level:
                    options.level,

                includePaid:
                    options.includePaid,

                limit:
                    options.limit
            });


        const response =
            await api.get(

                `/learning/resources/skill/${encodeURIComponent(
                    skill
                )}${query}`
            );


        return response.data;
    };


/*
============================================================
SEARCH LEARNING RESOURCES
============================================================

GET
/api/learning/resources/search

Example:

searchResources({
    query:
        "window functions",

    skill:
        "SQL",

    type:
        "youtube",

    level:
        "intermediate",

    limit:
        20
});

============================================================
*/

const searchResources =
    async ({
        query = "",
        skill = "",
        type = "",
        level = "",
        includePaid = false,
        limit = 20
    } = {}) => {

        const queryString =
            buildQueryString({

                q:
                    query,

                skill,

                type,

                level,

                includePaid,

                limit
            });


        const response =
            await api.get(
                `/learning/resources/search${queryString}`
            );


        return response.data;
    };


/*
============================================================
GET RESOURCE BY ID
============================================================

GET
/api/learning/resources/:resourceId

============================================================
*/

const getResourceById =
    async (
        resourceId
    ) => {

        if (
            !resourceId
        ) {

            throw new Error(
                "Learning resource ID is required."
            );
        }


        const response =
            await api.get(
                `/learning/resources/${resourceId}`
            );


        return response.data;
    };


/*
============================================================
GET YOUTUBE RESOURCES FOR SKILL
============================================================

Frontend convenience helper.

This does not call a separate backend route.

It uses:

GET
/api/learning/resources/skill/:skill?type=youtube

============================================================
*/

const getYouTubeResources =
    async (
        skill,
        options = {}
    ) => {

        return getResourcesBySkill(
            skill,
            {

                ...options,

                type:
                    "youtube"
            }
        );
    };


/*
============================================================
GET PRACTICE RESOURCES
============================================================
*/

const getPracticeResources =
    async (
        skill,
        options = {}
    ) => {

        return getResourcesBySkill(
            skill,
            {

                ...options,

                type:
                    "practice"
            }
        );
    };


/*
============================================================
GET DOCUMENTATION RESOURCES
============================================================
*/

const getDocumentationResources =
    async (
        skill,
        options = {}
    ) => {

        return getResourcesBySkill(
            skill,
            {

                ...options,

                type:
                    "documentation"
            }
        );
    };


/*
============================================================
GET COURSE RESOURCES
============================================================
*/

const getCourseResources =
    async (
        skill,
        options = {}
    ) => {

        return getResourcesBySkill(
            skill,
            {

                ...options,

                type:
                    "course"
            }
        );
    };


/*
============================================================
GET PROJECT RESOURCES
============================================================
*/

const getProjectResources =
    async (
        skill,
        options = {}
    ) => {

        return getResourcesBySkill(
            skill,
            {

                ...options,

                type:
                    "project"
            }
        );
    };


/*
============================================================
GET INTERVIEW RESOURCES
============================================================
*/

const getInterviewResources =
    async (
        skill,
        options = {}
    ) => {

        return getResourcesBySkill(
            skill,
            {

                ...options,

                type:
                    "interview"
            }
        );
    };


/*
============================================================
NORMALIZE LEARNING PLAN RESPONSE
============================================================

Useful because backend responses have:

{
    success: true,
    data: {...}
}

This helper lets components safely write:

const plan =
    learningService.normalizeLearningPlan(response);

============================================================
*/

const normalizeLearningPlan = (
    response
) => {

    if (
        !response
    ) {

        return null;
    }


    return (
        response?.data ||
        response
    );
};


/*
============================================================
NORMALIZE RESOURCE RESPONSE
============================================================
*/

const normalizeResourceResponse = (
    response
) => {

    const data =
        response?.data ||
        response ||
        {};


    return {

        ...data,

        resources:
            Array.isArray(
                data?.resources
            )
                ? data.resources
                : [],

        byType: {

            youtube:
                Array.isArray(
                    data
                        ?.byType
                        ?.youtube
                )
                    ? data
                        .byType
                        .youtube
                    : [],

            documentation:
                Array.isArray(
                    data
                        ?.byType
                        ?.documentation
                )
                    ? data
                        .byType
                        .documentation
                    : [],

            course:
                Array.isArray(
                    data
                        ?.byType
                        ?.course
                )
                    ? data
                        .byType
                        .course
                    : [],

            practice:
                Array.isArray(
                    data
                        ?.byType
                        ?.practice
                )
                    ? data
                        .byType
                        .practice
                    : [],

            article:
                Array.isArray(
                    data
                        ?.byType
                        ?.article
                )
                    ? data
                        .byType
                        .article
                    : [],

            project:
                Array.isArray(
                    data
                        ?.byType
                        ?.project
                )
                    ? data
                        .byType
                        .project
                    : [],

            interview:
                Array.isArray(
                    data
                        ?.byType
                        ?.interview
                )
                    ? data
                        .byType
                        .interview
                    : []
        }
    };
};

/*
============================================================
GET LIVE YOUTUBE RESOURCES
============================================================

GET
/api/learning/youtube/:skill

============================================================
*/

const getLiveYouTubeResources =
    async (
        skill,
        options = {}
    ) => {

        if (
            !skill
        ) {

            throw new Error(
                "Skill is required."
            );
        }


        const query =
            buildQueryString({

                topics:
                    options.topics,

                level:
                    options.level,

                limit:
                    options.limit,

                refresh:
                    options.refresh
            });


        const response =
            await api.get(

                `/learning/youtube/${encodeURIComponent(
                    skill
                )}${query}`
            );


        return response.data;
    };

    /*
============================================================
GET LEARNING PROGRESS
============================================================
*/

const getLearningProgress =
    async (
        resumeId
    ) => {

        const response =
            await api.get(
                `/learning/progress/${encodeURIComponent(
                    resumeId
                )}`
            );


        return response.data;
    };


/*
============================================================
SYNC LEARNING ROADMAP
============================================================
*/

const syncLearningProgress =
    async (
        resumeId,
        skills = []
    ) => {

        const response =
            await api.post(
                `/learning/progress/${encodeURIComponent(
                    resumeId
                )}/sync`,
                {
                    skills
                }
            );


        return response.data;
    };


/*
============================================================
START SKILL
============================================================
*/

const startSkillProgress =
    async (
        resumeId,
        skill
    ) => {

        const response =
            await api.post(
                `/learning/progress/${encodeURIComponent(
                    resumeId
                )}/${encodeURIComponent(
                    skill
                )}/start`
            );


        return response.data;
    };


/*
============================================================
UPDATE ITEM
============================================================
*/

const updateLearningItem =
    async (
        resumeId,
        skill,
        {
            itemType,
            key,
            completed,
            item = {}
        }
    ) => {

        const response =
            await api.patch(
                `/learning/progress/${encodeURIComponent(
                    resumeId
                )}/${encodeURIComponent(
                    skill
                )}/item`,
                {
                    itemType,
                    key,
                    completed,
                    item
                }
            );


        return response.data;
    };


/*
============================================================
RESOURCE ACCESS
============================================================
*/

const markResourceAccessed =
    async (
        resumeId,
        skill,
        {
            key,
            item = {}
        }
    ) => {

        const response =
            await api.patch(
                `/learning/progress/${encodeURIComponent(
                    resumeId
                )}/${encodeURIComponent(
                    skill
                )}/resource-access`,
                {
                    key,
                    item
                }
            );


        return response.data;
    };


/*
============================================================
EXPORT
============================================================
*/

const learningService = {

    getLearningPlan,

    generateRoadmap,

    getSkillRecommendations,

    getResourcesBySkill,

    searchResources,

    getResourceById,

    /*
    Live YouTube API.
    */

    getLiveYouTubeResources,

    /*
    Existing curated helpers.
    */

    getYouTubeResources,

    getPracticeResources,

    getDocumentationResources,

    getCourseResources,

    getProjectResources,

    getInterviewResources,

    normalizeLearningPlan,

    normalizeResourceResponse,

    getLearningProgress,
    syncLearningProgress,
    startSkillProgress,
    updateLearningItem,
    markResourceAccessed,
};


export default learningService;