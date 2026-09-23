const mongoose = require("mongoose");

const Resume = require("../models/Resume");
const UserLearningPlan = require("../models/UserLearningPlan");
const { resolveSkill } = require("./learningResourceService");


/* ============================================================
   HELPERS
============================================================ */

const safeArray = (value) => (
    Array.isArray(value)
        ? value
        : []
);


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


const normalizeTrackingKey = (
    value
) => {

    return normalizeText(
        value
    ).toLowerCase();
};


const createServiceError = (
    message,
    statusCode = 400
) => {

    const error =
        new Error(message);

    error.statusCode =
        statusCode;

    return error;
};


/* ============================================================
   VERIFY RESUME OWNERSHIP
============================================================ */

const verifyResumeOwnership =
    async ({
        userId,
        resumeId
    }) => {

        if (
            !mongoose.isValidObjectId(
                resumeId
            )
        ) {

            throw createServiceError(
                "Invalid resume ID.",
                400
            );
        }


        const resume =
            await Resume
                .findOne({
                    _id:
                        resumeId,

                    user:
                        userId
                })
                .select("_id")
                .lean();


        if (
            !resume
        ) {

            throw createServiceError(
                "Resume not found.",
                404
            );
        }


        return resume;
    };


/* ============================================================
   CATEGORY STATISTICS
============================================================ */

const calculateCategoryStats = (
    items
) => {

    const activeItems =
        safeArray(
            items
        ).filter(
            (
                item
            ) =>
                item
                    ?.isActive !==
                false
        );


    const total =
        activeItems.length;


    const completed =
        activeItems.filter(
            (
                item
            ) =>
                item
                    ?.isCompleted ===
                true
        ).length;


    const percentage =

        total ===
        0

            ? 0

            : Math.round(
                (
                    completed /
                    total
                ) *
                100
            );


    return {
        total,
        completed,
        percentage
    };
};


/* ============================================================
   CALCULATE PROGRESS
============================================================ */

const calculateProgress = (
    plan
) => {

    const topicStats =
        calculateCategoryStats(
            plan.topics
        );


    const resourceStats =
        calculateCategoryStats(
            plan.resources
        );


    const projectStats =
        calculateCategoryStats(
            plan.projects
        );


    const totalItems =

        topicStats.total +
        resourceStats.total +
        projectStats.total;


    const completedItems =

        topicStats.completed +
        resourceStats.completed +
        projectStats.completed;


    const overallPercentage =

        totalItems ===
        0

            ? 0

            : Math.round(
                (
                    completedItems /
                    totalItems
                ) *
                100
            );


    plan.progress = {

        topicPercentage:
            topicStats.percentage,

        resourcePercentage:
            resourceStats.percentage,

        projectPercentage:
            projectStats.percentage,

        overallPercentage,

        completedItems,

        totalItems
    };


    /*
    ========================================================
    STATUS
    ========================================================
    */

    if (
        totalItems >
            0 &&
        completedItems ===
            totalItems
    ) {

        plan.status =
            "completed";


        if (
            !plan.startedAt
        ) {

            plan.startedAt =
                new Date();
        }


        if (
            !plan.completedAt
        ) {

            plan.completedAt =
                new Date();
        }

    } else if (
        plan.startedAt ||
        completedItems >
            0
    ) {

        plan.status =
            "in-progress";

        plan.completedAt =
            null;

    } else {

        plan.status =
            "not-started";

        plan.completedAt =
            null;
    }


    return plan.progress;
};


/* ============================================================
   PLAIN SUBDOCUMENT
============================================================ */

const toPlain = (
    value
) => {

    if (
        value &&
        typeof value.toObject ===
            "function"
    ) {

        return value.toObject();
    }


    return {
        ...value
    };
};


/* ============================================================
   MERGE TOPICS
============================================================ */

