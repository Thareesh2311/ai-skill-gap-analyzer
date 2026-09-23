const express =
    require("express");


const protect =
    require(
        "../middleware/authMiddleware"
    );


const {
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
} = require(
    "../controllers/learningController"
);


const router =
    express.Router();


/*
============================================================
ALL LEARNING ROUTES REQUIRE AUTHENTICATION
============================================================
*/

router.use(
    protect
);


/*
============================================================
PERSONALIZED LEARNING PLAN
============================================================

GET
/api/learning/plan/:resumeId

Example:

GET /api/learning/plan/68...

Optional:

?maxSkills=5
&resourcesPerSkill=6

============================================================
*/

router.get(
    "/plan/:resumeId",
    getLearningPlan
);


/*
============================================================
CUSTOM ROADMAP
============================================================

POST
/api/learning/roadmap

============================================================
*/

router.post(
    "/roadmap",
    generateCustomRoadmap
);


/*
============================================================
RECOMMENDATIONS FOR ONE SKILL
============================================================

IMPORTANT:

Keep this before generic resource-id routes.

Examples:

GET /api/learning/recommendations/SQL?score=45

GET /api/learning/recommendations/SQL
    ?score=45
    &topics=joins,ctes
    &types=youtube,practice

============================================================
*/

router.get(
    "/recommendations/:skill",
    getSkillRecommendations
);


/*
============================================================
RESOURCE SEARCH
============================================================

IMPORTANT:

This must appear BEFORE:

/resources/:resourceId

Otherwise Express could interpret "search"
as a resource ID.

============================================================
*/

router.get(
    "/resources/search",
    searchLearningResources
);


/*
============================================================
RESOURCES FOR SKILL
============================================================

Example:

GET /api/learning/resources/skill/SQL

GET /api/learning/resources/skill/SQL?type=practice

============================================================
*/

router.get(
    "/resources/skill/:skill",
    getLearningResourcesBySkill
);


/*
============================================================
SINGLE RESOURCE
============================================================

This generic route stays AFTER:

/resources/search
/resources/skill/:skill

============================================================
*/

router.get(
    "/resources/:resourceId",
    getLearningResource
);

router.get(
    "/youtube/:skill",
    getYouTubeLearningResources
);

/*
============================================================
LEARNING PROGRESS
============================================================
*/

router.get(
    "/progress/:resumeId",
    getUserLearningProgress
);


router.post(
    "/progress/:resumeId/sync",
    syncUserLearningProgress
);


router.post(
    "/progress/:resumeId/:skill/start",
    startUserLearningSkill
);


router.patch(
    "/progress/:resumeId/:skill/item",
    updateUserLearningItem
);


router.patch(
    "/progress/:resumeId/:skill/resource-access",
    accessUserLearningResource
);

/*
============================================================
EXPORT
============================================================
*/

module.exports =
    router;