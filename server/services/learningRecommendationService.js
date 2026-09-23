const mongoose = require("mongoose");

const Resume =
    require("../models/Resume");

const JobRequirement =
    require("../models/JobRequirement");

const {
    getRecommendedResources,
    determineLearningLevel,
    normalizeSkillName
} = require(
    "./learningResourceService"
);


/*
============================================================
LEARNING RECOMMENDATION SERVICE
============================================================

PURPOSE

Resume Skill Gap
        +
Job Requirements
        +
Assessment Performance
        +
Job Readiness
        ↓
Priority Calculation
        ↓
Topics To Learn
        ↓
Projects
        ↓
Estimated Duration
        ↓
Verified Learning Resources
        ↓
Personalized Learning Roadmap

IMPORTANT

This service decides WHAT the user should learn.

learningResourceService.js decides WHICH trusted resources
should be attached.

The AI / recommendation layer never invents URLs.
============================================================
*/


/*
============================================================
CONFIGURATION
============================================================
*/

const DEFAULT_MAX_SKILLS = 5;

const DEFAULT_RESOURCES_PER_SKILL = 6;

const DEFAULT_TARGET_SCORE = 75;


/*
============================================================
TARGET SCORE BY REQUIRED LEVEL
============================================================
*/

const REQUIRED_LEVEL_TARGETS = {

    beginner:
        60,

    intermediate:
        75,

    advanced:
        85
};


/*
============================================================
TOPIC LIBRARY
============================================================

Fallback recommendation topics.

Later an AI model can enrich these topics, but this gives us
deterministic recommendations immediately.
============================================================
*/