const mergeTopics = (
    existingItems,
    topics
) => {

    const existingMap =
        new Map(

            safeArray(
                existingItems
            ).map(
                (
                    item
                ) => [
                    item.key,
                    toPlain(item)
                ]
            )
        );


    const result =
        safeArray(
            existingItems
        ).map(
            (
                item
            ) => ({
                ...toPlain(item),

                isActive:
                    false
            })
        );


    const indexMap =
        new Map(

            result.map(
                (
                    item,
                    index
                ) => [
                    item.key,
                    index
                ]
            )
        );


    const seen =
        new Set();


    for (
        const topic
        of safeArray(
            topics
        )
    ) {

        const name =
            normalizeText(

                typeof topic ===
                "string"

                    ? topic

                    : topic?.name
            );


        if (
            !name
        ) {

            continue;
        }


        const key =
            normalizeTrackingKey(
                name
            );


        if (
            seen.has(
                key
            )
        ) {

            continue;
        }


        seen.add(
            key
        );


        const existing =
            existingMap.get(
                key
            );


        const nextItem = {

            key,

            name,

            isActive:
                true,

            isCompleted:
                Boolean(
                    existing
                        ?.isCompleted
                ),

            completedAt:
                existing
                    ?.completedAt ||
                null
        };


        if (
            indexMap.has(
                key
            )
        ) {

            result[
                indexMap.get(
                    key
                )
            ] = nextItem;

        } else {

            result.push(
                nextItem
            );
        }
    }


    return result;
};


/* ============================================================
   RESOURCE KEY
============================================================ */

const getResourceKey = (
    resource
) => {

    return normalizeTrackingKey(

        resource
            ?.url ||

        resource
            ?.externalId ||

        resource
            ?.id ||

        resource
            ?._id ||

        resource
            ?.title
    );
};


/* ============================================================
   MERGE RESOURCES
============================================================ */

const mergeResources = (
    existingItems,
    resources
) => {

    const existingMap =
        new Map(

            safeArray(
                existingItems
            ).map(
                (
                    item
                ) => [
                    item.key,
                    toPlain(item)
                ]
            )
        );


    const result =
        safeArray(
            existingItems
        ).map(
            (
                item
            ) => ({
                ...toPlain(item),

                isActive:
                    false
            })
        );


    const indexMap =
        new Map(

            result.map(
                (
                    item,
                    index
                ) => [
                    item.key,
                    index
                ]
            )
        );


    const seen =
        new Set();


    for (
        const resource
        of safeArray(
            resources
        )
    ) {

        const key =
            getResourceKey(
                resource
            );


        if (
            !key ||
            seen.has(
                key
            )
        ) {

            continue;
        }


        seen.add(
            key
        );


        const existing =
            existingMap.get(
                key
            );


        const possibleResourceId =

            resource
                ?.id ||

            resource
                ?._id;


        const resourceId =

            mongoose.isValidObjectId(
                possibleResourceId
            )

                ? possibleResourceId

                : null;


        const nextItem = {

            key,

            resourceId,

            title:
                normalizeText(
                    resource
                        ?.title ||
                    "Learning Resource"
                ),

            url:
                normalizeText(
                    resource
                        ?.url
                ),

            type:
                normalizeText(
                    resource
                        ?.type ||
                    "resource"
                ),

            source:
                normalizeText(
                    resource
                        ?.source ||
                    "unknown"
                ),

            isActive:
                true,

            isCompleted:
                Boolean(
                    existing
                        ?.isCompleted
                ),

            completedAt:
                existing
                    ?.completedAt ||
                null,

            lastAccessedAt:
                existing
                    ?.lastAccessedAt ||
                null
        };


        if (
            indexMap.has(
                key
            )
        ) {

            result[
                indexMap.get(
                    key
                )
            ] = nextItem;

        } else {

            result.push(
                nextItem
            );
        }
    }


    return result;
};


/* ============================================================
   PROJECT TITLE
============================================================ */

const getProjectTitle = (
    project
) => {

    if (
        typeof project ===
        "string"
    ) {

        return normalizeText(
            project
        );
    }


    return normalizeText(

        project
            ?.title ||

        project
            ?.name
    );
};


