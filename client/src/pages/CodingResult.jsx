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
import "./codingResult.css";
const CodingResult = () => {
    const navigate = useNavigate();
    const {
        assessmentId: routeAssessmentId
    } = useParams();
    const assessmentId =
        routeAssessmentId ||
        localStorage.getItem("assessmentId") ||
        "";
    const [resultData, setResultData] =
        useState(null);
    const [loading, setLoading] =
        useState(true);
    const [error, setError] =
        useState("");
    const clampPercentage = (value) => {
        const number =
            Number(value || 0);
        return Math.min(
            100,
            Math.max(
                0,
                number
            )
        );
    };
    const formatExecutionTime = (
        milliseconds
    ) => {
        const time =
            Number(
                milliseconds || 0
            );
        if (time <= 0) {
            return "0 ms";
        }
        if (time < 1000) {
            return `${Math.round(
                time
            )} ms`;
        }
        return `${(
            time / 1000
        ).toFixed(2)} sec`;
    };
    const getPerformanceClass = (
        percentage
    ) => {
        const value =
            Number(
                percentage || 0
            );
        if (value >= 80) {
            return "excellent";
        }
        if (value >= 60) {
            return "good";
        }
        if (value >= 40) {
            return "average";
        }
        return "low";
    };
    const getQuestionStatus = (
        question
    ) => {
        if (
            question?.isCorrect
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
            ) > 0
        ) {
            return {
                label:
                    "Partial",
                className:
                    "partial"
            };
        }
        if (
            !question
                ?.attempted
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
    useEffect(() => {
        const loadResult =
            async () => {
                if (!assessmentId) {
                    setError(
                        "Assessment ID was not found. Please return to the assessment page."
                    );
                    setLoading(false);
                    return;
                }
                try {
                    setLoading(true);
                    setError("");
                    const response =
                        await assessmentService
                            .getAssessmentResult(
                                assessmentId
                            );
                    console.log(
                        "Coding result response:",
                        response
                    );
                    const data =
                        response?.data ||
                        response;
                    if (!data) {
                        throw new Error(
                            "Assessment result was empty."
                        );
                    }
                    if (
                        data
                            ?.assessment
                            ?.type &&
                        data
                            .assessment
                            .type !==
                            "coding"
                    ) {

                        throw new Error(
                            "This result does not belong to a coding assessment."
                        );
                    }
                    setResultData(
                        data
                    );
                    localStorage.setItem(
                        `codingResult_${assessmentId}`,
                        JSON.stringify(
                            data
                        )
                    );
                } catch (err) {
                    console.error(
                        "Failed to load coding result:",
                        err
                    );
                    try {
                        const cachedResult =
                            localStorage.getItem(
                                `codingResult_${assessmentId}`
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
                                parsed?.data ||
                                parsed;
                            if (
                                data
                                    ?.assessment
                                    ?.type ===
                                    "coding" ||
                                data?.type ===
                                    "coding"
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
                            "Failed to load cached result:",
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

                        "Failed to load coding assessment result."
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            };
        loadResult();
    }, [assessmentId]);
    const result =
        resultData
            ?.result ||
        {};
    const assessment =
        resultData
            ?.assessment ||
        {};
    const codingPerformance =
        resultData
            ?.codingPerformance ||
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
    const score =
        Number(
            result
                ?.score ||
            0
        );
    const maxScore =
        Number(
            result
                ?.maxScore ||
            0
        );
    const percentage =
        clampPercentage(
            result
                ?.percentage
        );
    const passedTestCases =
        Number(
            codingPerformance
                ?.testCasesPassed ||
            0
        );
    const failedTestCases =
        Number(
            codingPerformance
                ?.testCasesFailed ||
            0
        );
    const totalTestCases =
        Number(
            codingPerformance
                ?.totalTestCases ||
            0
        );
    const totalExecutionTime =
        Number(
            codingPerformance
                ?.totalExecutionTime ||
            0
        );
    const averageExecutionTime =
        Number(
            codingPerformance
                ?.averageExecutionTime ||
            0
        );
    const questionsAttempted =
        Number(
            codingPerformance
                ?.questionsAttempted ||
            0
        );
    const questionsSolved =
        Number(
            codingPerformance
                ?.questionsSolved ||
            0
        );
    const questionsPartiallyPassed =
        Number(
            codingPerformance
                ?.questionsPartiallyPassed ||
            0
        );
    const questionsFailed =
        Number(
            codingPerformance
                ?.questionsFailed ||
            0
        );
    const questionResults =
        Array.isArray(
            codingPerformance
                ?.questionResults
        )
            ? codingPerformance
                .questionResults

            : [];
    const testCasePercentage =
        useMemo(() => {
            if (
                codingPerformance
                    ?.testCasePercentage !==
                undefined
            ) {
                return clampPercentage(
                    codingPerformance
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
                ) * 100
            );
        }, [
            codingPerformance,
            totalTestCases,
            passedTestCases
        ]);
    const aiSummary =
        aiExplanation
            ?.summary ||
        jobReadinessExplanation
            ?.summary ||
        (
            percentage >= 70
                ? "You demonstrated a solid coding foundation. Continue improving consistency, edge-case handling and algorithmic problem solving."
                : "Your coding assessment shows areas that require additional practice. Focus on debugging, edge cases and writing solutions that pass all test cases."
        );
    const aiStrengths =
        Array.isArray(
            aiExplanation
                ?.strengths
        ) &&
        aiExplanation
            .strengths
            .length > 0
            ? aiExplanation
                .strengths
            : (
                jobReadinessExplanation
                    ?.strongSkills ||
                []
            ).map(
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
                        ""
                })
            );
    const aiImprovements =
        Array.isArray(
            aiExplanation
                ?.improvements
        ) &&
        aiExplanation
            .improvements
            .length > 0
            ? aiExplanation
                .improvements
            : (
                jobReadinessExplanation
                    ?.areasToImprove ||
                []
            ).map(
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
                        ""
                })
            );
    const codingAnalysis =
        aiExplanation
            ?.codingAnalysis ||
        {};
    const aiRecommendations =
        Array.isArray(
            aiExplanation
                ?.recommendations
        )
            ? aiExplanation
                .recommendations

            : [];
    const nextAction =
        aiExplanation
            ?.nextAction ||
        jobReadinessExplanation
            ?.priorityMessage ||

        "";
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
    if (loading) {
        return (
            <div className="coding-result-state-page">
                <div className="coding-result-state-card">
                    <div className="result-spinner" />
                    <h2>
                        Preparing Your Results
                    </h2>
                    <p>
                        Calculating your coding
                        performance and AI
                        insights...
                    </p>
                </div>
            </div>
        );
    }
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
    return (
        <div className="coding-result-page">
            <div className="coding-result-container">
                <header className="coding-result-header">
                    <div>
                        <div className="result-eyebrow">
                            CODING ASSESSMENT
                        </div>
                        <h1>
                            Coding Assessment Result
                        </h1>
                        <p>
                            Review your coding score,
                            test-case performance,
                            AI feedback, skill
                            performance and overall
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
                <section className="assessment-context-card">
                    <div>
                        <span>
                            Target Company
                        </span>
                        <strong>
                            {assessment
                                ?.company ||
                                "Not specified"}
                        </strong>
                    </div>
                    <div>
                        <span>
                            Target Role
                        </span>
                        <strong>
                            {assessment
                                ?.role ||
                                "Not specified"}
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
                <section className="result-hero-grid">
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
                                Assessment Score
                            </div>
                            <h2>
                                {score}
                                <span>
                                    {" "}
                                    / {maxScore}
                                </span>
                            </h2>
                            {result
                                ?.level && (
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
                            )}
                            <p>
                                Your coding score is
                                calculated from verified
                                test-case performance
                                across the coding
                                questions.
                            </p>
                        </div>
                    </div>
                    <div className="test-performance-card">
                        <div className="section-small-heading">
                            Test Case Performance
                        </div>
                        <div className="test-performance-score">
                            <strong>
                                {
                                    testCasePercentage
                                }
                                %
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
                                {
                                    passedTestCases
                                }
                            </strong>
                            <small>
                                out of{" "}
                                {
                                    totalTestCases
                                }
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
                                {
                                    failedTestCases
                                }
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
                            &lt;/&gt;
                        </div>
                        <div>
                            <span>
                                Questions Solved
                            </span>
                            <strong>
                                {
                                    questionsSolved
                                }
                            </strong>
                            <small>
                                {
                                    questionsPartiallyPassed
                                }{" "}
                                partial ·{" "}
                                {
                                    questionsFailed
                                }{" "}
                                failed
                            </small>
                        </div>
                    </div>
                </section>
                <section className="result-section-card">
                    <div className="result-section-header compact">
                        <div className="section-icon">
                            #
                        </div>
                        <div>
                            <h2>
                                Coding Summary
                            </h2>
                            <p>
                                Overall question-level
                                performance.
                            </p>
                        </div>
                    </div>
                    <div className="question-stat-grid">
                        <div>
                            <span>
                                Attempted
                            </span>
                            <strong>
                                {
                                    questionsAttempted
                                }
                            </strong>
                        </div>
                        <div>
                            <span>
                                Fully Solved
                            </span>
                            <strong>
                                {
                                    questionsSolved
                                }
                            </strong>
                        </div>
                        <div>
                            <span>
                                Partial
                            </span>
                            <strong>
                                {
                                    questionsPartiallyPassed
                                }
                            </strong>
                        </div>
                    </div>
                </section>
                <section className="result-section-card">
                    <div className="result-section-header">
                        <div>
                            <div className="section-icon">
                               ✦
                            </div>
                        </div>
                        <div>
                            <h2>
                                AI Performance Explanation
                            </h2>
                            <p>
                                Personalized analysis
                                based only on your
                                verified coding
                                assessment metrics.
                            </p>
                        </div>
                    </div>
                    <div className="ai-explanation-content">
                        <p className="ai-summary">
                            {aiSummary}
                        </p>
                        {aiExplanation
                            ?.source && (
                            <div className="ai-source-label">
                                {aiExplanation
                                    .source ===
                                "ollama"
                                    ? `AI generated${
                                        aiExplanation
                                            ?.model
                                            ? ` · ${aiExplanation.model}`
                                            : ""
                                    }`
                                    : "Performance analysis"}
                            </div>
                        )}
                        {nextAction && (
                            <div className="priority-message">
                                <span>
                                    Next Priority
                                </span>
                                <p>
                                    {nextAction}
                                </p>
                            </div>
                        )}
                        {aiStrengths.length >
                            0 && (
                            <div className="insight-group">
                                <h3>
                                    Strengths
                                </h3>
                                <div className="ai-insight-list">
                                    {aiStrengths.map(
                                        (
                                            item,
                                            index
                                        ) => (
                                            <div
                                                className="ai-insight-item strength"
                                                key={
                                                    `${item?.skill}-${index}`
                                                }
                                            >
                                                <div className="ai-insight-title">
                                                    <strong>
                                                        {
                                                            item
                                                                ?.skill ||
                                                            "Skill"
                                                        }
                                                    </strong>
                                                    <span>
                                                        {
                                                            Number(
                                                                item
                                                                    ?.score ??
                                                                item
                                                                    ?.percentage ??
                                                                0
                                                            )
                                                        }
                                                        %
                                                    </span>
                                                </div>
                                                {item
                                                    ?.message && (
                                                    <p>
                                                        {
                                                            item
                                                                .message
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                        {aiImprovements.length >
                            0 && (
                            <div className="insight-group">
                                <h3>
                                    Areas to Improve
                                </h3>
                                <div className="ai-insight-list">
                                    {aiImprovements.map(
                                        (
                                            item,
                                            index
                                        ) => (
                                            <div
                                                className="ai-insight-item improvement"
                                                key={
                                                    `${item?.skill}-${index}`
                                                }
                                            >
                                                <div className="ai-insight-title">
                                                    <strong>
                                                        {
                                                            item
                                                                ?.skill ||
                                                            "Skill"
                                                        }
                                                    </strong>
                                                    <span>
                                                        {
                                                            Number(
                                                                item
                                                                    ?.score ??
                                                                item
                                                                    ?.percentage ??
                                                                0
                                                            )
                                                        }
                                                        %
                                                    </span>
                                                </div>
                                                {item
                                                    ?.message && (
                                                    <p>
                                                        {
                                                            item
                                                                .message
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                        {Object.keys(
                            codingAnalysis
                        ).length > 0 && (
                            <div className="coding-ai-analysis">
                                <div>
                                    <span>
                                        Test Cases
                                    </span>
                                    <p>
                                        {
                                            codingAnalysis
                                                ?.testCaseInsight ||
                                            "No test-case insight available."
                                        }
                                    </p>
                                </div>
                                <div>
                                    <span>
                                        Problem Solving
                                    </span>
                                    <p>
                                        {
                                            codingAnalysis
                                                ?.problemSolvingInsight ||
                                            "No problem-solving insight available."
                                        }
                                    </p>
                                </div>
                                <div>
                                    <span>
                                        Execution
                                    </span>
                                    <p>
                                        {
                                            codingAnalysis
                                                ?.executionInsight ||
                                            "No execution insight available."
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                        {aiRecommendations.length >
                            0 && (
                            <div className="insight-group">
                                <h3>
                                    AI Recommendations
                                </h3>
                                <div className="ai-recommendation-list">
                                    {aiRecommendations.map(
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
                                                              JSON.stringify(
                                                                  recommendation
                                                              )
                                                    }
                                                </p>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
                <section className="analytics-result-grid">
                    <div className="result-section-card">
                        <div className="result-section-header compact">
                            <div className="section-icon">
                                ↗
                            </div>
                            <div>
                                <h2>
                                    Skill Performance
                                </h2>
                                <p>
                                    Detailed performance
                                    for each assessed skill.
                                </p>
                            </div>
                        </div>
                        {skillPerformance.length >
                            0 ? (
                            <div className="skill-performance-list">
                                {skillPerformance.map(
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
                                                                "Unknown Skill"
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
                                                            {" "}points                                                        </span>
                                                    </div>
                                                    <div
                                                        className={`skill-percentage ${getPerformanceClass(
                                                            skillPercentage
                                                        )}`}
                                                    >
                                                        {
                                                            skillPercentage
                                                        }
                                                        %
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
                                                        Accuracy:{" "}
                                                        {
                                                            accuracy
                                                        }
                                                        %
                                                    </span>
                                                    {Number(
                                                        skill
                                                            ?.totalTestCases ||
                                                        0
                                                    ) > 0 && (
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
                                                    )}
                                                    {Number(
                                                        skill
                                                            ?.totalTestCases ||
                                                        0
                                                    ) > 0 && (
                                                        <span>
                                                            Test Success:{" "}
                                                            {
                                                                skillTestPercentage
                                                            }
                                                            %
                                                        </span>
                                                    )}
                                                    {Number(
                                                        skill
                                                            ?.executionTime ||
                                                        0
                                                    ) > 0 && (
                                                        <span>
                                                            Runtime:{" "}
                                                            {
                                                                formatExecutionTime(
                                                                    skill
                                                                        ?.executionTime
                                                                )
                                                            }
                                                        </span>
                                                    )}
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
                                )}
                            </div>
                        ) : (
                            <div className="empty-result-message">
                                Skill performance will
                                appear after the assessment
                                result has been generated.
                            </div>
                        )}
                    </div>
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
                        {jobReadiness
                            ?.score !==
                        undefined ? (
                            <>
                                <div className="readiness-score">
                                    <strong>
                                        {
                                            readinessScore
                                        }
                                        %
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
                                                {
                                                    resumeCoverage
                                                }
                                                %
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
                                                Coding Assessment
                                            </span>
                                            <strong>
                                                {
                                                    assessmentScore
                                                }
                                                %
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
                        ) : (
                            <div className="empty-result-message">
                                Overall readiness data
                                is not available yet.
                            </div>
                        )}
                    </div>
                </section>
                {aiRecommendations.length ===
                    0 &&
                    Array.isArray(
                        weakSkillAnalysis
                            ?.recommendations
                    ) &&
                    weakSkillAnalysis
                        .recommendations
                        .length > 0 && (
                    <section className="result-section-card">
                        <div className="result-section-header compact">
                            <div className="section-icon">
                                ★
                            </div>
                            <div>
                                <h2>
                                    Recommendations
                                </h2>
                                <p>
                                    Suggested focus
                                    areas based on your
                                    skill performance.
                                </p>
                            </div>
                        </div>
                        <div className="recommendation-list">
                            {weakSkillAnalysis
                                .recommendations
                                .map(
                                    (
                                        recommendation,
                                        index
                                    ) => (
                                        <div
                                            className="recommendation-item"
                                            key={
                                                index
                                            }
                                        >
                                            <div className="recommendation-number">
                                                {
                                                    index +
                                                    1
                                                }
                                            </div>
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
                                )}
                        </div>
                    </section>
                )}
                {questionResults.length >
                    0 && (
                    <section className="result-section-card">
                        <div className="result-section-header compact">
                            <div className="section-icon">
                                {"{ }"}
                            </div>
                            <div>
                                <h2>
                                    Question Breakdown
                                </h2>
                                <p>
                                    Detailed result for
                                    every coding problem.
                                </p>
                            </div>
                        </div>
                        <div className="question-result-list">
                            {questionResults.map(
                                (
                                    question,
                                    index
                                ) => {
                                    const status =
                                        getQuestionStatus(
                                            question
                                        );
                                    return (
                                        <details
                                            className="question-result-item"
                                            key={
                                                question
                                                    ?.questionId ||
                                                index
                                            }
                                        >
                                            <summary>
                                                <div className="question-result-title">
                                                    <span className="question-result-number">
                                                        {
                                                            index +
                                                            1
                                                        }
                                                    </span>
                                                    <div>
                                                        <strong>
                                                            {
                                                                question
                                                                    ?.title ||
                                                                `Coding Question ${index + 1}`
                                                            }
                                                        </strong>
                                                        <span>
                                                            {
                                                                question
                                                                    ?.skill ||
                                                                "Unknown Skill"
                                                            }
                                                            {" · "}
                                                            {
                                                                question
                                                                    ?.language ||
                                                                "python"
                                                            }
                                                            {" · "}
                                                            {
                                                                question
                                                                    ?.difficulty ||
                                                                ""
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="question-result-summary">
                                                    <span
                                                        className={`question-status ${status.className}`}
                                                    >
                                                        {
                                                            status
                                                                .label
                                                        }
                                                    </span>
                                                    <strong>
                                                        {
                                                            Number(
                                                                question
                                                                    ?.pointsEarned ||
                                                                0
                                                            )
                                                        }
                                                        /
                                                        {
                                                            Number(
                                                                question
                                                                    ?.maxPoints ||
                                                                0
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
                                                            {
                                                                Number(
                                                                    question
                                                                        ?.testCasesPassed ||
                                                                    0
                                                                )
                                                            }

                                                            /
                                                            {
                                                                Number(
                                                                    question
                                                                        ?.totalTestCases ||
                                                                    0
                                                                )
                                                            }
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
                                                            {
                                                                Number(
                                                                    question
                                                                        ?.testCasesFailed ||
                                                                    0
                                                                )
                                                            }
                                                        </strong>
                                                    </div>
                                                </div>
                                                {question
                                                    ?.error && (
                                                    <div className="question-error-message">
                                                        <strong>
                                                            Error
                                                        </strong>
                                                        <pre>
                                                            {
                                                                question
                                                                    .error
                                                            }
                                                        </pre>
                                                    </div>
                                                )}
                                                {question
                                                    ?.timedOut && (
                                                    <div className="question-error-message">
                                                        <strong>
                                                            Timeout
                                                        </strong>
                                                        <pre>
                                                            Code execution exceeded the allowed time limit.
                                                        </pre>
                                                    </div>
                                                )}
                                                {Array.isArray(
                                                    question
                                                        ?.testCaseResults
                                                ) &&
                                                    question
                                                        .testCaseResults
                                                        .length >
                                                        0 && (
                                                    <div className="test-case-result-list">
                                                        {question
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
                                                                        {testCase
                                                                            ?.isHidden ? (
                                                                            <p className="hidden-test-message">
                                                                                Hidden test case.
                                                                                Input and expected
                                                                                output are protected.
                                                                            </p>
                                                                        ) : (
                                                                            <div className="test-case-values">
                                                                                <div>
                                                                                    <span>
                                                                                        Expected
                                                                                    </span>
                                                                                    <pre>
                                                                                        {
                                                                                            testCase
                                                                                                ?.expected ||
                                                                                            "-"
                                                                                        }
                                                                                    </pre>
                                                                                </div>
                                                                                <div>
                                                                                    <span>
                                                                                        Actual
                                                                                    </span>
                                                                                    <pre>
                                                                                        {
                                                                                            testCase
                                                                                                ?.actual ||
                                                                                            "-"
                                                                                        }
                                                                                    </pre>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {testCase
                                                                            ?.error && (
                                                                            <div className="test-case-error">
                                                                                {
                                                                                    testCase
                                                                                        .error
                                                                                }
                                                                            </div>
                                                                        )}
                                                                        {testCase
                                                                            ?.timedOut && (
                                                                            <div className="test-case-error">
                                                                                Test case timed out.
                                                                            </div>
                                                                        )}
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
                                                            )}
                                                    </div>
                                                )}
                                            </div>
                                        </details>
                                    );
                                }
                            )}
                        </div>
                    </section>
                )}
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
export default CodingResult;