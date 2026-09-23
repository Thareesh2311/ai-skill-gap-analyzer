const mongoose = require("mongoose");

const Assessment = require("../models/Assessment");
const Resume = require("../models/Resume");
const Question = require("../models/Question");
const CodingQuestion = require("../models/CodingQuestion");
const SQLQuestion = require("../models/SQLQuestion");
const AssessmentAttempt = require("../models/AssessmentAttempt");

const {
    scoreSQLAnswer
} = require("../services/sqlScoringService");
const {
    executeSQL
} = require("../services/sqlExecutionService");
const {
    runTestCases
} = require("../services/codeExecutionService");

const {
    analyzeWeakSkills
} = require("../services/skillRecommendationService");

const {
    calculateJobReadiness
} = require("../services/jobReadinessService");

const {
    generateJobReadinessExplanation
} = require("../services/jobReadinessExplanationService");

const {
    getFinalJobReadiness
} = require("../services/finalJobReadinessService");

const {
    calculateAssessmentProgress,
    calculateAttemptSkillProgress,
    analyzeSkillProgress
} = require("../services/assessmentProgressService");

const {
    generateLearningRecommendations,
    getTopLearningPriorities
} = require(
    "../services/learningProgressRecommendationService"
);

const {
    generateFinalProgressSummary
} = require(
    "../services/finalProgressSummaryService"
);

const {
    calculateAssessmentAnalytics,
    calculateAttemptTrend,
    calculateScoreDistribution,
    calculateSkillWisePerformance,
    analyzeSkillPerformance,
    calculateSkillPriorities,
    calculateDifficultyWisePerformance,
    analyzeDifficultyPerformance,
    recommendNextDifficulty,
    calculateQuestionAccuracy,
    getMostDifficultQuestions,
    getFrequentlyMissedQuestions,
    analyzeCodingPerformance,
    calculateAssessmentTypeAnalytics,
    compareAssessmentTypes,
    generateAssessmentTypeRecommendations,
    groupAttemptsByAssessmentType,
    calculatePerformanceTrend,
    calculateMovingAverage,
    calculatePerformanceMomentum,
    calculateTypePerformanceTrends,
    generatePerformanceTrendInsights
} = require(
    "../services/assessmentAnalyticsService"
);

const {
    generateAIPerformanceInsights
} = require(
    "../services/aiPerformanceInsightsService"
);

const {
    generateAssessmentAIInsight
} = require(
    "../services/aiAssessmentInsightService"
);


/*
============================================================
CREATE ASSESSMENT
============================================================
*/

const createAssessment = async (req, res) => {

    try {

        const {
            resumeId,
            type
        } = req.body;


        console.log(
            "\n========================================"
        );

        console.log(
            "CREATE ASSESSMENT"
        );

        console.log(
            "Resume ID:",
            resumeId
        );

        console.log(
            "Type:",
            type
        );

        console.log(
            "User ID:",
            req.user.id
        );

        console.log(
            "========================================"
        );


        /*
        --------------------------------------------------------
        VALIDATE INPUT
        --------------------------------------------------------
        */

        if (
            !resumeId ||
            !type
        ) {

            return res
                .status(400)
                .json({

                    success:
                        false,

                    message:
                        "resumeId and type are required"
                });
        }


        const normalizedType =
            String(type)
                .trim()
                .toLowerCase();


        /*
        --------------------------------------------------------
        VALIDATE TYPE
        --------------------------------------------------------
        */

        if (
            ![
                "mcq",
                "coding",
                "sql"
            ].includes(
                normalizedType
            )
        ) {

            return res
                .status(400)
                .json({

                    success:
                        false,

                    message:
                        "Invalid assessment type. Allowed types: mcq, coding, sql"
                });
        }


        /*
        --------------------------------------------------------
        FIND RESUME
        --------------------------------------------------------
        */

        const resume =
            await Resume.findOne({

                _id:
                    resumeId,

                user:
                    req.user.id
            })
            .populate("company")
            .populate("role");


        if (!resume) {

            return res
                .status(404)
                .json({

                    success:
                        false,

                    message:
                        "Resume not found"
                });
        }


        console.log(
            "Resume found:",
            resume._id.toString()
        );


        /*
        --------------------------------------------------------
        CHECK COMPANY + ROLE
        --------------------------------------------------------
        */

        if (
            !resume.company ||
            !resume.role
        ) {

            return res
                .status(400)
                .json({

                    success:
                        false,

                    message:
                        "Resume must have both company and role assigned"
                });
        }


        /*
        --------------------------------------------------------
        CHECK SKILL GAP
        --------------------------------------------------------
        */

        if (
            !resume.skillGapAnalysis
        ) {

            return res
                .status(400)
                .json({

                    success:
                        false,

                    message:
                        "Skill gap analysis has not been completed yet"
                });
        }


        /*
        --------------------------------------------------------
        GET MATCHED + MISSING SKILLS
        --------------------------------------------------------
        */

        const matchedSkills =
            Array.isArray(
                resume
                    .skillGapAnalysis
                    .matchedSkills
            )
                ? resume
                    .skillGapAnalysis
                    .matchedSkills
                : [];


        const missingSkills =
            Array.isArray(
                resume
                    .skillGapAnalysis
                    .missingSkills
            )
                ? resume
                    .skillGapAnalysis
                    .missingSkills
                : [];


        const rawSkillNames = [

            ...missingSkills.map(
                (skill) =>
                    typeof skill ===
                    "string"
                        ? skill
                        : skill?.name
            ),

            ...matchedSkills.map(
                (skill) =>
                    typeof skill ===
                    "string"
                        ? skill
                        : skill?.name
            )
        ];


        const skillNames = [

            ...new Set(

                rawSkillNames
                    .filter(Boolean)
                    .map(
                        (name) =>
                            String(name)
                                .trim()
                    )
                    .filter(Boolean)
            )
        ];


        console.log(
            "Resume skill names:",
            skillNames
        );


        if (
            skillNames.length ===
            0
        ) {

            return res
                .status(400)
                .json({

                    success:
                        false,

                    message:
                        "No skills available for assessment"
                });
        }


        /*
        --------------------------------------------------------
        FIND SKILL DOCUMENTS
        --------------------------------------------------------
        */

        const Skill =
            mongoose.model(
                "Skill"
            );


        const allSkills =
            await Skill.find({
                isActive:
                    true
            }).lean();


        const normalizedResumeSkills =
            new Set(

                skillNames.map(
                    (name) =>
                        name
                            .trim()
                            .toLowerCase()
                )
            );


        const matchingSkills =
            allSkills.filter(
                (skill) =>
                    normalizedResumeSkills
                        .has(
                            skill
                                .name
                                .trim()
                                .toLowerCase()
                        )
            );


        console.log(
            "Matching Skill documents:",
            matchingSkills.map(
                (skill) =>
                    skill.name
            )
        );


        if (
            matchingSkills.length ===
            0
        ) {

            return res
                .status(404)
                .json({

                    success:
                        false,

                    message:
                        "No matching skills found in the database",

                    requestedSkills:
                        skillNames
                });
        }


        const skillIds =
            matchingSkills.map(
                (skill) =>
                    skill._id
            );


        /*
        ========================================================
        LOAD QUESTIONS
        ========================================================
        */

        let questions = [];


        /*
        --------------------------------------------------------
        MCQ
        --------------------------------------------------------
        */

        if (
            normalizedType ===
            "mcq"
        ) {

            questions =
                await Question.find({

                    skill: {
                        $in:
                            skillIds
                    },

                    type:
                        "mcq",

                    isActive:
                        true
                })
                .select(
                    "_id skill difficulty question options points"
                )
                .limit(10)
                .lean();
        }


        /*
        --------------------------------------------------------
        CODING
        --------------------------------------------------------
        */

        else if (
            normalizedType ===
            "coding"
        ) {

            /*
            testCases + runnerCode are automatically excluded
            because CodingQuestion defines select:false.
            */

            const matchedCodingQuestions =
                await CodingQuestion.find({

                    skill: {
                        $in:
                            skillIds
                    },

                    type:
                        "coding",

                    isActive:
                        true
                })
                .sort({
                    difficulty:
                        1,

                    createdAt:
                        1
                })
                .limit(5)
                .lean();


            questions =
                matchedCodingQuestions;


            console.log(
                "Skill-matched coding questions:",
                questions.length
            );


            /*
            Fill remaining positions
            from active coding bank.
            */

            if (
                questions.length <
                5
            ) {

                const existingIds =
                    questions.map(
                        (question) =>
                            question._id
                    );


                const remainingCount =
                    5 -
                    questions.length;


                const fallbackQuestions =
                    await CodingQuestion.find({

                        _id: {
                            $nin:
                                existingIds
                        },

                        type:
                            "coding",

                        isActive:
                            true
                    })
                    .sort({
                        difficulty:
                            1,

                        createdAt:
                            1
                    })
                    .limit(
                        remainingCount
                    )
                    .lean();


                questions = [
                    ...questions,
                    ...fallbackQuestions
                ];


                console.log(
                    "Fallback coding questions:",
                    fallbackQuestions.length
                );
            }
        }


        /*
        --------------------------------------------------------
        SQL
        --------------------------------------------------------
        */

        else if (
                normalizedType ===
                "sql"
            ) {

                /*
                ========================================================
                SQL QUESTIONS MATCHING RESUME SKILLS
                ========================================================
                */

                const matchedSQLQuestions =
                    await SQLQuestion.find({

                        skill: {
                            $in:
                                skillIds
                        },

                        type:
                            "sql",

                        isActive:
                            true
                    })
                    .sort({

                        difficulty:
                            1,

                        createdAt:
                            1
                    })
                    .limit(5)
                    .lean();


                questions =
                    matchedSQLQuestions;


                console.log(
                    "Skill-matched SQL questions:",
                    questions.length
                );


                /*
                ========================================================
                FALLBACK SQL QUESTION BANK
                ========================================================

                Same idea as your Coding Assessment.

                If the resume does not explicitly contain SQL,
                we still allow the user to take the SQL assessment.

                Existing skill-matched questions stay first.
                ========================================================
                */

                if (
                    questions.length <
                    5
                ) {

                    const existingIds =
                        questions.map(
                            (question) =>
                                question._id
                        );


                    const remainingCount =
                        5 -
                        questions.length;


                    const fallbackSQLQuestions =
                        await SQLQuestion.find({

                            _id: {
                                $nin:
                                    existingIds
                            },

                            type:
                                "sql",

                            isActive:
                                true
                        })
                        .sort({

                            difficulty:
                                1,

                            createdAt:
                                1
                        })
                        .limit(
                            remainingCount
                        )
                        .lean();


                    questions = [

                        ...questions,

                        ...fallbackSQLQuestions
                    ];


                    console.log(
                        "Fallback SQL questions:",
                        fallbackSQLQuestions.length
                    );
                }


                console.log(
                    "Final SQL questions:",
                    questions.length
                );
            }


        /*
        --------------------------------------------------------
        CHECK QUESTIONS
        --------------------------------------------------------
        */

        if (
            questions.length ===
            0
        ) {

            return res
                .status(404)
                .json({

                    success:
                        false,

                    message:
                        `No ${normalizedType} questions are available.`,

                    requestedSkills:
                        skillNames,

                    matchedSkills:
                        matchingSkills.map(
                            (skill) =>
                                skill.name
                        )
                });
        }


        console.log(
            "Final questions selected:",
            questions.length
        );


        const questionIds =
            questions.map(
                (question) =>
                    question._id
            );


        console.log(
            "Question IDs:",
            questionIds.map(
                (id) =>
                    id.toString()
            )
        );


        /*
        ========================================================
        BUILD ASSESSMENT
        ========================================================
        */

        const assessmentData = {

            user:
                req.user.id,

            resume:
                resume._id,

            company:
                resume.company._id,

            role:
                resume.role._id,

            type:
                normalizedType,

            skills:
                skillIds,

            totalQuestion:
                questionIds.length,

            status:
                "created"
        };


        if (
            normalizedType ===
            "mcq"
        ) {

            assessmentData
                .mcqQuestions =
                questionIds;
        }


        else if (
            normalizedType ===
            "coding"
        ) {

            assessmentData
                .codingQuestions =
                questionIds;
        }


        else if (
            normalizedType ===
            "sql"
        ) {

            assessmentData
                .sqlQuestions =
                questionIds;
        }


        const assessment =
            await Assessment.create(
                assessmentData
            );


        console.log(
            "Assessment created:",
            assessment._id.toString()
        );


        return res
            .status(201)
            .json({

                success:
                    true,

                message:
                    "Assessment created successfully",

                data: {

                    assessmentId:
                        assessment._id,

                    company:
                        resume
                            .company
                            .name,

                    role:
                        resume
                            .role
                            .name,

                    type:
                        assessment.type,

                    totalQuestions:
                        assessment
                            .totalQuestion,

                    status:
                        assessment.status,

                    questionIds
                }
            });


    } catch (error) {

        console.error(
            "CREATE ASSESSMENT ERROR:",
            error
        );


        return res
            .status(500)
            .json({

                success:
                    false,

                message:
                    "Failed to create assessment",

                error:
                    error.message
            });
    }
};


/*
============================================================
START ASSESSMENT
============================================================
*/