/* ============================================================
   MERGE PROJECTS
============================================================ */

const mergeProjects = (
    existingItems,
    projects
) => {

    const existingMap =
        new Map(

            safeArray(
                existingItems
            ).map(
                (
                    item
                ) => [
                    item.key,
                    toPlain(item)
                ]
            )
        );


    const result =
        safeArray(
            existingItems
        ).map(
            (
                item
            ) => ({
                ...toPlain(item),

                isActive:
                    false
            })
        );


    const indexMap =
        new Map(

            result.map(
                (
                    item,
                    index
                ) => [
                    item.key,
                    index
                ]
            )
        );


    const seen =
        new Set();


    for (
        const project
        of safeArray(
            projects
        )
    ) {

        const title =
            getProjectTitle(
                project
            );


        if (
            !title
        ) {

            continue;
        }


        const key =
            normalizeTrackingKey(
                title
            );


        if (
            seen.has(
                key
            )
        ) {

            continue;
        }


        seen.add(
            key
        );


        const existing =
            existingMap.get(
                key
            );


        const nextItem = {

            key,

            title,

            description:

                typeof project ===
                "object"

                    ? normalizeText(
                        project
                            ?.description
                    )

                    : "",

            isActive:
                true,

            isCompleted:
                Boolean(
                    existing
                        ?.isCompleted
                ),

            completedAt:
                existing
                    ?.completedAt ||
                null
        };


        if (
            indexMap.has(
                key
            )
        ) {

            result[
                indexMap.get(
                    key
                )
            ] = nextItem;

        } else {

            result.push(
                nextItem
            );
        }
    }


    return result;
};


/* ============================================================
   FORMAT SKILL PROGRESS
============================================================ */

const formatSkillProgress = (
    plan
) => {

    return {

        id:
            plan
                ?._id
                ?.toString?.() ||
            null,

        skill: {

            id:

                plan
                    ?.skill
                    ?._id
                    ?.toString?.() ||

                plan
                    ?.skill
                    ?.toString?.() ||

                null,

            name:
                plan
                    ?.skillName ||
                ""
        },

        status:
            plan
                ?.status ||
            "not-started",

        topics:
            safeArray(
                plan
                    ?.topics
            ).filter(
                (
                    item
                ) =>
                    item
                        ?.isActive !==
                    false
            ),

        resources:
            safeArray(
                plan
                    ?.resources
            ).filter(
                (
                    item
                ) =>
                    item
                        ?.isActive !==
                    false
            ),

        projects:
            safeArray(
                plan
                    ?.projects
            ).filter(
                (
                    item
                ) =>
                    item
                        ?.isActive !==
                    false
            ),

        progress:
            plan
                ?.progress ||
            {},

        startedAt:
            plan
                ?.startedAt ||
            null,

        completedAt:
            plan
                ?.completedAt ||
            null,

        lastActivityAt:
            plan
                ?.lastActivityAt ||
            null,

        updatedAt:
            plan
                ?.updatedAt ||
            null
    };
};


/* ============================================================
   GET PROGRESS SNAPSHOT
============================================================ */

