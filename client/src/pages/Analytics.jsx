import {
    useEffect,
    useMemo,
    useState
} from "react";
import {
    useNavigate
} from "react-router-dom";
import assessmentService
    from "../services/assessmentService";
import learningService
    from "../services/learningService";
import "./Analytics.css";
const numberValue = (
    value,
    fallback = 0
) => {
    const parsed =
        Number(value);
    return Number.isFinite(parsed)
        ? parsed
        : fallback;
};
const percentageValue = (
    value
) => {
    return Math.max(
        0,
        Math.min(
            100,
            numberValue(value)
        )
    );
};
const safeArray = (
    value
) => {
    return Array.isArray(value)
        ? value
        : [];
};
const titleCase = (
    value
) => {
    return String(
        value || ""
    )
        .replace(
            /([a-z])([A-Z])/g,
            "$1 $2"
        )
        .replace(
            /[_-]+/g,
            " "
        )
        .replace(
            /\b\w/g,
            (letter) =>
                letter.toUpperCase()
        );
};
const normalizeCollection = (
    value
) => {
    if (
        Array.isArray(value)
    ) {
        return value;
    }
    if (
        value &&
        typeof value ===
            "object"
    ) {
        return Object.entries(
            value
        ).map(
            ([key, item]) => {
                if (
                    item &&
                    typeof item ===
                        "object" &&
                    !Array.isArray(item)
                ) {
                    return {
                        key,
                        ...item
                    };
                }
                return {
                    key,
                    value:
                        item
                };
            }
        );
    }
    return [];
};
const getEntityName = (
    value
) => {
    if (
        typeof value ===
        "string"
    ) {
        return value;
    }
    return (
        value?.name ||
        value?.title ||
        ""
    );
};