const startAssessment =
    async (req, res) => {

        try {

            const {
                assessmentId
            } = req.params;


            console.log(
                "\n========================================"
            );

            console.log(
                "START ASSESSMENT"
            );

            console.log(
                "Assessment ID:",
                assessmentId
            );

            console.log(
                "User ID:",
                req.user.id
            );

            console.log(
                "========================================"
            );


            /*
            --------------------------------------------------------
            FIND ASSESSMENT
            --------------------------------------------------------
            */

            const assessment =
                await Assessment.findOne({

                    _id:
                        assessmentId,

                    user:
                        req.user.id
                })
                .lean();


            if (!assessment) {

                return res
                    .status(404)
                    .json({

                        success:
                            false,

                        message:
                            "Assessment not found"
                    });
            }


            /*
            --------------------------------------------------------
            GET QUESTION IDS
            --------------------------------------------------------
            */

            let questionIds = [];


            if (
                assessment.type ===
                "mcq"
            ) {

                questionIds =
                    assessment
                        .mcqQuestions ||
                    [];
            }


            else if (
                assessment.type ===
                "coding"
            ) {

                questionIds =
                    assessment
                        .codingQuestions ||
                    [];
            }


            else if (
                assessment.type ===
                "sql"
            ) {

                questionIds =
                    assessment
                        .sqlQuestions ||
                    [];
            }


            if (
                !questionIds.length
            ) {

                return res
                    .status(404)
                    .json({

                        success:
                            false,

                        message:
                            "No questions are attached to this assessment."
                    });
            }


            /*
            --------------------------------------------------------
            LOAD QUESTIONS
            --------------------------------------------------------
            */

            let questions = [];


            if (
                assessment.type ===
                "mcq"
            ) {

                questions =
                    await Question.find({

                        _id: {
                            $in:
                                questionIds
                        }
                    })
                    .select(
                        "_id skill difficulty question options points"
                    )
                    .populate(
                        "skill",
                        "name"
                    )
                    .lean();
            }


            else if (
                assessment.type ===
                "coding"
            ) {

                /*
                SECURITY:

                DO NOT SEND:
                - testCases
                - runnerCode

                They are server-only.
                */

                questions =
                    await CodingQuestion.find({

                        _id: {
                            $in:
                                questionIds
                        }
                    })
                    .select(
                        [
                            "_id",
                            "skill",
                            "difficulty",
                            "title",
                            "description",
                            "inputFormat",
                            "outputFormat",
                            "constraints",
                            "sampleInput",
                            "sampleOutput",
                            "starterCode",
                            "language",
                            "points"
                        ].join(" ")
                    )
                    .populate(
                        "skill",
                        "name"
                    )
                    .lean();
            }


            else if (
                assessment.type ===
                "sql"
            ) {

                questions =
                    await SQLQuestion.find({

                        _id: {
                            $in:
                                questionIds
                        }
                    })
                    .populate(
                        "skill",
                        "name"
                    )
                    .lean();
            }


            if (
                !questions.length
            ) {

                return res
                    .status(404)
                    .json({

                        success:
                            false,

                        message:
                            `No ${assessment.type} questions found.`
                    });
            }


            /*
            --------------------------------------------------------
            FIND EXISTING ACTIVE ATTEMPT
            --------------------------------------------------------
            */

            let attempt =
                await AssessmentAttempt
                    .findOne({

                        assessment:
                            assessment._id,

                        user:
                            req.user.id,

                        status:
                            "in-progress"
                    });


            /*
            --------------------------------------------------------
            CREATE ATTEMPT
            --------------------------------------------------------
            */

            if (!attempt) {

                attempt =
                    await AssessmentAttempt
                        .create({

                            user:
                                req.user.id,

                            assessment:
                                assessment._id,

                            answers:
                                [],

                            score:
                                0,

                            percentage:
                                0,

                            startedAt:
                                new Date(),

                            status:
                                "in-progress"
                        });


                console.log(
                    "New attempt created:",
                    attempt._id
                );

            } else {

                console.log(
                    "Existing attempt:",
                    attempt._id
                );
            }


            /*
            --------------------------------------------------------
            UPDATE ASSESSMENT
            --------------------------------------------------------
            */

            await Assessment
                .findByIdAndUpdate(

                    assessment._id,

                    {

                        status:
                            "started",

                        startedAt:
                            assessment
                                .startedAt ||
                            new Date()
                    }
                );


            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "Assessment started successfully",

                    data: {

                        assessmentId:
                            assessment._id,

                        attemptId:
                            attempt._id,

                        type:
                            assessment.type,

                        totalQuestions:
                            questions.length,

                        status:
                            "in-progress",

                        startedAt:
                            attempt.startedAt,

                        questions
                    }
                });


        } catch (error) {

            console.error(
                "START ASSESSMENT ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Failed to start assessment",

                    error:
                        error.message
                });
        }
    };


/*
============================================================
SUBMIT ASSESSMENT
============================================================
*/

