import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import assessmentService from "../services/assessmentService";

/*
Reuse the Coding Result styling so SQLResult
has exactly the same visual design.

We can create a dedicated sqlResult.css later
if you want SQL-specific styling.
*/
import "./codingResult.css";


const SQLResult = () => {

    const navigate =
        useNavigate();


    const {
        assessmentId: routeAssessmentId
    } = useParams();


    /*
    =========================================================
    ASSESSMENT ID
    =========================================================
    */

    const assessmentId =
        routeAssessmentId ||
        localStorage.getItem(
            "assessmentId"
        ) ||
        "";


    /*
    =========================================================
    STATE
    =========================================================
    */

    const [
        resultData,
        setResultData
    ] =
        useState(null);


    const [
        loading,
        setLoading
    ] =
        useState(true);


    const [
        error,
        setError
    ] =
        useState("");


    /*
    =========================================================
    HELPERS
    =========================================================
    */

    const clampPercentage = (
        value
    ) => {

        const number =
            Number(
                value ||
                0
            );


        return Math.min(
            100,
            Math.max(
                0,
                number
            )
        );
    };


    /*
    ---------------------------------------------------------
    FORMAT EXECUTION TIME
    ---------------------------------------------------------
    */

    const formatExecutionTime = (
        milliseconds
    ) => {

        const time =
            Number(
                milliseconds ||
                0
            );


        if (
            time <=
            0
        ) {

            return "0 ms";
        }


        if (
            time <
            1000
        ) {

            return `${Math.round(
                time
            )} ms`;
        }


        return `${(
            time /
            1000
        ).toFixed(
            2
        )} sec`;
    };


    /*
    ---------------------------------------------------------
    PERFORMANCE CLASS
    ---------------------------------------------------------
    */

    const getPerformanceClass = (
        percentage
    ) => {

        const value =
            Number(
                percentage ||
                0
            );


        if (
            value >=
            80
        ) {

            return "excellent";
        }


        if (
            value >=
            60
        ) {

            return "good";
        }


        if (
            value >=
            40
        ) {

            return "average";
        }


        return "low";
    };


    /*
    ---------------------------------------------------------
    SQL QUESTION STATUS
    ---------------------------------------------------------
    */

    const getQuestionStatus = (
        question
    ) => {

        if (
            question
                ?.isCorrect
        ) {

            return {

                label:
                    "Passed",

                className:
                    "passed"
            };
        }


        if (
            Number(
                question
                    ?.testCasesPassed ||
                0
            ) >
            0
        ) {

            return {

                label:
                    "Partial",

                className:
                    "partial"
            };
        }


        if (
            question
                ?.error ===
            "No SQL query submitted"
        ) {

            return {

                label:
                    "Not Attempted",

                className:
                    "not-attempted"
            };
        }


        return {

            label:
                "Failed",

            className:
                "failed"
        };
    };


    /*
    =========================================================
    LOAD RESULT
    =========================================================
    */

    useEffect(
        () => {

            const loadResult =
                async () => {

                    /*
                    ---------------------------------------------
                    NO ASSESSMENT ID
                    ---------------------------------------------
                    */

                    if (
                        !assessmentId
                    ) {

                        setError(
                            "Assessment ID was not found. Please return to the assessment page."
                        );


                        setLoading(
                            false
                        );


                        return;
                    }


                    try {

                        setLoading(
                            true
                        );


                        setError(
                            ""
                        );


                        /*
                        ---------------------------------------------
                        FETCH RESULT FROM BACKEND
                        ---------------------------------------------
                        */

                        const response =
                            await assessmentService
                                .getAssessmentResult(
                                    assessmentId
                                );


                        console.log(
                            "SQL result response:",
                            response
                        );


                        const apiData =
                            response
                                ?.data ||
                            response;


                        if (
                            !apiData
                        ) {

                            throw new Error(
                                "Assessment result was empty."
                            );
                        }


                        /*
                        ---------------------------------------------
                        VALIDATE SQL ASSESSMENT
                        ---------------------------------------------
                        */

                        if (
                            apiData
                                ?.assessment
                                ?.type &&
                            apiData
                                .assessment
                                .type !==
                            "sql"
                        ) {

                            throw new Error(
                                "This result does not belong to a SQL assessment."
                            );
                        }


                        /*
                        =================================================
                        MERGE SUBMISSION RESULT
                        =================================================

                        submitAssessment() now returns sqlPerformance
                        and safe question-level answers.

                        getAssessmentResult() may not yet return every
                        SQL-specific field.

                        Therefore merge the saved submission response
                        with the fresh backend result.
                        =================================================
                        */

                        let submissionData =
                            null;


                        try {

                            const savedSubmission =
                                localStorage.getItem(
                                    "assessmentResult"
                                );


                            if (
                                savedSubmission
                            ) {

                                const parsed =
                                    JSON.parse(
                                        savedSubmission
                                    );


                                const possibleData =
                                    parsed
                                        ?.data ||
                                    parsed;


                                if (
                                    possibleData
                                        ?.type ===
                                    "sql" ||

                                    possibleData
                                        ?.assessment
                                        ?.type ===
                                    "sql"
                                ) {

                                    submissionData =
                                        possibleData;
                                }
                            }


                        } catch (
                            submissionError
                        ) {

                            console.error(
                                "Unable to read SQL submission cache:",
                                submissionError
                            );
                        }


                        /*
                        Fresh API data takes priority.

                        SQL-specific fields that are not returned by
                        getAssessmentResult are recovered from the
                        submission result.
                        */

                        const mergedData = {

                            ...(
                                submissionData ||
                                {}
                            ),

                            ...apiData,

                            result:
                                apiData
                                    ?.result ||
                                submissionData
                                    ?.result ||
                                {},

                            assessment:
                                apiData
                                    ?.assessment ||
                                submissionData
                                    ?.assessment ||
                                {
                                    type:
                                        "sql"
                                },

                            sqlPerformance:
                                apiData
                                    ?.sqlPerformance ||
                                submissionData
                                    ?.sqlPerformance ||
                                {},

                            answers:
                                apiData
                                    ?.answers ||
                                submissionData
                                    ?.answers ||
                                []
                        };


                        setResultData(
                            mergedData
                        );


                        /*
                        ---------------------------------------------
                        CACHE SQL RESULT
                        ---------------------------------------------
                        */

                        localStorage.setItem(
                            `sqlResult_${assessmentId}`,
                            JSON.stringify(
                                mergedData
                            )
                        );


                    } catch (
                        err
                    ) {

                        console.error(
                            "Failed to load SQL result:",
                            err
                        );


                        /*
                        =================================================
                        CACHE FALLBACK
                        =================================================
                        */

                        try {

                            const cachedResult =
                                localStorage.getItem(
                                    `sqlResult_${assessmentId}`
                                );


                            if (
                                cachedResult
                            ) {

                                const parsed =
                                    JSON.parse(
                                        cachedResult
                                    );


                                setResultData(
                                    parsed
                                );


                                setLoading(
                                    false
                                );


                                return;
                            }


                            /*
                            ---------------------------------------------
                            SUBMISSION RESULT FALLBACK
                            ---------------------------------------------
                            */

                            const submitResult =
                                localStorage.getItem(
                                    "assessmentResult"
                                );


                            if (
                                submitResult
                            ) {

                                const parsed =
                                    JSON.parse(
                                        submitResult
                                    );


                                const data =
                                    parsed
                                        ?.data ||
                                    parsed;


                                if (
                                    data
                                        ?.type ===
                                    "sql" ||

                                    data
                                        ?.assessment
                                        ?.type ===
                                    "sql"
                                ) {

                                    setResultData(
                                        data
                                    );


                                    setLoading(
                                        false
                                    );


                                    return;
                                }
                            }


                        } catch (
                            cacheError
                        ) {

                            console.error(
                                "Failed to load cached SQL result:",
                                cacheError
                            );
                        }


                        setError(

                            err
                                ?.response
                                ?.data
                                ?.message ||

                            err
                                ?.message ||

                            "Failed to load SQL assessment result."
                        );


                    } finally {

                        setLoading(
                            false
                        );
                    }
                };


            loadResult();


        },
        [
            assessmentId
        ]
    );


    /*
    =========================================================
    NORMALIZED DATA
    =========================================================
    */

    const result =
        resultData
            ?.result ||
        {};


    const assessment =
        resultData
            ?.assessment ||
        {};


    const sqlPerformance =
        resultData
            ?.sqlPerformance ||
        {};


    const jobReadiness =
        resultData
            ?.jobReadiness ||
        {};


    const jobReadinessExplanation =
        resultData
            ?.jobReadinessExplanation ||
        {};


    const aiExplanation =
        resultData
            ?.aiExplanation ||
        {};


    const weakSkillAnalysis =
        resultData
            ?.weakSkillAnalysis ||
        {};


    const skillPerformance =
        Array.isArray(
            resultData
                ?.skillPerformance
        )

            ? resultData
                .skillPerformance

            : [];


    /*
    =========================================================
    QUESTION RESULTS
    =========================================================

    Priority:

    1. sqlPerformance.questionResults
    2. resultData.questionResults
    3. submitAssessment() public answers
    =========================================================
    */

    const questionResults =
        useMemo(
            () => {

                if (
                    Array.isArray(
                        sqlPerformance
                            ?.questionResults
                    ) &&
                    sqlPerformance
                        .questionResults
                        .length >
                    0
                ) {

                    return sqlPerformance
                        .questionResults;
                }


                if (
                    Array.isArray(
                        resultData
                            ?.questionResults
                    ) &&
                    resultData
                        .questionResults
                        .length >
                    0
                ) {

                    return resultData
                        .questionResults;
                }


                if (
                    Array.isArray(
                        resultData
                            ?.answers
                    )
                ) {

                    return resultData
                        .answers;
                }


                return [];
            },
            [
                sqlPerformance,
                resultData
            ]
        );


    /*
    =========================================================
    SCORE VALUES
    =========================================================
    */

    const score =
        Number(
            result
                ?.score ??
            resultData
                ?.score ??
            0
        );


    /*
    Backend getAssessmentResult contains maxScore.

    submitAssessment also returns maxScore.
    */

    const maxScore =
        Number(
            result
                ?.maxScore ??
            resultData
                ?.maxScore ??
            skillPerformance
                .reduce(
                    (
                        total,
                        skill
                    ) =>
                        total +
                        Number(
                            skill
                                ?.maxScore ||
                            0
                        ),
                    0
                ) ??
            0
        );


    const percentage =
        clampPercentage(

            result
                ?.percentage ??
            resultData
                ?.percentage ??
            0
        );


    /*
    =========================================================
    SQL TEST-CASE PERFORMANCE
    =========================================================
    */

    const passedTestCases =
        useMemo(
            () => {

                if (
                    sqlPerformance
                        ?.testCasesPassed !==
                    undefined
                ) {

                    return Number(
                        sqlPerformance
                            .testCasesPassed ||
                        0
                    );
                }


                if (
                    questionResults.length >
                    0
                ) {

                    return questionResults
                        .reduce(
                            (
                                total,
                                question
                            ) =>
                                total +
                                Number(
                                    question
                                        ?.testCasesPassed ||
                                    0
                                ),
                            0
                        );
                }


                return skillPerformance
                    .reduce(
                        (
                            total,
                            skill
                        ) =>
                            total +
                            Number(
                                skill
                                    ?.testCasesPassed ||
                                0
                            ),
                        0
                    );
            },
            [
                sqlPerformance,
                questionResults,
                skillPerformance
            ]
        );


    const totalTestCases =
        useMemo(
            () => {

                if (
                    sqlPerformance
                        ?.totalTestCases !==
                    undefined
                ) {

                    return Number(
                        sqlPerformance
                            .totalTestCases ||
                        0
                    );
                }


                if (
                    questionResults.length >
                    0
                ) {

                    return questionResults
                        .reduce(
                            (
                                total,
                                question
                            ) =>
                                total +
                                Number(
                                    question
                                        ?.totalTestCases ||
                                    0
                                ),
                            0
                        );
                }


                return skillPerformance
                    .reduce(
                        (
                            total,
                            skill
                        ) =>
                            total +
                            Number(
                                skill
                                    ?.totalTestCases ||
                                0
                            ),
                        0
                    );
            },
            [
                sqlPerformance,
                questionResults,
                skillPerformance
            ]
        );


    const failedTestCases =
        Math.max(
            totalTestCases -
            passedTestCases,
            0
        );


    const testCasePercentage =
        useMemo(
            () => {

                if (
                    sqlPerformance
                        ?.testCasePercentage !==
                    undefined
                ) {

                    return clampPercentage(
                        sqlPerformance
                            .testCasePercentage
                    );
                }


                if (
                    totalTestCases ===
                    0
                ) {

                    return 0;
                }


                return Math.round(
                    (
                        passedTestCases /
                        totalTestCases
                    ) *
                    100
                );
            },
            [
                sqlPerformance,
                totalTestCases,
                passedTestCases
            ]
        );


    /*
    =========================================================
    QUESTION COUNTS
    =========================================================
    */

    const totalQuestions =
        Number(

            sqlPerformance
                ?.totalQuestions ??

            result
                ?.totalQuestions ??

            assessment
                ?.totalQuestions ??

            questionResults
                .length ??

            0
        );


    const correctQuestions =
        useMemo(
            () => {

                if (
                    sqlPerformance
                        ?.correctQuestions !==
                    undefined
                ) {

                    return Number(
                        sqlPerformance
                            .correctQuestions ||
                        0
                    );
                }


                if (
                    result
                        ?.correctAnswers !==
                    undefined
                ) {

                    return Number(
                        result
                            .correctAnswers ||
                        0
                    );
                }


                return questionResults
                    .filter(
                        (
                            question
                        ) =>
                            question
                                ?.isCorrect ===
                            true
                    )
                    .length;
            },
            [
                sqlPerformance,
                result,
                questionResults
            ]
        );


    const incorrectQuestions =
        Math.max(
            totalQuestions -
            correctQuestions,
            0
        );


    /*
    =========================================================
    EXECUTION TIME
    =========================================================
    */

    const totalExecutionTime =
        useMemo(
            () => {

                if (
                    sqlPerformance
                        ?.totalExecutionTime !==
                    undefined
                ) {

                    return Number(
                        sqlPerformance
                            .totalExecutionTime ||
                        0
                    );
                }


                if (
                    questionResults.length >
                    0
                ) {

                    return questionResults
                        .reduce(
                            (
                                total,
                                question
                            ) =>
                                total +
                                Number(
                                    question
                                        ?.executionTime ||
                                    0
                                ),
                            0
                        );
                }


                return skillPerformance
                    .reduce(
                        (
                            total,
                            skill
                        ) =>
                            total +
                            Number(
                                skill
                                    ?.executionTime ||
                                0
                            ),
                        0
                    );
            },
            [
                sqlPerformance,
                questionResults,
                skillPerformance
            ]
        );


    const averageExecutionTime =
        Number(
            sqlPerformance
                ?.averageExecutionTime ??
            (
                totalTestCases >
                0

                    ? totalExecutionTime /
                    totalTestCases

                    : 0
            )
        );


    /*
    =========================================================
    EXPLANATION
    =========================================================
    */

    const explanationSummary =

        aiExplanation
            ?.summary ||

        jobReadinessExplanation
            ?.summary ||

        (
            percentage >=
            80

                ? "You demonstrated strong SQL query-writing and database problem-solving skills. Continue practicing joins, aggregation, subqueries, CTEs and advanced query optimization."

                : percentage >=
                  60

                ? "Your SQL fundamentals are developing well. Continue strengthening joins, grouping, subqueries and multi-table query accuracy."

                : "Your SQL result shows areas that need additional practice. Focus on SELECT queries, filtering, joins, aggregation, grouping and subqueries."
        );


    const recommendations =
        Array.isArray(
            aiExplanation
                ?.recommendations
        ) &&
        aiExplanation
            .recommendations
            .length >
        0

            ? aiExplanation
                .recommendations

            : Array.isArray(
                weakSkillAnalysis
                    ?.recommendations
            )

                ? weakSkillAnalysis
                    .recommendations

                : [];


    const nextAction =

        aiExplanation
            ?.nextAction ||

        jobReadinessExplanation
            ?.priorityMessage ||

        "";


    /*
    =========================================================
    JOB READINESS
    =========================================================
    */

    const readinessScore =
        clampPercentage(
            jobReadiness
                ?.score
        );


    const resumeCoverage =
        clampPercentage(
            jobReadiness
                ?.resumeCoverage
        );


    const assessmentScore =
        clampPercentage(
            jobReadiness
                ?.assessmentScore
        );


    /*
    =========================================================
    LOADING
    =========================================================
    */

    if (
        loading
    ) {

        return (

            <div className="coding-result-state-page">

                <div className="coding-result-state-card">

                    <div className="result-spinner" />

                    <h2>
                        Preparing Your SQL Results
                    </h2>

                    <p>
                        Calculating query performance,
                        hidden test results and job
                        readiness...
                    </p>

                </div>

            </div>
        );
    }


    /*
    =========================================================
    ERROR
    =========================================================
    */

    if (
        error &&
        !resultData
    ) {

        return (

            <div className="coding-result-state-page">

                <div className="coding-result-state-card error">

                    <div className="state-icon">
                        !
                    </div>

                    <h2>
                        Unable to Load Result
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        className="result-primary-btn"
                        onClick={() =>
                            navigate(
                                "/assessments"
                            )
                        }
                    >
                        Back to Assessments
                    </button>

                </div>

            </div>
        );
    }


    /*
    =========================================================
    RENDER
    =========================================================
    */

    return (

        <div className="coding-result-page">

            <div className="coding-result-container">


                {/* ============================================
                    HEADER
                ============================================ */}

                <header className="coding-result-header">

                    <div>

                        <div className="result-eyebrow">
                            SQL ASSESSMENT
                        </div>

                        <h1>
                            SQL Assessment Result
                        </h1>

                        <p>

                            Review your SQL score,
                            hidden test-case performance,
                            skill analysis and overall
                            job readiness.

                        </p>

                    </div>


                    <div className="result-header-actions">

                        <button
                            type="button"
                            className="result-secondary-btn"
                            onClick={() =>
                                navigate(
                                    "/assessments"
                                )
                            }
                        >
                            Back to Assessments
                        </button>


                        <button
                            type="button"
                            className="result-primary-btn"
                            onClick={() =>
                                navigate(
                                    "/analytics"
                                )
                            }
                        >
                            View Analytics
                        </button>

                    </div>

                </header>


                {/* ============================================
                    CONTEXT
                ============================================ */}

                <section className="assessment-context-card">

                    <div>

                        <span>
                            Target Company
                        </span>

                        <strong>
                            {
                                assessment
                                    ?.company ||
                                "Not specified"
                            }
                        </strong>

                    </div>


                    <div>

                        <span>
                            Target Role
                        </span>

                        <strong>
                            {
                                assessment
                                    ?.role ||
                                "Not specified"
                            }
                        </strong>

                    </div>


                    <div>

                        <span>
                            Status
                        </span>

                        <strong className="status-evaluated">
                            Evaluated
                        </strong>

                    </div>

                </section>


                {/* ============================================
                    HERO
                ============================================ */}

                <section className="result-hero-grid">


                    {/* SCORE */}

                    <div className="result-score-card">

                        <div
                            className="score-ring"
                            style={{
                                "--score":
                                    `${percentage}%`
                            }}
                        >

                            <div className="score-ring-inner">

                                <strong>
                                    {percentage}%
                                </strong>

                                <span>
                                    Overall Score
                                </span>

                            </div>

                        </div>


                        <div className="score-card-content">

                            <div className="score-card-label">
                                SQL Assessment Score
                            </div>

                            <h2>

                                {score}

                                <span>
                                    {" "}
                                    / {maxScore}
                                </span>

                            </h2>


                            {
                                result
                                    ?.level &&
                                (

                                    <div
                                        className={`performance-level ${getPerformanceClass(
                                            percentage
                                        )}`}
                                    >
                                        {
                                            result
                                                .level
                                        }
                                    </div>
                                )
                            }


                            <p>

                                Your SQL score is calculated
                                from query results against
                                public and hidden database
                                test cases.

                            </p>

                        </div>

                    </div>


                    {/* TEST PERFORMANCE */}

                    <div className="test-performance-card">

                        <div className="section-small-heading">
                            SQL Test Performance
                        </div>


                        <div className="test-performance-score">

                            <strong>
                                {testCasePercentage}%
                            </strong>

                            <span>
                                Test cases passed
                            </span>

                        </div>


                        <div className="result-progress-track">

                            <div
                                className="result-progress-fill"
                                style={{
                                    width:
                                        `${testCasePercentage}%`
                                }}
                            />

                        </div>


                        <div className="test-summary-row">

                            <span>
                                {passedTestCases} passed
                            </span>

                            <span>
                                {failedTestCases} failed
                            </span>

                            <span>
                                {totalTestCases} total
                            </span>

                        </div>

                    </div>

                </section>


                {/* ============================================
                    METRICS
                ============================================ */}

                <section className="result-metrics-grid">


                    <div className="result-metric-card passed">

                        <div className="metric-icon">
                            ✓
                        </div>

                        <div>

                            <span>
                                Passed Test Cases
                            </span>

                            <strong>
                                {passedTestCases}
                            </strong>

                            <small>
                                out of {totalTestCases}
                            </small>

                        </div>

                    </div>


                    <div className="result-metric-card failed">

                        <div className="metric-icon">
                            ×
                        </div>

                        <div>

                            <span>
                                Failed Test Cases
                            </span>

                            <strong>
                                {failedTestCases}
                            </strong>

                            <small>
                                Need improvement
                            </small>

                        </div>

                    </div>


                    <div className="result-metric-card time">

                        <div className="metric-icon">
                            ◷
                        </div>

                        <div>

                            <span>
                                Execution Time
                            </span>

                            <strong>
                                {
                                    formatExecutionTime(
                                        totalExecutionTime
                                    )
                                }
                            </strong>

                            <small>

                                Avg{" "}

                                {
                                    formatExecutionTime(
                                        averageExecutionTime
                                    )
                                }

                            </small>

                        </div>

                    </div>


                    <div className="result-metric-card solved">

                        <div className="metric-icon">
                            SQL
                        </div>

                        <div>

                            <span>
                                Correct Queries
                            </span>

                            <strong>
                                {correctQuestions}
                            </strong>

                            <small>

                                {incorrectQuestions} failed

                            </small>

                        </div>

                    </div>

                </section>


                {/* ============================================
                    SQL SUMMARY
                ============================================ */}

                <section className="result-section-card">

                    <div className="result-section-header compact">

                        <div className="section-icon">
                            #
                        </div>

                        <div>

                            <h2>
                                SQL Summary
                            </h2>

                            <p>
                                Overall query-level
                                assessment performance.
                            </p>

                        </div>

                    </div>


                    <div className="question-stat-grid">

                        <div>

                            <span>
                                Total Questions
                            </span>

                            <strong>
                                {totalQuestions}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Correct
                            </span>

                            <strong>
                                {correctQuestions}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Incorrect
                            </span>

                            <strong>
                                {incorrectQuestions}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* ============================================
                    PERFORMANCE EXPLANATION
                ============================================ */}

                <section className="result-section-card">

                    <div className="result-section-header">

                        <div>

                            <div className="section-icon">
                                ✦
                            </div>

                        </div>


                        <div>

                            <h2>
                                SQL Performance Explanation
                            </h2>

                            <p>

                                Analysis based on your
                                verified SQL assessment
                                results.

                            </p>

                        </div>

                    </div>


                    <div className="ai-explanation-content">

                        <p className="ai-summary">

                            {explanationSummary}

                        </p>


                        {
                            aiExplanation
                                ?.source &&
                            (

                                <div className="ai-source-label">

                                    {
                                        aiExplanation
                                            .source ===
                                        "ollama"

                                            ? `AI generated${
                                                aiExplanation
                                                    ?.model
                                                    ? ` · ${aiExplanation.model}`
                                                    : ""
                                            }`

                                            : "Performance analysis"
                                    }

                                </div>
                            )
                        }


                        {
                            nextAction &&
                            (

                                <div className="priority-message">

                                    <span>
                                        Next Priority
                                    </span>

                                    <p>
                                        {nextAction}
                                    </p>

                                </div>
                            )
                        }


                        {
                            recommendations.length >
                            0 &&
                            (

                                <div className="insight-group">

                                    <h3>
                                        Recommendations
                                    </h3>


                                    <div className="ai-recommendation-list">

                                        {
                                            recommendations.map(
                                                (
                                                    recommendation,
                                                    index
                                                ) => (

                                                    <div
                                                        className="ai-recommendation-item"
                                                        key={
                                                            index
                                                        }
                                                    >

                                                        <span>
                                                            {index + 1}
                                                        </span>

                                                        <p>

                                                            {
                                                                typeof recommendation ===
                                                                "string"

                                                                    ? recommendation

                                                                    : recommendation
                                                                        ?.message ||

                                                                      recommendation
                                                                        ?.recommendation ||

                                                                      (
                                                                          recommendation
                                                                              ?.skill

                                                                              ? `Practice ${recommendation.skill}.`

                                                                              : JSON.stringify(
                                                                                  recommendation
                                                                              )
                                                                      )
                                                            }

                                                        </p>

                                                    </div>
                                                )
                                            )
                                        }

                                    </div>

                                </div>
                            )
                        }

                    </div>

                </section>


                {/* ============================================
                    SKILL PERFORMANCE + READINESS
                ============================================ */}

                <section className="analytics-result-grid">


                    {/* SKILLS */}

                    <div className="result-section-card">

                        <div className="result-section-header compact">

                            <div className="section-icon">
                                ↗
                            </div>

                            <div>

                                <h2>
                                    SQL Skill Performance
                                </h2>

                                <p>

                                    Performance for each
                                    assessed SQL skill.

                                </p>

                            </div>

                        </div>


                        {
                            skillPerformance.length >
                            0
                                ? (

                                    <div className="skill-performance-list">

                                        {
                                            skillPerformance.map(
                                                (
                                                    skill,
                                                    index
                                                ) => {

                                                    const skillPercentage =
                                                        clampPercentage(
                                                            skill
                                                                ?.percentage
                                                        );


                                                    const accuracy =
                                                        clampPercentage(
                                                            skill
                                                                ?.accuracy
                                                        );


                                                    const skillTestPercentage =
                                                        clampPercentage(
                                                            skill
                                                                ?.testCasePercentage
                                                        );


                                                    return (

                                                        <div
                                                            className="skill-performance-item"
                                                            key={
                                                                skill
                                                                    ?.skill ||
                                                                index
                                                            }
                                                        >

                                                            <div className="skill-performance-top">

                                                                <div>

                                                                    <strong>

                                                                        {
                                                                            skill
                                                                                ?.skill ||
                                                                            "SQL"
                                                                        }

                                                                    </strong>


                                                                    <span>

                                                                        {
                                                                            Number(
                                                                                skill
                                                                                    ?.score ||
                                                                                0
                                                                            )
                                                                        }

                                                                        {" / "}

                                                                        {
                                                                            Number(
                                                                                skill
                                                                                    ?.maxScore ||
                                                                                0
                                                                            )
                                                                        }

                                                                        {" "}points

                                                                    </span>

                                                                </div>


                                                                <div
                                                                    className={`skill-percentage ${getPerformanceClass(
                                                                        skillPercentage
                                                                    )}`}
                                                                >
                                                                    {skillPercentage}%
                                                                </div>

                                                            </div>


                                                            <div className="skill-progress-track">

                                                                <div
                                                                    className={`skill-progress-fill ${getPerformanceClass(
                                                                        skillPercentage
                                                                    )}`}
                                                                    style={{
                                                                        width:
                                                                            `${skillPercentage}%`
                                                                    }}
                                                                />

                                                            </div>


                                                            <div className="skill-performance-bottom">

                                                                <span>

                                                                    Questions:{" "}

                                                                    {
                                                                        Number(
                                                                            skill
                                                                                ?.correctAnswers ||
                                                                            0
                                                                        )
                                                                    }

                                                                    /

                                                                    {
                                                                        Number(
                                                                            skill
                                                                                ?.totalQuestions ||
                                                                            0
                                                                        )
                                                                    }

                                                                </span>


                                                                <span>
                                                                    Accuracy: {accuracy}%
                                                                </span>


                                                                {
                                                                    Number(
                                                                        skill
                                                                            ?.totalTestCases ||
                                                                        0
                                                                    ) >
                                                                    0 &&
                                                                    (

                                                                        <span>

                                                                            Tests:{" "}

                                                                            {
                                                                                Number(
                                                                                    skill
                                                                                        ?.testCasesPassed ||
                                                                                    0
                                                                                )
                                                                            }

                                                                            /

                                                                            {
                                                                                Number(
                                                                                    skill
                                                                                        ?.totalTestCases ||
                                                                                    0
                                                                                )
                                                                            }

                                                                        </span>
                                                                    )
                                                                }


                                                                {
                                                                    Number(
                                                                        skill
                                                                            ?.totalTestCases ||
                                                                        0
                                                                    ) >
                                                                    0 &&
                                                                    (

                                                                        <span>
                                                                            Test Success: {skillTestPercentage}%
                                                                        </span>
                                                                    )
                                                                }


                                                                <span>
                                                                    {
                                                                        skill
                                                                            ?.level ||
                                                                        ""
                                                                    }
                                                                </span>

                                                            </div>

                                                        </div>
                                                    );
                                                }
                                            )
                                        }

                                    </div>

                                )
                                : (

                                    <div className="empty-result-message">

                                        SQL skill performance
                                        will appear after
                                        evaluation.

                                    </div>
                                )
                        }

                    </div>


                    {/* READINESS */}

                    <div className="result-section-card readiness-card">

                        <div className="result-section-header compact">

                            <div className="section-icon">
                                ◎
                            </div>

                            <div>

                                <h2>
                                    Overall Job Readiness
                                </h2>

                                <p>

                                    Resume coverage and
                                    assessment performance.

                                </p>

                            </div>

                        </div>


                        {
                            jobReadiness
                                ?.score !==
                            undefined
                                ? (

                                    <>

                                        <div className="readiness-score">

                                            <strong>
                                                {readinessScore}%
                                            </strong>

                                            <span>

                                                {
                                                    jobReadiness
                                                        ?.level ||
                                                    ""
                                                }

                                            </span>

                                        </div>


                                        <div className="readiness-breakdown">


                                            <div className="readiness-row">

                                                <div>

                                                    <span>
                                                        Resume Coverage
                                                    </span>

                                                    <strong>
                                                        {resumeCoverage}%
                                                    </strong>

                                                </div>


                                                <div className="readiness-progress">

                                                    <div
                                                        style={{
                                                            width:
                                                                `${resumeCoverage}%`
                                                        }}
                                                    />

                                                </div>

                                            </div>


                                            <div className="readiness-row">

                                                <div>

                                                    <span>
                                                        SQL Assessment
                                                    </span>

                                                    <strong>
                                                        {assessmentScore}%
                                                    </strong>

                                                </div>


                                                <div className="readiness-progress">

                                                    <div
                                                        style={{
                                                            width:
                                                                `${assessmentScore}%`
                                                        }}
                                                    />

                                                </div>

                                            </div>

                                        </div>

                                    </>

                                )
                                : (

                                    <div className="empty-result-message">

                                        Overall readiness data
                                        is not available yet.

                                    </div>
                                )
                        }

                    </div>

                </section>


                {/* ============================================
                    QUESTION BREAKDOWN
                ============================================ */}

                {
                    questionResults.length >
                    0 &&
                    (

                        <section className="result-section-card">

                            <div className="result-section-header compact">

                                <div className="section-icon">
                                    DB
                                </div>

                                <div>

                                    <h2>
                                        Query Breakdown
                                    </h2>

                                    <p>

                                        Result for each SQL
                                        assessment question.

                                    </p>

                                </div>

                            </div>


                            <div className="question-result-list">

                                {
                                    questionResults.map(
                                        (
                                            question,
                                            index
                                        ) => {

                                            const status =
                                                getQuestionStatus(
                                                    question
                                                );


                                            const questionTotalTests =
                                                Number(
                                                    question
                                                        ?.totalTestCases ||
                                                    0
                                                );


                                            const questionPassedTests =
                                                Number(
                                                    question
                                                        ?.testCasesPassed ||
                                                    0
                                                );


                                            const questionFailedTests =
                                                Math.max(
                                                    questionTotalTests -
                                                    questionPassedTests,
                                                    0
                                                );


                                            return (

                                                <details
                                                    className="question-result-item"
                                                    key={
                                                        question
                                                            ?.questionId ||

                                                        question
                                                            ?.question ||

                                                        index
                                                    }
                                                >

                                                    <summary>

                                                        <div className="question-result-title">

                                                            <span className="question-result-number">
                                                                {index + 1}
                                                            </span>


                                                            <div>

                                                                <strong>

                                                                    {
                                                                        question
                                                                            ?.title ||
                                                                        `SQL Question ${index + 1}`
                                                                    }

                                                                </strong>


                                                                <span>

                                                                    {
                                                                        question
                                                                            ?.skill ||
                                                                        "SQL"
                                                                    }

                                                                    {
                                                                        question
                                                                            ?.difficulty

                                                                            ? ` · ${question.difficulty}`

                                                                            : ""
                                                                    }

                                                                </span>

                                                            </div>

                                                        </div>


                                                        <div className="question-result-summary">

                                                            <span
                                                                className={`question-status ${status.className}`}
                                                            >
                                                                {status.label}
                                                            </span>


                                                            <strong>

                                                                {
                                                                    Number(
                                                                        question
                                                                            ?.pointsEarned ||
                                                                        0
                                                                    )
                                                                }

                                                                {
                                                                    question
                                                                        ?.maxPoints !==
                                                                    undefined &&
                                                                    (
                                                                        <>
                                                                            /
                                                                            {
                                                                                Number(
                                                                                    question
                                                                                        ?.maxPoints ||
                                                                                    0
                                                                                )
                                                                            }
                                                                        </>
                                                                    )
                                                                }

                                                            </strong>

                                                        </div>

                                                    </summary>


                                                    <div className="question-result-details">


                                                        <div className="question-stat-grid">

                                                            <div>

                                                                <span>
                                                                    Test Cases
                                                                </span>

                                                                <strong>

                                                                    {questionPassedTests}

                                                                    /

                                                                    {questionTotalTests}

                                                                </strong>

                                                            </div>


                                                            <div>

                                                                <span>
                                                                    Execution
                                                                </span>

                                                                <strong>

                                                                    {
                                                                        formatExecutionTime(
                                                                            question
                                                                                ?.executionTime
                                                                        )
                                                                    }

                                                                </strong>

                                                            </div>


                                                            <div>

                                                                <span>
                                                                    Failed
                                                                </span>

                                                                <strong>
                                                                    {questionFailedTests}
                                                                </strong>

                                                            </div>

                                                        </div>


                                                        {
                                                            question
                                                                ?.performance &&
                                                            (

                                                                <div className="priority-message">

                                                                    <span>
                                                                        Performance
                                                                    </span>

                                                                    <p>
                                                                        {
                                                                            question
                                                                                .performance
                                                                        }
                                                                    </p>

                                                                </div>
                                                            )
                                                        }


                                                        {
                                                            question
                                                                ?.error &&
                                                            (

                                                                <div className="question-error-message">

                                                                    <strong>
                                                                        SQL Error
                                                                    </strong>

                                                                    <pre>
                                                                        {
                                                                            question
                                                                                .error
                                                                        }
                                                                    </pre>

                                                                </div>
                                                            )
                                                        }


                                                        {
                                                            question
                                                                ?.timedOut &&
                                                            (

                                                                <div className="question-error-message">

                                                                    <strong>
                                                                        Timeout
                                                                    </strong>

                                                                    <pre>
                                                                        SQL execution exceeded the allowed time limit.
                                                                    </pre>

                                                                </div>
                                                            )
                                                        }


                                                        {/* TEST CASE RESULTS */}

                                                        {
                                                            Array.isArray(
                                                                question
                                                                    ?.testCaseResults
                                                            ) &&
                                                            question
                                                                .testCaseResults
                                                                .length >
                                                            0 &&
                                                            (

                                                                <div className="test-case-result-list">

                                                                    {
                                                                        question
                                                                            .testCaseResults
                                                                            .map(
                                                                                (
                                                                                    testCase,
                                                                                    testIndex
                                                                                ) => (

                                                                                    <div
                                                                                        className={`test-case-result ${
                                                                                            testCase
                                                                                                ?.passed

                                                                                                ? "passed"

                                                                                                : "failed"
                                                                                        }`}
                                                                                        key={
                                                                                            testIndex
                                                                                        }
                                                                                    >

                                                                                        <div className="test-case-result-header">

                                                                                            <strong>

                                                                                                Test Case{" "}

                                                                                                {
                                                                                                    testCase
                                                                                                        ?.testCaseNumber ||
                                                                                                    testIndex +
                                                                                                    1
                                                                                                }

                                                                                            </strong>


                                                                                            <span>

                                                                                                {
                                                                                                    testCase
                                                                                                        ?.passed

                                                                                                        ? "Passed"

                                                                                                        : "Failed"
                                                                                                }

                                                                                            </span>

                                                                                        </div>


                                                                                        <p className="hidden-test-message">

                                                                                            SQL evaluation
                                                                                            test data is
                                                                                            protected.

                                                                                        </p>


                                                                                        {
                                                                                            testCase
                                                                                                ?.error &&
                                                                                            (

                                                                                                <div className="test-case-error">

                                                                                                    {
                                                                                                        testCase
                                                                                                            .error
                                                                                                    }

                                                                                                </div>
                                                                                            )
                                                                                        }


                                                                                        {
                                                                                            testCase
                                                                                                ?.timedOut &&
                                                                                            (

                                                                                                <div className="test-case-error">
                                                                                                    Test case timed out.
                                                                                                </div>
                                                                                            )
                                                                                        }


                                                                                        <small>

                                                                                            {
                                                                                                formatExecutionTime(
                                                                                                    testCase
                                                                                                        ?.executionTime
                                                                                                )
                                                                                            }

                                                                                        </small>

                                                                                    </div>
                                                                                )
                                                                            )
                                                                    }

                                                                </div>
                                                            )
                                                        }

                                                    </div>

                                                </details>
                                            );
                                        }
                                    )
                                }

                            </div>

                        </section>
                    )
                }


                {/* ============================================
                    FOOTER
                ============================================ */}

                <section className="result-footer-actions">

                    <button
                        type="button"
                        className="result-secondary-btn"
                        onClick={() =>
                            navigate(
                                "/dashboard"
                            )
                        }
                    >
                        Dashboard
                    </button>


                    <button
                        type="button"
                        className="result-secondary-btn"
                        onClick={() =>
                            navigate(
                                "/assessments"
                            )
                        }
                    >
                        New Assessment
                    </button>


                    <button
                        type="button"
                        className="result-primary-btn"
                        onClick={() =>
                            navigate(
                                "/analytics"
                            )
                        }
                    >
                        Continue to Analytics →
                    </button>

                </section>

            </div>

        </div>
    );
};


export default SQLResult;