const getLearningProgress =
    async ({
        userId,
        resumeId
    }) => {

        await verifyResumeOwnership({
            userId,
            resumeId
        });


        const plans =
            await UserLearningPlan
                .find({
                    user:
                        userId,

                    resume:
                        resumeId,

                    isActive:
                        true
                })
                .sort({
                    updatedAt:
                        -1
                });


        const formatted =
            plans.map(
                formatSkillProgress
            );


        const totalSkills =
            formatted.length;


        const startedSkills =
            formatted.filter(
                (
                    plan
                ) =>
                    plan.status ===
                        "in-progress" ||

                    plan.status ===
                        "completed"
            ).length;


        const completedSkills =
            formatted.filter(
                (
                    plan
                ) =>
                    plan.status ===
                    "completed"
            ).length;


        const totalItems =
            formatted.reduce(
                (
                    total,
                    plan
                ) =>
                    total +
                    safeNumber(
                        plan
                            ?.progress
                            ?.totalItems
                    ),
                0
            );


        const completedItems =
            formatted.reduce(
                (
                    total,
                    plan
                ) =>
                    total +
                    safeNumber(
                        plan
                            ?.progress
                            ?.completedItems
                    ),
                0
            );


        const overallPercentage =

            totalItems ===
            0

                ? 0

                : Math.round(
                    (
                        completedItems /
                        totalItems
                    ) *
                    100
                );


        return {

            resumeId,

            summary: {

                totalSkills,

                startedSkills,

                completedSkills,

                completedItems,

                totalItems,

                overallPercentage
            },

            skills:
                formatted
        };
    };


/* ============================================================
   SYNC ONE SKILL
============================================================ */

const syncSkillProgress =
    async ({
        userId,
        resumeId,
        recommendation
    }) => {

        /*
        Recommendation may contain:

        skill: "SQL"

        OR

        skill: {
            id: "...",
            name: "SQL"
        }

        OR

        skill: {
            _id: "...",
            name: "SQL"
        }
        */

        let skillInput =
            null;


        if (
            typeof recommendation
                ?.skill ===
            "string"
        ) {

            skillInput =
                recommendation.skill;

        } else {

            skillInput =

                recommendation
                    ?.skill
                    ?.id ||

                recommendation
                    ?.skill
                    ?._id ||

                recommendation
                    ?.skill
                    ?.name ||

                recommendation
                    ?.skillName ||

                recommendation
                    ?.name;
        }


        if (
            !skillInput
        ) {

            throw createServiceError(
                "Learning recommendation does not contain a valid skill.",
                400
            );
        }


        const skill =
            await resolveSkill(
                skillInput
            );


        let plan =
            await UserLearningPlan
                .findOne({
                    user:
                        userId,

                    resume:
                        resumeId,

                    skill:
                        skill._id
                });


        /*
        ========================================================
        CREATE PLAN
        ========================================================
        */

        if (
            !plan
        ) {

            try {

                plan =
                    await UserLearningPlan
                        .create({

                            user:
                                userId,

                            resume:
                                resumeId,

                            skill:
                                skill._id,

                            skillName:
                                skill.name,

                            status:
                                "not-started",

                            topics:
                                [],

                            resources:
                                [],

                            projects:
                                [],

                            progress:
                                {},

                            startedAt:
                                null,

                            completedAt:
                                null,

                            lastActivityAt:
                                null,

                            isActive:
                                true
                        });

            } catch (
                error
            ) {

                /*
                Handle race condition if two requests create
                the same unique user/resume/skill document.
                */

                if (
                    error
                        ?.code !==
                    11000
                ) {

                    throw error;
                }


                plan =
                    await UserLearningPlan
                        .findOne({
                            user:
                                userId,

                            resume:
                                resumeId,

                            skill:
                                skill._id
                        });


                if (
                    !plan
                ) {

                    throw error;
                }
            }
        }


        /*
        ========================================================
        MERGE CURRENT ROADMAP
        ========================================================
        */

        plan.skillName =
            skill.name;


        plan.isActive =
            true;


        plan.topics =
            mergeTopics(
                plan.topics,
                recommendation
                    ?.topics
            );


        plan.resources =
            mergeResources(
                plan.resources,
                recommendation
                    ?.resources
            );


        plan.projects =
            mergeProjects(
                plan.projects,
                recommendation
                    ?.projects
            );


        calculateProgress(
            plan
        );


        await plan.save();


        return plan;
    };


/* ============================================================
   SYNC CURRENT LEARNING ROADMAP
============================================================ */