const submitAssessment =
    async (req, res) => {

        try {

            const {
                assessmentId
            } = req.params;


            const {
                answers
            } = req.body;


            console.log(
                "\n========== SUBMIT ASSESSMENT =========="
            );

            console.log(
                "Assessment ID:",
                assessmentId
            );

            console.log(
                "Request User:",
                req.user.id
            );


            /*
            ========================================================
            VALIDATE ANSWERS
            ========================================================
            */

            if (
                !Array.isArray(
                    answers
                )
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "answers must be an array"
                    });
            }


            /*
            ========================================================
            FIND ASSESSMENT
            ========================================================
            */

            const assessment =
                await Assessment.findOne({

                    _id:
                        assessmentId,

                    user:
                        req.user.id
                });


            if (
                !assessment
            ) {

                return res
                    .status(404)
                    .json({

                        success:
                            false,

                        message:
                            "Assessment not found"
                    });
            }


            /*
            ========================================================
            CHECK ASSESSMENT STATUS
            ========================================================
            */

            if (
                assessment.status !==
                "started"
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Assessment is not currently active",

                        currentStatus:
                            assessment.status
                    });
            }


            /*
            ========================================================
            FIND ACTIVE ATTEMPT
            ========================================================
            */

            const attempt =
                await AssessmentAttempt
                    .findOne({

                        assessment:
                            assessment._id,

                        user:
                            req.user.id,

                        status:
                            "in-progress"
                    });


            if (
                !attempt
            ) {

                return res
                    .status(404)
                    .json({

                        success:
                            false,

                        message:
                            "Active assessment attempt not found"
                    });
            }


            /*
            ========================================================
            MCQ ASSESSMENT
            ========================================================
            */

            if (
                assessment.type ===
                "mcq"
            ) {

                const questionIds =
                    assessment
                        .mcqQuestions ||
                    [];


                const questions =
                    await Question.find({

                        _id: {
                            $in:
                                questionIds
                        }
                    })
                    .select(
                        "+testCases +expectedQueryResult"
                    );


                if (
                    questions.length ===
                    0
                ) {

                    return res
                        .status(404)
                        .json({

                            success:
                                false,

                            message:
                                "MCQ questions not found"
                        });
                }


                let totalScore =
                    0;

                let maxScore =
                    0;


                const evaluatedAnswers =
                    [];


                /*
                ====================================================
                EVALUATE MCQ QUESTIONS
                ====================================================
                */

                for (
                    const question
                    of questions
                ) {

                    const questionPoints =
                        Number(
                            question
                                .points ||
                            0
                        );


                    maxScore +=
                        questionPoints;


                    const submittedAnswer =
                        answers.find(
                            (
                                answer
                            ) =>
                                answer
                                    .questionId
                                    ?.toString() ===
                                question
                                    ._id
                                    .toString()
                        );


                    const selectedAnswer =
                        submittedAnswer

                            ? Number(
                                submittedAnswer
                                    .answer
                            )

                            : null;


                    const isCorrect =
                        selectedAnswer ===
                        question
                            .correctAnswer;


                    const pointsEarned =
                        isCorrect

                            ? questionPoints

                            : 0;


                    totalScore +=
                        pointsEarned;


                    evaluatedAnswers.push({

                        question:
                            question._id,

                        answer:
                            submittedAnswer

                                ? String(
                                    submittedAnswer
                                        .answer
                                )

                                : "",

                        isCorrect,

                        pointsEarned
                    });
                }


                /*
                ====================================================
                MCQ PERCENTAGE
                ====================================================
                */

                const percentage =
                    maxScore >
                    0

                        ? Math.round(
                            (
                                totalScore /
                                maxScore
                            ) *
                            100
                        )

                        : 0;


                /*
                ====================================================
                SAVE MCQ ATTEMPT
                ====================================================
                */

                attempt.answers =
                    evaluatedAnswers;


                attempt.score =
                    totalScore;


                attempt.percentage =
                    percentage;


                attempt.submittedAt =
                    new Date();


                attempt.status =
                    "evaluated";


                await attempt.save();


                /*
                ====================================================
                UPDATE MCQ ASSESSMENT
                ====================================================
                */

                assessment.score =
                    percentage;


                assessment.status =
                    "evaluated";


                assessment.completedAt =
                    new Date();


                await assessment.save();


                /*
                ====================================================
                MCQ RESPONSE
                ====================================================
                */

                return res
                    .status(200)
                    .json({

                        success:
                            true,

                        message:
                            "MCQ assessment submitted successfully",

                        data: {

                            assessmentId:
                                assessment._id,

                            attemptId:
                                attempt._id,

                            type:
                                assessment.type,

                            score:
                                totalScore,

                            maxScore,

                            percentage,

                            status:
                                attempt.status,

                            answers:
                                evaluatedAnswers
                        }
                    });
            }


            /*
            ========================================================
            CODING ASSESSMENT
            ========================================================
            */

            if (
                assessment.type ===
                "coding"
            ) {

                const questionIds =
                    assessment
                        .codingQuestions ||
                    [];


                /*
                ====================================================
                runnerCode + testCases use select:false

                They are intentionally hidden from the frontend.

                Final server-side evaluation must explicitly
                retrieve them.
                ====================================================
                */

                const questions =
                    await CodingQuestion.find({

                        _id: {
                            $in:
                                questionIds
                        }
                    })
                    .select(
                        "+runnerCode +testCases"
                    );


                if (
                    questions.length ===
                    0
                ) {

                    return res
                        .status(404)
                        .json({

                            success:
                                false,

                            message:
                                "Coding questions not found"
                        });
                }


                let totalScore =
                    0;

                let maxScore =
                    0;

                let totalTestCases =
                    0;

                let testCasesPassed =
                    0;

                let totalExecutionTime =
                    0;

                let questionsSolved =
                    0;

                let questionsPartiallyPassed =
                    0;


                const evaluatedAnswers =
                    [];


                /*
                ====================================================
                EVALUATE CODING QUESTIONS
                ====================================================
                */

                for (
                    const question
                    of questions
                ) {

                    const submittedAnswer =
                        answers.find(
                            (
                                answer
                            ) =>
                                answer
                                    .questionId
                                    ?.toString() ===
                                question
                                    ._id
                                    .toString()
                        );


                    const code =
                        String(
                            submittedAnswer
                                ?.answer ||
                            ""
                        );


                    const questionPoints =
                        Number(
                            question
                                .points ||
                            10
                        );


                    const questionTestCases =
                        Array.isArray(
                            question
                                .testCases
                        )

                            ? question
                                .testCases

                            : [];


                    const questionTotalTestCases =
                        questionTestCases
                            .length;


                    maxScore +=
                        questionPoints;


                    totalTestCases +=
                        questionTotalTestCases;


                    /*
                    =================================================
                    NO CODE SUBMITTED
                    =================================================
                    */

                    if (
                        !code.trim()
                    ) {

                        evaluatedAnswers.push({

                            question:
                                question._id,

                            answer:
                                "",

                            isCorrect:
                                false,

                            pointsEarned:
                                0,

                            testCasesPassed:
                                0,

                            totalTestCases:
                                questionTotalTestCases,

                            executionTime:
                                0,

                            error:
                                "No code submitted",

                            timedOut:
                                false,

                            language:
                                question
                                    .language ||
                                "python",

                            /*
                            Do not expose hidden expected outputs.
                            */

                            testCaseResults:
                                questionTestCases
                                    .map(
                                        (
                                            testCase,
                                            index
                                        ) => {

                                            const isHidden =
                                                Boolean(
                                                    testCase
                                                        .isHidden
                                                );


                                            return {

                                                testCaseNumber:
                                                    index + 1,

                                                passed:
                                                    false,

                                                actual:
                                                    "",

                                                expected:
                                                    isHidden

                                                        ? ""

                                                        : String(
                                                            testCase
                                                                .expectedOutput ||
                                                            ""
                                                        ),

                                                executionTime:
                                                    0,

                                                error:
                                                    "No code submitted",

                                                timedOut:
                                                    false,

                                                isHidden
                                            };
                                        }
                                    )
                        });


                        continue;
                    }


                    /*
                    =================================================
                    RUN PUBLIC + HIDDEN TEST CASES
                    =================================================
                    */

                    const executionResult =
                        await runTestCases({

                            code,

                            language:
                                question
                                    .language ||
                                "python",

                            testCases:
                                questionTestCases,

                            runnerCode:
                                question
                                    .runnerCode ||
                                ""
                        });


                    const questionPassed =
                        Number(
                            executionResult
                                ?.testCasesPassed ||
                            0
                        );


                    const questionTotal =
                        Number(
                            executionResult
                                ?.totalTestCases ||
                            questionTotalTestCases ||
                            0
                        );


                    const executionTime =
                        Number(
                            executionResult
                                ?.executionTime ||
                            0
                        );


                    const error =
                        executionResult
                            ?.error ||
                        "";


                    const timedOut =
                        Boolean(
                            executionResult
                                ?.timedOut
                        );


                    const isCorrect =
                        questionTotal >
                        0 &&
                        questionPassed ===
                        questionTotal;


                    /*
                    Partial credit based on test cases.
                    */

                    const pointsEarned =
                        questionTotal >
                        0

                            ? Math.round(
                                (
                                    questionPassed /
                                    questionTotal
                                ) *
                                questionPoints
                            )

                            : 0;


                    totalScore +=
                        pointsEarned;


                    testCasesPassed +=
                        questionPassed;


                    totalExecutionTime +=
                        executionTime;


                    if (
                        isCorrect
                    ) {

                        questionsSolved++;

                    } else if (
                        questionPassed >
                        0
                    ) {

                        questionsPartiallyPassed++;
                    }


                    evaluatedAnswers.push({

                        question:
                            question._id,

                        answer:
                            code,

                        isCorrect,

                        pointsEarned,

                        testCasesPassed:
                            questionPassed,

                        totalTestCases:
                            questionTotal,

                        executionTime,

                        error,

                        timedOut,

                        language:
                            question
                                .language ||
                            "python",

                        testCaseResults:
                            executionResult
                                ?.testCaseResults ||

                            executionResult
                                ?.results ||

                            []
                    });
                }


                /*
                ====================================================
                CODING ANALYTICS
                ====================================================
                */

                const testCasesFailed =
                    Math.max(
                        totalTestCases -
                        testCasesPassed,
                        0
                    );


                const questionsFailed =
                    Math.max(
                        questions.length -
                        questionsSolved -
                        questionsPartiallyPassed,
                        0
                    );


                const percentage =
                    maxScore >
                    0

                        ? Math.round(
                            (
                                totalScore /
                                maxScore
                            ) *
                            100
                        )

                        : 0;


                const testCasePercentage =
                    totalTestCases >
                    0

                        ? Math.round(
                            (
                                testCasesPassed /
                                totalTestCases
                            ) *
                            100
                        )

                        : 0;


                const averageExecutionTime =
                    totalTestCases >
                    0

                        ? Math.round(
                            totalExecutionTime /
                            totalTestCases
                        )

                        : 0;


                /*
                ====================================================
                SAVE CODING ATTEMPT
                ====================================================
                */

                attempt.answers =
                    evaluatedAnswers;


                attempt.score =
                    totalScore;


                attempt.percentage =
                    percentage;


                attempt.submittedAt =
                    new Date();


                attempt.status =
                    "evaluated";


                await attempt.save();


                /*
                ====================================================
                UPDATE CODING ASSESSMENT
                ====================================================
                */

                assessment.score =
                    percentage;


                assessment.status =
                    "evaluated";


                assessment.completedAt =
                    new Date();


                await assessment.save();


                /*
                ====================================================
                SAFE CODING RESPONSE
                ====================================================
                */

                const publicAnswers =
                    evaluatedAnswers.map(
                        (
                            answer
                        ) => ({

                            questionId:
                                answer.question,

                            isCorrect:
                                answer.isCorrect,

                            pointsEarned:
                                answer
                                    .pointsEarned,

                            testCasesPassed:
                                answer
                                    .testCasesPassed,

                            testCasesFailed:
                                Math.max(
                                    answer
                                        .totalTestCases -
                                    answer
                                        .testCasesPassed,
                                    0
                                ),

                            totalTestCases:
                                answer
                                    .totalTestCases,

                            executionTime:
                                answer
                                    .executionTime,

                            error:
                                answer.error,

                            timedOut:
                                answer
                                    .timedOut,

                            language:
                                answer
                                    .language,

                            testCaseResults:
                                (
                                    answer
                                        .testCaseResults ||
                                    []
                                )
                                    .map(
                                        (
                                            result
                                        ) => {

                                            const base = {

                                                testCaseNumber:
                                                    result
                                                        .testCaseNumber,

                                                passed:
                                                    Boolean(
                                                        result
                                                            .passed
                                                    ),

                                                executionTime:
                                                    Number(
                                                        result
                                                            .executionTime ||
                                                        0
                                                    ),

                                                error:
                                                    result
                                                        .error ||
                                                    "",

                                                timedOut:
                                                    Boolean(
                                                        result
                                                            .timedOut
                                                    ),

                                                isHidden:
                                                    Boolean(
                                                        result
                                                            .isHidden
                                                    )
                                            };


                                            /*
                                            Never return expected/actual
                                            hidden output.
                                            */

                                            if (
                                                result
                                                    .isHidden
                                            ) {

                                                return base;
                                            }


                                            return {

                                                ...base,

                                                actual:
                                                    result
                                                        .actual ||
                                                    "",

                                                expected:
                                                    result
                                                        .expected ||
                                                    ""
                                            };
                                        }
                                    )
                        })
                    );


                /*
                ====================================================
                CODING RESPONSE
                ====================================================
                */

                return res
                    .status(200)
                    .json({

                        success:
                            true,

                        message:
                            "Coding assessment evaluated successfully",

                        data: {

                            assessmentId:
                                assessment._id,

                            attemptId:
                                attempt._id,

                            type:
                                assessment.type,

                            score:
                                totalScore,

                            maxScore,

                            percentage,

                            status:
                                attempt.status,

                            codingPerformance: {

                                questionsSolved,

                                questionsPartiallyPassed,

                                questionsFailed,

                                testCasesPassed,

                                testCasesFailed,

                                totalTestCases,

                                testCasePercentage,

                                totalExecutionTime,

                                averageExecutionTime
                            },

                            answers:
                                publicAnswers
                        }
                    });
            }


            /*
            ========================================================
            SQL ASSESSMENT
            ========================================================
            */

            if (
                assessment.type ===
                "sql"
            ) {

                const questionIds =
                    assessment
                        .sqlQuestions ||
                    [];


                /*
                ====================================================
                CRITICAL FIX

                testCases and expectedQueryResult are select:false
                in SQLQuestion.js.

                Run Query only needs public schema/sampleData.

                Final submission MUST explicitly retrieve hidden
                evaluation data.
                ====================================================
                */

                const questions =
                    await SQLQuestion.find({

                        _id: {
                            $in:
                                questionIds
                        }
                    })
                    .select(
                        "+testCases +expectedQueryResult"
                    );


                if (
                    questions.length ===
                    0
                ) {

                    return res
                        .status(404)
                        .json({

                            success:
                                false,

                            message:
                                "SQL questions not found"
                        });
                }


                let totalScore =
                    0;

                let maxScore =
                    0;


                const evaluatedAnswers =
                    [];


                console.log(
                    "\n========== SQL EVALUATION =========="
                );


                /*
                ====================================================
                EVALUATE EACH SQL QUESTION
                ====================================================
                */

                for (
                    const question
                    of questions
                ) {

                    /*
                    Safe debugging.

                    Do not log hidden schemas, hidden data,
                    or expected query results.
                    */

                    console.log(
                        "\nSQL Question:",
                        question
                            ._id
                            .toString()
                    );


                    console.log(
                        "SQL scoring configuration:",
                        {

                            hiddenTestCases:
                                Array.isArray(
                                    question
                                        .testCases
                                )

                                    ? question
                                        .testCases
                                        .length

                                    : 0,

                            hasExpectedResult:
                                question
                                    .expectedQueryResult !==
                                undefined
                        }
                    );


                    /*
                    =================================================
                    FIND SUBMITTED QUERY
                    =================================================
                    */

                    const submittedAnswer =
                        answers.find(
                            (
                                answer
                            ) =>
                                answer
                                    .questionId
                                    ?.toString() ===
                                question
                                    ._id
                                    .toString()
                        );


                    const submittedQuery =
                        String(
                            submittedAnswer
                                ?.answer ||
                            ""
                        );


                    const questionPoints =
                        Number(
                            question
                                .points ||
                            10
                        );


                    maxScore +=
                        questionPoints;


                    /*
                    =================================================
                    NO SQL QUERY SUBMITTED
                    =================================================
                    */

                    if (
                        !submittedQuery
                            .trim()
                    ) {

                        const expectedTestCount =
                            Array.isArray(
                                question
                                    .testCases
                            ) &&
                            question
                                .testCases
                                .length >
                            0

                                ? question
                                    .testCases
                                    .length

                                : 1;


                        evaluatedAnswers.push({

                            question:
                                question._id,

                            answer:
                                "",

                            isCorrect:
                                false,

                            pointsEarned:
                                0,

                            testCasesPassed:
                                0,

                            totalTestCases:
                                expectedTestCount,

                            executionTime:
                                0,

                            performance:
                                "Not Attempted",

                            error:
                                "No SQL query submitted",

                            timedOut:
                                false,

                            testCaseResults:
                                []
                        });


                        continue;
                    }


                    /*
                    =================================================
                    SCORE SQL QUERY
                    =================================================
                    */

                    let result;


                    try {

                        result =
                            await scoreSQLAnswer({

                                query:
                                    submittedQuery,

                                /*
                                Public fallback schema.
                                */

                                schema:
                                    question
                                        .schema ||
                                    "",

                                sampleData:
                                    question
                                        .sampleData ||
                                    "",

                                /*
                                Legacy expected result.
                                */

                                expectedRows:
                                    question
                                        .expectedQueryResult ||
                                    [],

                                /*
                                New hidden test case system.
                                */

                                testCases:
                                    Array.isArray(
                                        question
                                            .testCases
                                    )

                                        ? question
                                            .testCases

                                        : [],

                                points:
                                    questionPoints
                            });


                    } catch (
                        sqlError
                    ) {

                        console.error(
                            "SQL scoring error:",
                            sqlError
                        );


                        const expectedTestCount =
                            Array.isArray(
                                question
                                    .testCases
                            ) &&
                            question
                                .testCases
                                .length >
                            0

                                ? question
                                    .testCases
                                    .length

                                : 1;


                        result = {

                            isCorrect:
                                false,

                            pointsEarned:
                                0,

                            totalPoints:
                                questionPoints,

                            testCasesPassed:
                                0,

                            totalTestCases:
                                expectedTestCount,

                            executionTime:
                                0,

                            performance:
                                "Error",

                            timedOut:
                                false,

                            testCaseResults:
                                [],

                            error:
                                sqlError
                                    ?.message ||
                                "SQL evaluation failed"
                        };
                    }


                    /*
                    =================================================
                    NORMALIZE SQL RESULT
                    =================================================
                    */

                    const isCorrect =
                        Boolean(
                            result
                                ?.isCorrect
                        );


                    const pointsEarned =
                        Number(
                            result
                                ?.pointsEarned ??
                            0
                        );


                    const passed =
                        Number(
                            result
                                ?.testCasesPassed ??
                            0
                        );


                    const defaultTestCount =
                        Array.isArray(
                            question
                                .testCases
                        ) &&
                        question
                            .testCases
                            .length >
                        0

                            ? question
                                .testCases
                                .length

                            : 1;


                    const total =
                        Number(
                            result
                                ?.totalTestCases ??
                            defaultTestCount
                        );


                    const executionTime =
                        Number(
                            result
                                ?.executionTime ??
                            0
                        );


                    const timedOut =
                        Boolean(
                            result
                                ?.timedOut
                        );


                    const error =
                        result
                            ?.error ||
                        "";


                    /*
                    =================================================
                    ADD SQL SCORE
                    =================================================
                    */

                    totalScore +=
                        pointsEarned;


                    /*
                    =================================================
                    STORE SQL RESULT
                    =================================================
                    */

                    evaluatedAnswers.push({

                        question:
                            question._id,

                        answer:
                            submittedQuery,

                        isCorrect,

                        pointsEarned,

                        testCasesPassed:
                            passed,

                        totalTestCases:
                            total,

                        executionTime,

                        performance:
                            result
                                ?.performance ||
                            (
                                isCorrect

                                    ? "Correct"

                                    : "Needs Improvement"
                            ),

                        error,

                        timedOut,

                        testCaseResults:
                            result
                                ?.testCaseResults ||
                            []
                    });


                    /*
                    =================================================
                    SAFE DEBUG LOGGING
                    =================================================
                    */

                    console.log(
                        "SQL Correct:",
                        isCorrect
                    );


                    console.log(
                        "Points Earned:",
                        pointsEarned,
                        "/",
                        questionPoints
                    );


                    console.log(
                        "Test Cases:",
                        `${passed}/${total}`
                    );


                    console.log(
                        "Execution Time:",
                        executionTime
                    );


                    if (
                        error
                    ) {

                        console.log(
                            "SQL Evaluation Error:",
                            error
                        );
                    }
                }


                /*
                ====================================================
                SQL FINAL PERCENTAGE
                ====================================================
                */

                const percentage =
                    maxScore >
                    0

                        ? Math.round(
                            (
                                totalScore /
                                maxScore
                            ) *
                            100
                        )

                        : 0;


                console.log(
                    "\n========== SQL FINAL RESULT =========="
                );


                console.log(
                    "Total Score:",
                    totalScore
                );


                console.log(
                    "Max Score:",
                    maxScore
                );


                console.log(
                    "Percentage:",
                    `${percentage}%`
                );


                /*
                ====================================================
                SAVE SQL ATTEMPT
                ====================================================
                */

                attempt.answers =
                    evaluatedAnswers;


                attempt.score =
                    totalScore;


                attempt.percentage =
                    percentage;


                attempt.submittedAt =
                    new Date();


                attempt.status =
                    "evaluated";


                await attempt.save();


                /*
                ====================================================
                UPDATE SQL ASSESSMENT
                ====================================================
                */

                assessment.score =
                    percentage;


                assessment.status =
                    "evaluated";


                assessment.completedAt =
                    new Date();


                await assessment.save();


                /*
                ====================================================
                SAFE SQL RESPONSE

                Never expose expected result rows, hidden schemas,
                hidden database data, etc.
                ====================================================
                */

                const publicAnswers =
                    evaluatedAnswers.map(
                        (
                            answer
                        ) => ({

                            questionId:
                                answer.question,

                            isCorrect:
                                answer
                                    .isCorrect,

                            pointsEarned:
                                answer
                                    .pointsEarned,

                            testCasesPassed:
                                answer
                                    .testCasesPassed,

                            testCasesFailed:
                                Math.max(
                                    Number(
                                        answer
                                            .totalTestCases ||
                                        0
                                    ) -
                                    Number(
                                        answer
                                            .testCasesPassed ||
                                        0
                                    ),
                                    0
                                ),

                            totalTestCases:
                                answer
                                    .totalTestCases,

                            executionTime:
                                answer
                                    .executionTime,

                            performance:
                                answer
                                    .performance,

                            error:
                                answer
                                    .error,

                            timedOut:
                                answer
                                    .timedOut,

                            testCaseResults:
                                (
                                    answer
                                        .testCaseResults ||
                                    []
                                )
                                    .map(
                                        (
                                            testCase,
                                            index
                                        ) => {

                                            /*
                                            Only expose status information.

                                            Do not expose SQL expected rows,
                                            actual hidden rows, schema or
                                            hidden sample data.
                                            */

                                            return {

                                                testCaseNumber:
                                                    testCase
                                                        ?.testCaseNumber ??
                                                    index + 1,

                                                passed:
                                                    Boolean(
                                                        testCase
                                                            ?.passed
                                                    ),

                                                executionTime:
                                                    Number(
                                                        testCase
                                                            ?.executionTime ||
                                                        0
                                                    ),

                                                error:
                                                    testCase
                                                        ?.error ||
                                                    "",

                                                timedOut:
                                                    Boolean(
                                                        testCase
                                                            ?.timedOut
                                                    ),

                                                isHidden:
                                                    Boolean(
                                                        testCase
                                                            ?.isHidden
                                                    )
                                            };
                                        }
                                    )
                        })
                    );


                /*
                ====================================================
                SQL PERFORMANCE SUMMARY
                ====================================================
                */

                const sqlTotalTestCases =
                    evaluatedAnswers
                        .reduce(
                            (
                                sum,
                                answer
                            ) =>
                                sum +
                                Number(
                                    answer
                                        .totalTestCases ||
                                    0
                                ),
                            0
                        );


                const sqlPassedTestCases =
                    evaluatedAnswers
                        .reduce(
                            (
                                sum,
                                answer
                            ) =>
                                sum +
                                Number(
                                    answer
                                        .testCasesPassed ||
                                    0
                                ),
                            0
                        );


                const correctQuestions =
                    evaluatedAnswers
                        .filter(
                            (
                                answer
                            ) =>
                                answer
                                    .isCorrect ===
                                true
                        )
                        .length;


                /*
                ====================================================
                SQL RESPONSE
                ====================================================
                */

                return res
                    .status(200)
                    .json({

                        success:
                            true,

                        message:
                            "SQL assessment evaluated successfully",

                        data: {

                            assessmentId:
                                assessment._id,

                            attemptId:
                                attempt._id,

                            type:
                                assessment.type,

                            score:
                                totalScore,

                            maxScore,

                            percentage,

                            status:
                                attempt.status,

                            sqlPerformance: {

                                totalQuestions:
                                    questions.length,

                                correctQuestions,

                                incorrectQuestions:
                                    Math.max(
                                        questions.length -
                                        correctQuestions,
                                        0
                                    ),

                                totalTestCases:
                                    sqlTotalTestCases,

                                testCasesPassed:
                                    sqlPassedTestCases,

                                testCasesFailed:
                                    Math.max(
                                        sqlTotalTestCases -
                                        sqlPassedTestCases,
                                        0
                                    ),

                                testCasePercentage:
                                    sqlTotalTestCases >
                                    0

                                        ? Math.round(
                                            (
                                                sqlPassedTestCases /
                                                sqlTotalTestCases
                                            ) *
                                            100
                                        )

                                        : 0
                            },

                            answers:
                                publicAnswers
                        }
                    });
            }


            /*
            ========================================================
            UNSUPPORTED ASSESSMENT TYPE
            ========================================================
            */

            return res
                .status(400)
                .json({

                    success:
                        false,

                    message:
                        "Unsupported assessment type"
                });


        } catch (
            error
        ) {

            console.error(
                "\nSUBMIT ASSESSMENT ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Failed to submit assessment",

                    error:
                        error.message
                });
        }
    };
