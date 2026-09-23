import {
    useEffect,
    useMemo,
    useState
} from "react";
import {
    useNavigate
} from "react-router-dom";
import {
    useAuth
} from "../context/AuthContext";
import assessmentService
    from "../services/assessmentService";
import learningService
    from "../services/learningService";
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
const safeArray = (
    value
) => {
    return Array.isArray(
        value
    )
        ? value
        : [];
};
const clampPercentage = (
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
            (
                character
            ) =>
                character
                    .toUpperCase()
        );
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
        value
            ?.name ||
        value
            ?.title ||
        ""
    );
};
const normalizeCollection = (
    value
) => {
    if (
        Array.isArray(
            value
        )
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
            (
                [
                    key,
                    item
                ]
            ) => {
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
                    name:
                        key,
                    score:
                        item
                };
            }
        );
    }
    return [];
};
const getSkillName = (
    skill
) => {
    if (
        typeof skill ===
        "string"
    ) {

        return skill;
    }
    return (
        skill
            ?.skill
            ?.name ||
        (
            typeof skill
                ?.skill ===
                "string"
                ? skill.skill
                : ""
        ) ||
        skill
            ?.skillName ||
        skill
            ?.name ||
        skill
            ?.key ||
        "Skill"
    );
};
const getSkillScore = (
    skill
) => {
    return clampPercentage(
        skill
            ?.percentage ??
        skill
            ?.averagePercentage ??
        skill
            ?.currentScore ??
        skill
            ?.score ??
        skill
            ?.value ??
        0
    );
};
const getRecommendationText = (
    value
) => {
    if (
        !value
    ) {
        return "";
    }
    if (
        typeof value ===
        "string"
    ) {
        return value;
    }
    return (
        value
            ?.message ||
        value
            ?.recommendation ||
        value
            ?.reason ||
        value
            ?.summary ||
        value
            ?.text ||
        ""
    );
};
const formatDate = (
    value
) => {
    if (
        !value
    ) {
        return "Not available";
    }
    const date =
        new Date(
            value
        );
    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Not available";
    }
    return date
        .toLocaleDateString(
            undefined,
            {
                day:
                    "numeric",
                month:
                    "short",
                year:
                    "numeric"
            }
        );
};
const getPriorityIcon = (
    priority
) => {
    switch (
        String(
            priority ||
            ""
        )
            .toLowerCase()
    ) {
        case "critical":
            return "🔥";
        case "high":
            return "⚡";
        case "medium":
            return "📈";
        default:
            return "✓";
    }
};
const getResourceIcon = (
    type
) => {
    switch (
        String(
            type ||
            ""
        )
            .toLowerCase()
    ) {
        case "youtube":
            return "▶";
        case "practice":
            return "💻";
        case "course":
            return "🎓";
        case "project":
            return "🛠";
        case "interview":
            return "🎯";
        case "article":
            return "📄";
        case "documentation":
            return "📚";
        default:
            return "🔗";
    }
};
const Dashboard = () => {
    const navigate =
        useNavigate();
    const {
        user
    } =
        useAuth();
    const resumeId =
        localStorage.getItem(
            "resumeId"
        ) || "";
    const [
        progressData,
        setProgressData
    ] =
        useState(null);
    const [
        finalReadinessData,
        setFinalReadinessData
    ] =
        useState(null);
    const [
        learningPlan,
        setLearningPlan
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
    useEffect(
        () => {
            let active =
                true;
            const loadDashboard =
                async () => {
                    if (
                        !resumeId
                    ) {
                        if (
                            active
                        ) {
                            setProgressData(
                                null
                            );
                            setFinalReadinessData(
                                null
                            );
                            setLearningPlan(
                                null
                            );
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
                            progressResult,
                            readinessResult,
                            learningResult
                        ] =
                            await Promise.allSettled([
                                assessmentService
                                    .getOverallProgress(
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
                                                5,
                                            resourcesPerSkill:
                                                6
                                        }
                                    )
                            ]);
                        if (
                            !active
                        ) {

                            return;
                        }
                        if (
                            progressResult
                                .status ===
                            "fulfilled"
                        ) {
                            const progressResponse =
                                progressResult
                                    .value;
                            const normalizedProgress =
                                progressResponse
                                    ?.data
                                    ?.overallProgress
                                    ? progressResponse
                                        .data
                                    : progressResponse ||
                                    {};
                            setProgressData(
                                normalizedProgress
                            );
                        } else {
                            console.error(
                                "Dashboard progress error:",
                                progressResult
                                    .reason
                            );
                            setProgressData(
                                null
                            );
                        }
                        if (
                            readinessResult
                                .status ===
                            "fulfilled"
                        ) {
                            const readinessResponse =
                                readinessResult
                                    .value;
                            const finalReadinessRoot =
                                readinessResponse
                                    ?.data ??
                                readinessResponse ??
                                {};
                            const normalizedReadiness =
                                finalReadinessRoot
                                    ?.jobReadiness ||
                                finalReadinessRoot
                                    ?.readiness ||
                                finalReadinessRoot;
                            setFinalReadinessData(
                                normalizedReadiness
                            );
                        } else {
                            console.error(
                                "Dashboard readiness error:",
                                readinessResult
                                    .reason
                            );
                            setFinalReadinessData(
                                null
                            );
                        }
                        if (
                            learningResult
                                .status ===
                            "fulfilled"
                        ) {
                            const normalizedPlan =
                                learningService
                                    .normalizeLearningPlan(
                                        learningResult
                                            .value
                                    );
                            setLearningPlan(
                                normalizedPlan
                            );
                        } else {
                            console.error(
                                "Dashboard learning plan error:",
                                learningResult
                                    .reason
                            );
                            setLearningPlan(
                                null
                            );
                        }
                        if (
                            progressResult
                                .status ===
                                "rejected" &&
                            readinessResult
                                .status ===
                                "rejected" &&
                            learningResult
                                .status ===
                                "rejected"
                        ) {
                            setError(
                                "Unable to load dashboard data."
                            );
                        }
                    } catch (
                        requestError
                    ) {
                        console.error(
                            "Dashboard load error:",
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
                                "Failed to load dashboard."
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
            loadDashboard();
            return () => {
                active =
                    false;
            };
        },
        [
            resumeId
        ]
    );
    const progress =
        progressData ||
        {};
    const overallProgress =
        progress
            ?.overallProgress ||
        {};
    const progressReadiness =
        progress
            ?.jobReadiness ||
        {};
    const finalReadiness =
        finalReadinessData ||
        {};
    const readinessScore =
        clampPercentage(
            finalReadiness
                ?.score ??
            finalReadiness
                ?.readinessScore ??
            progressReadiness
                ?.score ??
            0
        );
    const readinessLevel =
        finalReadiness
            ?.level ||
        progressReadiness
            ?.level ||
        (
            readinessScore > 0
                ? "Calculated"
                : "Not Calculated"
        );
    const resumeCoverage =
        clampPercentage(
            finalReadiness
                ?.resumeCoverage ??
            progressReadiness
                ?.resumeCoverage ??
            learningPlan
                ?.resume
                ?.coverageScore ??
            0
        );
    const assessmentScore =
        clampPercentage(
            finalReadiness
                ?.assessmentScore ??
            progressReadiness
                ?.assessmentScore ??
            overallProgress
                ?.currentScore ??
            0
        );
    const resume =
        progress
            ?.resume ||
        learningPlan
            ?.resume ||
        {};
    const companyName =
        getEntityName(
            resume
                ?.company
        ) ||
        learningPlan
            ?.target
            ?.company ||
        "";
    const roleName =
        getEntityName(
            resume
                ?.role
        ) ||
        learningPlan
            ?.target
            ?.role ||
        "";
    const skills =
        useMemo(
            () => {
                const analyticsSkills =
                    normalizeCollection(
                        progress
                            ?.analytics
                            ?.skills
                    );
                if (
                    analyticsSkills
                        .length >
                    0
                ) {
                    return analyticsSkills
                        .map(
                            (
                                skill
                            ) => ({
                                ...skill,
                                name:
                                    getSkillName(
                                        skill
                                    ),
                                score:
                                    getSkillScore(
                                        skill
                                    )
                            })
                        )
                        .sort(
                            (
                                a,
                                b
                            ) =>
                                b.score -
                                a.score
                        );
                }
                const progressSkills =
                    normalizeCollection(
                        progress
                            ?.skillProgress
                    );
                return progressSkills
                    .map(
                        (
                            skill
                        ) => ({
                            ...skill,
                            name:
                                getSkillName(
                                    skill
                                ),
                            score:
                                getSkillScore(
                                    skill
                                )
                        })
                    )
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            b.score -
                            a.score
                    );

            },
            [
                progress
            ]
        );
    const skillGaps =
        useMemo(
            () => {
                return skills
                    .filter(
                        (
                            skill
                        ) =>
                            skill.score <
                            70
                    )
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            a.score -
                            b.score
                    )
                    .slice(
                        0,
                        5
                    )
                    .map(
                        (
                            skill
                        ) => {
                            let severity =
                                "low";
                            let level =
                                "Developing";
                            if (
                                skill.score <
                                40
                            ) {
                                severity =
                                    "high";
                                level =
                                    "Needs Improvement";
                            } else if (
                                skill.score <
                                60
                            ) {
                                severity =
                                    "medium";
                                level =
                                    "Needs Practice";
                            }
                            return {
                                ...skill,
                                severity,
                                level
                            };
                        }
                    );
            },
            [
                skills
            ]
        );
    const assessmentHistory =
        safeArray(
            progress
                ?.assessmentHistory
        );
    const latestAssessment =
        assessmentHistory[0] ||
        null;
    const stats = {
        readiness:
            readinessScore,
        resumes:
            resumeId
                ? 1
                : 0,
        matchedSkills:
            skills.length,
        assessments:
            assessmentHistory
                .length ||
            safeNumber(
                overallProgress
                    ?.attempts
            )
    };
    const learningRecommendations =
        safeArray(
            learningPlan
                ?.recommendedSkills
        );
    const topLearningPriority =
        learningPlan
            ?.topPriority ||
        learningRecommendations[0] ||
        null;
    const topLearningSkill =
        topLearningPriority
            ?.skill
            ?.name ||
        topLearningPriority
            ?.skillName ||
        topLearningPriority
            ?.name ||
        "";
    const topLearningResources =
        safeArray(
            topLearningPriority
                ?.resources
        )
            .slice(
                0,
                3
            );
    const topLearningTopics =
        safeArray(
            topLearningPriority
                ?.topics
        )
            .slice(
                0,
                4
            );
    const learningPriority =
        String(
            topLearningPriority
                ?.priority ||
            ""
        )
            .toLowerCase();
    const learningCurrentScore =
        topLearningPriority
            ?.assessment
            ?.hasData
            ? safeNumber(
                topLearningPriority
                    ?.assessment
                    ?.currentScore
            )
            : null;
    const learningTargetScore =
        safeNumber(
            topLearningPriority
                ?.assessment
                ?.targetScore
        );
    const learningGap =
        safeNumber(
            topLearningPriority
                ?.assessment
                ?.scoreGap
        );
    const learningRecommendationText =
        topLearningPriority
            ?.nextAction ||
        learningPlan
            ?.nextAction ||
        learningPlan
            ?.summary ||
        "";
    const fallbackRecommendation =
        useMemo(
            () => {
                const summary =
                    getRecommendationText(
                        progress
                            ?.finalProgressSummary
                    );
                if (
                    summary
                ) {
                    return summary;
                }
                const aiInsight =
                    getRecommendationText(
                        progress
                            ?.aiPerformanceInsights
                    );
                if (
                    aiInsight
                ) {

                    return aiInsight;
                }
                const recommendations =
                    safeArray(
                        progress
                            ?.learningRecommendations
                    );
                if (
                    recommendations
                        .length >
                    0
                ) {
                    return (
                        getRecommendationText(
                            recommendations[0]
                        ) ||
                        ""
                    );
                }
                const priorities =
                    safeArray(
                        progress
                            ?.topLearningPriorities
                    );
                if (
                    priorities
                        .length >
                    0
                ) {
                    return (
                        getRecommendationText(
                            priorities[0]
                        ) ||
                        ""
                    );
                }
                return "";

            },
            [
                progress
            ]
        );
    const handleRecommendedAssessment =
        () => {
            const assessmentType =
                topLearningPriority
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
            <div className="dashboard-page">
                <div className="container">
                    <div className="card dashboard-loading-card">
                        <div className="dashboard-loading-spinner" />
                        <h2>
                            Loading your dashboard...
                        </h2>
                        <p className="text-muted">
                            Fetching readiness, assessments,
                            skill analytics, and learning recommendations.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="dashboard-page">
            <div className="container">
                <section className="dashboard-header">
                    <div className="dashboard-header-content">
                        <div>
                            <h1 className="heading-lg dashboard-title">
                                Welcome,{" "}
                                <span className="gradient-text">
                                    {
                                        user
                                            ?.name ||
                                        "User"
                                    }
                                </span>
                                {" "}👋
                            </h1>
                            <p className="text-muted dashboard-subtitle">
                                Track your career readiness,
                                identify skill gaps, improve your
                                technical skills, and follow your
                                personalized learning roadmap.
                            </p>
                            {(roleName ||
                                companyName) && (
                                <div className="dashboard-target-meta">
                                    {roleName && (
                                        <span>
                                            🎯 {roleName}
                                        </span>
                                    )}
                                    {companyName && (
                                        <span>
                                            🏢 {companyName}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="dashboard-header-actions">
                            <button
                                type="button"
                                className="dashboard-secondary-button"
                                onClick={() =>
                                    navigate(
                                        "/analytics"
                                    )
                                }
                            >
                                View Analytics
                            </button>
                            <button
                                type="button"
                                className="dashboard-primary-button"
                                onClick={() =>
                                    navigate(
                                        "/learning"
                                    )
                                }
                            >
                                Learning Center →
                            </button>
                        </div>
                    </div>
                </section>
                {error && (
                    <div className="card dashboard-error-card">
                        <strong>
                            Dashboard Notice
                        </strong>
                        <p>
                            {error}
                        </p>
                    </div>
                )}
                <section className="dashboard-stats">
                    <div className="card dashboard-stat-card">
                        <div className="stat-top">
                            <span className="stat-label">
                                Job Readiness
                            </span>
                            <div className="stat-icon">
                                🎯
                            </div>
                        </div>
                        <div className="stat-value">
                            {
                                Math.round(
                                    stats
                                        .readiness
                                )
                            }%
                        </div>
                        <p className="stat-description">
                            {
                                readinessLevel
                            }
                        </p>

                    </div>
                    <div className="card dashboard-stat-card">
                        <div className="stat-top">
                            <span className="stat-label">
                                Resume Connected
                            </span>
                            <div className="stat-icon green">
                                📄
                            </div>
                        </div>
                        <div className="stat-value">
                            {
                                stats
                                    .resumes
                            }
                        </div>
                        <p className="stat-description">
                            {
                                resumeId
                                    ? "Resume analysis available"
                                    : "Upload your resume"
                            }
                        </p>
                    </div>
                    <div className="card dashboard-stat-card">
                        <div className="stat-top">
                            <span className="stat-label">
                                Skills Tracked
                            </span>
                            <div className="stat-icon purple">
                                🧠
                            </div>
                        </div>
                        <div className="stat-value">
                            {
                                stats
                                    .matchedSkills
                            }
                        </div>
                        <p className="stat-description">
                            Skills evaluated from assessments
                        </p>
                    </div>
                    <div className="card dashboard-stat-card">
                        <div className="stat-top">
                            <span className="stat-label">
                                Assessments
                            </span>
                            <div className="stat-icon orange">
                                📝
                            </div>
                        </div>
                        <div className="stat-value">
                            {
                                stats
                                    .assessments
                            }
                        </div>
                        <p className="stat-description">
                            Completed assessment attempts
                        </p>
                    </div>
                </section>
                {!resumeId && (
                    <div className="card dashboard-empty-content">
                        <span className="dashboard-empty-icon">
                            📄
                        </span>
                        <h3>
                            Start With Your Resume
                        </h3>
                        <p>
                            Upload and analyze your resume to
                            calculate skill gaps, job readiness,
                            assessments, and personalized learning
                            recommendations.
                        </p>
                        <button
                            type="button"
                            className="dashboard-primary-button"
                            onClick={() =>
                                navigate(
                                    "/resume"
                                )
                            }
                        >
                            Analyze Resume →
                        </button>
                    </div>
                )}
                {resumeId && (

                    <>
                        <section className="dashboard-grid">
                            <div className="card dashboard-card">
                                <div className="dashboard-card-header">
                                    <div>
                                        <h2 className="dashboard-card-title">
                                            Skill Performance
                                        </h2>
                                        <p className="dashboard-card-subtitle">
                                            Performance from your completed assessments.
                                        </p>
                                    </div>
                                    <span>
                                        📊
                                    </span>
                                </div>
                                {skills.length >
                                    0 ? (
                                    <div className="skill-list">
                                        {skills
                                            .slice(
                                                0,
                                                6
                                            )
                                            .map(
                                                (
                                                    skill,
                                                    index
                                                ) => (

                                                    <div
                                                        className="skill-row"
                                                        key={
                                                            `${skill.name}-${index}`
                                                        }
                                                    >
                                                        <div className="skill-row-top">
                                                            <span>
                                                                {
                                                                    skill
                                                                        .name
                                                                }
                                                            </span>
                                                            <strong>
                                                                {
                                                                    Math.round(
                                                                        skill
                                                                            .score
                                                                    )
                                                                }%
                                                            </strong>
                                                        </div>
                                                        <div className="skill-bar">
                                                            <div
                                                                className="skill-bar-fill"
                                                                style={{
                                                                    width:
                                                                        `${clampPercentage(
                                                                            skill
                                                                                .score
                                                                        )}%`
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                    </div>
                                ) : (
                                    <div className="dashboard-empty-content">
                                        <span className="dashboard-empty-icon">
                                            🧠
                                        </span>
                                        <h3>
                                            No Skill Scores Yet
                                        </h3>
                                        <p>
                                            Complete an assessment to build
                                            your skill-performance profile.
                                        </p>
                                        <button
                                            type="button"
                                            className="dashboard-secondary-button"
                                            onClick={() =>
                                                navigate(
                                                    "/assessments"
                                                )
                                            }
                                        >
                                            Take Assessment
                                        </button>
                                    </div>
                                )}

                            </div>
                            <div className="card dashboard-card">
                                <div className="dashboard-card-header">
                                    <div>
                                        <h2 className="dashboard-card-title">
                                            Skill Gaps
                                        </h2>
                                        <p className="dashboard-card-subtitle">
                                            Assessed skills currently below 70%.
                                        </p>
                                    </div>
                                    <span>
                                        ⚠️
                                    </span>
                                </div>
                                {skillGaps.length >
                                    0 ? (
                                    <div className="gap-list">
                                        {skillGaps.map(
                                            (
                                                gap,
                                                index
                                            ) => (
                                                <div
                                                    className="gap-item"
                                                    key={
                                                        `${gap.name}-${index}`
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            `gap-indicator ${
                                                                gap
                                                                    .severity
                                                            }`
                                                        }
                                                    />
                                                    <div className="gap-content">
                                                        <strong>
                                                            {
                                                                gap
                                                                    .name
                                                            }
                                                        </strong>
                                                        <span className="gap-level">
                                                            {
                                                                gap
                                                                    .level
                                                            }
                                                        </span>
                                                    </div>
                                                    <span className="gap-score">
                                                        {
                                                            Math.round(
                                                                gap
                                                                    .score
                                                            )
                                                        }%
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <div className="dashboard-empty-content">
                                        <span className="dashboard-empty-icon">
                                            ✓
                                        </span>
                                        <h3>
                                            No Major Assessed Gaps
                                        </h3>
                                        <p>
                                            Complete additional assessments
                                            to continue validating your skills.
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="card dashboard-card">
                                <div className="dashboard-card-header">
                                    <div>
                                        <h2 className="dashboard-card-title">
                                            Latest Assessment
                                        </h2>
                                        <p className="dashboard-card-subtitle">
                                            Your most recent submitted result.
                                        </p>
                                    </div>
                                    <span>
                                        📝
                                    </span>
                                </div>
                                {latestAssessment ? (
                                    <div className="assessment-summary">
                                        <div className="assessment-score">
                                            <span className="assessment-score-value">
                                                {
                                                    Math.round(
                                                        clampPercentage(
                                                            latestAssessment
                                                                ?.percentage
                                                        )
                                                    )
                                                }%
                                            </span>
                                            <small>
                                                Score
                                            </small>
                                        </div>
                                        <div className="assessment-info">
                                            <h3>
                                                {
                                                    titleCase(
                                                        latestAssessment
                                                            ?.type ||
                                                        "Assessment"
                                                    )
                                                }
                                                {" "}Assessment
                                            </h3>
                                            <p>
                                                Status:{" "}
                                                <strong>
                                                    {
                                                        titleCase(
                                                            latestAssessment
                                                                ?.status ||
                                                            "Completed"
                                                        )
                                                    }
                                                </strong>
                                            </p>
                                            <p>
                                                {
                                                    formatDate(
                                                        latestAssessment
                                                            ?.submittedAt
                                                    )
                                                }
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="dashboard-secondary-button"
                                            onClick={() =>
                                                navigate(
                                                    "/analytics"
                                                )
                                            }
                                        >
                                            View Analytics
                                        </button>
                                    </div>
                                ) : (
                                    <div className="dashboard-empty-content">
                                        <span className="dashboard-empty-icon">
                                            📝
                                        </span>
                                        <h3>
                                            No Assessments Yet
                                        </h3>
                                        <p>
                                            Take an MCQ, Coding, or SQL
                                            assessment to measure your skills.
                                        </p>
                                        <button
                                            type="button"
                                            className="dashboard-primary-button"
                                            onClick={() =>
                                                navigate(
                                                    "/assessments"
                                                )
                                            }
                                        >
                                            Take Assessment →
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="card dashboard-card">
                                <div className="dashboard-card-header">
                                    <div>
                                        <h2 className="dashboard-card-title">
                                            Overall Progress
                                        </h2>
                                        <p className="dashboard-card-subtitle">
                                            Track improvement across assessment attempts.
                                        </p>
                                    </div>
                                    <span>
                                        📈
                                    </span>
                                </div>
                                <div className="dashboard-progress-summary">
                                    <div className="dashboard-progress-item">
                                        <span>
                                            Current
                                        </span>
                                        <strong>
                                            {
                                                Math.round(
                                                    clampPercentage(
                                                        overallProgress
                                                            ?.currentScore
                                                    )
                                                )
                                            }%
                                        </strong>
                                    </div>
                                    <div className="dashboard-progress-item">
                                        <span>
                                            Previous
                                        </span>
                                        <strong>
                                            {
                                                Math.round(
                                                    clampPercentage(
                                                        overallProgress
                                                            ?.previousScore
                                                    )
                                                )
                                            }%
                                        </strong>
                                    </div>
                                    <div className="dashboard-progress-item">
                                        <span>
                                            Improvement
                                        </span>
                                        <strong>
                                            {
                                                safeNumber(
                                                    overallProgress
                                                        ?.improvement
                                                ) >
                                                0
                                                    ? "+"
                                                    : ""
                                            }
                                            {
                                                Math.round(
                                                    safeNumber(
                                                        overallProgress
                                                            ?.improvement
                                                    )
                                                )
                                            }%
                                        </strong>
                                    </div>
                                    <div className="dashboard-progress-item">
                                        <span>
                                            Attempts
                                        </span>
                                        <strong>
                                            {
                                                safeNumber(
                                                    overallProgress
                                                        ?.attempts,
                                                    assessmentHistory
                                                        .length
                                                )
                                            }
                                        </strong>
                                    </div>
                                </div>
                            </div>
                            <div className="card dashboard-card dashboard-readiness-card">
                                <div className="dashboard-card-header">
                                    <div>
                                        <h2 className="dashboard-card-title">
                                            Job Readiness
                                        </h2>
                                        <p className="dashboard-card-subtitle">
                                            Combined resume and assessment readiness.
                                        </p>
                                    </div>
                                    <span>
                                        🎯
                                    </span>
                                </div>
                                <div className="dashboard-readiness-main">
                                    <div className="assessment-score">
                                        <span className="assessment-score-value">
                                            {
                                                Math.round(
                                                    readinessScore
                                                )
                                            }%
                                        </span>
                                        <small>
                                            {
                                                readinessLevel
                                            }
                                        </small>
                                    </div>
                                    <div className="dashboard-readiness-breakdown">
                                        <div>
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
                                        <div className="skill-bar">
                                            <div
                                                className="skill-bar-fill"
                                                style={{
                                                    width:
                                                        `${resumeCoverage}%`
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <span>
                                                Assessment Performance
                                            </span>
                                            <strong>
                                                {
                                                    Math.round(
                                                        assessmentScore
                                                    )
                                                }%
                                            </strong>
                                        </div>
                                        <div className="skill-bar">
                                            <div
                                                className="skill-bar-fill"
                                                style={{
                                                    width:
                                                        `${assessmentScore}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="card dashboard-card dashboard-learning-preview">
                                <div className="dashboard-card-header">
                                    <div>
                                        <span className="dashboard-mini-label">
                                            PERSONALIZED LEARNING
                                        </span>
                                        <h2 className="dashboard-card-title">
                                            AI Learning Recommendation
                                        </h2>
                                        <p className="dashboard-card-subtitle">
                                            Based on your resume,
                                            target role, assessment
                                            performance, and job readiness.
                                        </p>
                                    </div>
                                    <div className="dashboard-learning-icon">
                                        🎓
                                    </div>
                                </div>
                                {topLearningPriority ? (
                                    <div className="dashboard-learning-focus">
                                        <div className="dashboard-learning-focus-header">
                                            <div>
                                                <span
                                                    className={
                                                        `dashboard-priority-badge ${
                                                            learningPriority ||
                                                            "medium"
                                                        }`
                                                    }
                                                >
                                                    {
                                                        getPriorityIcon(
                                                            learningPriority
                                                        )
                                                    }
                                                    {" "}
                                                    {
                                                        learningPriority
                                                            ? learningPriority
                                                                .toUpperCase()
                                                            : "PRIORITY"
                                                    }
                                                </span>
                                                <h3>
                                                    {
                                                        topLearningSkill ||
                                                        "Priority Skill"
                                                    }
                                                </h3>
                                            </div>
                                            <div className="dashboard-learning-priority-score">
                                                <span>
                                                    Priority
                                                </span>
                                                <strong>
                                                    {
                                                        safeNumber(
                                                            topLearningPriority
                                                                ?.priorityScore
                                                        )
                                                    }
                                                    /100
                                                </strong>
                                            </div>
                                        </div>
                                        <div className="dashboard-learning-score-grid">
                                            <div>
                                                <span>
                                                    Current
                                                </span>
                                                <strong>
                                                    {
                                                        learningCurrentScore !==
                                                        null
                                                            ? `${Math.round(
                                                                learningCurrentScore
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
                                                            learningTargetScore
                                                        )
                                                    }%
                                                </strong>
                                            </div>
                                            <div>
                                                <span>
                                                    Gap
                                                </span>
                                                <strong>
                                                    {
                                                        Math.round(
                                                            learningGap
                                                        )
                                                    }%
                                                </strong>
                                            </div>
                                            <div>
                                                <span>
                                                    Duration
                                                </span>
                                                <strong>
                                                    {
                                                        topLearningPriority
                                                            ?.estimatedDuration ||
                                                        "Self paced"
                                                    }
                                                </strong>
                                            </div>
                                        </div>
                                        {topLearningPriority
                                            ?.reason && (
                                            <p className="dashboard-learning-reason">
                                                {
                                                    topLearningPriority
                                                        .reason
                                                }
                                            </p>
                                        )}
                                        {topLearningTopics
                                            .length >
                                            0 && (
                                            <div className="dashboard-learning-topics">
                                                <span className="dashboard-learning-subtitle">
                                                    Recommended Topics
                                                </span>
                                                <div>
                                                    {topLearningTopics.map(
                                                        (
                                                            topic,
                                                            index
                                                        ) => (
                                                            <span
                                                                key={
                                                                    `${topic}-${index}`
                                                                }
                                                            >
                                                                {topic}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {topLearningResources
                                            .length >
                                            0 && (
                                            <div className="dashboard-learning-resources">
                                                <span className="dashboard-learning-subtitle">
                                                    Start Learning
                                                </span>
                                                <div className="dashboard-resource-preview-list">
                                                    {topLearningResources.map(
                                                        (
                                                            resource,
                                                            index
                                                        ) => (
                                                            <a
                                                                href={
                                                                    resource
                                                                        ?.url
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="dashboard-resource-preview"
                                                                key={
                                                                    resource
                                                                        ?.id ||
                                                                    resource
                                                                        ?._id ||
                                                                    `${resource?.title}-${index}`
                                                                }
                                                            >
                                                                <span className="dashboard-resource-preview-icon">
                                                                    {
                                                                        getResourceIcon(
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
                                                                            "Learning resource"
                                                                        }
                                                                        {
                                                                            resource
                                                                                ?.duration
                                                                                ? ` • ${resource.duration}`
                                                                                : ""
                                                                        }
                                                                    </small>
                                                                </div>
                                                                <span className="dashboard-resource-arrow">
                                                                    ↗
                                                                </span>
                                                            </a>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {learningRecommendationText && (
                                            <div className="dashboard-learning-next-action">
                                                <span>
                                                    Next Action
                                                </span>
                                                <p>
                                                    {
                                                        learningRecommendationText
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        <div className="dashboard-learning-actions">
                                            <button
                                                type="button"
                                                className="dashboard-primary-button"
                                                onClick={() =>
                                                    navigate(
                                                        "/learning"
                                                    )
                                                }
                                            >
                                                Continue Learning →
                                            </button>
                                            {topLearningPriority
                                                ?.recommendedAssessment && (
                                                <button
                                                    type="button"
                                                    className="dashboard-secondary-button"
                                                    onClick={
                                                        handleRecommendedAssessment
                                                    }
                                                >
                                                    Retake{" "}
                                                    {
                                                        String(
                                                            topLearningPriority
                                                                .recommendedAssessment
                                                        )
                                                            .toUpperCase()
                                                    }
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="dashboard-empty-content">
                                        <span className="dashboard-empty-icon">
                                            🎓
                                        </span>
                                        <h3>
                                            Learning Plan Not Available Yet
                                        </h3>
                                        <p>
                                            {
                                                fallbackRecommendation ||
                                                "Complete your resume analysis and assessments to generate personalized learning recommendations."
                                            }
                                        </p>
                                        <button
                                            type="button"
                                            className="dashboard-primary-button"
                                            onClick={() =>
                                                navigate(
                                                    "/learning"
                                                )
                                            }
                                        >
                                            Open Learning Center
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>
                        {learningPlan && (
                            <section className="dashboard-roadmap-summary">
                                <div>
                                    <span className="dashboard-mini-label">
                                        LEARNING ROADMAP
                                    </span>
                                    <h3>
                                        {
                                            learningPlan
                                                ?.roadmapDuration ||
                                            "Personalized Roadmap"
                                        }
                                    </h3>
                                    <p>
                                        {
                                            learningPlan
                                                ?.summary ||
                                            "Follow your personalized skill development roadmap."
                                        }
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/learning"
                                        )
                                    }
                                >
                                    View Full Roadmap →
                                </button>
                            </section>
                        )}
                        <section className="dashboard-quick-actions">
                            <button
                                type="button"
                                className="card dashboard-quick-action-card"
                                onClick={() =>
                                    navigate(
                                        "/resume"
                                    )
                                }
                            >
                                <span>
                                    📄
                                </span>
                                <div>
                                    <strong>
                                        Resume Analysis
                                    </strong>
                                    <small>
                                        Upload or analyze your resume
                                    </small>
                                </div>
                                <span>
                                    →
                                </span>
                            </button>
                            <button
                                type="button"
                                className="card dashboard-quick-action-card"
                                onClick={() =>
                                    navigate(
                                        "/assessments"
                                    )
                                }
                            >
                                <span>
                                    📝
                                </span>
                                <div>
                                    <strong>
                                        Assessments
                                    </strong>
                                    <small>
                                        MCQ, Coding and SQL tests
                                    </small>
                                </div>
                                <span>
                                    →
                                </span>
                            </button>
                            <button
                                type="button"
                                className="card dashboard-quick-action-card"
                                onClick={() =>
                                    navigate(
                                        "/analytics"
                                    )
                                }
                            >
                                <span>
                                    📊
                                </span>
                                <div>
                                    <strong>
                                        Analytics
                                    </strong>
                                    <small>
                                        Review performance and trends
                                    </small>
                                </div>
                                <span>
                                    →
                                </span>
                            </button>
                            <button
                                type="button"
                                className="card dashboard-quick-action-card"
                                onClick={() =>
                                    navigate(
                                        "/learning"
                                    )
                                }
                            >
                                <span>
                                    🎓
                                </span>
                                <div>
                                    <strong>
                                        Learning Center
                                    </strong>
                                    <small>
                                        Follow your personalized roadmap
                                    </small>
                                </div>
                                <span>
                                    →
                                </span>
                            </button>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
};
export default Dashboard;