const syncLearningProgress =
    async ({
        userId,
        resumeId,
        skills
    }) => {

        /*
        ========================================================
        VERIFY RESUME
        ========================================================
        */

        await verifyResumeOwnership({
            userId,
            resumeId
        });


        const recommendations =
            safeArray(
                skills
            )
                .filter(
                    Boolean
                )
                .slice(
                    0,
                    20
                );


        const activeSkillIds =
            [];


        const syncErrors =
            [];


        /*
        ========================================================
        IMPORTANT FIX

        Sync the new roadmap BEFORE deactivating old skills.

        The old version could deactivate every plan and then
        leave the page at 0 / 0 when one sync failed.
        ========================================================
        */

        for (
            const recommendation
            of recommendations
        ) {

            try {

                const plan =
                    await syncSkillProgress({
                        userId,
                        resumeId,
                        recommendation
                    });


                if (
                    plan
                        ?.skill
                ) {

                    activeSkillIds.push(
                        plan.skill
                    );
                }

            } catch (
                error
            ) {

                const skillName =

                    typeof recommendation
                        ?.skill ===
                    "string"

                        ? recommendation.skill

                        : (
                            recommendation
                                ?.skill
                                ?.name ||

                            recommendation
                                ?.skillName ||

                            recommendation
                                ?.name ||

                            "Unknown"
                        );


                console.error(
                    "Learning progress skill sync failed:",
                    {
                        skill:
                            skillName,

                        message:
                            error.message
                    }
                );


                syncErrors.push({
                    skill:
                        skillName,

                    message:
                        error.message
                });
            }
        }


        /*
        ========================================================
        DEACTIVATE OLD ROADMAP SKILLS

        Only run this after at least one skill was
        successfully initialized.
        ========================================================
        */

        if (
            activeSkillIds.length >
            0
        ) {

            await UserLearningPlan
                .updateMany(
                    {
                        user:
                            userId,

                        resume:
                            resumeId,

                        skill: {
                            $nin:
                                activeSkillIds
                        }
                    },
                    {
                        $set: {
                            isActive:
                                false
                        }
                    }
                );
        }


        const progress =
            await getLearningProgress({
                userId,
                resumeId
            });


        return {

            ...progress,

            sync: {

                requestedSkills:
                    recommendations.length,

                initializedSkills:
                    activeSkillIds.length,

                failedSkills:
                    syncErrors.length,

                errors:
                    syncErrors
            }
        };
    };


/* ============================================================
   GET / AUTO-INITIALIZE TRACKED SKILL
============================================================ */

const getTrackedSkill =
    async ({
        userId,
        resumeId,
        skill,
        createIfMissing = true
    }) => {

        /*
        ========================================================
        VERIFY RESUME
        ========================================================
        */

        await verifyResumeOwnership({
            userId,
            resumeId
        });


        /*
        ========================================================
        RESOLVE SKILL
        ========================================================
        */

        const resolvedSkill =
            await resolveSkill(
                skill
            );


        /*
        ========================================================
        FIND PLAN

        IMPORTANT:
        Do NOT filter by isActive here.

        An old sync may have marked it inactive.
        We should reactivate it instead of throwing 404.
        ========================================================
        */

        let plan =
            await UserLearningPlan
                .findOne({
                    user:
                        userId,

                    resume:
                        resumeId,

                    skill:
                        resolvedSkill._id
                });


        /*
        ========================================================
        AUTO INITIALIZE

        This fixes:

        "Learning progress for this skill has not been
        initialized."

        Even if the initial roadmap sync failed, the first
        progress action can create the record automatically.
        ========================================================
        */

        if (
            !plan &&
            createIfMissing
        ) {

            try {

                plan =
                    await UserLearningPlan
                        .create({

                            user:
                                userId,

                            resume:
                                resumeId,

                            skill:
                                resolvedSkill._id,

                            skillName:
                                resolvedSkill.name,

                            status:
                                "not-started",

                            topics:
                                [],

                            resources:
                                [],

                            projects:
                                [],

                            progress: {

                                topicPercentage:
                                    0,

                                resourcePercentage:
                                    0,

                                projectPercentage:
                                    0,

                                overallPercentage:
                                    0,

                                completedItems:
                                    0,

                                totalItems:
                                    0
                            },

                            startedAt:
                                null,

                            completedAt:
                                null,

                            lastActivityAt:
                                null,

                            isActive:
                                true
                        });

            } catch (
                error
            ) {

                /*
                Duplicate key can happen if two requests
                initialize the same skill simultaneously.
                */

                if (
                    error
                        ?.code ===
                    11000
                ) {

                    plan =
                        await UserLearningPlan
                            .findOne({
                                user:
                                    userId,

                                resume:
                                    resumeId,

                                skill:
                                    resolvedSkill._id
                            });

                } else {

                    throw error;
                }
            }
        }


        if (
            !plan
        ) {

            throw createServiceError(
                "Learning progress could not be initialized.",
                404
            );
        }


        /*
        ========================================================
        REACTIVATE
        ========================================================
        */

        let shouldSave =
            false;


        if (
            plan.isActive ===
            false
        ) {

            plan.isActive =
                true;

            shouldSave =
                true;
        }


        if (
            plan.skillName !==
            resolvedSkill.name
        ) {

            plan.skillName =
                resolvedSkill.name;

            shouldSave =
                true;
        }


        if (
            shouldSave
        ) {

            await plan.save();
        }


        return {

            plan,

            skill:
                resolvedSkill
        };
    };