/*
============================================================
GET ASSESSMENT RESULT
============================================================
*/

const getAssessmentResult =
    async (req, res) => {

        try {

            const {
                assessmentId
            } = req.params;


            console.log(
                "\n========== GET ASSESSMENT RESULT =========="
            );


            /*
            --------------------------------------------------------
            ASSESSMENT
            --------------------------------------------------------
            */

            const assessment =
                await Assessment.findOne({

                    _id:
                        assessmentId,

                    user:
                        req.user.id
                })
                .populate(
                    "company"
                )
                .populate(
                    "role"
                );


            if (!assessment) {

                return res
                    .status(404)
                    .json({

                        success:
                            false,

                        message:
                            "Assessment not found"
                    });
            }


            /*
            --------------------------------------------------------
            RESUME
            --------------------------------------------------------
            */

            const resume =
                await Resume.findOne({

                    _id:
                        assessment
                            .resume,

                    user:
                        req.user.id
                });


            const resumeCoverage =
                Number(
                    resume
                        ?.skillGapAnalysis
                        ?.coverageScore ||
                    0
                );


            /*
            --------------------------------------------------------
            EVALUATED ATTEMPT
            --------------------------------------------------------
            */

            const attempt =
                await AssessmentAttempt
                    .findOne({

                        assessment:
                            assessment._id,

                        user:
                            req.user.id,

                        status:
                            "evaluated"
                    })
                    .sort({
                        createdAt:
                            -1
                    });


            if (!attempt) {

                return res
                    .status(404)
                    .json({

                        success:
                            false,

                        message:
                            "Assessment has not been evaluated yet"
                    });
            }


            /*
            --------------------------------------------------------
            PERFORMANCE LEVEL
            --------------------------------------------------------
            */

            const getPerformanceLevel =
                (value) => {

                    const score =
                        Number(
                            value ||
                            0
                        );


                    if (
                        score >=
                        90
                    ) {

                        return "Expert";
                    }


                    if (
                        score >=
                        70
                    ) {

                        return "Advanced";
                    }


                    if (
                        score >=
                        40
                    ) {

                        return "Intermediate";
                    }


                    return "Beginner";
                };


            const percentage =
                Number(
                    attempt
                        .percentage ||
                    0
                );


            const totalQuestions =
                Number(
                    assessment
                        .totalQuestion ||
                    assessment
                        .totalQuestions ||
                    0
                );


            const correctAnswers =
                Array.isArray(
                    attempt.answers
                )

                    ? attempt.answers
                        .filter(
                            (answer) =>
                                answer
                                    .isCorrect ===
                                true
                        )
                        .length

                    : 0;


            const wrongAnswers =
                Math.max(
                    totalQuestions -
                    correctAnswers,
                    0
                );


            const level =
                getPerformanceLevel(
                    percentage
                );


            /*
            ========================================================
            LOAD QUESTIONS
            ========================================================
            */

            let questions = [];


            if (
                assessment.type ===
                "mcq"
            ) {

                questions =
                    await Question.find({

                        _id: {
                            $in:
                                assessment
                                    .mcqQuestions ||
                                []
                        }
                    })
                    .populate(
                        "skill"
                    );
            }


            else if (
                assessment.type ===
                "coding"
            ) {

                /*
                No need to retrieve testCases here.

                Final test information is already safely stored
                in AssessmentAttempt.
                */

                questions =
                    await CodingQuestion.find({

                        _id: {
                            $in:
                                assessment
                                    .codingQuestions ||
                                []
                        }
                    })
                    .populate(
                        "skill"
                    );
            }


            else if (
                assessment.type ===
                "sql"
            ) {

                questions =
                    await SQLQuestion.find({

                        _id: {
                            $in:
                                assessment
                                    .sqlQuestions ||
                                []
                        }
                    })
                    .populate(
                        "skill"
                    );
            }


            const maxScore =
                questions.reduce(

                    (
                        sum,
                        question
                    ) =>

                        sum +
                        Number(
                            question
                                ?.points ||
                            1
                        ),

                    0
                );


            /*
            ========================================================
            SKILL PERFORMANCE
            ========================================================
            */

            const skillPerformance =
                {};


            for (
                const question
                of questions
            ) {

                const skillName =
                    question
                        ?.skill
                        ?.name ||
                    "Unknown";


                if (
                    !skillPerformance[
                        skillName
                    ]
                ) {

                    skillPerformance[
                        skillName
                    ] = {

                        skill:
                            skillName,

                        totalQuestions:
                            0,

                        correctAnswers:
                            0,

                        score:
                            0,

                        maxScore:
                            0,

                        percentage:
                            0,

                        accuracy:
                            0,

                        level:
                            "Beginner",

                        testCasesPassed:
                            0,

                        totalTestCases:
                            0,

                        testCasePercentage:
                            0,

                        executionTime:
                            0
                    };
                }


                const skill =
                    skillPerformance[
                        skillName
                    ];


                const answer =
                    Array.isArray(
                        attempt.answers
                    )

                        ? attempt.answers
                            .find(
                                (item) =>
                                    item
                                        ?.question
                                        ?.toString() ===
                                    question
                                        ?._id
                                        ?.toString()
                            )

                        : null;


                skill.totalQuestions++;


                const questionPoints =
                    Number(
                        question
                            ?.points ||
                        1
                    );


                skill.maxScore +=
                    questionPoints;


                if (answer) {

                    skill.score +=
                        Number(
                            answer
                                .pointsEarned ||
                            0
                        );


                    if (
                        answer
                            .isCorrect
                    ) {

                        skill.correctAnswers++;
                    }


                    skill.testCasesPassed +=
                        Number(
                            answer
                                .testCasesPassed ||
                            0
                        );


                    skill.totalTestCases +=
                        Number(
                            answer
                                .totalTestCases ||
                            0
                        );


                    skill.executionTime +=
                        Number(
                            answer
                                .executionTime ||
                            0
                        );
                }
            }


            const skillResults =
                Object.values(
                    skillPerformance
                )
                .map(
                    (skill) => {

                        skill.percentage =
                            skill
                                .maxScore >
                            0

                                ? Math.round(
                                    (
                                        skill
                                            .score /
                                        skill
                                            .maxScore
                                    ) * 100
                                )

                                : 0;


                        skill.accuracy =
                            skill
                                .totalQuestions >
                            0

                                ? Math.round(
                                    (
                                        skill
                                            .correctAnswers /
                                        skill
                                            .totalQuestions
                                    ) * 100
                                )

                                : 0;


                        skill.testCasePercentage =
                            skill
                                .totalTestCases >
                            0

                                ? Math.round(
                                    (
                                        skill
                                            .testCasesPassed /
                                        skill
                                            .totalTestCases
                                    ) * 100
                                )

                                : 0;


                        skill.level =
                            getPerformanceLevel(
                                skill
                                    .percentage
                            );


                        return skill;
                    }
                )
                .sort(
                    (a, b) =>
                        b.percentage -
                        a.percentage
                );


            const skillAnalysis =
                analyzeWeakSkills(
                    skillResults
                );


            /*
            ========================================================
            JOB READINESS
            ========================================================
            */

            const jobReadiness =
                calculateJobReadiness({

                    resumeCoverage,

                    assessmentScore:
                        percentage
                });


            const jobReadinessExplanation =
                generateJobReadinessExplanation({

                    jobReadiness,

                    skillPerformance:
                        skillResults,

                    weakSkillAnalysis:
                        skillAnalysis
                });


            /*
            ========================================================
            CODING PERFORMANCE
            ========================================================
            */

            let codingPerformance =
                null;


            if (
                assessment.type ===
                "coding"
            ) {

                let totalTestCases =
                    0;

                let testCasesPassed =
                    0;

                let totalExecutionTime =
                    0;

                let questionsAttempted =
                    0;

                let questionsSolved =
                    0;

                let questionsPartiallyPassed =
                    0;


                const questionResults =
                    questions.map(
                        (question) => {

                            const answer =
                                Array.isArray(
                                    attempt.answers
                                )

                                    ? attempt.answers
                                        .find(
                                            (item) =>
                                                item
                                                    ?.question
                                                    ?.toString() ===
                                                question
                                                    ?._id
                                                    ?.toString()
                                        )

                                    : null;


                            const passed =
                                Number(
                                    answer
                                        ?.testCasesPassed ||
                                    0
                                );


                            /*
                            Use attempt value because CodingQuestion
                            testCases are server-only.
                            */

                            const total =
                                Number(
                                    answer
                                        ?.totalTestCases ||
                                    0
                                );


                            const executionTime =
                                Number(
                                    answer
                                        ?.executionTime ||
                                    0
                                );


                            const attempted =
                                Boolean(
                                    String(
                                        answer
                                            ?.answer ||
                                        ""
                                    ).trim()
                                );


                            if (
                                attempted
                            ) {

                                questionsAttempted++;
                            }


                            if (
                                answer
                                    ?.isCorrect
                            ) {

                                questionsSolved++;

                            } else if (
                                passed >
                                0
                            ) {

                                questionsPartiallyPassed++;
                            }


                            totalTestCases +=
                                total;

                            testCasesPassed +=
                                passed;

                            totalExecutionTime +=
                                executionTime;


                            /*
                            ----------------------------------------
                            SAFE TEST CASE RESULTS
                            ----------------------------------------
                            */

                            const publicTestCaseResults =
                                (
                                    answer
                                        ?.testCaseResults ||
                                    []
                                )
                                .map(
                                    (result) => {

                                        const base = {

                                            testCaseNumber:
                                                result
                                                    ?.testCaseNumber,

                                            passed:
                                                Boolean(
                                                    result
                                                        ?.passed
                                                ),

                                            executionTime:
                                                Number(
                                                    result
                                                        ?.executionTime ||
                                                    0
                                                ),

                                            error:
                                                result
                                                    ?.error ||
                                                "",

                                            timedOut:
                                                Boolean(
                                                    result
                                                        ?.timedOut
                                                ),

                                            isHidden:
                                                Boolean(
                                                    result
                                                        ?.isHidden
                                                )
                                        };


                                        if (
                                            result
                                                ?.isHidden
                                        ) {

                                            return base;
                                        }


                                        return {

                                            ...base,

                                            actual:
                                                result
                                                    ?.actual ||
                                                "",

                                            expected:
                                                result
                                                    ?.expected ||
                                                ""
                                        };
                                    }
                                );


                            return {

                                questionId:
                                    question._id,

                                title:
                                    question
                                        .title ||
                                    "Coding Question",

                                skill:
                                    question
                                        ?.skill
                                        ?.name ||
                                    "Unknown",

                                difficulty:
                                    question
                                        ?.difficulty ||
                                    "",

                                language:
                                    question
                                        ?.language ||
                                    answer
                                        ?.language ||
                                    "python",

                                attempted,

                                isCorrect:
                                    Boolean(
                                        answer
                                            ?.isCorrect
                                    ),

                                pointsEarned:
                                    Number(
                                        answer
                                            ?.pointsEarned ||
                                        0
                                    ),

                                maxPoints:
                                    Number(
                                        question
                                            ?.points ||
                                        10
                                    ),

                                testCasesPassed:
                                    passed,

                                testCasesFailed:
                                    Math.max(
                                        total -
                                        passed,
                                        0
                                    ),

                                totalTestCases:
                                    total,

                                executionTime,

                                error:
                                    answer
                                        ?.error ||
                                    "",

                                timedOut:
                                    Boolean(
                                        answer
                                            ?.timedOut
                                    ),

                                testCaseResults:
                                    publicTestCaseResults
                            };
                        }
                    );


                const testCasesFailed =
                    Math.max(
                        totalTestCases -
                        testCasesPassed,
                        0
                    );


                const questionsFailed =
                    Math.max(
                        totalQuestions -
                        questionsSolved -
                        questionsPartiallyPassed,
                        0
                    );


                const testCasePercentage =
                    totalTestCases > 0

                        ? Math.round(
                            (
                                testCasesPassed /
                                totalTestCases
                            ) * 100
                        )

                        : 0;


                const averageExecutionTime =
                    totalTestCases > 0

                        ? Math.round(
                            totalExecutionTime /
                            totalTestCases
                        )

                        : 0;


                codingPerformance = {

                    questionsAttempted,

                    questionsSolved,

                    questionsPartiallyPassed,

                    questionsFailed,

                    testCasesPassed,

                    testCasesFailed,

                    totalTestCases,

                    testCasePercentage,

                    totalExecutionTime,

                    averageExecutionTime,

                    questionResults
                };
            }


            /*
            ========================================================
            AI CODING EXPLANATION
            ========================================================
            */

            let aiExplanation =
                attempt
                    .aiInsights ||
                null;


            if (
                !aiExplanation &&
                assessment.type ===
                "coding"
            ) {

                try {

                    const safeCodingPerformance =
                        codingPerformance

                            ? {

                                questionsAttempted:
                                    codingPerformance
                                        .questionsAttempted,

                                questionsSolved:
                                    codingPerformance
                                        .questionsSolved,

                                questionsPartiallyPassed:
                                    codingPerformance
                                        .questionsPartiallyPassed,

                                questionsFailed:
                                    codingPerformance
                                        .questionsFailed,

                                testCasesPassed:
                                    codingPerformance
                                        .testCasesPassed,

                                testCasesFailed:
                                    codingPerformance
                                        .testCasesFailed,

                                totalTestCases:
                                    codingPerformance
                                        .totalTestCases,

                                testCasePercentage:
                                    codingPerformance
                                        .testCasePercentage,

                                totalExecutionTime:
                                    codingPerformance
                                        .totalExecutionTime,

                                averageExecutionTime:
                                    codingPerformance
                                        .averageExecutionTime
                            }

                            : {};


                    const generatedInsight =
                        await generateAssessmentAIInsight({

                            assessmentType:
                                assessment
                                    .type,

                            percentage,

                            jobReadiness: {

                                score:
                                    Number(
                                        jobReadiness
                                            ?.score ||
                                        0
                                    ),

                                level:
                                    jobReadiness
                                        ?.level ||
                                    "",

                                resumeCoverage:
                                    Number(
                                        jobReadiness
                                            ?.resumeCoverage ||
                                        0
                                    ),

                                assessmentScore:
                                    Number(
                                        jobReadiness
                                            ?.assessmentScore ||
                                        0
                                    )
                            },

                            codingPerformance:
                                safeCodingPerformance,

                            skillPerformance:
                                skillResults,

                            weakSkillAnalysis: {

                                weakSkills:
                                    skillAnalysis
                                        ?.weakSkills ||
                                    [],

                                moderateSkills:
                                    skillAnalysis
                                        ?.moderateSkills ||
                                    [],

                                strongSkills:
                                    skillAnalysis
                                        ?.strongSkills ||
                                    []
                            }
                        });


                    if (
                        generatedInsight
                    ) {

                        aiExplanation =
                            generatedInsight;


                        attempt.aiInsights =
                            generatedInsight;


                        await attempt.save();


                        console.log(
                            "AI coding insight generated and cached."
                        );
                    }


                } catch (
                    aiError
                ) {

                    console.error(
                        "AI explanation generation failed:",
                        aiError.message
                    );
                }
            }


            /*
            ========================================================
            FALLBACK EXPLANATION
            ========================================================
            */

            if (!aiExplanation) {

                const fallbackStrongSkills =
                    jobReadinessExplanation
                        ?.strongSkills ||
                    [];


                const fallbackWeakSkills =
                    jobReadinessExplanation
                        ?.areasToImprove ||
                    [];


                aiExplanation = {

                    source:
                        "rule-based-fallback",

                    model:
                        null,

                    summary:
                        jobReadinessExplanation
                            ?.summary ||

                        (
                            percentage >=
                            70

                                ? "You demonstrated a solid coding foundation. Continue improving consistency, edge-case handling and algorithmic problem solving."

                                : "Your coding result shows areas that need additional practice. Focus on debugging, edge cases and solving problems consistently across all test cases."
                        ),

                    strengths:
                        fallbackStrongSkills
                            .slice(
                                0,
                                5
                            )
                            .map(
                                (skill) => ({

                                    skill:
                                        skill
                                            ?.skill ||
                                        "Skill",

                                    score:
                                        Number(
                                            skill
                                                ?.percentage ||
                                            0
                                        ),

                                    message:
                                        `${skill?.skill || "This skill"} is currently one of your stronger assessed areas.`
                                })
                            ),

                    improvements:
                        fallbackWeakSkills
                            .slice(
                                0,
                                5
                            )
                            .map(
                                (skill) => ({

                                    skill:
                                        skill
                                            ?.skill ||
                                        "Skill",

                                    score:
                                        Number(
                                            skill
                                                ?.percentage ||
                                            0
                                        ),

                                    message:
                                        `Continue practicing ${skill?.skill || "this skill"} to improve accuracy and consistency.`
                                })
                            ),

                    codingAnalysis: {

                        testCaseInsight:
                            codingPerformance

                                ? `${codingPerformance.testCasesPassed} of ${codingPerformance.totalTestCases} test cases passed.`

                                : "No coding test-case information is available.",

                        problemSolvingInsight:
                            codingPerformance

                                ? `${codingPerformance.questionsSolved} question(s) were fully solved and ${codingPerformance.questionsPartiallyPassed} were partially solved.`

                                : "Problem-solving information is unavailable.",

                        executionInsight:
                            codingPerformance

                                ? `Average recorded execution time was ${codingPerformance.averageExecutionTime} ms per test case.`

                                : "Execution-time information is unavailable."
                    },

                    recommendations:
                        (
                            skillAnalysis
                                ?.recommendations ||
                            []
                        )
                        .slice(
                            0,
                            5
                        )
                        .map(
                            (
                                recommendation
                            ) => {

                                if (
                                    typeof recommendation ===
                                    "string"
                                ) {

                                    return recommendation;
                                }


                                const skillName =
                                    recommendation
                                        ?.skill ||
                                    "your weaker skills";


                                const topics =
                                    Array.isArray(
                                        recommendation
                                            ?.recommendedTopics
                                    )

                                        ? recommendation
                                            .recommendedTopics

                                        : [];


                                if (
                                    topics.length >
                                    0
                                ) {

                                    return (
                                        `Improve ${skillName}: ${topics
                                            .slice(
                                                0,
                                                3
                                            )
                                            .join(", ")}.`
                                    );
                                }


                                return (
                                    recommendation
                                        ?.message ||

                                    `Practice ${skillName} with additional coding problems.`
                                );
                            }
                        ),

                    nextAction:
                        jobReadinessExplanation
                            ?.priorityMessage ||

                        (
                            skillResults.length >
                            0

                                ? `Focus next on ${skillResults[
                                    skillResults.length -
                                    1
                                ].skill}.`

                                : "Continue practicing coding problems and review failed test cases."
                        )
                };
            }


            /*
            ========================================================
            FINAL RESULT RESPONSE
            ========================================================
            */

            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "Assessment result fetched successfully",

                    data: {

                        assessment: {

                            id:
                                assessment._id,

                            type:
                                assessment.type,

                            company:
                                assessment
                                    ?.company
                                    ?.name ||
                                "",

                            role:
                                assessment
                                    ?.role
                                    ?.name ||
                                "",

                            totalQuestions,

                            status:
                                assessment.status
                        },

                        result: {

                            score:
                                Number(
                                    attempt
                                        .score ||
                                    0
                                ),

                            maxScore,

                            percentage,

                            level,

                            correctAnswers,

                            wrongAnswers,

                            totalQuestions
                        },

                        codingPerformance,

                        skillPerformance:
                            skillResults,

                        weakSkillAnalysis: {

                            weakSkills:
                                skillAnalysis
                                    ?.weakSkills ||
                                [],

                            moderateSkills:
                                skillAnalysis
                                    ?.moderateSkills ||
                                [],

                            strongSkills:
                                skillAnalysis
                                    ?.strongSkills ||
                                [],

                            recommendations:
                                skillAnalysis
                                    ?.recommendations ||
                                []
                        },

                        jobReadiness: {

                            score:
                                Number(
                                    jobReadiness
                                        ?.score ||
                                    0
                                ),

                            level:
                                jobReadiness
                                    ?.level ||
                                "",

                            resumeCoverage:
                                Number(
                                    jobReadiness
                                        ?.resumeCoverage ||
                                    0
                                ),

                            assessmentScore:
                                Number(
                                    jobReadiness
                                        ?.assessmentScore ||
                                    0
                                ),

                            weights:
                                jobReadiness
                                    ?.weights ||
                                {}
                        },

                        jobReadinessExplanation,

                        aiExplanation,

                        completedAt:
                            attempt
                                .submittedAt
                    }
                });


        } catch (error) {

            console.error(
                "GET ASSESSMENT RESULT ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Failed to fetch assessment result",

                    error:
                        error.message
                });
        }
    };