const getItemName = (
    item,
    fallback = "Unknown"
) => {
    if (
        typeof item ===
        "string"
    ) {
        return item;
    }
    if (
        typeof item?.skill ===
        "string"
    ) {
        return item.skill;
    }
    return (
        item?.skill?.name ||
        item?.skillName ||
        item?.name ||
        item?.difficulty ||
        item?.type ||
        item?.key ||
        fallback
    );
};
const getItemPercentage = (
    item
) => {
    return percentageValue(
        item?.percentage ??
        item?.averagePercentage ??
        item?.currentScore ??
        item?.score ??
        item?.value ??
        0
    );
};
const recommendationText = (
    recommendation
) => {
    if (
        typeof recommendation ===
        "string"
    ) {
        return recommendation;
    }
    if (
        !recommendation
    ) {
        return "";
    }
    const topics =
        safeArray(
            recommendation
                ?.recommendedTopics
        );
    if (
        recommendation?.message
    ) {
        return recommendation.message;
    }
    if (
        recommendation
            ?.recommendation
    ) {

        return recommendation
            .recommendation;
    }
    if (
        recommendation?.title
    ) {
        return recommendation.title;
    }
    const skillName =
        getItemName(
            recommendation,
            ""
        );
    if (
        skillName &&
        topics.length
    ) {
        return (
            `Improve ${skillName}: ` +
            topics
                .slice(0, 3)
                .join(", ")
        );
    }
    if (
        skillName
    ) {
        return (
            `Focus on ${skillName}.`
        );
    }
    return "";
};
const getLearningSkillName = (
    recommendation
) => {
    return (
        recommendation
            ?.skill
            ?.name ||
        recommendation
            ?.skillName ||
        recommendation
            ?.name ||
        (
            typeof recommendation
                ?.skill ===
                "string"
                ? recommendation.skill
                : ""
        ) ||
        "Skill"
    );
};
const getLearningResourceIcon = (
    type
) => {
    switch (
        String(
            type || ""
        ).toLowerCase()
    ) {
        case "youtube":
            return "▶";
        case "documentation":
            return "📚";
        case "course":
            return "🎓";
        case "practice":
            return "💻";
        case "project":
            return "🛠";
        case "interview":
            return "🎯";
        case "article":
            return "📄";
        default:
            return "🔗";
    }
};
const MetricCard = ({
    label,
    value,
    suffix = "",
    description,
    icon,
    tone = ""
}) => {
    return (
        <div
            className={
                `analytics-metric-card ${tone}`
            }
        >
            <div className="analytics-metric-top">
                <span className="analytics-metric-label">
                    {label}
                </span>
                <span className="analytics-metric-icon">
                    {icon}
                </span>
            </div>
            <div className="analytics-metric-value">
                {value}
                {suffix}
            </div>
            <div className="analytics-metric-description">
                {description}
            </div>
        </div>
    );
};
const AnalyticsBar = ({
    value
}) => {
    const safeValue =
        percentageValue(value);
    return (
        <div className="analytics-bar">
            <div
                className="analytics-bar-fill"
                style={{
                    width:
                        `${safeValue}%`
                }}
            />
        </div>
    );
};
const PerformanceChart = ({
    points
}) => {
    const values =
        safeArray(points);
    if (
        values.length ===
        0
    ) {
        return (
            <div className="analytics-empty-chart">
                Complete assessments to
                generate your performance
                trend.
            </div>
        );
    }
    const width =
        760;
    const height =
        230;
    const paddingX =
        36;
    const paddingY =
        25;
    const chartWidth =
        width -
        paddingX * 2;
    const chartHeight =
        height -
        paddingY * 2;
    const coordinatePoints =
        values.map(
            (
                point,
                index
            ) => {
                const x =
                    values.length ===
                    1
                        ? width / 2
                        : paddingX +
                        (
                            index /
                            (
                                values.length -
                                1
                            )
                        ) *
                        chartWidth;
                const y =
                    paddingY +
                    (
                        1 -
                        (
                            percentageValue(
                                point.value
                            ) /
                            100
                        )
                    ) *
                    chartHeight;
                return {
                    ...point,
                    x,
                    y
                };
            }
        );
    const polyline =
        coordinatePoints
            .map(
                (point) =>
                    `${point.x},${point.y}`
            )
            .join(" ");
    return (
        <div className="analytics-chart-wrapper">
            <svg
                className="analytics-line-chart"
                viewBox={
                    `0 0 ${width} ${height}`
                }
                role="img"
                aria-label="Assessment performance trend"
            >
                {
                    [
                        0,
                        25,
                        50,
                        75,
                        100
                    ].map(
                        (level) => {
                            const y =
                                paddingY +
                                (
                                    1 -
                                    level / 100
                                ) *
                                chartHeight;

                            return (
                                <g
                                    key={
                                        level
                                    }
                                >
                                    <line
                                        className="analytics-grid-line"
                                        x1={
                                            paddingX
                                        }
                                        x2={
                                            width -
                                            paddingX
                                        }
                                        y1={
                                            y
                                        }
                                        y2={
                                            y
                                        }
                                    />
                                    <text
                                        className="analytics-grid-label"
                                        x="3"
                                        y={
                                            y + 4
                                        }
                                    >
                                        {level}%
                                    </text>
                                </g>
                            );
                        }
                    )
                }
                {
                    coordinatePoints.length >
                    1 && (
                        <polyline
                            className="analytics-trend-line"
                            points={
                                polyline
                            }
                            fill="none"
                        />
                    )
                }
                {
                    coordinatePoints.map(
                        (
                            point,
                            index
                        ) => (

                            <g
                                key={
                                    index
                                }
                            >
                                <circle
                                    className="analytics-trend-point"
                                    cx={
                                        point.x
                                    }
                                    cy={
                                        point.y
                                    }
                                    r="5"
                                />
                                <text
                                    className="analytics-point-value"
                                    x={
                                        point.x
                                    }
                                    y={
                                        point.y -
                                        12
                                    }
                                    textAnchor="middle"
                                >
                                    {
                                        Math.round(
                                            point.value
                                        )
                                    }%
                                </text>
                            </g>
                        )
                    )
                }
            </svg>
            <div className="analytics-chart-labels">
                {
                    coordinatePoints.map(
                        (
                            point,
                            index
                        ) => (
                            <span
                                key={
                                    index
                                }
                            >
                                {
                                    point.label ||
                                    `Attempt ${index + 1}`
                                }
                            </span>
                        )
                    )
                }
            </div>
        </div>
    );
};
const Analytics = () => {
    const navigate =
        useNavigate();
    const resumeId =
        localStorage.getItem(
            "resumeId"
        ) || "";
    const [
        analyticsResponse,
        setAnalyticsResponse
    ] = useState(null);
    const [
        readinessResponse,
        setReadinessResponse
    ] = useState(null);
    const [
        learningPlan,
        setLearningPlan
    ] = useState(null);
    const [
        loading,
        setLoading
    ] = useState(true);
    const [
        error,
        setError
    ] = useState("");
    useEffect(
        () => {
            let active =
                true;
            const loadAnalytics =
                async () => {
                    if (
                        !resumeId
                    ) {
                        if (
                            active
                        ) {
                            setLoading(
                                false
                            );
                        }
                        return;
                    }
                    try {
                        setLoading(
                            true
                        );
                        setError(
                            ""
                        );
                        const [
                            analyticsResult,
                            readinessResult,
                            learningResult
                        ] =
                            await Promise.allSettled([
                                assessmentService
                                    .getAssessmentAnalytics(
                                        resumeId
                                    ),
                                assessmentService
                                    .getFinalReadiness(
                                        resumeId
                                    ),
                                learningService
                                    .getLearningPlan(
                                        resumeId,
                                        {
                                            maxSkills:
                                                6,
                                            resourcesPerSkill:
                                                8
                                        }
                                    )
                            ]);
                        if (
                            !active
                        ) {

                            return;
                        }
                        if (
                            analyticsResult.status ===
                            "fulfilled"
                        ) {
                            setAnalyticsResponse(
                                analyticsResult.value
                            );
                        } else {
                            console.error(
                                "Analytics request failed:",
                                analyticsResult.reason
                            );
                            setAnalyticsResponse(
                                null
                            );
                        }
                        if (
                            readinessResult.status ===
                            "fulfilled"
                        ) {
                            setReadinessResponse(
                                readinessResult.value
                            );
                        } else {
                            console.warn(
                                "Final readiness request failed:",
                                readinessResult.reason
                            );
                            setReadinessResponse(
                                null
                            );
                        }
                        if (
                            learningResult.status ===
                            "fulfilled"
                        ) {
                            const normalizedPlan =
                                learningService
                                    .normalizeLearningPlan(
                                        learningResult.value
                                    );
                            setLearningPlan(
                                normalizedPlan
                            );
                        } else {
                            console.warn(
                                "Learning plan request failed:",
                                learningResult.reason
                            );
                            setLearningPlan(
                                null
                            );
                        }
                        if (
                            analyticsResult.status ===
                                "rejected" &&
                            readinessResult.status ===
                                "rejected" &&
                            learningResult.status ===
                                "rejected"
                        ) {
                            throw (
                                analyticsResult.reason ||
                                readinessResult.reason ||
                                learningResult.reason
                            );
                        }
                    } catch (
                        requestError
                    ) {
                        console.error(
                            "Analytics Error:",
                            requestError
                        );
                        if (
                            active
                        ) {
                            setError(
                                requestError
                                    ?.response
                                    ?.data
                                    ?.message ||
                                requestError
                                    ?.message ||
                                "Failed to load analytics."
                            );
                        }
                    } finally {
                        if (
                            active
                        ) {
                            setLoading(
                                false
                            );
                        }
                    }
                };
            loadAnalytics();
            return () => {
                active =
                    false;
            };

        },
        [
            resumeId
        ]
    );
    const analytics =
        analyticsResponse
            ?.analytics ||
        analyticsResponse
            ?.data
            ?.analytics ||
        {};
    const overall =
        analytics
            ?.overall ||
        {};
    const completedAttempts =
        numberValue(
            overall
                ?.completedAttempts ??

            overall
                ?.totalAttempts ??
            0
        );
    const averageScore =
        percentageValue(
            overall
                ?.averagePercentage ??
            overall
                ?.averageScore ??
            0
        );
    const highestScore =
        percentageValue(
            overall
                ?.bestPercentage ??
            overall
                ?.highestScore ??
            0
        );
    const rawFinalReadiness =
        readinessResponse
            ?.data ??
        readinessResponse ??
        {};
    const finalReadiness =
        rawFinalReadiness
            ?.jobReadiness ||
        rawFinalReadiness
            ?.readiness ||
        rawFinalReadiness;
    const analyticsReadiness =
        analytics
            ?.jobReadiness ||
        {};
    const readinessScore =
        percentageValue(
            finalReadiness
                ?.score ??
            finalReadiness
                ?.readinessScore ??
            finalReadiness
                ?.overallScore ??
            analyticsReadiness
                ?.score ??
            0
        );
    const readinessLevel =
        finalReadiness
            ?.level ||
        finalReadiness
            ?.readinessLevel ||
        analyticsReadiness
            ?.level ||
        (
            readinessScore >
            0
                ? "Calculated"
                : "Not Enough Data"
        );
    const resumeCoverage =
        percentageValue(
            finalReadiness
                ?.resumeCoverage ??
            analyticsReadiness
                ?.resumeCoverage ??
            learningPlan
                ?.resume
                ?.coverageScore ??

            0
        );
    const assessmentReadinessScore =
        percentageValue(
            finalReadiness
                ?.assessmentScore ??
            analyticsReadiness
                ?.assessmentScore ??
            averageScore
        );
    const trend =
        analytics
            ?.trends
            ?.performance ||
        {};
    const improvement =
        numberValue(
            trend
                ?.improvement ??
            analytics
                ?.trends
                ?.momentum
                ?.improvement ??
            0
        );
    const trendDirection =
        trend
            ?.direction ||
        analytics
            ?.trends
            ?.momentum
            ?.direction ||
        "stable";
    const chartPoints =
        useMemo(
            () => {
                const candidates = [
                    analytics
                        ?.trends
                        ?.performance
                        ?.history,
                    analytics
                        ?.attemptTrend,
                    analytics
                        ?.trends
                        ?.movingAverage
                ];
                let history =
                    [];
                for (
                    const candidate
                    of candidates
                ) {
                    if (
                        Array.isArray(
                            candidate
                        ) &&
                        candidate.length >
                            0
                    ) {
                        history =
                            candidate;
                        break;
                    }
                }
                return history
                    .slice(-10)
                    .map(
                        (
                            item,
                            index
                        ) => {
                            const value =
                                percentageValue(
                                    item
                                        ?.percentage ??
                                    item
                                        ?.score ??
                                    item
                                        ?.average ??
                                    item
                                        ?.averagePercentage ??
                                    item
                                        ?.value ??
                                    0
                                );
                            let label =
                                item
                                    ?.label ||
                                item
                                    ?.type ||
                                item
                                    ?.assessmentType ||

                                `#${index + 1}`;
                            const dateValue =
                                item
                                    ?.submittedAt ||

                                item
                                    ?.date ||

                                item
                                    ?.createdAt;
                            if (
                                dateValue
                            ) {

                                const date =
                                    new Date(
                                        dateValue
                                    );
                                if (
                                    !Number.isNaN(
                                        date.getTime()
                                    )
                                ) {
                                    label =
                                        date
                                            .toLocaleDateString(
                                                undefined,
                                                {
                                                    month:
                                                        "short",

                                                    day:
                                                        "numeric"
                                                }
                                            );
                                }
                            }
                            return {
                                label,
                                value
                            };
                        }
                    );
            },
            [
                analytics
            ]
        );
    const skillPerformance =
        normalizeCollection(
            analytics
                ?.skills
                ?.performance
        )
            .sort(
                (
                    a,
                    b
                ) =>
                    getItemPercentage(b) -
                    getItemPercentage(a)
            );
    const skillAnalysis =
        analytics
            ?.skills
            ?.analysis ||
        {};
    const strongSkills =
        safeArray(
            skillAnalysis
                ?.strongSkills
        );
    const moderateSkills =
        safeArray(
            skillAnalysis
                ?.moderateSkills
        );
    const weakSkills =
        safeArray(
            skillAnalysis
                ?.weakSkills
        );
    const assessmentTypes =
        analytics
            ?.assessmentTypes
            ?.performance ||
        {};
    const typeCards = [
        {
            key:
                "mcq",
            title:
                "MCQ",
            icon:
                "🧠",
            data:
                assessmentTypes
                    ?.mcq ||
                {}
        },
        {
            key:
                "coding",
            title:
                "Coding",
            icon:
                "💻",
            data:
                assessmentTypes
                    ?.coding ||
                {}
        },
        {
            key:
                "sql",
            title:
                "SQL",
            icon:
                "🗄️",
            data:
                assessmentTypes
                    ?.sql ||
                {}
        }
    ];
    const difficultyPerformance =
        normalizeCollection(
            analytics
                ?.difficulty
                ?.performance
        );
    const learningRecommendations =
        safeArray(
            analytics
                ?.learning
                ?.recommendations
        );
    const topPriorities =
        safeArray(
            analytics
                ?.learning
                ?.topPriorities
        );
    const aiInsights =
        analytics
            ?.aiPerformanceInsights;
    const aiSummary =
        typeof aiInsights ===
        "string"
            ? aiInsights
            : (
                aiInsights
                    ?.summary ||

                aiInsights
                    ?.overview ||

                aiInsights
                    ?.message ||

                ""
            );
    const aiRecommendations =
        safeArray(
            aiInsights
                ?.recommendations
        );
    const mostDifficult =
        safeArray(
            analytics
                ?.questions
                ?.mostDifficult
        );
    const frequentlyMissed =
        safeArray(
            analytics
                ?.questions
                ?.frequentlyMissed
        );
    const coding =
        analytics
            ?.coding;
    const roadmapSkills =
        safeArray(
            learningPlan
                ?.recommendedSkills
        );
    const roadmapReadySkills =
        safeArray(
            learningPlan
                ?.readySkills
        );
    const roadmapTopPriority =
        learningPlan
            ?.topPriority ||
        roadmapSkills[0] ||
        null;
    const roadmapReadiness =
        learningPlan
            ?.jobReadiness ||
        {};
    const roadmapResume =
        learningPlan
            ?.resume ||
        {};
    const roadmapTarget =
        learningPlan
            ?.target ||
        {};
    const roadmapRole =
        getEntityName(
            roadmapTarget
                ?.role
        ) ||
        getEntityName(
            roadmapResume
                ?.role
        ) ||
        "Personalized Career Roadmap";
    const roadmapCompany =
        getEntityName(
            roadmapTarget
                ?.company
        ) ||
        getEntityName(
            roadmapResume
                ?.company
        ) ||
        "";
    const totalLearningResources =
        roadmapSkills.reduce(
            (
                total,
                skill
            ) => {
                return (
                    total +
                    safeArray(
                        skill
                            ?.resources
                    ).length
                );
            },
            0
        );
    const totalLearningTopics =
        roadmapSkills.reduce(
            (
                total,
                skill
            ) => {
                return (
                    total +
                    safeArray(
                        skill
                            ?.topics
                    ).length
                );
            },
            0
        );
    const handleRoadmapAssessment =
        (
            recommendation
        ) => {
            const assessmentType =
                recommendation
                    ?.recommendedAssessment;
            if (
                assessmentType
            ) {
                localStorage.setItem(
                    "selectedAssessmentType",
                    assessmentType
                );
                localStorage.removeItem(
                    "assessmentId"
                );
                localStorage.removeItem(
                    "assessmentQuestions"
                );
                localStorage.removeItem(
                    "assessmentResult"
                );
            }
            navigate(
                "/assessments"
            );
        };
    if (
        loading
    ) {
        return (
            <div className="analytics-state-page">
                <div className="analytics-state-card">
                    <div className="analytics-spinner" />
                    <h2>
                        Building Your Analytics
                    </h2>
                    <p>
                        Calculating assessment
                        performance, skill trends,
                        job readiness and your
                        personalized learning roadmap...

                    </p>
                </div>
            </div>
        );
    }
    if (
        !resumeId
    ) {
        return (
            <div className="analytics-state-page">
                <div className="analytics-state-card">
                    <div className="analytics-state-icon">
                        📄
                    </div>
                    <h2>
                        Resume Required
                    </h2>
                    <p>
                        Upload and analyze your
                        resume before viewing
                        assessment analytics.
                    </p>
                    <button
                        type="button"
                        className="analytics-primary-btn"
                        onClick={() =>
                            navigate(
                                "/resume"
                            )
                        }
                    >
                        Analyze Resume
                    </button>
                </div>
            </div>
        );
    }
    if (
        error &&
        !analyticsResponse &&
        !learningPlan
    ) {
        return (
            <div className="analytics-state-page">
                <div className="analytics-state-card">
                    <div className="analytics-state-icon error">
                        !
                    </div>
                    <h2>
                        Analytics Unavailable
                    </h2>
                    <p>
                        {error}
                    </p>
                    <button
                        type="button"
                        className="analytics-primary-btn"
                        onClick={() =>
                            navigate(
                                "/assessments"
                            )
                        }
                    >
                        Go to Assessments
                    </button>
                </div>
            </div>
        );
    }
    return (
        <div className="analytics-page">
            <div className="analytics-container">
                <section className="analytics-header">
                    <div>
                        <span className="analytics-kicker">
                            PERFORMANCE INTELLIGENCE
                        </span>
                        <h1>
                            Assessment{" "}
                            <span>
                                Analytics
                            </span>
                        </h1>
                        <p>
                            Track technical performance,
                            identify weak areas, measure
                            progress and follow a personalized
                            learning path toward your target job.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="analytics-header-btn"
                        onClick={() =>
                            navigate(
                                "/assessments"
                            )
                        }
                    >
                        Take Assessment →
                    </button>
                </section>
                <section className="analytics-metrics-grid">
                    <MetricCard
                        label="Average Score"
                        value={
                            Math.round(
                                averageScore
                            )
                        }
                        suffix="%"
                        description="Average across completed assessments"
                        icon="📊"
                    />
                    <MetricCard
                        label="Completed Attempts"
                        value={
                            completedAttempts
                        }
                        description="Evaluated assessment attempts"
                        icon="📝"
                        tone="blue"
                    />
                    <MetricCard
                        label="Job Readiness"
                        value={
                            Math.round(
                                readinessScore
                            )
                        }
                        suffix="%"
                        description={
                            readinessLevel
                        }
                        icon="🎯"
                        tone="green"
                    />
                    <MetricCard
                        label="Highest Score"
                        value={
                            Math.round(
                                highestScore
                            )
                        }
                        suffix="%"
                        description="Best assessment performance"
                        icon="🏆"
                        tone="purple"
                    />
                    <MetricCard
                        label="Performance Trend"
                        value={
                            improvement >
                            0
                                ? `+${Math.round(
                                    improvement
                                )}`

                                : Math.round(
                                    improvement
                                )
                        }
                        suffix="%"
                        description={
                            titleCase(
                                trendDirection
                            )
                        }
                        icon={
                            improvement >
                            0
                                ? "↗"
                                : improvement <
                                0
                                ? "↘"
                                : "→"
                        }
                        tone={
                            improvement >
                            0
                                ? "green"
                                : improvement <
                                0
                                ? "red"
                                : ""
                        }
                    />
                </section>
                <section className="analytics-readiness-card">
                    <div className="analytics-readiness-score">
                        <div className="analytics-readiness-ring">
                            <div>
                                <strong>
                                    {
                                        Math.round(
                                            readinessScore
                                        )
                                    }%
                                </strong>
                                <span>
                                    Job Ready
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="analytics-readiness-content">
                        <span className="analytics-section-label">
                            OVERALL JOB READINESS
                        </span>
                        <h2>
                            {readinessLevel}
                        </h2>
                        <p>
                            Your readiness combines
                            resume coverage and assessment
                            performance to show your current
                            preparation for the target role.
                        </p>
                        <div className="analytics-readiness-breakdown">
                            <div>
                                <div className="analytics-breakdown-header">
                                    <span>
                                        Resume Coverage
                                    </span>
                                    <strong>
                                        {
                                            Math.round(
                                                resumeCoverage
                                            )
                                        }%
                                    </strong>
                                </div>
                                <AnalyticsBar
                                    value={
                                        resumeCoverage
                                    }
                                />
                            </div>
                            <div>
                                <div className="analytics-breakdown-header">
                                    <span>
                                        Assessment Performance
                                    </span>
                                    <strong>
                                        {
                                            Math.round(
                                                assessmentReadinessScore
                                            )
                                        }%
                                    </strong>
                                </div>
                                <AnalyticsBar
                                    value={
                                        assessmentReadinessScore
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </section>
                <section className="analytics-card analytics-trend-card">
                    <div className="analytics-card-header">
                        <div>
                            <span className="analytics-section-label">
                                PERFORMANCE HISTORY
                            </span>
                            <h2>
                                Score Trend
                            </h2>
                        </div>
                        <div className="analytics-trend-badge">
                            {
                                titleCase(
                                    trend
                                        ?.trend ||
                                    trendDirection
                                )
                            }
                        </div>
                    </div>
                    <PerformanceChart
                        points={
                            chartPoints
                        }
                    />
                </section>
                <section className="analytics-card">
                    <div className="analytics-card-header">
                        <div>
                            <span className="analytics-section-label">
                                ASSESSMENT TYPES
                            </span>
                            <h2>
                                MCQ vs Coding vs SQL
                            </h2>
                        </div>
                    </div>
                    <div className="analytics-type-grid">
                        {
                            typeCards.map(
                                (item) => {
                                    const attempts =
                                        numberValue(
                                            item
                                                .data
                                                ?.attempts
                                        );
                                    const score =
                                        percentageValue(
                                            item
                                                .data
                                                ?.averagePercentage ??
                                            item
                                                .data
                                                ?.averageScore ??
                                            0
                                        );
                                    return (
                                        <div
                                            className="analytics-type-card"
                                            key={
                                                item.key
                                            }
                                        >
                                            <div className="analytics-type-top">
                                                <span>
                                                    {item.icon}
                                                </span>
                                                <strong>
                                                    {item.title}
                                                </strong>
                                            </div>
                                            <div className="analytics-type-score">
                                                {
                                                    Math.round(
                                                        score
                                                    )
                                                }%
                                            </div>
                                            <AnalyticsBar
                                                value={
                                                    score
                                                }
                                            />
                                            <div className="analytics-type-footer">
                                                {attempts}{" "}
                                                attempt{
                                                    attempts ===
                                                    1
                                                        ? ""
                                                        : "s"
                                                }
                                            </div>
                                        </div>
                                    );
                                }
                            )
                        }
                    </div>
                </section>
                <section className="analytics-two-column">
                    <div className="analytics-card">
                        <div className="analytics-card-header">
                            <div>
                                <span className="analytics-section-label">
                                    SKILL PERFORMANCE
                                </span>
                                <h2>
                                    Technical Skills
                                </h2>
                            </div>
                        </div>
                        {
                            skillPerformance.length >
                            0 ? (
                                <div className="analytics-skill-list">
                                    {
                                        skillPerformance.map(
                                            (
                                                skill,
                                                index
                                            ) => {
                                                const score =
                                                    getItemPercentage(
                                                        skill
                                                    );
                                                return (
                                                    <div
                                                        className="analytics-skill-row"
                                                        key={
                                                            skill?._id ||
                                                            `${getItemName(
                                                                skill
                                                            )}-${index}`
                                                        }
                                                    >
                                                        <div className="analytics-skill-header">
                                                            <span>
                                                                {
                                                                    titleCase(
                                                                        getItemName(
                                                                            skill
                                                                        )
                                                                    )
                                                                }
                                                            </span>
                                                            <strong>
                                                                {
                                                                    Math.round(
                                                                        score
                                                                    )
                                                                }%
                                                            </strong>
                                                        </div>
                                                        <AnalyticsBar
                                                            value={
                                                                score
                                                            }
                                                        />
                                                    </div>
                                                );
                                            }
                                        )
                                    }
                                </div>
                            ) : (
                                <div className="analytics-empty">
                                    Skill analytics will
                                    appear after evaluated
                                    assessments.
                                </div>
                            )
                        }
                    </div>
                    <div className="analytics-card">
                        <div className="analytics-card-header">
                            <div>
                                <span className="analytics-section-label">
                                    DIFFICULTY
                                </span>
                                <h2>
                                    Difficulty Performance
                                </h2>
                            </div>
                        </div>
                        {
                            difficultyPerformance.length >
                            0 ? (
                                <div className="analytics-difficulty-list">
                                    {
                                        difficultyPerformance.map(
                                            (
                                                difficulty,
                                                index
                                            ) => {
                                                const score =
                                                    getItemPercentage(
                                                        difficulty
                                                    );
                                                return (
                                                    <div
                                                        className="analytics-difficulty-item"
                                                        key={
                                                            difficulty
                                                                ?.difficulty ||
                                                            difficulty
                                                                ?.key ||
                                                            index
                                                        }
                                                    >
                                                        <div>
                                                            <strong>
                                                                {
                                                                    titleCase(
                                                                        getItemName(
                                                                            difficulty,
                                                                            `Level ${index + 1}`
                                                                        )
                                                                    )
                                                                }
                                                            </strong>
                                                            <span>
                                                                {
                                                                    numberValue(
                                                                        difficulty
                                                                            ?.attempts ??
                                                                        difficulty
                                                                            ?.totalAttempts
                                                                    )
                                                                }{" "}
                                                                attempts
                                                            </span>
                                                        </div>
                                                        <div className="analytics-difficulty-score">
                                                            {
                                                                Math.round(
                                                                    score
                                                                )
                                                            }%
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )
                                    }
                                </div>
                            ) : (
                                <div className="analytics-empty">
                                    Difficulty analytics
                                    are not available yet.
                                </div>
                            )
                        }
                        {
                            analytics
                                ?.difficulty
                                ?.nextDifficulty
                                ?.recommendedDifficulty && (
                                <div className="analytics-next-level">
                                    <span>
                                        Recommended Next Level
                                    </span>
                                    <strong>
                                        {
                                            titleCase(
                                                analytics
                                                    .difficulty
                                                    .nextDifficulty
                                                    .recommendedDifficulty
                                            )
                                        }
                                    </strong>
                                    <p>
                                        {
                                            analytics
                                                ?.difficulty
                                                ?.nextDifficulty
                                                ?.reason ||
                                            ""
                                        }
                                    </p>
                                </div>
                            )
                        }
                    </div>
                </section>
                <section className="analytics-three-column">
                    <div className="analytics-insight-card strong">
                        <span className="analytics-insight-icon">
                            ✓
                        </span>
                        <h3>
                            Strong Skills
                        </h3>
                        <div className="analytics-chip-list">
                            {
                                strongSkills.length >
                                0 ? (
                                    strongSkills.map(
                                        (
                                            skill,
                                            index
                                        ) => (
                                            <span
                                                key={
                                                    index
                                                }
                                            >
                                                {
                                                    titleCase(
                                                        getItemName(
                                                            skill
                                                        )
                                                    )
                                                }
                                            </span>
                                        )
                                    )
                                ) : (
                                    <p>
                                        Keep completing
                                        assessments to identify
                                        strong areas.
                                    </p>
                                )
                            }
                        </div>
                    </div>
                    <div className="analytics-insight-card moderate">
                        <span className="analytics-insight-icon">
                            →
                        </span>
                        <h3>
                            Developing Skills
                        </h3>
                        <div className="analytics-chip-list">
                            {
                                moderateSkills.length >
                                0 ? (
                                    moderateSkills.map(
                                        (
                                            skill,
                                            index
                                        ) => (
                                            <span
                                                key={
                                                    index
                                                }
                                            >
                                                {
                                                    titleCase(
                                                        getItemName(
                                                            skill
                                                        )
                                                    )
                                                }
                                            </span>
                                        )
                                    )
                                ) : (
                                    <p>
                                        No moderate skill
                                        areas detected.
                                    </p>
                                )
                            }
                        </div>
                    </div>
                    <div className="analytics-insight-card weak">
                        <span className="analytics-insight-icon">
                            !
                        </span>
                        <h3>
                            Priority Skills
                        </h3>
                        <div className="analytics-chip-list">
                            {
                                weakSkills.length >
                                0 ? (
                                    weakSkills.map(
                                        (
                                            skill,
                                            index
                                        ) => (
                                            <span
                                                key={
                                                    index
                                                }
                                            >
                                                {
                                                    titleCase(
                                                        getItemName(
                                                            skill
                                                        )
                                                    )
                                                }
                                            </span>
                                        )
                                    )
                                ) : (
                                    <p>
                                        No weak skill
                                        areas detected.
                                    </p>
                                )
                            }
                        </div>
                    </div>
                </section>
                {
                    coding && (
                        <section className="analytics-card">
                            <div className="analytics-card-header">
                                <div>
                                    <span className="analytics-section-label">
                                        CODING PERFORMANCE
                                    </span>
                                    <h2>
                                        Coding Test Analysis
                                    </h2>
                                </div>
                            </div>
                            <div className="analytics-coding-grid">
                                <MetricCard
                                    label="Test Cases Passed"
                                    value={
                                        numberValue(
                                            coding
                                                ?.testCasesPassed
                                        )
                                    }
                                    description="Successfully passed"
                                    icon="✓"
                                    tone="green"
                                />
                                <MetricCard
                                    label="Total Test Cases"
                                    value={
                                        numberValue(
                                            coding
                                                ?.totalTestCases
                                        )
                                    }
                                    description="Executed test cases"
                                    icon="⚙"
                                />
                                <MetricCard
                                    label="Pass Rate"
                                    value={
                                        Math.round(
                                            percentageValue(
                                                coding
                                                    ?.testCasePercentage ??
                                                coding
                                                    ?.passPercentage ??
                                                0
                                            )
                                        )
                                    }
                                    suffix="%"
                                    description="Overall test success"
                                    icon="%"
                                    tone="blue"
                                />
                                <MetricCard
                                    label="Questions Solved"
                                    value={
                                        numberValue(
                                            coding
                                                ?.questionsSolved
                                        )
                                    }
                                    description="Fully solved problems"
                                    icon="💻"
                                />
                            </div>
                        </section>
                    )
                }
                {
                    (
                        mostDifficult.length >
                        0 ||
                        frequentlyMissed.length >
                        0
                    ) && (
                        <section className="analytics-two-column">
                            <div className="analytics-card">
                                <div className="analytics-card-header">
                                    <h2>
                                        Most Difficult Questions
                                    </h2>
                                </div>
                                <div className="analytics-simple-list">
                                    {
                                        mostDifficult
                                            .slice(
                                                0,
                                                5
                                            )
                                            .map(
                                                (
                                                    question,
                                                    index
                                                ) => (
                                                    <div
                                                        key={
                                                            index
                                                        }
                                                    >
                                                        <span>
                                                            {index + 1}
                                                        </span>
                                                        <div>
                                                            <strong>
                                                                {
                                                                    question
                                                                        ?.title ||
                                                                    question
                                                                        ?.question ||
                                                                    `Question ${index + 1}`
                                                                }
                                                            </strong>
                                                            <p>
                                                                Accuracy:{" "}
                                                                {
                                                                    Math.round(
                                                                        percentageValue(
                                                                            question
                                                                                ?.accuracy ??
                                                                            question
                                                                                ?.percentage
                                                                        )
                                                                    )
                                                                }%
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            )
                                    }
                                </div>
                            </div>
                            <div className="analytics-card">
                                <div className="analytics-card-header">
                                    <h2>
                                        Frequently Missed
                                    </h2>
                                </div>
                                <div className="analytics-simple-list">
                                    {
                                        frequentlyMissed
                                            .slice(
                                                0,
                                                5
                                            )
                                            .map(
                                                (
                                                    question,
                                                    index
                                                ) => (
                                                    <div
                                                        key={
                                                            index
                                                        }
                                                    >
                                                        <span>
                                                            !
                                                        </span>
                                                        <div>
                                                            <strong>
                                                                {
                                                                    question
                                                                        ?.title ||
                                                                    question
                                                                        ?.question ||
                                                                    `Question ${index + 1}`
                                                                }
                                                            </strong>
                                                            <p>
                                                                Missed{" "}
                                                                {
                                                                    numberValue(
                                                                        question
                                                                            ?.missCount ??
                                                                        question
                                                                            ?.incorrectAttempts
                                                                    )
                                                                }{" "}
                                                                times
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            )
                                    }
                                </div>
                            </div>
                        </section>
                    )
                }
                <section className="analytics-two-column">
                    <div className="analytics-card">
                        <div className="analytics-card-header">
                            <div>
                                <span className="analytics-section-label">
                                    ASSESSMENT LEARNING
                                </span>
                                <h2>
                                    Top Priorities
                                </h2>
                            </div>
                        </div>
                        {
                            topPriorities.length >
                            0 ? (
                                <div className="analytics-priority-list">
                                    {
                                        topPriorities
                                            .slice(
                                                0,
                                                5
                                            )
                                            .map(
                                                (
                                                    priority,
                                                    index
                                                ) => (
                                                    <div
                                                        className="analytics-priority-item"
                                                        key={
                                                            index
                                                        }
                                                    >
                                                        <span>
                                                            {index + 1}
                                                        </span>
                                                        <div>
                                                            <strong>
                                                                {
                                                                    titleCase(
                                                                        typeof priority ===
                                                                        "string"
                                                                            ? priority
                                                                            : getItemName(
                                                                                priority,
                                                                                `Priority ${index + 1}`
                                                                            )
                                                                    )
                                                                }
                                                            </strong>
                                                            {
                                                                priority
                                                                    ?.reason && (
                                                                    <p>
                                                                        {
                                                                            priority
                                                                                .reason
                                                                        }
                                                                    </p>
                                                                )
                                                            }
                                                        </div>
                                                    </div>
                                                )
                                            )
                                    }
                                </div>
                            ) : (
                                <div className="analytics-empty">
                                    Learning priorities
                                    will appear after
                                    additional assessment
                                    data is available.
                                </div>
                            )
                        }
                    </div>
                    <div className="analytics-card">
                        <div className="analytics-card-header">
                            <div>
                                <span className="analytics-section-label">
                                    RECOMMENDATIONS
                                </span>
                                <h2>
                                    What to Do Next
                                </h2>
                            </div>
                        </div>
                        {
                            learningRecommendations.length >
                            0 ? (
                                <div className="analytics-recommendation-list">
                                    {
                                        learningRecommendations
                                            .slice(
                                                0,
                                                6
                                            )
                                            .map(
                                                (
                                                    recommendation,
                                                    index
                                                ) => (
                                                    <div
                                                        key={
                                                            index
                                                        }
                                                    >
                                                        <span>
                                                            →
                                                        </span>
                                                        <p>
                                                            {
                                                                recommendationText(
                                                                    recommendation
                                                                )
                                                            }
                                                        </p>
                                                    </div>
                                                )
                                            )
                                    }
                                </div>
                            ) : (
                                <div className="analytics-empty">
                                    No learning
                                    recommendations yet.
                                </div>
                            )
                        }
                    </div>
                </section>
                <section className="analytics-learning-roadmap">
                    <div className="analytics-section-header">
                        <div>
                            <span className="analytics-section-label">
                                PERSONALIZED DEVELOPMENT
                            </span>
                            <h2>
                                Full Learning Roadmap
                            </h2>
                            <p>
                                Your roadmap combines resume
                                gaps, target-role requirements,
                                assessment results and job
                                readiness into an actionable
                                learning plan.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="analytics-learning-center-button"
                            onClick={() =>
                                navigate(
                                    "/learning"
                                )
                            }
                        >
                            Open Learning Center →
                        </button>
                    </div>
                    {
                        learningPlan ? (
                            <>
                                <div className="analytics-roadmap-overview">
                                    <div className="analytics-roadmap-main">
                                        <div className="analytics-roadmap-icon">
                                            🎓
                                        </div>
                                        <div>
                                            <span>
                                                LEARNING STRATEGY
                                            </span>
                                            <h3>
                                                {roadmapRole}
                                            </h3>
                                            <p>
                                                {
                                                    learningPlan
                                                        ?.summary ||
                                                    "Complete priority skills, practice using verified resources, build projects and retake assessments."
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    {
                                        roadmapCompany && (
                                            <div className="analytics-roadmap-target">
                                                {roadmapCompany}
                                            </div>
                                        )
                                    }
                                </div>
                                <div className="analytics-roadmap-metrics">
                                    <div>
                                        <span>
                                            Job Readiness
                                        </span>
                                        <strong>
                                            {
                                                Math.round(
                                                    percentageValue(
                                                        roadmapReadiness
                                                            ?.score ??
                                                        readinessScore
                                                    )
                                                )
                                            }%
                                        </strong>
                                    </div>
                                    <div>
                                        <span>
                                            Priority Skills
                                        </span>
                                        <strong>
                                            {
                                                roadmapSkills
                                                    .length
                                            }
                                        </strong>
                                    </div>
                                    <div>
                                        <span>
                                            Learning Topics
                                        </span>
                                        <strong>
                                            {
                                                totalLearningTopics
                                            }
                                        </strong>
                                    </div>
                                    <div>
                                        <span>
                                            Resources
                                        </span>
                                        <strong>
                                            {
                                                totalLearningResources
                                            }
                                        </strong>
                                    </div>
                                    <div>
                                        <span>
                                            Roadmap Duration
                                        </span>
                                        <strong className="analytics-duration-value">
                                            {
                                                learningPlan
                                                    ?.roadmapDuration ||
                                                "—"
                                            }
                                        </strong>
                                    </div>
                                </div>
                                {
                                    roadmapTopPriority && (
                                        <div className="analytics-top-learning-priority">
                                            <div className="analytics-top-priority-header">
                                                <div>
                                                    <span className="analytics-section-label">
                                                        HIGHEST PRIORITY
                                                    </span>
                                                    <h3>
                                                        {
                                                            getLearningSkillName(
                                                                roadmapTopPriority
                                                            )
                                                        }
                                                    </h3>
                                                    <p>
                                                        {
                                                            roadmapTopPriority
                                                                ?.reason ||
                                                            "This skill has been identified as a learning priority."
                                                        }
                                                    </p>
                                                </div>
                                                <div
                                                    className={
                                                        `analytics-priority-score ${
                                                            roadmapTopPriority
                                                                ?.priority ||
                                                            "medium"
                                                        }`
                                                    }
                                                >
                                                    <span>
                                                        {
                                                            titleCase(
                                                                roadmapTopPriority
                                                                    ?.priority ||
                                                                "Priority"
                                                            )
                                                        }
                                                    </span>
                                                    <strong>
                                                        {
                                                            numberValue(
                                                                roadmapTopPriority
                                                                    ?.priorityScore
                                                            )
                                                        }
                                                        /100
                                                    </strong>
                                                </div>
                                            </div>
                                            <div className="analytics-top-priority-stats">
                                                <div>                                                    <span>
                                                        Current
                                                    </span>
                                                    <strong>
                                                        {
                                                            roadmapTopPriority
                                                                ?.assessment
                                                                ?.hasData
                                                                ? `${Math.round(
                                                                    percentageValue(
                                                                        roadmapTopPriority
                                                                            ?.assessment
                                                                            ?.currentScore
                                                                    )
                                                                )}%`
                                                                : "Not assessed"
                                                        }
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span>
                                                        Target
                                                    </span>
                                                    <strong>
                                                        {
                                                            Math.round(
                                                                percentageValue(
                                                                    roadmapTopPriority
                                                                        ?.assessment
                                                                        ?.targetScore
                                                                )
                                                            )
                                                        }%
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span>
                                                        Score Gap
                                                    </span>
                                                    <strong>
                                                        {
                                                            Math.round(
                                                                percentageValue(
                                                                    roadmapTopPriority
                                                                        ?.assessment
                                                                        ?.scoreGap
                                                                )
                                                            )
                                                        }%
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span>
                                                        Required Level
                                                    </span>
                                                    <strong>
                                                        {
                                                            titleCase(
                                                                roadmapTopPriority
                                                                    ?.requiredLevel ||
                                                                "Intermediate"
                                                            )
                                                        }
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span>
                                                        Duration
                                                    </span>
                                                    <strong>
                                                        {
                                                            roadmapTopPriority
                                                                ?.estimatedDuration ||
                                                            "Self paced"
                                                        }
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                {
                                    roadmapSkills.length >
                                    0 ? (
                                        <div className="analytics-learning-skills">
                                            {
                                                roadmapSkills.map(
                                                    (
                                                        recommendation,
                                                        skillIndex
                                                    ) => {                                                        const resources =
                                                            safeArray(
                                                                recommendation
                                                                    ?.resources
                                                            );
                                                        const topics =
                                                            safeArray(
                                                                recommendation
                                                                    ?.topics
                                                            );
                                                        const projects =
                                                            safeArray(
                                                                recommendation
                                                                    ?.projects
                                                            );
                                                        const currentScore =
                                                            recommendation
                                                                ?.assessment
                                                                ?.hasData
                                                                ? percentageValue(
                                                                    recommendation
                                                                        ?.assessment
                                                                        ?.currentScore
                                                                )
                                                                : null;
                                                        const targetScore =
                                                            percentageValue(
                                                                recommendation
                                                                    ?.assessment
                                                                    ?.targetScore
                                                            );
                                                        return (
                                                            <article
                                                                className="analytics-learning-skill-card"
                                                                key={
                                                                    recommendation
                                                                        ?.skill
                                                                        ?.id ||
                                                                    `${getLearningSkillName(
                                                                        recommendation
                                                                    )}-${skillIndex}`
                                                                }
                                                            >
                                                                <div className="analytics-learning-skill-header">
                                                                    <div>
                                                                        <span
                                                                            className={
                                                                                `analytics-learning-priority ${
                                                                                    recommendation
                                                                                        ?.priority ||
                                                                                    "medium"
                                                                                }`
                                                                            }
                                                                        >
                                                                            {
                                                                                titleCase(
                                                                                    recommendation
                                                                                        ?.priority ||
                                                                                    "Priority"
                                                                                )
                                                                            }
                                                                        </span>
                                                                        <h3>
                                                                            {
                                                                                getLearningSkillName(
                                                                                    recommendation
                                                                                )
                                                                            }
                                                                        </h3>
                                                                        <p>
                                                                            {
                                                                                recommendation
                                                                                    ?.reason ||
                                                                                "Complete this learning path to improve your role readiness."
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                    <div className="analytics-learning-duration">
                                                                        <span>
                                                                            Estimated Time
                                                                        </span>
                                                                        <strong>
                                                                            {
                                                                                recommendation
                                                                                    ?.estimatedDuration ||
                                                                                "Self paced"
                                                                            }
                                                                        </strong>
                                                                    </div>
                                                                </div>
                                                                <div className="analytics-learning-score-row">
                                                                    <div>
                                                                        <span>
                                                                            Current
                                                                        </span>
                                                                        <strong>
                                                                            {
                                                                                currentScore !==
                                                                                null
                                                                                    ? `${Math.round(
                                                                                        currentScore
                                                                                    )}%`
                                                                                    : "Not assessed"
                                                                            }
                                                                        </strong>
                                                                    </div>
                                                                    <div className="analytics-learning-progress-track">
                                                                        <div
                                                                            className="analytics-learning-current-bar"
                                                                            style={{
                                                                                width:
                                                                                    `${currentScore || 0}%`
                                                                            }}
                                                                        />
                                                                        <div
                                                                            className="analytics-learning-target-marker"
                                                                            style={{
                                                                                left:
                                                                                    `${targetScore}%`
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <span>
                                                                            Target
                                                                        </span>
                                                                        <strong>
                                                                            {
                                                                                Math.round(
                                                                                    targetScore
                                                                                )
                                                                            }%
                                                                        </strong>
                                                                    </div>
                                                                </div>
                                                                {
                                                                    topics.length >
                                                                    0 && (
                                                                        <div className="analytics-learning-block">
                                                                            <span className="analytics-learning-block-title">
                                                                                Topics To Master
                                                                            </span>
                                                                            <div className="analytics-learning-topic-list">
                                                                                {
                                                                                    topics.map(
                                                                                        (
                                                                                            topic,
                                                                                            index
                                                                                        ) => (
                                                                                            <span
                                                                                                key={
                                                                                                    `${topic}-${index}`
                                                                                                }
                                                                                            >
                                                                                                <b>
                                                                                                    {index + 1}
                                                                                                </b>
                                                                                                {topic}
                                                                                            </span>
                                                                                        )
                                                                                    )
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                }
                                                                <div className="analytics-learning-block">
                                                                    <div className="analytics-learning-block-heading">
                                                                        <span className="analytics-learning-block-title">
                                                                            Recommended Resources
                                                                        </span>
                                                                        <small>
                                                                            {
                                                                                resources
                                                                                    .length
                                                                            }{" "}
                                                                            resources
                                                                        </small>
                                                                    </div>
                                                                    {
                                                                        resources.length >
                                                                        0 ? (
                                                                            <div className="analytics-learning-resource-list">
                                                                                {
                                                                                    resources
                                                                                        .slice(
                                                                                            0,
                                                                                            6
                                                                                        )
                                                                                        .map(
                                                                                            (
                                                                                                resource,
                                                                                                resourceIndex
                                                                                            ) => (
                                                                                                <a
                                                                                                    href={
                                                                                                        resource
                                                                                                            ?.url
                                                                                                    }
                                                                                                    target="_blank"
                                                                                                    rel="noopener noreferrer"
                                                                                                    className="analytics-learning-resource"
                                                                                                    key={
                                                                                                        resource
                                                                                                            ?.id ||
                                                                                                        resource
                                                                                                            ?._id ||
                                                                                                        `${resource?.title}-${resourceIndex}`
                                                                                                    }
                                                                                                >
                                                                                                    <span className="analytics-learning-resource-icon">
                                                                                                        {
                                                                                                            getLearningResourceIcon(
                                                                                                                resource
                                                                                                                    ?.type
                                                                                                            )
                                                                                                        }
                                                                                                    </span>
                                                                                                    <div>
                                                                                                        <strong>
                                                                                                            {
                                                                                                                resource
                                                                                                                    ?.title ||
                                                                                                                "Learning Resource"
                                                                                                            }
                                                                                                        </strong>
                                                                                                        <small>
                                                                                                            {
                                                                                                                resource
                                                                                                                    ?.provider ||
                                                                                                                "Resource"
                                                                                                            }
                                                                                                            {
                                                                                                                resource
                                                                                                                    ?.duration
                                                                                                                    ? ` • ${resource.duration}`
                                                                                                                    : ""
                                                                                                            }
                                                                                                        </small>
                                                                                                    </div>
                                                                                                    <span className="analytics-learning-resource-type">
                                                                                                        {
                                                                                                            titleCase(
                                                                                                                resource
                                                                                                                    ?.type
                                                                                                            )
                                                                                                        }
                                                                                                    </span>
                                                                                                    <span className="analytics-learning-resource-arrow">
                                                                                                        ↗
                                                                                                    </span>
                                                                                                </a>
                                                                                            )
                                                                                        )
                                                                                }
                                                                            </div>
                                                                        ) : (
                                                                            <p className="analytics-learning-empty-text">
                                                                                No verified resources
                                                                                are available for this
                                                                                skill yet.
                                                                            </p>
                                                                        )
                                                                    }
                                                                </div>
                                                                {
                                                                    projects.length >
                                                                    0 && (
                                                                        <div className="analytics-learning-block">
                                                                            <span className="analytics-learning-block-title">
                                                                                Portfolio Projects
                                                                            </span>
                                                                            <div className="analytics-learning-projects">
                                                                                {
                                                                                    projects.map(
                                                                                        (
                                                                                            project,
                                                                                            index
                                                                                        ) => (
                                                                                            <div
                                                                                                key={
                                                                                                    `${project}-${index}`
                                                                                                }
                                                                                            >
                                                                                                <span>
                                                                                                    🛠
                                                                                                </span>
                                                                                                <div>
                                                                                                    <strong>
                                                                                                        {project}
                                                                                                    </strong>
                                                                                                    <small>
                                                                                                        Apply your learning
                                                                                                        in a practical
                                                                                                        portfolio project.
                                                                                                    </small>
                                                                                                </div>
                                                                                            </div>
                                                                                        )
                                                                                    )
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                }
                                                                <div className="analytics-learning-action">
                                                                    <div>
                                                                        <span>
                                                                            NEXT ACTION
                                                                        </span>
                                                                        <p>
                                                                            {
                                                                                recommendation
                                                                                    ?.nextAction ||
                                                                                "Complete the learning path and retake the related assessment."
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                    <div className="analytics-learning-action-buttons">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                navigate(
                                                                                    "/learning"
                                                                                )
                                                                            }
                                                                        >
                                                                            Continue Learning
                                                                        </button>
                                                                        {
                                                                            recommendation
                                                                                ?.recommendedAssessment && (
                                                                                <button
                                                                                    type="button"
                                                                                    className="secondary"
                                                                                    onClick={() =>
                                                                                        handleRoadmapAssessment(
                                                                                            recommendation
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    Retake{" "}
                                                                                    {
                                                                                        String(
                                                                                            recommendation
                                                                                                .recommendedAssessment
                                                                                        )
                                                                                            .toUpperCase()
                                                                                    }
                                                                                </button>
                                                                            )
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </article>
                                                        );
                                                    }
                                                )
                                            }
                                        </div>
                                    ) : (
                                        <div className="analytics-learning-empty">
                                            <span>
                                                ✓
                                            </span>
                                            <h3>
                                                No Major Learning Priorities
                                            </h3>
                                            <p>
                                                Your current profile does
                                                not contain major priority
                                                skill gaps for the selected
                                                role.
                                            </p>
                                        </div>
                                    )
                                }
                                {
                                    roadmapReadySkills.length >
                                    0 && (
                                        <div className="analytics-ready-skills">
                                            <span className="analytics-learning-block-title">
                                                Skills Meeting Target
                                            </span>
                                            <div>

                                                {
                                                    roadmapReadySkills.map(
                                                        (
                                                            skill,
                                                            index
                                                        ) => (
                                                            <div
                                                                key={
                                                                    skill
                                                                        ?.skill
                                                                        ?.id ||
                                                                    `${getLearningSkillName(
                                                                        skill
                                                                    )}-${index}`
                                                                }
                                                            >
                                                                <span>
                                                                    ✓
                                                                </span>
                                                                <strong>
                                                                    {
                                                                        getLearningSkillName(
                                                                            skill
                                                                        )
                                                                    }
                                                                </strong>
                                                                <small>
                                                                    {
                                                                        Math.round(
                                                                            percentageValue(
                                                                                skill
                                                                                    ?.assessment
                                                                                    ?.effectiveScore
                                                                            )
                                                                        )
                                                                    }%
                                                                </small>
                                                            </div>
                                                        )
                                                    )
                                                }
                                            </div>
                                        </div>
                                    )
                                }
                            </>
                        ) : (
                            <div className="analytics-learning-empty">
                                <span>
                                    🎓
                                </span>
                                <h3>
                                    Learning Roadmap Not Available
                                </h3>
                                <p>
                                    Complete your resume analysis
                                    and technical assessments to
                                    generate a personalized roadmap.

                                </p>
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/learning"
                                        )
                                    }
                                >
                                    Open Learning Center
                                </button>

                            </div>
                        )
                    }
                </section>
                {
                    (
                        aiSummary ||
                        aiRecommendations.length >
                        0
                    ) && (
                        <section className="analytics-ai-card">
                            <div className="analytics-ai-icon">
                                ✦
                            </div>
                            <div className="analytics-ai-content">
                                <span className="analytics-section-label">
                                    AI PERFORMANCE INSIGHTS
                                </span>
                                <h2>
                                    Personalized Analysis
                                </h2>
                                {
                                    aiSummary && (

                                        <p className="analytics-ai-summary">
                                            {aiSummary}
                                        </p>
                                    )
                                }
                                {
                                    aiRecommendations.length >
                                    0 && (
                                        <div className="analytics-ai-recommendations">
                                            {
                                                aiRecommendations
                                                    .slice(
                                                        0,
                                                        5
                                                    )
                                                    .map(
                                                        (
                                                            item,
                                                            index
                                                        ) => (
                                                            <div
                                                                key={
                                                                    index
                                                                }
                                                            >
                                                                <span>
                                                                    ✓
                                                                </span>
                                                                <p>
                                                                    {
                                                                        recommendationText(
                                                                            item
                                                                        )
                                                                    }
                                                                </p>
                                                            </div>
                                                        )
                                                    )
                                            }
                                        </div>
                                    )
                                }
                            </div>
                        </section>
                    )
                }
                <section className="analytics-footer-actions">
                    <button
                        type="button"
                        className="analytics-secondary-btn"
                        onClick={() =>
                            navigate(
                                "/dashboard"
                            )
                        }
                    >
                        ← Dashboard
                    </button>
                    <button
                        type="button"
                        className="analytics-secondary-btn"
                        onClick={() =>
                            navigate(
                                "/learning"
                            )
                        }
                    >
                        Learning Center
                    </button>
                    <button
                        type="button"
                        className="analytics-primary-btn"
                        onClick={() =>
                            navigate(
                                "/assessments"
                            )
                        }
                    >
                        Improve Your Score →
                    </button>
                </section>
            </div>
        </div>
    );
};
export default Analytics;