const SKILL_TOPIC_LIBRARY = {

    sql: {
        beginner: [
            "SQL Fundamentals",
            "SELECT",
            "WHERE",
            "ORDER BY",
            "GROUP BY",
            "Aggregate Functions"
        ],

        intermediate: [
            "JOINs",
            "Subqueries",
            "CTEs",
            "CASE Expressions",
            "Window Functions",
            "Database Design"
        ],

        advanced: [
            "Advanced SQL",
            "Window Functions",
            "Query Optimization",
            "Indexes",
            "Execution Plans",
            "Transactions"
        ]
    },


    python: {
        beginner: [
            "Python Fundamentals",
            "Variables",
            "Data Types",
            "Conditions",
            "Loops",
            "Functions"
        ],

        intermediate: [
            "Object Oriented Programming",
            "File Handling",
            "Exception Handling",
            "Modules",
            "Collections",
            "Python Problem Solving"
        ],

        advanced: [
            "Advanced Python",
            "Decorators",
            "Generators",
            "Concurrency",
            "Testing",
            "Performance Optimization"
        ]
    },


    javascript: {
        beginner: [
            "JavaScript Fundamentals",
            "Variables",
            "Functions",
            "Arrays",
            "Objects",
            "DOM"
        ],

        intermediate: [
            "Modern JavaScript",
            "Promises",
            "Async Await",
            "Closures",
            "ES6 Modules",
            "Error Handling"
        ],

        advanced: [
            "Advanced JavaScript",
            "Event Loop",
            "Performance",
            "Design Patterns",
            "Functional Programming",
            "Testing"
        ]
    },


    react: {
        beginner: [
            "React Fundamentals",
            "JSX",
            "Components",
            "Props",
            "State",
            "Events"
        ],

        intermediate: [
            "React Hooks",
            "Context API",
            "Forms",
            "Routing",
            "API Integration",
            "Component Architecture"
        ],

        advanced: [
            "React Performance",
            "Advanced Hooks",
            "State Management",
            "Testing",
            "Design Patterns",
            "Production Architecture"
        ]
    },


    "node.js": {
        beginner: [
            "Node.js Fundamentals",
            "Modules",
            "npm",
            "File System",
            "HTTP"
        ],

        intermediate: [
            "Express.js",
            "REST APIs",
            "Middleware",
            "Authentication",
            "Error Handling"
        ],

        advanced: [
            "Node.js Performance",
            "Security",
            "Caching",
            "Queues",
            "Scalable Architecture"
        ]
    },


    mongodb: {
        beginner: [
            "MongoDB Fundamentals",
            "Documents",
            "Collections",
            "CRUD Operations",
            "Queries"
        ],

        intermediate: [
            "Aggregation",
            "Indexes",
            "Schema Design",
            "Mongoose",
            "Relationships"
        ],

        advanced: [
            "MongoDB Performance",
            "Advanced Aggregation",
            "Transactions",
            "Replication",
            "Scaling"
        ]
    },


    "data analysis": {
        beginner: [
            "Data Analysis Fundamentals",
            "Data Cleaning",
            "Exploratory Data Analysis",
            "Basic Statistics"
        ],

        intermediate: [
            "Data Analysis with Python",
            "Data Transformation",
            "Feature Analysis",
            "Business Metrics",
            "Reporting"
        ],

        advanced: [
            "Advanced Analytics",
            "Experimental Analysis",
            "Statistical Modeling",
            "Analytics Automation"
        ]
    },


    pandas: {
        beginner: [
            "Pandas Fundamentals",
            "Series",
            "DataFrames",
            "Reading Data",
            "Filtering"
        ],

        intermediate: [
            "Pandas Practice",
            "GroupBy",
            "Merge",
            "Missing Values",
            "Data Transformation"
        ],

        advanced: [
            "Pandas Optimization",
            "Time Series",
            "Advanced Indexing",
            "Vectorization"
        ]
    },


    "machine learning": {
        beginner: [
            "Machine Learning Fundamentals",
            "Regression",
            "Classification",
            "Train Test Split",
            "Model Evaluation"
        ],

        intermediate: [
            "Machine Learning with Python",
            "Feature Engineering",
            "Cross Validation",
            "Hyperparameter Tuning",
            "Ensemble Models"
        ],

        advanced: [
            "Advanced Machine Learning",
            "Model Optimization",
            "Pipelines",
            "Deployment",
            "ML System Design"
        ]
    },


    statistics: {
        beginner: [
            "Statistics Fundamentals",
            "Mean Median Mode",
            "Variance",
            "Probability",
            "Distributions"
        ],

        intermediate: [
            "Applied Statistics",
            "Hypothesis Testing",
            "Confidence Intervals",
            "Correlation",
            "Regression"
        ],

        advanced: [
            "Advanced Statistics",
            "Statistical Inference",
            "Bayesian Statistics",
            "Experimental Design"
        ]
    },


    "power bi": {
        beginner: [
            "Power BI Fundamentals",
            "Power Query",
            "Data Import",
            "Basic Visualizations",
            "Dashboards"
        ],

        intermediate: [
            "Data Modeling",
            "DAX",
            "Relationships",
            "Interactive Reports",
            "Dashboard Design"
        ],

        advanced: [
            "Advanced DAX",
            "Power BI Performance",
            "Row Level Security",
            "Enterprise Reporting"
        ]
    },


    "data visualization": {
        beginner: [
            "Visualization Fundamentals",
            "Chart Selection",
            "Matplotlib",
            "Basic Dashboards"
        ],

        intermediate: [
            "Interactive Dashboards",
            "Tableau",
            "Storytelling With Data",
            "Dashboard Design"
        ],

        advanced: [
            "Advanced Visualization",
            "Executive Dashboards",
            "Visualization Performance",
            "Data Storytelling"
        ]
    },


    "data structures and algorithms": {
        beginner: [
            "DSA Fundamentals",
            "Arrays",
            "Strings",
            "Searching",
            "Sorting",
            "Complexity Analysis"
        ],

        intermediate: [
            "Linked Lists",
            "Stacks",
            "Queues",
            "Trees",
            "Hashing",
            "Recursion"
        ],

        advanced: [
            "Graphs",
            "Dynamic Programming",
            "Greedy Algorithms",
            "Advanced Trees",
            "Backtracking"
        ]
    },


    git: {
        beginner: [
            "Git Fundamentals",
            "Repositories",
            "Commits",
            "Branches",
            "GitHub Workflow"
        ],

        intermediate: [
            "Merge",
            "Rebase",
            "Pull Requests",
            "Git Collaboration"
        ],

        advanced: [
            "Advanced Git",
            "Git Internals",
            "Complex Branching Workflows"
        ]
    },


    docker: {
        beginner: [
            "Docker Fundamentals",
            "Containers",
            "Images",
            "Dockerfiles"
        ],

        intermediate: [
            "Docker Compose",
            "Volumes",
            "Networking",
            "Docker Practice"
        ],

        advanced: [
            "Docker Security",
            "Container Optimization",
            "Production Containers"
        ]
    }
};


/*
============================================================
PROJECT LIBRARY
============================================================
*/