/*
============================================================
GET FINAL JOB READINESS
============================================================
*/

const getFinalJobReadinessResult =
    async (req, res) => {

        try {

            const {
                resumeId
            } = req.params;


            const result =
                await getFinalJobReadiness({

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
                        "Final job readiness calculated successfully",

                    data:
                        result
                });


        } catch (error) {

            console.error(
                "FINAL JOB READINESS ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Failed to calculate final job readiness",

                    error:
                        error.message
                });
        }
    };


/*
============================================================
GET ASSESSMENT PROGRESS
============================================================
*/

const getAssessmentProgress =
    async (req, res) => {

        try {

            const {
                resumeId
            } = req.params;


            /*
            --------------------------------------------------------
            VERIFY RESUME
            --------------------------------------------------------
            */

            const resume =
                await Resume.findOne({

                    _id:
                        resumeId,

                    user:
                        req.user.id
                })
                .populate(
                    "company"
                )
                .populate(
                    "role"
                );


            if (!resume) {

                return res
                    .status(404)
                    .json({

                        success:
                            false,

                        message:
                            "Resume not found"
                    });
            }


            /*
            --------------------------------------------------------
            ASSESSMENTS
            --------------------------------------------------------
            */

            const assessments =
                await Assessment.find({

                    user:
                        req.user.id,

                    resume:
                        resumeId
                })
                .sort({
                    createdAt:
                        -1
                });


            if (
                !assessments.length
            ) {

                return res
                    .status(200)
                    .json({

                        success:
                            true,

                        message:
                            "No assessments found for this resume",

                        resume: {

                            id:
                                resume._id,

                            company:
                                resume
                                    .company ||
                                null,

                            role:
                                resume
                                    .role ||
                                null
                        },

                        overallProgress: {

                            currentScore:
                                0,

                            previousScore:
                                0,

                            improvement:
                                0,

                            attempts:
                                []
                        },

                        typeProgress: {

                            mcq: {
                                currentScore:
                                    0,
                                previousScore:
                                    0,
                                improvement:
                                    0,
                                attempts:
                                    []
                            },

                            coding: {
                                currentScore:
                                    0,
                                previousScore:
                                    0,
                                improvement:
                                    0,
                                attempts:
                                    []
                            },

                            sql: {
                                currentScore:
                                    0,
                                previousScore:
                                    0,
                                improvement:
                                    0,
                                attempts:
                                    []
                            }
                        },

                        skillProgress:
                            [],

                        skillAnalysis: {

                            strongestSkill:
                                null,

                            weakestSkill:
                                null,

                            biggestImprovement:
                                null,

                            biggestDecline:
                                null
                        },

                        learningRecommendations:
                            [],

                        topLearningPriorities:
                            [],

                        finalProgressSummary:
                            null,

                        aiPerformanceInsights:
                            null,

                        assessmentHistory:
                            []
                    });
            }


            /*
            --------------------------------------------------------
            ASSESSMENT MAP
            --------------------------------------------------------
            */

            const assessmentMap =
                new Map();


            assessments.forEach(
                (assessment) => {

                    assessmentMap.set(
                        assessment
                            ._id
                            .toString(),
                        assessment
                    );
                }
            );


            const assessmentIds =
                assessments.map(
                    (assessment) =>
                        assessment._id
                );


            /*
            --------------------------------------------------------
            EVALUATED ATTEMPTS
            --------------------------------------------------------
            */

            const attempts =
                await AssessmentAttempt.find({

                    user:
                        req.user.id,

                    assessment: {
                        $in:
                            assessmentIds
                    },

                    status:
                        "evaluated"
                })
                .sort({
                    submittedAt:
                        -1
                });


            if (
                !attempts.length
            ) {

                return res
                    .status(200)
                    .json({

                        success:
                            true,

                        message:
                            "No completed assessment attempts found",

                        resume: {

                            id:
                                resume._id,

                            company:
                                resume
                                    .company ||
                                null,

                            role:
                                resume
                                    .role ||
                                null
                        },

                        overallProgress: {

                            currentScore:
                                0,

                            previousScore:
                                0,

                            improvement:
                                0,

                            attempts:
                                []
                        },

                        typeProgress: {

                            mcq: {
                                currentScore:
                                    0,
                                previousScore:
                                    0,
                                improvement:
                                    0,
                                attempts:
                                    []
                            },

                            coding: {
                                currentScore:
                                    0,
                                previousScore:
                                    0,
                                improvement:
                                    0,
                                attempts:
                                    []
                            },

                            sql: {
                                currentScore:
                                    0,
                                previousScore:
                                    0,
                                improvement:
                                    0,
                                attempts:
                                    []
                            }
                        },

                        skillProgress:
                            [],

                        skillAnalysis: {

                            strongestSkill:
                                null,

                            weakestSkill:
                                null,

                            biggestImprovement:
                                null,

                            biggestDecline:
                                null
                        },

                        learningRecommendations:
                            [],

                        topLearningPriorities:
                            [],

                        finalProgressSummary:
                            null,

                        aiPerformanceInsights:
                            null,

                        assessmentHistory:
                            []
                    });
            }


            /*
            --------------------------------------------------------
            HISTORY
            --------------------------------------------------------
            */

            const history =
                attempts.map(
                    (attempt) => {

                        const assessment =
                            assessmentMap.get(
                                attempt
                                    .assessment
                                    .toString()
                            );


                        return {

                            attemptId:
                                attempt._id,

                            assessmentId:
                                assessment
                                    ?._id ||
                                null,

                            type:
                                assessment
                                    ?.type ||
                                "unknown",

                            score:
                                Number(
                                    attempt
                                        .score
                                ) ||
                                0,

                            percentage:
                                Number(
                                    attempt
                                        .percentage
                                ) ||
                                0,

                            submittedAt:
                                attempt
                                    .submittedAt ||
                                null,

                            status:
                                attempt.status
                        };
                    }
                );


            /*
            --------------------------------------------------------
            OVERALL + TYPE PROGRESS
            --------------------------------------------------------
            */

            const overallProgress =
                calculateAssessmentProgress(
                    attempts
                );


            const groupedAttempts = {

                mcq:
                    [],

                coding:
                    [],

                sql:
                    []
            };


            history.forEach(
                (item) => {

                    if (
                        groupedAttempts[
                            item.type
                        ]
                    ) {

                        groupedAttempts[
                            item.type
                        ].push(
                            item
                        );
                    }
                }
            );


            const typeProgress =
                {};


            Object.keys(
                groupedAttempts
            )
            .forEach(
                (type) => {

                    typeProgress[
                        type
                    ] =
                        calculateAssessmentProgress(
                            groupedAttempts[
                                type
                            ]
                        );
                }
            );


            /*
            --------------------------------------------------------
            SKILL PROGRESS
            --------------------------------------------------------
            */

            let skillProgress =
                [];


            let skillAnalysis = {

                strongestSkill:
                    null,

                weakestSkill:
                    null,

                biggestImprovement:
                    null,

                biggestDecline:
                    null
            };


            const currentAttempt =
                attempts[0];


            const previousAttempt =
                attempts.length >
                1
                    ? attempts[1]
                    : null;


            if (
                previousAttempt
            ) {

                const currentAssessment =
                    assessmentMap.get(
                        currentAttempt
                            .assessment
                            .toString()
                    );


                const previousAssessment =
                    assessmentMap.get(
                        previousAttempt
                            .assessment
                            .toString()
                    );


                if (
                    currentAssessment &&
                    previousAssessment
                ) {

                    let currentQuestions =
                        [];


                    if (
                        currentAssessment
                            .type ===
                        "mcq"
                    ) {

                        currentQuestions =
                            await Question.find({

                                _id: {
                                    $in:
                                        currentAssessment
                                            .mcqQuestions ||
                                        []
                                }
                            })
                            .populate(
                                "skill"
                            );
                    }


                    else if (
                        currentAssessment
                            .type ===
                        "coding"
                    ) {

                        currentQuestions =
                            await CodingQuestion.find({

                                _id: {
                                    $in:
                                        currentAssessment
                                            .codingQuestions ||
                                        []
                                }
                            })
                            .populate(
                                "skill"
                            );
                    }


                    else if (
                        currentAssessment
                            .type ===
                        "sql"
                    ) {

                        currentQuestions =
                            await SQLQuestion.find({

                                _id: {
                                    $in:
                                        currentAssessment
                                            .sqlQuestions ||
                                        []
                                }
                            })
                            .populate(
                                "skill"
                            );
                    }


                    let previousQuestions =
                        [];


                    if (
                        previousAssessment
                            .type ===
                        "mcq"
                    ) {

                        previousQuestions =
                            await Question.find({

                                _id: {
                                    $in:
                                        previousAssessment
                                            .mcqQuestions ||
                                        []
                                }
                            })
                            .populate(
                                "skill"
                            );
                    }


                    else if (
                        previousAssessment
                            .type ===
                        "coding"
                    ) {

                        previousQuestions =
                            await CodingQuestion.find({

                                _id: {
                                    $in:
                                        previousAssessment
                                            .codingQuestions ||
                                        []
                                }
                            })
                            .populate(
                                "skill"
                            );
                    }


                    else if (
                        previousAssessment
                            .type ===
                        "sql"
                    ) {

                        previousQuestions =
                            await SQLQuestion.find({

                                _id: {
                                    $in:
                                        previousAssessment
                                            .sqlQuestions ||
                                        []
                                }
                            })
                            .populate(
                                "skill"
                            );
                    }


                    skillProgress =
                        calculateAttemptSkillProgress({

                            currentAttempt,

                            currentQuestions,

                            previousAttempt,

                            previousQuestions
                        });


                    skillAnalysis =
                        analyzeSkillProgress(
                            skillProgress
                        );
                }
            }


            /*
            --------------------------------------------------------
            LEARNING RECOMMENDATIONS
            --------------------------------------------------------
            */

            const learningRecommendations =
                generateLearningRecommendations(
                    skillProgress
                );


            const topLearningPriorities =
                getTopLearningPriorities(
                    learningRecommendations
                );


            /*
            --------------------------------------------------------
            JOB READINESS
            --------------------------------------------------------
            */

            const jobReadiness =
                calculateJobReadiness({

                    resumeCoverage:
                        resume
                            .skillGapAnalysis
                            ?.coveragePercentage ||
                        0,

                    assessmentScore:
                        overallProgress
                            .currentScore ||
                        0
                });


            /*
            --------------------------------------------------------
            FRONTEND ANALYTICS
            --------------------------------------------------------
            */

            const chronologicalHistory =
                [
                    ...history
                ].reverse();


            const performanceTrend =
                chronologicalHistory
                    .map(
                        (
                            item,
                            index
                        ) => ({

                            attemptNumber:
                                index +
                                1,

                            attemptId:
                                item
                                    .attemptId,

                            assessmentId:
                                item
                                    .assessmentId,

                            type:
                                item.type,

                            score:
                                Number(
                                    item
                                        .score
                                ) ||
                                0,

                            percentage:
                                Number(
                                    item
                                        .percentage
                                ) ||
                                0,

                            submittedAt:
                                item
                                    .submittedAt
                        })
                    );


            const movingAverage =
                [];


            for (
                let i = 0;
                i <
                performanceTrend.length;
                i++
            ) {

                const start =
                    Math.max(
                        0,
                        i - 2
                    );


                const window =
                    performanceTrend
                        .slice(
                            start,
                            i + 1
                        );


                const average =
                    window.length >
                    0

                        ? Math.round(
                            window.reduce(
                                (
                                    sum,
                                    item
                                ) =>

                                    sum +
                                    Number(
                                        item
                                            .percentage ||
                                        0
                                    ),

                                0
                            ) /
                            window.length
                        )

                        : 0;


                movingAverage.push({

                    attemptNumber:
                        i + 1,

                    average
                });
            }


            /*
            --------------------------------------------------------
            MOMENTUM
            --------------------------------------------------------
            */

            let momentum = {

                value:
                    0,

                direction:
                    "stable",

                description:
                    "Not enough data to determine performance momentum."
            };


            if (
                performanceTrend.length >=
                2
            ) {

                const latest =
                    Number(
                        performanceTrend[
                            performanceTrend
                                .length -
                            1
                        ].percentage
                    ) ||
                    0;


                const previous =
                    Number(
                        performanceTrend[
                            performanceTrend
                                .length -
                            2
                        ].percentage
                    ) ||
                    0;


                const difference =
                    latest -
                    previous;


                let direction =
                    "stable";


                if (
                    difference >
                    0
                ) {

                    direction =
                        "improving";
                }


                else if (
                    difference <
                    0
                ) {

                    direction =
                        "declining";
                }


                momentum = {

                    value:
                        difference,

                    direction,

                    description:
                        difference >
                        0

                            ? `Performance improved by ${Math.abs(difference)} points.`

                            : difference <
                                0

                                ? `Performance declined by ${Math.abs(difference)} points.`

                                : "Performance remained stable."
                };
            }


            /*
            --------------------------------------------------------
            TYPE ANALYTICS
            --------------------------------------------------------
            */

            const typeAnalytics =
                {};


            Object.keys(
                groupedAttempts
            )
            .forEach(
                (type) => {

                    const typeAttempts =
                        groupedAttempts[
                            type
                        ];


                    const scores =
                        typeAttempts.map(
                            (item) =>
                                Number(
                                    item
                                        .percentage
                                ) ||
                                0
                        );


                    const totalAttempts =
                        scores.length;


                    const averageScore =
                        totalAttempts >
                        0

                            ? Math.round(
                                scores.reduce(
                                    (
                                        sum,
                                        score
                                    ) =>
                                        sum +
                                        score,
                                    0
                                ) /
                                totalAttempts
                            )

                            : 0;


                    typeAnalytics[
                        type
                    ] = {

                        type,

                        totalAttempts,

                        averageScore,

                        bestScore:
                            totalAttempts >
                            0
                                ? Math.max(
                                    ...scores
                                )
                                : 0,

                        latestScore:
                            totalAttempts >
                            0
                                ? scores[0]
                                : 0
                    };
                }
            );


            /*
            --------------------------------------------------------
            SKILL ANALYTICS
            --------------------------------------------------------
            */

            const analyticsSkillPerformance =
                Array.isArray(
                    skillProgress
                )

                    ? skillProgress.map(
                        (skill) => ({

                            skill:
                                skill
                                    .skill ||
                                skill
                                    .name ||
                                "Unknown",

                            name:
                                skill
                                    .name ||
                                skill
                                    .skill ||
                                "Unknown",

                            score:
                                Number(
                                    skill
                                        .score ||
                                    0
                                ),

                            maxScore:
                                Number(
                                    skill
                                        .maxScore ||
                                    0
                                ),

                            percentage:
                                Number(
                                    skill
                                        .percentage ||
                                    0
                                ),

                            level:
                                skill
                                    .level ||
                                "Unknown",

                            improvement:
                                Number(
                                    skill
                                        .improvement ||
                                    0
                                )
                        })
                    )

                    : [];


            /*
            --------------------------------------------------------
            DIFFICULTY ANALYTICS
            --------------------------------------------------------
            */

            const difficultyBuckets = {

                Easy:
                    [],

                Medium:
                    [],

                Hard:
                    []
            };


            attempts.forEach(
                (attempt) => {

                    if (
                        !Array.isArray(
                            attempt.answers
                        )
                    ) {

                        return;
                    }


                    attempt.answers.forEach(
                        (answer) => {

                            const difficulty =
                                answer
                                    .difficulty;


                            if (
                                difficultyBuckets[
                                    difficulty
                                ]
                            ) {

                                difficultyBuckets[
                                    difficulty
                                ].push(

                                    answer
                                        .isCorrect

                                        ? 100

                                        : 0
                                );
                            }
                        }
                    );
                }
            );


            const difficultyPerformance =
                {};


            Object.keys(
                difficultyBuckets
            )
            .forEach(
                (difficulty) => {

                    const values =
                        difficultyBuckets[
                            difficulty
                        ];


                    difficultyPerformance[
                        difficulty
                    ] = {

                        difficulty,

                        attempts:
                            values.length,

                        averageScore:
                            values.length >
                            0

                                ? Math.round(
                                    values.reduce(
                                        (
                                            sum,
                                            value
                                        ) =>
                                            sum +
                                            value,

                                        0
                                    ) /
                                    values.length
                                )

                                : 0
                    };
                }
            );


            /*
            --------------------------------------------------------
            OVERALL ANALYTICS
            --------------------------------------------------------
            */

            const percentages =
                attempts.map(
                    (attempt) =>
                        Number(
                            attempt
                                .percentage ||
                            0
                        )
                );


            const totalAttempts =
                percentages.length;


            const averageScore =
                totalAttempts >
                0

                    ? Math.round(
                        percentages.reduce(
                            (
                                sum,
                                value
                            ) =>
                                sum +
                                value,

                            0
                        ) /
                        totalAttempts
                    )

                    : 0;


            const bestScore =
                totalAttempts >
                0

                    ? Math.max(
                        ...percentages
                    )

                    : 0;


            const lowestScore =
                totalAttempts >
                0

                    ? Math.min(
                        ...percentages
                    )

                    : 0;


            const firstScore =
                chronologicalHistory
                    .length >
                0

                    ? Number(
                        chronologicalHistory[
                            0
                        ].percentage ||
                        0
                    )

                    : 0;


            const latestScore =
                chronologicalHistory
                    .length >
                0

                    ? Number(
                        chronologicalHistory[
                            chronologicalHistory
                                .length -
                            1
                        ].percentage ||
                        0
                    )

                    : 0;


            const overallAnalytics = {

                totalAttempts,

                averageScore,

                bestScore,

                lowestScore,

                firstScore,

                latestScore,

                improvement:
                    latestScore -
                    firstScore,

                currentScore:
                    overallProgress
                        .currentScore ||
                    0,

                previousScore:
                    overallProgress
                        .previousScore ||
                    0
            };


            /*
            --------------------------------------------------------
            FINAL SUMMARY
            --------------------------------------------------------
            */

            const finalProgressSummary =
                generateFinalProgressSummary({

                    jobReadiness,

                    overallProgress,

                    skillAnalysis,

                    learningRecommendations,

                    topLearningPriorities
                });


            /*
            --------------------------------------------------------
            AI PERFORMANCE INSIGHTS
            --------------------------------------------------------
            */

            let aiPerformanceInsights =
                null;


            try {

                aiPerformanceInsights =
                    generateAIPerformanceInsights({

                        jobReadiness,

                        overallAnalytics,

                        skillPerformance:
                            analyticsSkillPerformance,

                        difficultyPerformance,

                        typeAnalytics,

                        performanceTrend,

                        momentum,

                        learningRecommendations
                    });


            } catch (
                aiError
            ) {

                console.error(
                    "AI Performance Insights Error:",
                    aiError
                );


                aiPerformanceInsights = {

                    summary:
                        "Performance analytics are available, but AI insights could not be generated.",

                    error:
                        aiError.message
                };
            }


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
                        "Assessment progress fetched successfully",

                    resume: {

                        id:
                            resume._id,

                        company:
                            resume
                                .company ||
                            null,

                        role:
                            resume
                                .role ||
                            null
                    },

                    overallProgress,

                    typeProgress,

                    skillProgress,

                    skillAnalysis,

                    learningRecommendations,

                    topLearningPriorities,

                    jobReadiness,

                    finalProgressSummary,

                    aiPerformanceInsights,

                    analytics: {

                        overall:
                            overallAnalytics,

                        skills:
                            analyticsSkillPerformance,

                        difficulty:
                            difficultyPerformance,

                        byType:
                            typeAnalytics,

                        trend:
                            performanceTrend,

                        movingAverage,

                        momentum
                    },

                    assessmentHistory:
                        history
                });


        } catch (error) {

            console.error(
                "Get Assessment Progress Error:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Failed to get assessment progress",

                    error:
                        error.message
                });
        }
    };