/* ============================================================
   START SKILL
============================================================ */

const startSkillProgress =
    async ({
        userId,
        resumeId,
        skill
    }) => {

        const {
            plan
        } =
            await getTrackedSkill({
                userId,
                resumeId,
                skill
            });


        if (
            !plan.startedAt
        ) {

            plan.startedAt =
                new Date();
        }


        if (
            plan.status ===
            "not-started"
        ) {

            plan.status =
                "in-progress";
        }


        plan.lastActivityAt =
            new Date();


        calculateProgress(
            plan
        );


        await plan.save();


        return getLearningProgress({
            userId,
            resumeId
        });
    };


/* ============================================================
   ADD DYNAMIC ITEM
============================================================ */

const addMissingItem = ({
    plan,
    itemType,
    key,
    item
}) => {

    /*
    ========================================================
    TOPIC
    ========================================================
    */

    if (
        itemType ===
        "topic"
    ) {

        const name =
            normalizeText(

                item
                    ?.name ||

                item
                    ?.title ||

                key
            );


        plan.topics.push({

            key,

            name,

            isActive:
                true,

            isCompleted:
                false,

            completedAt:
                null
        });


        return plan.topics[
            plan.topics.length -
            1
        ];
    }


    /*
    ========================================================
    PROJECT
    ========================================================
    */

    if (
        itemType ===
        "project"
    ) {

        const title =
            normalizeText(

                item
                    ?.title ||

                item
                    ?.name ||

                key
            );


        plan.projects.push({

            key,

            title,

            description:
                normalizeText(
                    item
                        ?.description
                ),

            isActive:
                true,

            isCompleted:
                false,

            completedAt:
                null
        });


        return plan.projects[
            plan.projects.length -
            1
        ];
    }


    /*
    ========================================================
    RESOURCE

    This also handles live YouTube resources.
    ========================================================
    */

    if (
        itemType ===
        "resource"
    ) {

        const possibleResourceId =

            item
                ?.id ||

            item
                ?._id;


        plan.resources.push({

            key,

            resourceId:

                mongoose.isValidObjectId(
                    possibleResourceId
                )

                    ? possibleResourceId

                    : null,

            title:
                normalizeText(
                    item
                        ?.title ||
                    "Learning Resource"
                ),

            url:
                normalizeText(
                    item
                        ?.url
                ),

            type:
                normalizeText(
                    item
                        ?.type ||
                    "resource"
                ),

            source:
                normalizeText(
                    item
                        ?.source ||
                    "unknown"
                ),

            isActive:
                true,

            isCompleted:
                false,

            completedAt:
                null,

            lastAccessedAt:
                null
        });


        return plan.resources[
            plan.resources.length -
            1
        ];
    }


    return null;
};