const PROJECT_LIBRARY = {

    sql: [
        "E-commerce Sales Analytics Database",
        "Employee Management SQL Analytics",
        "Customer Retention Analysis",
        "Online Store Reporting System"
    ],

    python: [
        "Expense Tracker",
        "Automation Toolkit",
        "Data Processing Pipeline",
        "REST API Client"
    ],

    javascript: [
        "Interactive Task Manager",
        "Expense Dashboard",
        "Weather Application",
        "Interactive Quiz Platform"
    ],

    react: [
        "Job Tracking Dashboard",
        "Analytics Dashboard",
        "E-commerce Frontend",
        "Learning Management Interface"
    ],

    "node.js": [
        "REST API Backend",
        "Authentication Service",
        "Job Portal Backend",
        "Real-time Notification Service"
    ],

    mongodb: [
        "User Management Database",
        "E-commerce Product Database",
        "Analytics Data Store",
        "Content Management Backend"
    ],

    pandas: [
        "Sales Data Cleaning Pipeline",
        "Customer Behaviour Analysis",
        "Netflix Dataset Analysis",
        "Financial Dataset Explorer"
    ],

    "data analysis": [
        "Retail Sales Analysis",
        "Customer Churn Dashboard",
        "Marketing Campaign Analysis",
        "Business KPI Dashboard"
    ],

    "machine learning": [
        "Customer Churn Prediction",
        "House Price Prediction",
        "Sentiment Analysis",
        "Recommendation System"
    ],

    statistics: [
        "A/B Testing Analysis",
        "Customer Survey Analysis",
        "Sales Forecast Evaluation",
        "Statistical Experiment Report"
    ],

    "power bi": [
        "Executive Sales Dashboard",
        "HR Analytics Dashboard",
        "Financial KPI Dashboard",
        "Customer Analytics Dashboard"
    ],

    "data visualization": [
        "Interactive Sales Dashboard",
        "Customer Behaviour Dashboard",
        "Public Dataset Storytelling Project"
    ],

    "data structures and algorithms": [
        "Algorithm Visualizer",
        "Path Finding Visualizer",
        "Data Structure Playground"
    ],

    docker: [
        "Dockerized MERN Application",
        "Multi-container API Deployment",
        "Containerized Data Pipeline"
    ],

    git: [
        "Open Source Contribution",
        "Collaborative Git Workflow Project"
    ]
};


/*
============================================================
HELPERS
============================================================
*/

const safeArray = (
    value
) => {

    return Array.isArray(value)
        ? value
        : [];
};


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