/*
============================================================
GET ASSESSMENT ANALYTICS
============================================================
*/

const getAssessmentAnalytics =
    async (req, res) => {

        try {

            const {
                resumeId
            } = req.params;


            console.log(
                "\n===================================="
            );

            console.log(
                "GET ASSESSMENT ANALYTICS"
            );

            console.log(
                "Resume ID:",
                resumeId
            );

            console.log(
                "User ID:",
                req.user?.id
            );

            console.log(
                "====================================\n"
            );


            /*
            --------------------------------------------------------
            VALIDATE
            --------------------------------------------------------
            */

            if (!resumeId) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "resumeId is required"
                    });
            }


            if (
                !req.user?.id
            ) {

                return res
                    .status(401)
                    .json({

                        success:
                            false,

                        message:
                            "User authentication information is missing"
                    });
            }


            /*
            --------------------------------------------------------
            RESUME
            --------------------------------------------------------
            */

            const resume =
                await Resume.findOne({

                    _id:
                        resumeId,

                    user:
                        req.user.id
                })
                .lean();


            if (!resume) {

                return res
                    .status(404)
                    .json({

                        success:
                            false,

                        message:
                            "Resume not found"
                    });
            }


            /*
            --------------------------------------------------------
            ASSESSMENTS
            --------------------------------------------------------
            */

            const assessments =
                await Assessment.find({

                    user:
                        req.user.id,

                    resume:
                        resumeId
                })
                .lean();


            /*
            --------------------------------------------------------
            NO ASSESSMENTS
            --------------------------------------------------------
            */

            if (
                !assessments.length
            ) {

                return res
                    .status(200)
                    .json({

                        success:
                            true,

                        message:
                            "No assessments found for this resume",

                        resumeId,

                        analytics: {

                            overall: {
                                totalAttempts:
                                    0,
                                completedAttempts:
                                    0,
                                averageScore:
                                    0,
                                highestScore:
                                    0,
                                lowestScore:
                                    0,
                                averagePercentage:
                                    0,
                                bestPercentage:
                                    0,
                                worstPercentage:
                                    0
                            },

                            attemptTrend:
                                [],

                            scoreDistribution: {
                                beginner:
                                    0,
                                intermediate:
                                    0,
                                advanced:
                                    0,
                                expert:
                                    0
                            },

                            skills: {

                                performance:
                                    [],

                                analysis: {
                                    strongestSkill:
                                        null,
                                    weakestSkill:
                                        null,
                                    averageScore:
                                        0,
                                    strongSkills:
                                        [],
                                    moderateSkills:
                                        [],
                                    weakSkills:
                                        []
                                },

                                priorities:
                                    []
                            },

                            difficulty: {

                                performance:
                                    [],

                                analysis: {
                                    strongestDifficulty:
                                        null,
                                    weakestDifficulty:
                                        null,
                                    averageScore:
                                        0
                                },

                                nextDifficulty: {

                                    recommendedDifficulty:
                                        "beginner",

                                    reason:
                                        "Start with beginner-level questions to establish your baseline."
                                }
                            },

                            questions: {
                                accuracy:
                                    [],
                                mostDifficult:
                                    [],
                                frequentlyMissed:
                                    []
                            },

                            coding:
                                null,

                            assessmentTypes: {

                                performance: {

                                    mcq: {
                                        attempts:
                                            0,
                                        averageScore:
                                            0,
                                        averagePercentage:
                                            0
                                    },

                                    coding: {
                                        attempts:
                                            0,
                                        averageScore:
                                            0,
                                        averagePercentage:
                                            0
                                    },

                                    sql: {
                                        attempts:
                                            0,
                                        averageScore:
                                            0,
                                        averagePercentage:
                                            0
                                    }
                                },

                                comparison: {
                                    strongestType:
                                        null,
                                    weakestType:
                                        null
                                },

                                recommendations:
                                    [],

                                trends:
                                    []
                            },

                            trends: {

                                performance: {
                                    trend:
                                        "No Data",
                                    direction:
                                        "stable",
                                    improvement:
                                        0,
                                    history:
                                        []
                                },

                                movingAverage:
                                    [],

                                momentum:
                                    {},

                                insights:
                                    []
                            },

                            learning: {
                                recommendations:
                                    [],
                                topPriorities:
                                    []
                            },

                            jobReadiness: {
                                score:
                                    0,
                                level:
                                    "Not Ready"
                            },

                            aiPerformanceInsights:
                                null
                        }
                    });
            }


            /*
            --------------------------------------------------------
            ASSESSMENT IDS
            --------------------------------------------------------
            */

            const assessmentIds =
                assessments
                    .filter(
                        (assessment) =>
                            assessment &&
                            assessment._id
                    )
                    .map(
                        (assessment) =>
                            assessment._id
                    );


            /*
            --------------------------------------------------------
            ATTEMPTS
            --------------------------------------------------------
            */

            const attempts =
                await AssessmentAttempt
                    .find({

                        user:
                            req.user.id,

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


            /*
            --------------------------------------------------------
            BASIC ANALYTICS
            --------------------------------------------------------
            */

            const overallAnalytics =
                calculateAssessmentAnalytics(
                    attempts
                );


            const attemptTrend =
                calculateAttemptTrend(
                    attempts
                );


            const scoreDistribution =
                calculateScoreDistribution(
                    attempts
                );


            /*
            --------------------------------------------------------
            COLLECT QUESTION IDS
            --------------------------------------------------------
            */

            const questionIds =
                [];


            assessments.forEach(
                (assessment) => {

                    if (
                        Array.isArray(
                            assessment
                                .mcqQuestions
                        )
                    ) {

                        questionIds.push(
                            ...assessment
                                .mcqQuestions
                        );
                    }


                    if (
                        Array.isArray(
                            assessment
                                .codingQuestions
                        )
                    ) {

                        questionIds.push(
                            ...assessment
                                .codingQuestions
                        );
                    }


                    if (
                        Array.isArray(
                            assessment
                                .sqlQuestions
                        )
                    ) {

                        questionIds.push(
                            ...assessment
                                .sqlQuestions
                        );
                    }
                }
            );


            const uniqueQuestionIds = [

                ...new Set(

                    questionIds
                        .filter(
                            (id) =>
                                id !==
                                undefined &&
                                id !==
                                null
                        )
                        .map(
                            (id) =>
                                id.toString()
                        )
                        .filter(
                            (id) =>
                                id.length >
                                0
                        )
                )
            ];


            /*
            --------------------------------------------------------
            LOAD QUESTIONS
            --------------------------------------------------------
            */

            const [
                mcqQuestions,
                codingQuestions,
                sqlQuestions
            ] =
                await Promise.all([

                    Question.find({

                        _id: {
                            $in:
                                uniqueQuestionIds
                        }
                    })
                    .populate(
                        "skill",
                        "name"
                    )
                    .lean(),

                    CodingQuestion.find({

                        _id: {
                            $in:
                                uniqueQuestionIds
                        }
                    })
                    .populate(
                        "skill",
                        "name"
                    )
                    .lean(),

                    SQLQuestion.find({

                        _id: {
                            $in:
                                uniqueQuestionIds
                        }
                    })
                    .populate(
                        "skill",
                        "name"
                    )
                    .lean()
                ]);


            const allQuestions = [

                ...mcqQuestions,

                ...codingQuestions,

                ...sqlQuestions

            ].filter(
                (question) =>
                    question &&
                    question._id
            );


            /*
            --------------------------------------------------------
            SKILL ANALYTICS
            --------------------------------------------------------
            */

            const skillPerformance =
                calculateSkillWisePerformance({

                    attempts,

                    questions:
                        allQuestions
                });


            const skillAnalysis =
                analyzeSkillPerformance(
                    skillPerformance
                );


            const skillPriorities =
                calculateSkillPriorities(
                    skillPerformance
                );


            /*
            --------------------------------------------------------
            DIFFICULTY ANALYTICS
            --------------------------------------------------------
            */

            const difficultyPerformance =
                calculateDifficultyWisePerformance({

                    attempts,

                    questions:
                        allQuestions
                });


            const difficultyAnalysis =
                analyzeDifficultyPerformance(
                    difficultyPerformance
                );


            const nextDifficulty =
                recommendNextDifficulty(
                    difficultyPerformance
                );


            /*
            --------------------------------------------------------
            QUESTION ANALYTICS
            --------------------------------------------------------
            */

            const questionAccuracy =
                calculateQuestionAccuracy({

                    attempts,

                    questions:
                        allQuestions
                });


            const mostDifficultQuestions =
                getMostDifficultQuestions(
                    questionAccuracy,
                    5
                );


            const frequentlyMissedQuestions =
                getFrequentlyMissedQuestions(
                    questionAccuracy,
                    5
                );


            const codingPerformance =
                analyzeCodingPerformance(
                    questionAccuracy
                );


            /*
            --------------------------------------------------------
            ASSESSMENT TYPE ANALYTICS
            --------------------------------------------------------
            */

            const typeAnalytics =
                calculateAssessmentTypeAnalytics({

                    attempts,

                    assessments
                });


            const typeComparison =
                compareAssessmentTypes(
                    typeAnalytics
                );


            const typeRecommendations =
                generateAssessmentTypeRecommendations(
                    typeAnalytics
                );


            /*
            --------------------------------------------------------
            PERFORMANCE TREND
            --------------------------------------------------------
            */

            const performanceTrend =
                calculatePerformanceTrend(
                    attempts
                );


            const movingAverage =
                calculateMovingAverage(
                    performanceTrend
                        .history
                );


            const momentum =
                calculatePerformanceMomentum(
                    performanceTrend
                        .history
                );


            /*
            --------------------------------------------------------
            TYPE PERFORMANCE TRENDS
            --------------------------------------------------------
            */

            const typePerformanceTrends =
                calculateTypePerformanceTrends({

                    attempts,

                    assessments
                });


            /*
            --------------------------------------------------------
            TREND INSIGHTS
            --------------------------------------------------------
            */

            const trendInsights =
                generatePerformanceTrendInsights({

                    overallTrend:
                        performanceTrend,

                    momentum,

                    typeTrends:
                        typePerformanceTrends
                });


            /*
            --------------------------------------------------------
            LEARNING RECOMMENDATIONS
            --------------------------------------------------------
            */

            const learningRecommendations =
                generateLearningRecommendations(

                    skillPerformance.map(
                        (skill) => ({

                            skill:
                                skill.skill,

                            previousScore:
                                0,

                            currentScore:
                                skill.score,

                            improvement:
                                0
                        })
                    )
                );


            const topLearningPriorities =
                getTopLearningPriorities(
                    learningRecommendations,
                    5
                );


            /*
            --------------------------------------------------------
            JOB READINESS
            --------------------------------------------------------
            */

            const resumeCoverage =
                Number(
                    resume
                        ?.skillGapAnalysis
                        ?.coveragePercentage
                ) ||
                0;


            const assessmentScore =
                Number(
                    overallAnalytics
                        ?.averagePercentage
                ) ||
                0;


            const jobReadiness =
                calculateJobReadiness({

                    resumeCoverage,

                    assessmentScore
                });


            /*
            --------------------------------------------------------
            AI PERFORMANCE INSIGHTS
            --------------------------------------------------------
            */

            let aiPerformanceInsights =
                null;


            try {

                aiPerformanceInsights =
                    generateAIPerformanceInsights({

                        jobReadiness,

                        overallAnalytics,

                        skillPerformance,

                        difficultyPerformance,

                        typeAnalytics,

                        performanceTrend,

                        momentum,

                        learningRecommendations
                    });


            } catch (
                aiError
            ) {

                console.error(
                    "AI Performance Insights Error:",
                    aiError
                );


                aiPerformanceInsights = {

                    summary:
                        "Performance analytics are available, but AI insights could not be generated.",

                    error:
                        aiError.message
                };
            }


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
                        "Assessment analytics generated successfully",

                    resumeId,

                    analytics: {

                        overall:
                            overallAnalytics,

                        attemptTrend,

                        scoreDistribution,

                        skills: {

                            performance:
                                skillPerformance,

                            analysis:
                                skillAnalysis,

                            priorities:
                                skillPriorities
                        },

                        difficulty: {

                            performance:
                                difficultyPerformance,

                            analysis:
                                difficultyAnalysis,

                            nextDifficulty
                        },

                        questions: {

                            accuracy:
                                questionAccuracy,

                            mostDifficult:
                                mostDifficultQuestions,

                            frequentlyMissed:
                                frequentlyMissedQuestions
                        },

                        coding:
                            codingPerformance,

                        assessmentTypes: {

                            performance:
                                typeAnalytics,

                            comparison:
                                typeComparison,

                            recommendations:
                                typeRecommendations,

                            trends:
                                typePerformanceTrends
                        },

                        trends: {

                            performance:
                                performanceTrend,

                            movingAverage,

                            momentum,

                            insights:
                                trendInsights
                        },

                        learning: {

                            recommendations:
                                learningRecommendations,

                            topPriorities:
                                topLearningPriorities
                        },

                        jobReadiness,

                        aiPerformanceInsights
                    }
                });


        } catch (error) {

            console.error(
                "\nASSESSMENT ANALYTICS ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Failed to generate assessment analytics",

                    error:
                        error.message
                });
        }
    };