/* ============================================================
   UPDATE TOPIC / RESOURCE / PROJECT
============================================================ */

const updateLearningItemProgress =
    async ({
        userId,
        resumeId,
        skill,
        itemType,
        key,
        completed,
        item = {}
    }) => {

        const normalizedType =
            normalizeTrackingKey(
                itemType
            );


        if (
            ![
                "topic",
                "resource",
                "project"
            ].includes(
                normalizedType
            )
        ) {

            throw createServiceError(
                "itemType must be topic, resource, or project.",
                400
            );
        }


        const normalizedKey =
            normalizeTrackingKey(
                key
            );


        if (
            !normalizedKey
        ) {

            throw createServiceError(
                "Progress item key is required.",
                400
            );
        }


        /*
        getTrackedSkill now automatically initializes
        missing UserLearningPlan documents.
        */

        const {
            plan
        } =
            await getTrackedSkill({
                userId,
                resumeId,
                skill
            });


        const collection =

            normalizedType ===
            "topic"

                ? plan.topics

                : normalizedType ===
                  "project"

                ? plan.projects

                : plan.resources;


        let progressItem =
            collection.find(
                (
                    current
                ) =>
                    current.key ===
                    normalizedKey
            );


        /*
        A live YouTube resource or newly generated topic/project
        may not have existed during the initial roadmap sync.
        Add it dynamically.
        */

        if (
            !progressItem
        ) {

            progressItem =
                addMissingItem({

                    plan,

                    itemType:
                        normalizedType,

                    key:
                        normalizedKey,

                    item
                });
        }


        if (
            !progressItem
        ) {

            throw createServiceError(
                "Unable to create learning progress item.",
                400
            );
        }


        progressItem.isActive =
            true;


        progressItem.isCompleted =
            Boolean(
                completed
            );


        progressItem.completedAt =

            completed

                ? new Date()

                : null;


        /*
        First completion automatically starts the skill.
        */

        if (
            !plan.startedAt
        ) {

            plan.startedAt =
                new Date();
        }


        plan.lastActivityAt =
            new Date();


        calculateProgress(
            plan
        );


        await plan.save();


        return getLearningProgress({
            userId,
            resumeId
        });
    };


/* ============================================================
   RESOURCE ACCESS
============================================================ */

const markLearningResourceAccessed =
    async ({
        userId,
        resumeId,
        skill,
        key,
        item = {}
    }) => {

        const normalizedKey =
            normalizeTrackingKey(
                key
            );


        if (
            !normalizedKey
        ) {

            throw createServiceError(
                "Resource key is required.",
                400
            );
        }


        const {
            plan
        } =
            await getTrackedSkill({
                userId,
                resumeId,
                skill
            });


        let resource =
            plan.resources.find(
                (
                    current
                ) =>
                    current.key ===
                    normalizedKey
            );


        /*
        Live YouTube/resource may not exist in initial sync.
        */

        if (
            !resource
        ) {

            resource =
                addMissingItem({

                    plan,

                    itemType:
                        "resource",

                    key:
                        normalizedKey,

                    item
                });
        }


        if (
            !resource
        ) {

            throw createServiceError(
                "Unable to create learning resource progress item.",
                400
            );
        }


        resource.isActive =
            true;


        resource.lastAccessedAt =
            new Date();


        if (
            !plan.startedAt
        ) {

            plan.startedAt =
                new Date();
        }


        plan.lastActivityAt =
            new Date();


        calculateProgress(
            plan
        );


        await plan.save();


        return getLearningProgress({
            userId,
            resumeId
        });
    };


/* ============================================================
   EXPORTS
============================================================ */

module.exports = {

    syncLearningProgress,

    getLearningProgress,

    startSkillProgress,

    updateLearningItemProgress,

    markLearningResourceAccessed,

    normalizeTrackingKey,

    calculateProgress
};