const clamp = (
    value,
    min = 0,
    max = 100
) => {

    return Math.min(
        max,
        Math.max(
            min,
            safeNumber(value)
        )
    );
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


const normalizeRequiredLevel = (
    value
) => {

    const level =
        normalizeText(
            value
        )
            .toLowerCase();


    if (
        [
            "beginner",
            "intermediate",
            "advanced"
        ].includes(level)
    ) {

        return level;
    }


    return "intermediate";
};


/*
============================================================
GET TARGET SCORE
============================================================
*/

const getTargetScore = (
    requiredLevel
) => {

    const normalized =
        normalizeRequiredLevel(
            requiredLevel
        );


    return (
        REQUIRED_LEVEL_TARGETS[
            normalized
        ] ||
        DEFAULT_TARGET_SCORE
    );
};


/*
============================================================
NORMALIZE SKILL PERFORMANCE
============================================================
*/

const normalizeSkillPerformance = (
    skillPerformance
) => {

    if (
        Array.isArray(
            skillPerformance
        )
    ) {

        return skillPerformance;
    }


    if (
        skillPerformance &&
        typeof skillPerformance ===
            "object"
    ) {

        return Object.entries(
            skillPerformance
        ).map(
            ([key, item]) => {

                if (
                    item &&
                    typeof item ===
                        "object"
                ) {

                    return {
                        key,
                        ...item
                    };
                }


                return {
                    skill:
                        key,

                    percentage:
                        item
                };
            }
        );
    }


    return [];
};


/*
============================================================
GET SKILL NAME
============================================================
*/

const getSkillName = (
    value
) => {

    if (
        typeof value ===
        "string"
    ) {

        return value;
    }


    return (
        value?.skill?.name ||
        value?.skillName ||
        value?.skill ||
        value?.name ||
        value?.key ||
        ""
    );
};


/*
============================================================
GET ASSESSMENT SCORE FOR SKILL
============================================================
*/

const findAssessmentScore = (
    skillName,
    skillPerformance
) => {

    const normalizedTarget =
        normalizeSkillName(
            skillName
        );


    const item =
        skillPerformance.find(
            (entry) => {

                return (
                    normalizeSkillName(
                        getSkillName(entry)
                    ) ===
                    normalizedTarget
                );
            }
        );


    if (
        !item
    ) {

        return null;
    }


    const value =

        item?.percentage ??
        item?.averagePercentage ??
        item?.currentScore ??
        item?.score ??
        item?.value;


    if (
        value ===
        undefined ||
        value ===
        null
    ) {

        return null;
    }


    return clamp(value);
};


/*
============================================================
GET TOPICS
============================================================
*/

const getRecommendedTopics = ({
    skillName,
    currentScore,
    requiredLevel
}) => {

    const normalizedSkill =
        normalizeSkillName(
            skillName
        );


    const library =
        SKILL_TOPIC_LIBRARY[
            normalizedSkill
        ];


    if (
        !library
    ) {

        return [
            `${skillName} Fundamentals`,
            `${skillName} Practice`,
            `${skillName} Projects`
        ];
    }


    /*
    Use current assessment level when possible.
    */

    const learningLevel =
        determineLearningLevel(
            currentScore
        );


    /*
    If the role requires advanced knowledge,
    include some higher-level topics as well.
    */

    const required =
        normalizeRequiredLevel(
            requiredLevel
        );


    let topics =
        safeArray(
            library[
                learningLevel
            ]
        );


    if (
        required ===
            "advanced" &&
        learningLevel !==
            "advanced"
    ) {

        topics = [
            ...topics,
            ...safeArray(
                library.advanced
            ).slice(
                0,
                2
            )
        ];
    }


    return [
        ...new Set(topics)
    ].slice(
        0,
        6
    );
};


/*
============================================================
GET PROJECTS
============================================================
*/

const getRecommendedProjects = (
    skillName
) => {

    const normalized =
        normalizeSkillName(
            skillName
        );


    return (
        PROJECT_LIBRARY[
            normalized
        ] ||
        [
            `${skillName} Practical Project`,
            `${skillName} Portfolio Project`
        ]
    )
        .slice(
            0,
            3
        );
};


/*
============================================================
ESTIMATE LEARNING DURATION
============================================================
*/

const estimateLearningDuration = ({
    currentScore,
    targetScore,
    isMissing
}) => {

    if (
        isMissing
    ) {

        return "3-4 weeks";
    }


    const gap =
        Math.max(
            targetScore -
            currentScore,
            0
        );


    if (
        gap >= 50
    ) {

        return "4-6 weeks";
    }


    if (
        gap >= 30
    ) {

        return "3-4 weeks";
    }


    if (
        gap >= 15
    ) {

        return "2-3 weeks";
    }


    if (
        gap > 0
    ) {

        return "1-2 weeks";
    }


    return "Ongoing practice";
};


/*
============================================================
CALCULATE PRIORITY SCORE
============================================================

Priority factors:

1. Job requirement importance
2. Missing from resume
3. Assessment performance gap
4. Required skill level
5. Overall job readiness

============================================================
*/

const calculatePriorityScore = ({
    importance,
    currentScore,
    targetScore,
    isMissing,
    requiredLevel,
    jobReadinessScore
}) => {

    const importanceScore =
        clamp(
            importance
        );


    const performanceGap =
        Math.max(
            targetScore -
            currentScore,
            0
        );


    const missingBonus =
        isMissing
            ? 25
            : 0;


    const levelBonus =

        normalizeRequiredLevel(
            requiredLevel
        ) === "advanced"

            ? 10

            : normalizeRequiredLevel(
                requiredLevel
            ) === "intermediate"

            ? 6

            : 2;


    /*
    Lower overall readiness slightly increases urgency.
    */

    const readinessGap =
        Math.max(
            100 -
            clamp(
                jobReadinessScore
            ),
            0
        );


    const rawScore =

        importanceScore * 0.35 +

        performanceGap * 0.40 +

        missingBonus +

        levelBonus +

        readinessGap * 0.05;


    return Math.round(
        clamp(
            rawScore
        )
    );
};


/*
============================================================
PRIORITY LABEL
============================================================
*/

const getPriorityLabel = (
    score
) => {

    if (
        score >= 75
    ) {

        return "critical";
    }


    if (
        score >= 55
    ) {

        return "high";
    }


    if (
        score >= 35
    ) {

        return "medium";
    }


    return "low";
};


/*
============================================================
BUILD REASON
============================================================
*/

const buildRecommendationReason = ({
    skillName,
    currentScore,
    targetScore,
    importance,
    requiredLevel,
    isMissing,
    hasAssessmentData
}) => {

    const reasons =
        [];


    if (
        isMissing
    ) {

        reasons.push(
            `${skillName} is required for the target role but is currently missing from the resume`
        );
    }


    if (
        hasAssessmentData &&
        currentScore <
            targetScore
    ) {

        reasons.push(
            `assessment performance is ${Math.round(currentScore)}%, below the ${targetScore}% target`
        );
    }


    if (
        !hasAssessmentData &&
        !isMissing
    ) {

        reasons.push(
            "there is not enough assessment evidence yet to confirm proficiency"
        );
    }


    if (
        importance >= 75
    ) {

        reasons.push(
            "the skill has high importance for the selected job"
        );
    }


    if (
        normalizeRequiredLevel(
            requiredLevel
        ) === "advanced"
    ) {

        reasons.push(
            "the role expects advanced proficiency"
        );
    }


    if (
        reasons.length ===
        0
    ) {

        reasons.push(
            "additional practice can strengthen job readiness"
        );
    }


    return (
        reasons
            .join("; ")
            .replace(
                /^./,
                (character) =>
                    character
                        .toUpperCase()
            ) +
        "."
    );
};


/*
============================================================
NEXT ACTION
============================================================
*/

const buildNextAction = ({
    skillName,
    priority,
    currentScore
}) => {

    if (
        priority ===
        "critical"
    ) {

        return (
            `Start ${skillName} immediately. ` +
            `Complete the beginner/intermediate learning resources, ` +
            `finish at least one practical project, then retake the related assessment.`
        );
    }


    if (
        priority ===
        "high"
    ) {

        return (
            `Focus next on ${skillName}. ` +
            `Complete the recommended topics and practice resources before retaking the assessment.`
        );
    }


    if (
        currentScore >= 75
    ) {

        return (
            `Maintain ${skillName} through advanced practice and a portfolio project.`
        );
    }


    return (
        `Practice ${skillName} regularly and complete the recommended learning resources.`
    );
};


/*
============================================================
ASSESSMENT TYPE RECOMMENDATION
============================================================
*/

const recommendAssessmentType = (
    skillName
) => {

    const normalized =
        normalizeSkillName(
            skillName
        );


    if (
        normalized ===
        "sql"
    ) {

        return "sql";
    }


    if (
        [
            "python",
            "javascript",
            "java",
            "c",
            "c++",
            "data structures and algorithms"
        ].includes(
            normalized
        )
    ) {

        return "coding";
    }


    return "mcq";
};


/*
============================================================
GENERATE SINGLE SKILL RECOMMENDATION
============================================================
*/

const generateSkillRecommendation =
    async ({
        requirement,
        currentScore,
        isMissing,
        jobReadinessScore,
        resourcesPerSkill
    }) => {

        const skillName =
            requirement
                ?.skill
                ?.name ||
            requirement
                ?.name ||
            "Unknown Skill";


        const requiredLevel =
            normalizeRequiredLevel(
                requirement
                    ?.requiredLevel
            );


        const importance =
            clamp(
                requirement
                    ?.importance ??
                50
            );


        const targetScore =
            getTargetScore(
                requiredLevel
            );


        const hasAssessmentData =
            currentScore !==
                null &&
            currentScore !==
                undefined;


        /*
        Missing skill without assessment data starts at zero.

        Existing skill without assessment data receives a neutral
        baseline so it does not automatically appear as completely
        unskilled.
        */

        const effectiveScore =
            hasAssessmentData
                ? clamp(
                    currentScore
                )
                : isMissing
                ? 0
                : 50;


        const priorityScore =
            calculatePriorityScore({

                importance,

                currentScore:
                    effectiveScore,

                targetScore,

                isMissing,

                requiredLevel,

                jobReadinessScore
            });


        const priority =
            getPriorityLabel(
                priorityScore
            );


        const topics =
            getRecommendedTopics({

                skillName,

                currentScore:
                    effectiveScore,

                requiredLevel
            });


        const projects =
            getRecommendedProjects(
                skillName
            );


        const estimatedDuration =
            estimateLearningDuration({

                currentScore:
                    effectiveScore,

                targetScore,

                isMissing
            });


        /*
        --------------------------------------------------------
        VERIFIED RESOURCE LOOKUP
        --------------------------------------------------------
        */

        let resourceResult = {

            totalResources:
                0,

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
        };


        try {

            resourceResult =
                await getRecommendedResources({

                    skill:
                        skillName,

                    currentScore:
                        effectiveScore,

                    topics,

                    totalLimit:
                        resourcesPerSkill,

                    limitPerType:
                        2,

                    includePaid:
                        false
                });


        } catch (
            resourceError
        ) {

            /*
            A missing resource catalog must not destroy the
            entire learning plan.
            */

            console.warn(
                `Learning resources unavailable for ${skillName}:`,
                resourceError.message
            );
        }


        return {

            skill: {

                id:
                    requirement
                        ?.skill
                        ?._id ||
                    requirement
                        ?.skill ||
                    null,

                name:
                    skillName
            },

            requiredLevel,

            importance,

            status:
                isMissing
                    ? "missing"
                    : "matched",

            assessment: {

                hasData:
                    hasAssessmentData,

                currentScore:
                    hasAssessmentData
                        ? clamp(
                            currentScore
                        )
                        : null,

                effectiveScore,

                targetScore,

                scoreGap:
                    Math.max(
                        targetScore -
                        effectiveScore,
                        0
                    )
            },

            learningLevel:
                determineLearningLevel(
                    effectiveScore
                ),

            priorityScore,

            priority,

            reason:
                buildRecommendationReason({

                    skillName,

                    currentScore:
                        effectiveScore,

                    targetScore,

                    importance,

                    requiredLevel,

                    isMissing,

                    hasAssessmentData
                }),

            topics,

            estimatedDuration,

            projects,

            recommendedAssessment:
                recommendAssessmentType(
                    skillName
                ),

            resources:
                resourceResult
                    ?.resources ||
                [],

            resourcesByType:
                resourceResult
                    ?.byType ||
                {},

            totalResources:
                safeNumber(
                    resourceResult
                        ?.totalResources
                ),

            nextAction:
                buildNextAction({

                    skillName,

                    priority,

                    currentScore:
                        effectiveScore
                })
        };
    };


/*
============================================================
GENERATE ROADMAP SUMMARY
============================================================
*/

const buildSummary = ({
    recommendations,
    targetRole,
    jobReadinessScore
}) => {

    if (
        recommendations.length ===
        0
    ) {

        return (
            `Your current skill profile does not contain any major ` +
            `learning gaps for ${targetRole || "the selected role"}. ` +
            `Continue advanced practice and periodic assessments.`
        );
    }


    const topSkills =
        recommendations
            .slice(
                0,
                3
            )
            .map(
                (item) =>
                    item.skill.name
            );


    return (
        `Your current job readiness is ${Math.round(jobReadinessScore)}%. ` +
        `The highest learning priorities for ` +
        `${targetRole || "your target role"} are ` +
        `${topSkills.join(", ")}. ` +
        `Complete the recommended learning resources and projects, ` +
        `then retake the related assessments to measure improvement.`
    );
};


/*
============================================================
GENERATE LEARNING RECOMMENDATIONS FROM CONTEXT
============================================================

Reusable function if another service/controller already has:

- job requirements
- missing skills
- skill performance
- readiness

============================================================
*/

const generateLearningRecommendations =
    async ({
        jobRequirements = [],
        missingSkills = [],
        skillPerformance = [],
        jobReadiness = {},
        targetRole = "",
        targetCompany = "",
        maxSkills = DEFAULT_MAX_SKILLS,
        resourcesPerSkill =
            DEFAULT_RESOURCES_PER_SKILL
    }) => {

        const normalizedPerformance =
            normalizeSkillPerformance(
                skillPerformance
            );


        const missingSkillNames =
            new Set(

                safeArray(
                    missingSkills
                )
                    .map(
                        (item) =>
                            normalizeSkillName(
                                getSkillName(
                                    item
                                )
                            )
                    )
                    .filter(
                        Boolean
                    )
            );


        const readinessScore =
            clamp(
                jobReadiness
                    ?.score ??
                jobReadiness
                    ?.readinessScore ??
                0
            );


        const candidates =
            [];


        /*
        --------------------------------------------------------
        CREATE RECOMMENDATION FOR EVERY JOB REQUIREMENT
        --------------------------------------------------------
        */

        for (
            const requirement
            of safeArray(
                jobRequirements
            )
        ) {

            const skillName =
                requirement
                    ?.skill
                    ?.name ||
                requirement
                    ?.name ||
                "";


            if (
                !skillName
            ) {

                continue;
            }


            const isMissing =
                missingSkillNames.has(
                    normalizeSkillName(
                        skillName
                    )
                );


            const currentScore =
                findAssessmentScore(
                    skillName,
                    normalizedPerformance
                );


            const recommendation =
                await generateSkillRecommendation({

                    requirement,

                    currentScore,

                    isMissing,

                    jobReadinessScore:
                        readinessScore,

                    resourcesPerSkill
                });


            candidates.push(
                recommendation
            );
        }


        /*
        --------------------------------------------------------
        SORT BY PRIORITY
        --------------------------------------------------------
        */

        candidates.sort(
            (a, b) => {

                if (
                    b.priorityScore !==
                    a.priorityScore
                ) {

                    return (
                        b.priorityScore -
                        a.priorityScore
                    );
                }


                return (
                    b.importance -
                    a.importance
                );
            }
        );


        /*
        --------------------------------------------------------
        DIVIDE READY VS IMPROVEMENT SKILLS
        --------------------------------------------------------
        */

        const recommendedSkills =
            candidates
                .filter(
                    (item) => {

                        return (
                            item.status ===
                                "missing" ||

                            item.assessment
                                .effectiveScore <
                                item.assessment
                                    .targetScore
                        );
                    }
                )
                .slice(
                    0,
                    Math.max(
                        1,
                        safeNumber(
                            maxSkills,
                            DEFAULT_MAX_SKILLS
                        )
                    )
                );


        const readySkills =
            candidates
                .filter(
                    (item) => {

                        return (
                            item.status !==
                                "missing" &&

                            item.assessment
                                .effectiveScore >=
                                item.assessment
                                    .targetScore
                        );
                    }
                );


        const topPriority =
            recommendedSkills[0] ||
            null;


        /*
        --------------------------------------------------------
        ESTIMATED TOTAL ROADMAP DURATION
        --------------------------------------------------------
        */

        const criticalCount =
            recommendedSkills.filter(
                (item) =>
                    item.priority ===
                    "critical"
            ).length;


        const highCount =
            recommendedSkills.filter(
                (item) =>
                    item.priority ===
                    "high"
            ).length;


        let roadmapDuration =
            "2-4 weeks";


        if (
            criticalCount >= 2
        ) {

            roadmapDuration =
                "8-12 weeks";

        } else if (
            criticalCount === 1 ||
            highCount >= 3
        ) {

            roadmapDuration =
                "6-8 weeks";

        } else if (
            highCount >= 1
        ) {

            roadmapDuration =
                "4-6 weeks";
        }


        /*
        --------------------------------------------------------
        FINAL ROADMAP
        --------------------------------------------------------
        */

        return {

            target: {

                company:
                    targetCompany ||
                    "",

                role:
                    targetRole ||
                    ""
            },

            jobReadiness: {

                score:
                    readinessScore,

                level:
                    jobReadiness
                        ?.level ||
                    "",

                resumeCoverage:
                    clamp(
                        jobReadiness
                            ?.resumeCoverage ??
                        0
                    ),

                assessmentScore:
                    clamp(
                        jobReadiness
                            ?.assessmentScore ??
                        0
                    )
            },

            summary:
                buildSummary({

                    recommendations:
                        recommendedSkills,

                    targetRole,

                    jobReadinessScore:
                        readinessScore
                }),

            roadmapDuration,

            totalPrioritySkills:
                recommendedSkills.length,

            topPriority,

            recommendedSkills,

            readySkills,

            nextAction:
                topPriority
                    ?.nextAction ||
                (
                    "Continue practicing your current skills " +
                    "and complete periodic assessments."
                ),

            generatedAt:
                new Date()
        };
    };


/*
============================================================
GENERATE LEARNING PLAN FOR RESUME
============================================================

This is the primary function that the controller will call.

It validates ownership and automatically loads:

- Resume
- Company
- Role
- Skill gaps
- Job requirements

The controller only needs to provide:

{
    userId,
    resumeId,
    skillPerformance,
    jobReadiness
}

============================================================
*/

const generateLearningPlanForResume =
    async ({
        userId,
        resumeId,
        skillPerformance = [],
        jobReadiness = {},
        maxSkills = DEFAULT_MAX_SKILLS,
        resourcesPerSkill =
            DEFAULT_RESOURCES_PER_SKILL
    }) => {

        /*
        --------------------------------------------------------
        VALIDATE
        --------------------------------------------------------
        */

        if (
            !userId
        ) {

            const error =
                new Error(
                    "User ID is required."
                );

            error.statusCode =
                401;

            throw error;
        }


        if (
            !resumeId ||
            !mongoose.Types.ObjectId
                .isValid(
                    resumeId
                )
        ) {

            const error =
                new Error(
                    "Valid resume ID is required."
                );

            error.statusCode =
                400;

            throw error;
        }


        /*
        --------------------------------------------------------
        LOAD RESUME
        --------------------------------------------------------
        */

        const resume =
            await Resume
                .findOne({

                    _id:
                        resumeId,

                    user:
                        userId
                })
                .populate(
                    "company",
                    "name"
                )
                .populate(
                    "role",
                    "name"
                )
                .lean();


        if (
            !resume
        ) {

            const error =
                new Error(
                    "Resume not found."
                );

            error.statusCode =
                404;

            throw error;
        }


        if (
            !resume.company ||
            !resume.role
        ) {

            const error =
                new Error(
                    "Resume must have a company and job role."
                );

            error.statusCode =
                400;

            throw error;
        }


        /*
        --------------------------------------------------------
        SKILL GAP
        --------------------------------------------------------
        */

        const skillGap =
            resume
                ?.skillGapAnalysis ||
            {};


        const missingSkills =
            safeArray(
                skillGap
                    ?.missingSkills
            );


        /*
        --------------------------------------------------------
        JOB REQUIREMENTS
        --------------------------------------------------------
        */

        const jobRequirements =
            await JobRequirement
                .find({

                    company:
                        resume
                            .company
                            ._id,

                    role:
                        resume
                            .role
                            ._id
                })
                .populate(
                    "skill",
                    "name"
                )
                .sort({

                    importance:
                        -1
                })
                .lean();


        if (
            jobRequirements.length ===
            0
        ) {

            const error =
                new Error(
                    "No job requirements were found for the selected company and role."
                );

            error.statusCode =
                404;

            throw error;
        }


        /*
        --------------------------------------------------------
        READINESS FALLBACK

        Resume schema currently stores coverageScore.
        --------------------------------------------------------
        */

        const normalizedJobReadiness = {

            ...jobReadiness,

            resumeCoverage:

                jobReadiness
                    ?.resumeCoverage ??

                skillGap
                    ?.coverageScore ??

                0
        };


        /*
        --------------------------------------------------------
        BUILD ROADMAP
        --------------------------------------------------------
        */

        const roadmap =
            await generateLearningRecommendations({

                jobRequirements,

                missingSkills,

                skillPerformance,

                jobReadiness:
                    normalizedJobReadiness,

                targetRole:
                    resume
                        ?.role
                        ?.name ||
                    "",

                targetCompany:
                    resume
                        ?.company
                        ?.name ||
                    "",

                maxSkills,

                resourcesPerSkill
            });


        /*
        --------------------------------------------------------
        ADD RESUME CONTEXT
        --------------------------------------------------------
        */

        return {

            resume: {

                id:
                    resume._id,

                company:
                    resume
                        ?.company
                        ?.name ||
                    "",

                role:
                    resume
                        ?.role
                        ?.name ||
                    "",

                coverageScore:
                    clamp(
                        skillGap
                            ?.coverageScore ??
                        0
                    ),

                matchedSkillCount:
                    safeArray(
                        skillGap
                            ?.matchedSkills
                    ).length,

                missingSkillCount:
                    missingSkills.length
            },

            ...roadmap
        };
    };


/*
============================================================
BUILD MINIMAL ROADMAP WITHOUT DATABASE CONTEXT
============================================================

Useful later for:
- testing
- analytics integration
- AI experimentation
============================================================
*/

const buildLearningRoadmap =
    async ({
        skills = [],
        jobReadiness = {},
        targetRole = "",
        targetCompany = "",
        resourcesPerSkill =
            DEFAULT_RESOURCES_PER_SKILL
    }) => {

        const recommendations =
            [];


        for (
            const skill
            of safeArray(
                skills
            )
        ) {

            const skillName =
                getSkillName(
                    skill
                );


            if (
                !skillName
            ) {

                continue;
            }


            const requirement = {

                skill: {
                    _id:
                        skill
                            ?.skillId ||
                        skill
                            ?._id ||
                        null,

                    name:
                        skillName
                },

                importance:
                    safeNumber(
                        skill
                            ?.importance,
                        50
                    ),

                requiredLevel:
                    skill
                        ?.requiredLevel ||
                    "Intermediate"
            };


            const result =
                await generateSkillRecommendation({

                    requirement,

                    currentScore:

                        skill
                            ?.percentage ??

                        skill
                            ?.currentScore ??

                        skill
                            ?.score ??

                        null,

                    isMissing:
                        Boolean(
                            skill
                                ?.isMissing ||
                            skill
                                ?.status ===
                                "missing"
                        ),

                    jobReadinessScore:
                        safeNumber(
                            jobReadiness
                                ?.score
                        ),

                    resourcesPerSkill
                });


            recommendations.push(
                result
            );
        }


        recommendations.sort(
            (a, b) =>
                b.priorityScore -
                a.priorityScore
        );


        return {

            target: {
                company:
                    targetCompany,

                role:
                    targetRole
            },

            jobReadiness,

            recommendedSkills:
                recommendations,

            topPriority:
                recommendations[0] ||
                null,

            nextAction:
                recommendations[0]
                    ?.nextAction ||
                "Continue improving your technical skills.",

            generatedAt:
                new Date()
        };
    };


/*
============================================================
EXPORTS
============================================================
*/

module.exports = {

    /*
    Main functions
    */

    generateLearningPlanForResume,

    generateLearningRecommendations,

    generateSkillRecommendation,

    buildLearningRoadmap,


    /*
    Helpers
    */

    calculatePriorityScore,

    getPriorityLabel,

    getTargetScore,

    getRecommendedTopics,

    getRecommendedProjects,

    estimateLearningDuration,

    recommendAssessmentType,


    /*
    Configuration
    */

    REQUIRED_LEVEL_TARGETS,

    SKILL_TOPIC_LIBRARY,

    PROJECT_LIBRARY
};