/*
============================================================
RUN CODING QUESTION
============================================================

Run Code:
    - Executes PUBLIC tests only
    - Does not save final assessment score
    - Does not expose hidden tests
    - Does not mark assessment evaluated

Submit:
    - Executes PUBLIC + HIDDEN tests
    - Calculates score
============================================================
*/

const runCodingQuestion =
    async (req, res) => {

        try {

            const {
                assessmentId
            } = req.params;


            const {
                questionId,
                code
            } = req.body;


            console.log(
                "\n========== RUN CODING QUESTION =========="
            );

            console.log(
                "Assessment:",
                assessmentId
            );

            console.log(
                "Question:",
                questionId
            );

            console.log(
                "User:",
                req.user.id
            );


            /*
            --------------------------------------------------------
            VALIDATE IDS
            --------------------------------------------------------
            */

            if (
                !assessmentId ||
                !mongoose
                    .Types
                    .ObjectId
                    .isValid(
                        assessmentId
                    )
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "A valid assessment ID is required."
                    });
            }


            if (
                !questionId ||
                !mongoose
                    .Types
                    .ObjectId
                    .isValid(
                        questionId
                    )
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "A valid coding question ID is required."
                    });
            }


            /*
            --------------------------------------------------------
            VALIDATE CODE
            --------------------------------------------------------
            */

            const submittedCode =
                String(
                    code ||
                    ""
                );


            if (
                !submittedCode
                    .trim()
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Please write some code before running."
                    });
            }


            const MAX_CODE_LENGTH =
                50000;


            if (
                submittedCode
                    .length >
                MAX_CODE_LENGTH
            ) {

                return res
                    .status(413)
                    .json({

                        success:
                            false,

                        message:
                            `Code exceeds the ${MAX_CODE_LENGTH} character limit.`
                    });
            }


            /*
            --------------------------------------------------------
            FIND ACTIVE CODING ASSESSMENT
            --------------------------------------------------------
            */

            const assessment =
                await Assessment.findOne({

                    _id:
                        assessmentId,

                    user:
                        req.user.id,

                    type:
                        "coding"
                });


            if (!assessment) {

                return res
                    .status(404)
                    .json({

                        success:
                            false,

                        message:
                            "Coding assessment not found."
                    });
            }


            if (
                assessment.status !==
                "started"
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Coding assessment is not currently active.",

                        currentStatus:
                            assessment.status
                    });
            }


            /*
            --------------------------------------------------------
            ACTIVE ATTEMPT
            --------------------------------------------------------
            */

            const attempt =
                await AssessmentAttempt
                    .findOne({

                        assessment:
                            assessment._id,

                        user:
                            req.user.id,

                        status:
                            "in-progress"
                    })
                    .select(
                        "_id"
                    )
                    .lean();


            if (!attempt) {

                return res
                    .status(404)
                    .json({

                        success:
                            false,

                        message:
                            "Active coding assessment attempt was not found."
                    });
            }


            /*
            --------------------------------------------------------
            QUESTION MUST BELONG TO ASSESSMENT
            --------------------------------------------------------
            */

            const belongsToAssessment =
                (
                    assessment
                        .codingQuestions ||
                    []
                )
                .some(
                    (id) =>
                        id.toString() ===
                        questionId.toString()
                );


            if (
                !belongsToAssessment
            ) {

                return res
                    .status(403)
                    .json({

                        success:
                            false,

                        message:
                            "This coding question does not belong to this assessment."
                    });
            }


            /*
            --------------------------------------------------------
            LOAD SERVER-ONLY EXECUTION DATA
            --------------------------------------------------------
            */

            const question =
                await CodingQuestion
                    .findOne({

                        _id:
                            questionId,

                        isActive:
                            true
                    })
                    .select(
                        "+testCases +runnerCode"
                    )
                    .populate(
                        "skill",
                        "name"
                    );


            if (!question) {

                return res
                    .status(404)
                    .json({

                        success:
                            false,

                        message:
                            "Coding question not found."
                    });
            }


            /*
            --------------------------------------------------------
            PUBLIC TEST CASES ONLY
            --------------------------------------------------------
            */

            const allTestCases =
                Array.isArray(
                    question
                        .testCases
                )
                    ? question
                        .testCases
                    : [];


            const publicTestCases =
                allTestCases
                    .filter(
                        (testCase) =>
                            !Boolean(
                                testCase
                                    .isHidden
                            )
                    )
                    .map(
                        (testCase) => ({

                            input:
                                String(
                                    testCase
                                        .input ??
                                    ""
                                ),

                            expectedOutput:
                                String(
                                    testCase
                                        .expectedOutput ??
                                    ""
                                ),

                            isHidden:
                                false
                        })
                    );


            if (
                publicTestCases.length ===
                0
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "No public test cases are configured for this coding question."
                    });
            }


            /*
            --------------------------------------------------------
            EXECUTE
            --------------------------------------------------------
            */

            const executionResult =
                await runTestCases({

                    code:
                        submittedCode,

                    language:
                        question
                            .language ||
                        "python",

                    testCases:
                        publicTestCases,

                    runnerCode:
                        question
                            .runnerCode ||
                        ""
                });


            const rawResults =
                Array.isArray(
                    executionResult
                        ?.testCaseResults
                )

                    ? executionResult
                        .testCaseResults

                    : Array.isArray(
                        executionResult
                            ?.results
                    )

                        ? executionResult
                            .results

                        : [];


            /*
            --------------------------------------------------------
            BUILD SAFE PUBLIC RESULTS
            --------------------------------------------------------
            */

            const testCaseResults =
                publicTestCases.map(
                    (
                        testCase,
                        index
                    ) => {

                        const result =
                            rawResults[
                                index
                            ] ||
                            {};


                        return {

                            testCaseNumber:
                                Number(
                                    result
                                        ?.testCaseNumber ||
                                    index + 1
                                ),

                            passed:
                                Boolean(
                                    result
                                        ?.passed
                                ),

                            input:
                                testCase
                                    .input,

                            expected:
                                result
                                    ?.expected ??
                                testCase
                                    .expectedOutput,

                            actual:
                                result
                                    ?.actual ??
                                "",

                            executionTime:
                                Number(
                                    result
                                        ?.executionTime ||
                                    0
                                ),

                            error:
                                result
                                    ?.error ||
                                "",

                            timedOut:
                                Boolean(
                                    result
                                        ?.timedOut
                                )
                        };
                    }
                );


            const passedCount =
                testCaseResults
                    .filter(
                        (testCase) =>
                            testCase
                                .passed
                    )
                    .length;


            const totalTestCases =
                testCaseResults
                    .length;


            const failedCount =
                Math.max(
                    totalTestCases -
                    passedCount,
                    0
                );


            const allPassed =
                totalTestCases >
                0 &&
                passedCount ===
                totalTestCases;


            const passPercentage =
                totalTestCases >
                0

                    ? Math.round(
                        (
                            passedCount /
                            totalTestCases
                        ) * 100
                    )

                    : 0;


            const executionTime =
                Number(
                    executionResult
                        ?.totalExecutionTime ??
                    executionResult
                        ?.executionTime ??
                    testCaseResults
                        .reduce(
                            (
                                total,
                                testCase
                            ) =>

                                total +
                                Number(
                                    testCase
                                        .executionTime ||
                                    0
                                ),

                            0
                        )
                );


            const averageExecutionTime =
                totalTestCases >
                0

                    ? Math.round(
                        executionTime /
                        totalTestCases
                    )

                    : 0;


            const timedOut =
                Boolean(
                    executionResult
                        ?.timedOut
                ) ||
                testCaseResults.some(
                    (testCase) =>
                        testCase
                            .timedOut
                );


            console.log(
                "Run Code Result:",
                {
                    questionId,
                    passedCount,
                    failedCount,
                    totalTestCases,
                    passPercentage,
                    executionTime
                }
            );


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
                        allPassed

                            ? "All public test cases passed."

                            : `${passedCount} of ${totalTestCases} public test cases passed.`,

                    data: {

                        assessmentId:
                            assessment._id,

                        attemptId:
                            attempt._id,

                        questionId:
                            question._id,

                        title:
                            question
                                .title ||
                            "Coding Question",

                        skill:
                            question
                                ?.skill
                                ?.name ||
                            "",

                        difficulty:
                            question
                                ?.difficulty ||
                            "",

                        language:
                            question
                                .language ||
                            "python",

                        allPassed,

                        passedCount,

                        failedCount,

                        totalTestCases,

                        passPercentage,

                        executionTime,

                        totalExecutionTime:
                            executionTime,

                        averageExecutionTime,

                        error:
                            executionResult
                                ?.error ||
                            "",

                        timedOut,

                        testCases:
                            testCaseResults
                    }
                });


        } catch (error) {

            console.error(
                "RUN CODING QUESTION ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Failed to execute coding question.",

                    error:
                        error.message
                });
        }
    };
/*
============================================================
RUN SQL QUERY
============================================================

Endpoint:

POST /api/assessments/:assessmentId/run-sql


BODY:

{
    "questionId": "...",
    "query": "SELECT ..."
}


PURPOSE:

SQLAssessment.jsx
        ↓
Student writes SQL
        ↓
Run Query
        ↓
Execute against PUBLIC schema + sample data
        ↓
Return rows / columns / errors


IMPORTANT:

Run Query:

    ✓ Uses public schema
    ✓ Uses public sampleData
    ✓ Returns query result
    ✓ Returns execution time

    ✗ Does not calculate score
    ✗ Does not save final answer
    ✗ Does not run hidden tests
    ✗ Does not expose expected answers
    ✗ Does not complete assessment


Submit Assessment:

    ✓ Uses hidden test databases
    ✓ Uses expected results
    ✓ Calculates score
============================================================
*/

const runSQLQuery =
    async (req, res) => {

        try {

            /*
            ========================================================
            REQUEST DATA
            ========================================================
            */

            const {
                assessmentId
            } = req.params;


            const {
                questionId,
                query
            } = req.body;


            console.log(
                "\n========== RUN SQL QUERY =========="
            );

            console.log(
                "Assessment:",
                assessmentId
            );

            console.log(
                "Question:",
                questionId
            );

            console.log(
                "User:",
                req.user.id
            );


            /*
            ========================================================
            VALIDATE ASSESSMENT ID
            ========================================================
            */

            if (
                !assessmentId ||
                !mongoose.Types.ObjectId
                    .isValid(
                        assessmentId
                    )
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "A valid assessment ID is required."
                    });
            }


            /*
            ========================================================
            VALIDATE QUESTION ID
            ========================================================
            */

            if (
                !questionId ||
                !mongoose.Types.ObjectId
                    .isValid(
                        questionId
                    )
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "A valid SQL question ID is required."
                    });
            }


            /*
            ========================================================
            VALIDATE QUERY
            ========================================================
            */

            const submittedQuery =
                String(
                    query || ""
                );


            if (
                !submittedQuery.trim()
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Please write a SQL query before running."
                    });
            }


            /*
            ========================================================
            FIND SQL ASSESSMENT
            ========================================================
            */

            const assessment =
                await Assessment.findOne({

                    _id:
                        assessmentId,

                    user:
                        req.user.id,

                    type:
                        "sql"
                });


            if (!assessment) {

                return res
                    .status(404)
                    .json({

                        success:
                            false,

                        message:
                            "SQL assessment not found."
                    });
            }


            /*
            ========================================================
            ASSESSMENT MUST BE ACTIVE
            ========================================================

            Prevent execution:

            - before starting assessment
            - after final submission
            ========================================================
            */

            if (
                assessment.status !==
                "started"
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "SQL assessment is not currently active.",

                        currentStatus:
                            assessment.status
                    });
            }


            /*
            ========================================================
            VERIFY ACTIVE ATTEMPT
            ========================================================
            */

            const attempt =
                await AssessmentAttempt
                    .findOne({

                        assessment:
                            assessment._id,

                        user:
                            req.user.id,

                        status:
                            "in-progress"
                    })
                    .select(
                        "_id"
                    )
                    .lean();


            if (!attempt) {

                return res
                    .status(404)
                    .json({

                        success:
                            false,

                        message:
                            "Active SQL assessment attempt was not found."
                    });
            }


            /*
            ========================================================
            VERIFY QUESTION BELONGS TO ASSESSMENT
            ========================================================
            */

            const sqlQuestionIds =
                assessment
                    .sqlQuestions ||
                [];


            const belongsToAssessment =
                sqlQuestionIds.some(
                    (id) =>
                        id.toString() ===
                        questionId.toString()
                );


            if (
                !belongsToAssessment
            ) {

                return res
                    .status(403)
                    .json({

                        success:
                            false,

                        message:
                            "This SQL question does not belong to this assessment."
                    });
            }


            /*
            ========================================================
            LOAD SQL QUESTION
            ========================================================

            IMPORTANT:

            We deliberately DO NOT select:

                +testCases
                +expectedQueryResult

            Those fields are hidden by select:false.

            Run Query needs only:

                schema
                sampleData

            Both are public fields.
            ========================================================
            */

            const question =
                await SQLQuestion
                    .findOne({

                        _id:
                            questionId,

                        isActive:
                            true
                    })
                    .select(
                        [
                            "_id",
                            "skill",
                            "difficulty",
                            "title",
                            "description",
                            "schema",
                            "sampleData",
                            "points"
                        ].join(" ")
                    )
                    .populate(
                        "skill",
                        "name"
                    );


            if (!question) {

                return res
                    .status(404)
                    .json({

                        success:
                            false,

                        message:
                            "SQL question not found."
                    });
            }


            /*
            ========================================================
            CHECK PUBLIC DATABASE
            ========================================================
            */

            if (
                !String(
                    question.schema ||
                    ""
                ).trim()
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "This SQL question does not have a public database schema configured."
                    });
            }


            /*
            ========================================================
            EXECUTE QUERY
            ========================================================

            Uses PUBLIC:

                question.schema
                question.sampleData

            Hidden test databases are never loaded here.
            ========================================================
            */

            const executionResult =
                executeSQL({

                    query:
                        submittedQuery,

                    schema:
                        question.schema ||
                        "",

                    sampleData:
                        question.sampleData ||
                        ""
                });


            /*
            ========================================================
            EXECUTION FAILED
            ========================================================
            */

            if (
                !executionResult
                    ?.success
            ) {

                console.log(
                    "SQL Run Failed:",
                    {
                        questionId,
                        error:
                            executionResult
                                ?.error,
                        errorType:
                            executionResult
                                ?.errorType,
                        executionTime:
                            executionResult
                                ?.executionTime
                    }
                );


                /*
                We return HTTP 200 here intentionally.

                Why?

                A bad SQL query is a normal Run Query result,
                not a server failure.

                This makes the frontend easier:

                    response.success === false
                    → display SQL error
                */

                return res
                    .status(200)
                    .json({

                        success:
                            false,

                        message:
                            executionResult
                                ?.timedOut

                                ? "SQL query timed out."

                                : "SQL query could not be executed.",

                        data: {

                            assessmentId:
                                assessment._id,

                            attemptId:
                                attempt._id,

                            questionId:
                                question._id,

                            title:
                                question.title ||
                                "SQL Question",

                            skill:
                                question
                                    ?.skill
                                    ?.name ||
                                "",

                            difficulty:
                                question
                                    ?.difficulty ||
                                "",


                            /*
                            Empty result table
                            */

                            rows:
                                [],

                            columns:
                                [],

                            rowCount:
                                0,


                            /*
                            Execution information
                            */

                            executionTime:
                                Number(
                                    executionResult
                                        ?.executionTime ||
                                    0
                                ),

                            timedOut:
                                Boolean(
                                    executionResult
                                        ?.timedOut
                                ),

                            errorType:
                                executionResult
                                    ?.errorType ||
                                "EXECUTION_ERROR",

                            error:
                                executionResult
                                    ?.error ||
                                "SQL execution failed."
                        }
                    });
            }


            /*
            ========================================================
            NORMALIZE RESULT
            ========================================================
            */

            const rows =
                Array.isArray(
                    executionResult
                        ?.rows
                )
                    ? executionResult
                        .rows
                    : [];


            /*
            sqlExecutionService normally returns columns.

            Fallback:
            derive them from first row.
            */

            let columns =
                Array.isArray(
                    executionResult
                        ?.columns
                )
                    ? executionResult
                        .columns
                    : [];


            if (
                columns.length ===
                    0 &&
                rows.length >
                    0 &&
                rows[0] &&
                typeof rows[0] ===
                    "object"
            ) {

                columns =
                    Object.keys(
                        rows[0]
                    );
            }


            const rowCount =
                Number(
                    executionResult
                        ?.rowCount ??
                    rows.length
                );


            const executionTime =
                Number(
                    executionResult
                        ?.executionTime ||
                    0
                );


            /*
            ========================================================
            LOG SUCCESS
            ========================================================
            */

            console.log(
                "SQL Run Success:",
                {
                    questionId,
                    rowCount,
                    columns:
                        columns.length,
                    executionTime
                }
            );


            /*
            ========================================================
            SUCCESS RESPONSE
            ========================================================
            */

            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        rowCount ===
                            1

                            ? "Query executed successfully. 1 row returned."

                            : `Query executed successfully. ${rowCount} rows returned.`,

                    data: {

                        assessmentId:
                            assessment._id,

                        attemptId:
                            attempt._id,

                        questionId:
                            question._id,

                        title:
                            question.title ||
                            "SQL Question",

                        skill:
                            question
                                ?.skill
                                ?.name ||
                            "",

                        difficulty:
                            question
                                ?.difficulty ||
                            "",


                        /*
                        ====================================================
                        QUERY RESULT
                        ====================================================
                        */

                        rows,

                        columns,

                        rowCount,


                        /*
                        ====================================================
                        EXECUTION METRICS
                        ====================================================
                        */

                        executionTime,

                        timedOut:
                            false,

                        errorType:
                            null,

                        error:
                            null
                    }
                });


        } catch (error) {

            /*
            ========================================================
            SERVER ERROR
            ========================================================
            */

            console.error(
                "\n========== RUN SQL QUERY ERROR =========="
            );

            console.error(
                error
            );

            console.error(
                "Message:",
                error.message
            );

            console.error(
                "Stack:",
                error.stack
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Failed to execute SQL query.",

                    error:
                        error.message
                });
        }
    };

/*
============================================================
EXPORTS
============================================================
*/

module.exports = {

    createAssessment,

    startAssessment,

    submitAssessment,

    runCodingQuestion,

    runSQLQuery,

    getAssessmentResult,

    getFinalJobReadinessResult,

    getAssessmentProgress,

    getAssessmentAnalytics
};