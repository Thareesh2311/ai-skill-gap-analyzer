import {
    useEffect,
    useMemo,
    useState
} from "react";
import {
    useNavigate
} from "react-router-dom";
import learningService
    from "../services/learningService";
import "./learning.css";
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
const clampPercentage = (
    value
) => {
    return Math.max(
        0,
        Math.min(
            100,
            safeNumber(value)
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
            (character) =>
                character.toUpperCase()
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
        value?.name ||
        value?.title ||
        ""
    );
};
const getSkillName = (
    recommendation
) => {
    if (
        typeof recommendation?.skill ===
        "string"
    ) {
        return recommendation.skill;
    }
    return (
        recommendation
            ?.skill
            ?.name ||
        recommendation
            ?.skillName ||
        recommendation
            ?.name ||
        "Skill"
    );
};
const getResourceTypeLabel = (
    type
) => {
    const labels = {
        youtube:
            "YouTube",
        documentation:
            "Documentation",
        course:
            "Course",
        practice:
            "Practice",
        article:
            "Article",
        project:
            "Project",
        interview:
            "Interview Prep"
    };
    return (
        labels[type] ||
        titleCase(type)
    );
};
const getResourceIcon = (
    type
) => {
    const icons = {
        youtube:
            "▶",
        documentation:
            "📚",
        course:
            "🎓",
        practice:
            "💻",
        article:
            "📄",
        project:
            "🛠",
        interview:
            "🎯"
    };
    return (
        icons[type] ||
        "🔗"
    );
};
const getPriorityIcon = (
    priority
) => {
    switch (
        String(
            priority || ""
        ).toLowerCase()
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
const getAssessmentLabel = (
    type
) => {
    switch (
        String(
            type || ""
        ).toLowerCase()
    ) {
        case "sql":
            return "SQL Assessment";
        case "coding":
            return "Coding Assessment";
        case "mcq":
            return "MCQ Assessment";
        default:
            return "Assessment";
    }
};
const getProjectTitle = (
    project
) => {
    if (
        typeof project ===
        "string"
    ) {
        return project;
    }
    return (
        project?.title ||
        project?.name ||
        "Recommended Project"
    );
};
const getProjectDescription = (
    project
) => {
    if (
        typeof project ===
        "string"
    ) {
        return (
            "Build this project after completing the " +
            "recommended topics to demonstrate practical proficiency."
        );
    }
    return (
        project?.description ||
        "Apply your learning in a practical portfolio-ready project."
    );
};
const normalizeProgressKey = (
    value
) => {
    return String(
        value || ""
    )
        .trim()
        .replace(
            /\s+/g,
            " "
        )
        .toLowerCase();
};
const getResourceProgressKey = (
    resource
) => {
    return normalizeProgressKey(
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
const ProgressBar = ({
    value
}) => {
    const percentage =
        clampPercentage(value);
    return (
        <div className="learning-progress-bar">
            <div
                className="learning-progress-fill"
                style={{
                    width:
                        `${percentage}%`
                }}
            />
        </div>
    );
};
const ResourceCard = ({
    resource,
    completed = false,
    updating = false,
    onToggleComplete,
    onAccess
}) => {
    const [
        imageFailed,
        setImageFailed
    ] = useState(false);
    const type =
        resource?.type ||
        "resource";
    const showThumbnail =
        Boolean(
            resource
                ?.thumbnailUrl
        ) &&
        !imageFailed;
    return (
        <article
            className={
                `learning-resource-card ${
                    completed
                        ? "completed"
                        : ""
                }`
            }
        >
            {
                showThumbnail ? (
                    <div className="learning-resource-thumbnail">
                        <img
                            src={
                                resource
                                    .thumbnailUrl
                            }
                            alt={
                                resource
                                    ?.title ||
                                "Learning resource"
                            }
                            loading="lazy"
                            onError={() =>
                                setImageFailed(true)
                            }
                        />
                        {
                            type ===
                            "youtube" && (
                                <span className="learning-play-badge">
                                    ▶
                                </span>
                            )
                        }
                    </div>
                ) : (
                    <div className="learning-resource-placeholder">
                        <span>
                            {
                                getResourceIcon(
                                    type
                                )
                            }
                        </span>
                    </div>
                )
            }
            <div className="learning-resource-content">
                <div className="learning-resource-meta">
                    <span
                        className={
                            `learning-resource-type ${type}`
                        }
                    >
                        {
                            getResourceTypeLabel(
                                type
                            )
                        }
                    </span>
                    {
                        resource
                            ?.isFree !==
                            false && (
                            <span className="learning-free-badge">
                                Free
                            </span>
                        )
                    }
                    {
                        resource
                            ?.source ===
                            "youtube-api" && (
                            <span className="learning-live-youtube-badge">
                                YOUTUBE API
                            </span>
                        )
                    }
                    {
                        completed && (
                            <span className="learning-completed-badge">
                                ✓ Completed
                            </span>
                        )
                    }
                </div>
                <h4>
                    {
                        resource
                            ?.title ||
                        "Learning Resource"
                    }
                </h4>
                {
                    resource
                        ?.provider && (
                        <p className="learning-resource-provider">
                            By{" "}
                            <strong>
                                {
                                    resource
                                        .provider
                                }
                            </strong>
                        </p>
                    )
                }
                {
                    resource
                        ?.description && (
                        <p className="learning-resource-description">
                            {
                                resource
                                    .description
                            }
                        </p>
                    )
                }
                <div className="learning-resource-details">
                    {
                        resource
                            ?.duration && (
                            <span>
                                ⏱{" "}
                                {
                                    resource
                                        .duration
                                }
                            </span>
                        )
                    }
                    {
                        resource
                            ?.level && (
                            <span>
                                📊{" "}
                                {
                                    titleCase(
                                        resource
                                            .level
                                    )
                                }
                            </span>
                        )
                    }
                </div>
                {
                    safeArray(
                        resource
                            ?.tags
                    ).length >
                        0 && (
                        <div className="learning-resource-tags">
                            {
                                safeArray(
                                    resource
                                        ?.tags
                                )
                                    .slice(
                                        0,
                                        4
                                    )
                                    .map(
                                        (
                                            tag,
                                            index
                                        ) => (
                                            <span
                                                key={
                                                    `${tag}-${index}`
                                                }
                                            >
                                                {tag}
                                            </span>
                                        )
                                    )
                            }
                        </div>
                    )
                }
                {
                    resource
                        ?.url && (
                        <a
                            className="learning-resource-link"
                            href={
                                resource
                                    .url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                                if (
                                    onAccess
                                ) {
                                    onAccess(
                                        resource
                                    );
                                }
                            }}
                        >
                            {
                                type ===
                                "youtube"
                                    ? "Watch Video"
                                    : type ===
                                      "practice"
                                    ? "Start Practice"
                                    : type ===
                                      "documentation"
                                    ? "Read Documentation"
                                    : type ===
                                      "course"
                                    ? "Start Course"
                                    : "Open Resource"
                            }
                            <span>
                                ↗
                            </span>
                        </a>
                    )
                }
                <button
                    type="button"
                    className={
                        `learning-resource-complete-btn ${
                            completed
                                ? "completed"
                                : ""
                        }`
                    }
                    disabled={
                        updating
                    }
                    onClick={() =>
                        onToggleComplete?.(
                            resource,
                            !completed
                        )
                    }
                >
                    {
                        completed
                            ? "✓ Completed"
                            : "Mark as Completed"
                    }
                </button>
            </div>
        </article>
    );
};
const Learning = () => {
    const navigate =
        useNavigate();
    const resumeId =
        localStorage.getItem(
            "resumeId"
        ) || "";
    const [
        learningPlan,
        setLearningPlan
    ] = useState(null);
    const [
        loading,
        setLoading
    ] = useState(true);
    const [
        refreshing,
        setRefreshing
    ] = useState(false);
    const [
        error,
        setError
    ] = useState("");
    const [
        selectedSkillIndex,
        setSelectedSkillIndex
    ] = useState(0);
    const [
        resourceFilter,
        setResourceFilter
    ] = useState("all");
    const [
        resourceSearch,
        setResourceSearch
    ] = useState("");
    const [
        liveYouTubeResources,
        setLiveYouTubeResources
    ] = useState([]);
    const [
        youtubeLoading,
        setYoutubeLoading
    ] = useState(false);
    const [
        youtubeSource,
        setYoutubeSource
    ] = useState("");
    const [
        learningProgress,
        setLearningProgress
    ] = useState(null);
    const [
        progressUpdating,
        setProgressUpdating
    ] = useState(false);
    const normalizeProgressResponse =
        (
            response
        ) => {
            return (
                response
                    ?.data ||
                response ||
                null
            );
        };
    const syncProgressForPlan =
        async (
            plan
        ) => {
            try {
                const response =
                    await learningService
                        .syncLearningProgress(
                            resumeId,
                            safeArray(
                                plan
                                    ?.recommendedSkills
                            )
                        );
                const progress =
                    normalizeProgressResponse(
                        response
                    );
                setLearningProgress(
                    progress
                );
                return progress;
            } catch (
                progressError
            ) {
                console.error(
                    "Learning progress sync error:",
                    progressError
                );
                try {
                    const existingResponse =
                        await learningService
                            .getLearningProgress(
                                resumeId
                            );
                    const existingProgress =
                        normalizeProgressResponse(
                            existingResponse
                        );
                    setLearningProgress(
                        existingProgress
                    );
                    return existingProgress;
                } catch (
                    loadProgressError
                ) {
                    console.error(
                        "Learning progress load error:",
                        loadProgressError
                    );
                    setLearningProgress(
                        null
                    );
                    return null;
                }
            }
        };
    const loadLearningPlan =
        async (
            isRefresh = false
        ) => {
            if (
                !resumeId
            ) {
                setLoading(
                    false
                );
                return;
            }
            try {
                if (
                    isRefresh
                ) {
                    setRefreshing(
                        true
                    );
                } else {
                    setLoading(
                        true
                    );
                }
                setError(
                    ""
                );
                const response =
                    await learningService
                        .getLearningPlan(
                            resumeId,
                            {
                                maxSkills:
                                    5,
                                resourcesPerSkill:
                                    8
                            }
                        );
                const plan =
                    learningService
                        .normalizeLearningPlan(
                            response
                        );
                setLearningPlan(
                    plan
                );
                await syncProgressForPlan(
                    plan
                );
                setSelectedSkillIndex(
                    0
                );
                setResourceFilter(
                    "all"
                );
                setResourceSearch(
                    ""
                );
            } catch (
                requestError
            ) {
                console.error(
                    "Learning plan error:",
                    requestError
                );
                setError(
                    requestError
                        ?.response
                        ?.data
                        ?.message ||
                    requestError
                        ?.message ||
                    "Failed to load your personalized learning plan."
                );
            } finally {
                setLoading(
                    false
                );
                setRefreshing(
                    false
                );
            }
        };
    useEffect(
        () => {
            loadLearningPlan();
        },
        [
            resumeId
        ]
    );
    const resume =
        learningPlan
            ?.resume ||
        {};
    const target =
        learningPlan
            ?.target ||
        {};
    const readiness =
        learningPlan
            ?.jobReadiness ||
        {};
    const recommendedSkills =
        safeArray(
            learningPlan
                ?.recommendedSkills
        );
    const readySkills =
        safeArray(
            learningPlan
                ?.readySkills
        );
    const topPriority =
        learningPlan
            ?.topPriority ||
        recommendedSkills[0] ||
        null;
    const targetRole =
        getEntityName(
            target
                ?.role
        ) ||
        getEntityName(
            resume
                ?.role
        ) ||
        learningPlan
            ?.targetRole ||
        "Target Role";
    const targetCompany =
        getEntityName(
            target
                ?.company
        ) ||
        getEntityName(
            resume
                ?.company
        ) ||
        learningPlan
            ?.targetCompany ||
        "";
    const selectedSkill =
        recommendedSkills[
            selectedSkillIndex
        ] ||
        topPriority ||
        null;
    const selectedSkillName =
        getSkillName(
            selectedSkill
        );
    const progressSkills =
        safeArray(
            learningProgress
                ?.skills
        );
    const selectedSkillProgress =
        useMemo(
            () => {
                if (
                    !selectedSkill
                ) {
                    return null;
                }
                const selectedId =
                    selectedSkill
                        ?.skill
                        ?.id ||
                    selectedSkill
                        ?.skill
                        ?._id;
                return (
                    progressSkills.find(
                        (
                            progress
                        ) => {
                            const progressId =
                                progress
                                    ?.skill
                                    ?.id;
                            if (
                                selectedId &&
                                progressId &&
                                String(
                                    selectedId
                                ) ===
                                String(
                                    progressId
                                )
                            ) {
                                return true;
                            }
                            return (
                                normalizeProgressKey(
                                    progress
                                        ?.skill
                                        ?.name
                                ) ===
                                normalizeProgressKey(
                                    selectedSkillName
                                )
                            );
                        }
                    ) ||
                    null
                );
            },
            [
                progressSkills,
                selectedSkill,
                selectedSkillName
            ]
        );
    const refreshProgressFromResponse =
        (
            response
        ) => {
            const progress =
                normalizeProgressResponse(
                    response
                );
            if (
                progress
            ) {
                setLearningProgress(
                    progress
                );
            }
        };
    const handleStartSkill =
        async () => {
            if (
                !selectedSkill ||
                !resumeId
            ) {
                return;
            }
            try {
                setProgressUpdating(
                    true
                );
                setError(
                    ""
                );
                const response =
                    await learningService
                        .startSkillProgress(
                            resumeId,
                            selectedSkillName
                        );
                refreshProgressFromResponse(
                    response
                );
            } catch (
                progressError
            ) {
                console.error(
                    "Start skill progress error:",
                    progressError
                );
                setError(
                    progressError
                        ?.response
                        ?.data
                        ?.message ||
                    "Unable to start learning progress."
                );
            } finally {
                setProgressUpdating(
                    false
                );
            }
        };
    const updateProgressItem =
        async ({
            itemType,
            key,
            completed,
            item = {}
        }) => {
            if (
                !selectedSkill ||
                !resumeId
            ) {
                return;
            }
            try {
                setProgressUpdating(
                    true
                );
                setError(
                    ""
                );
                const response =
                    await learningService
                        .updateLearningItem(
                            resumeId,
                            selectedSkillName,
                            {
                                itemType,
                                key,
                                completed,
                                item
                            }
                        );
                refreshProgressFromResponse(
                    response
                );
            } catch (
                progressError
            ) {
                console.error(
                    "Update learning progress error:",
                    progressError
                );
                setError(
                    progressError
                        ?.response
                        ?.data
                        ?.message ||
                    "Unable to update learning progress."
                );
            } finally {
                setProgressUpdating(
                    false
                );
            }
        };
    const handleResourceAccess =
        async (
            resource
        ) => {
            if (
                !resumeId ||
                !selectedSkill
            ) {
                return;
            }
            const key =
                getResourceProgressKey(
                    resource
                );
            if (
                !key
            ) {
                return;
            }
            try {
                const response =
                    await learningService
                        .markResourceAccessed(
                            resumeId,
                            selectedSkillName,
                            {
                                key,
                                item:
                                    resource
                            }
                        );
                refreshProgressFromResponse(
                    response
                );
            } catch (
                accessError
            ) {
                console.warn(
                    "Resource access tracking failed:",
                    accessError
                );
            }
        };
    useEffect(
        () => {
            let active =
                true;
            const loadLiveYouTube =
                async () => {
                    setLiveYouTubeResources(
                        []
                    );
                    setYoutubeSource(
                        ""
                    );
                    if (
                        !selectedSkill
                    ) {
                        setYoutubeLoading(
                            false
                        );
                        return;
                    }
                    const skillName =
                        getSkillName(
                            selectedSkill
                        );
                    if (
                        !skillName ||
                        skillName ===
                        "Skill"
                    ) {
                        setYoutubeLoading(
                            false
                        );
                        return;
                    }
                    try {
                        setYoutubeLoading(
                            true
                        );
                        const response =
                            await learningService
                                .getLiveYouTubeResources(
                                    skillName,
                                    {
                                        topics:
                                            safeArray(
                                                selectedSkill
                                                    ?.topics
                                            )
                                                .slice(
                                                    0,
                                                    3
                                                ),
                                        level:
                                            selectedSkill
                                                ?.learningLevel ||
                                            "all",
                                        limit:
                                            6
                                    }
                                );
                        if (
                            !active
                        ) {
                            return;
                        }
                        const result =
                            response
                                ?.data ||
                            response ||
                            {};
                        setLiveYouTubeResources(
                            safeArray(
                                result
                                    ?.resources
                            )
                        );
                        setYoutubeSource(
                            result
                                ?.source ||
                            ""
                        );
                    } catch (
                        youtubeError
                    ) {
                        console.error(
                            "YouTube resources error:",
                            youtubeError
                        );
                        if (
                            active
                        ) {
                            setLiveYouTubeResources(
                                []
                            );
                            setYoutubeSource(
                                ""
                            );
                        }
                    } finally {
                        if (
                            active
                        ) {
                            setYoutubeLoading(
                                false
                            );
                        }
                    }
                };
            loadLiveYouTube();
            return () => {
                active =
                    false;
            };
        },
        [
            selectedSkill
        ]
    );
    const selectedResources =
        useMemo(
            () => {
                const curated =
                    safeArray(
                        selectedSkill
                            ?.resources
                    );
                const combined = [
                    ...liveYouTubeResources,
                    ...curated
                ];
                const seen =
                    new Set();
                return combined.filter(
                    (
                        resource
                    ) => {
                        const identity =
                            getResourceProgressKey(
                                resource
                            );
                        if (
                            !identity
                        ) {
                            return true;
                        }
                        if (
                            seen.has(
                                identity
                            )
                        ) {
                            return false;
                        }
                        seen.add(
                            identity
                        );
                        return true;
                    }
                );
            },
            [
                selectedSkill,
                liveYouTubeResources
            ]
        );
    const availableResourceTypes =
        useMemo(
            () => {
                return [
                    ...new Set(
                        selectedResources
                            .map(
                                (
                                    resource
                                ) =>
                                    resource
                                        ?.type
                            )
                            .filter(
                                Boolean
                            )
                    )
                ];
            },
            [
                selectedResources
            ]
        );
    const filteredResources =
        useMemo(
            () => {
                const query =
                    resourceSearch
                        .trim()
                        .toLowerCase();
                return selectedResources
                    .filter(
                        (
                            resource
                        ) => {
                            if (
                                resourceFilter !==
                                    "all" &&
                                resource
                                    ?.type !==
                                    resourceFilter
                            ) {
                                return false;
                            }
                            if (
                                !query
                            ) {
                                return true;
                            }
                            const searchable =
                                [
                                    resource
                                        ?.title,
                                    resource
                                        ?.provider,
                                    resource
                                        ?.topic,
                                    resource
                                        ?.description,
                                    ...safeArray(
                                        resource
                                            ?.tags
                                    )
                                ]
                                    .filter(
                                        Boolean
                                    )
                                    .join(" ")
                                    .toLowerCase();
                            return searchable
                                .includes(
                                    query
                                );
                        }
                    );
            },
            [
                selectedResources,
                resourceFilter,
                resourceSearch
            ]
        );
    const handleSelectSkill =
        (
            index
        ) => {
            setSelectedSkillIndex(
                index
            );
            setResourceFilter(
                "all"
            );
            setResourceSearch(
                ""
            );
            window.scrollTo({
                top:
                    450,
                behavior:
                    "smooth"
            });
        };
    const handleAssessment =
        (
            recommendation
        ) => {
            const type =
                recommendation
                    ?.recommendedAssessment ||
                "mcq";
            localStorage.setItem(
                "selectedAssessmentType",
                type
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
            navigate(
                "/assessments"
            );
        };
    const roadmapDuration =
        learningPlan
            ?.roadmapDuration ||
        learningPlan
            ?.estimatedDuration ||
        "—";
    const overallLearningPercentage =
        clampPercentage(
            learningProgress
                ?.summary
                ?.overallPercentage
        );
    const overallCompletedItems =
        safeNumber(
            learningProgress
                ?.summary
                ?.completedItems
        );
    const overallTotalItems =
        safeNumber(
            learningProgress
                ?.summary
                ?.totalItems
        );
    if (
        !resumeId
    ) {
        return (
            <div className="learning-state-page">
                <div className="learning-state-card">
                    <div className="learning-state-icon">
                        📄
                    </div>
                    <h2>
                        Analyze Your Resume First
                    </h2>
                    <p>
                        Upload and analyze a resume
                        before generating your
                        personalized learning roadmap.
                    </p>
                    <button
                        type="button"
                        className="learning-primary-btn"
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
        loading
    ) {
        return (
            <div className="learning-state-page">
                <div className="learning-state-card">
                    <div className="learning-spinner" />
                    <h2>
                        Building Your Learning Plan
                    </h2>
                    <p>
                        Analyzing job requirements,
                        assessment performance,
                        skill gaps, learning resources
                        and your saved progress...
                    </p>
                </div>
            </div>
        );
    }
    if (
        error &&
        !learningPlan
    ) {
        return (
            <div className="learning-state-page">
                <div className="learning-state-card">
                    <div className="learning-state-icon error">
                        !
                    </div>
                    <h2>
                        Learning Plan Unavailable
                    </h2>
                    <p>
                        {error}
                    </p>
                    <button
                        type="button"
                        className="learning-primary-btn"
                        onClick={() =>
                            loadLearningPlan(
                                true
                            )
                        }
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }
    return (
        <div className="learning-page">
            <div className="learning-container">
                <header className="learning-header">
                    <div>
                        <span className="learning-kicker">
                            PERSONALIZED DEVELOPMENT
                        </span>
                        <h1>
                            Your{" "}
                            <span>
                                Learning Roadmap
                            </span>
                        </h1>
                        <p>
                            Follow a personalized path
                            based on your resume,
                            target role, skill gaps,
                            assessment performance and
                            persistent learning progress.
                        </p>
                    </div>
                    <div className="learning-header-actions">
                        <button
                            type="button"
                            className="learning-secondary-btn"
                            onClick={() =>
                                navigate(
                                    "/analytics"
                                )
                            }
                        >
                            Analytics
                        </button>
                        <button
                            type="button"
                            className="learning-refresh-btn"
                            disabled={
                                refreshing
                            }
                            onClick={() =>
                                loadLearningPlan(
                                    true
                                )
                            }
                        >
                            {
                                refreshing
                                    ? "Refreshing..."
                                    : "↻ Refresh Plan"
                            }
                        </button>
                    </div>
                </header>
                {
                    error && (
                        <div className="learning-error-banner">
                            <span>
                                !
                            </span>
                            <p>
                                {error}
                            </p>
                        </div>
                    )
                }
                <section className="learning-summary-grid">
                    <div className="learning-summary-card">
                        <span>
                            Job Readiness
                        </span>
                        <strong>
                            {
                                Math.round(
                                    clampPercentage(
                                        readiness
                                            ?.score
                                    )
                                )
                            }%
                        </strong>
                        <small>
                            {
                                readiness
                                    ?.level ||
                                "Not calculated"
                            }
                        </small>
                    </div>
                    <div className="learning-summary-card">
                        <span>
                            Resume Coverage
                        </span>
                        <strong>
                            {
                                Math.round(
                                    clampPercentage(
                                        readiness
                                            ?.resumeCoverage ??
                                        resume
                                            ?.coverageScore
                                    )
                                )
                            }%
                        </strong>
                        <small>
                            Job requirement coverage
                        </small>
                    </div>
                    <div className="learning-summary-card">
                        <span>
                            Priority Skills
                        </span>
                        <strong>
                            {
                                recommendedSkills
                                    .length
                            }
                        </strong>
                        <small>
                            Skills requiring attention
                        </small>
                    </div>
                    <div className="learning-summary-card">
                        <span>
                            Roadmap Duration
                        </span>
                        <strong className="learning-duration-value">
                            {roadmapDuration}
                        </strong>
                        <small>
                            Estimated learning path
                        </small>
                    </div>
                    <div className="learning-summary-card learning-progress-summary-card">
                        <span>
                            Learning Progress
                        </span>
                        <strong>
                            {
                                Math.round(
                                    overallLearningPercentage
                                )
                            }%
                        </strong>
                        <ProgressBar
                            value={
                                overallLearningPercentage
                            }
                        />
                        <small>
                            {
                                overallCompletedItems
                            }
                            {" / "}
                            {
                                overallTotalItems
                            }
                            {" "}items completed
                        </small>
                    </div>
                </section>
                <section className="learning-target-card">
                    <div className="learning-target-icon">
                        🎯
                    </div>
                    <div>
                        <span className="learning-section-label">
                            TARGET
                        </span>
                        <h2>
                            {targetRole}
                        </h2>
                        <p>
                            {
                                targetCompany
                                    ? `Target company: ${targetCompany}`
                                    : "Personalized career preparation"
                            }
                        </p>
                    </div>
                    <div className="learning-target-stats">
                        <div>
                            <strong>
                                {
                                    safeNumber(
                                        resume
                                            ?.matchedSkillCount
                                    )
                                }
                            </strong>
                            <span>
                                Matched
                            </span>
                        </div>
                        <div>
                            <strong>
                                {
                                    safeNumber(
                                        resume
                                            ?.missingSkillCount
                                    )
                                }
                            </strong>
                            <span>
                                Missing
                            </span>
                        </div>
                    </div>
                </section>
                <section className="learning-ai-summary">
                    <div className="learning-ai-summary-icon">
                        🤖
                    </div>
                    <div>
                        <span className="learning-section-label">
                            ROADMAP SUMMARY
                        </span>
                        <h2>
                            Recommended Learning Strategy
                        </h2>
                        <p>
                            {
                                learningPlan
                                    ?.summary ||
                                "Complete your priority learning resources, practice consistently, build practical projects and retake assessments to measure improvement."
                            }
                        </p>
                    </div>
                </section>
                {
                    recommendedSkills
                        .length ===
                        0 ? (
                        <section className="learning-complete-card">
                            <div className="learning-complete-icon">
                                ✓
                            </div>
                            <h2>
                                No Major Skill Gaps Detected
                            </h2>
                            <p>
                                Your current profile does
                                not contain major priority
                                gaps for the selected role.
                                Continue with advanced
                                practice, projects and
                                periodic assessments.
                            </p>
                            <button
                                type="button"
                                className="learning-primary-btn"
                                onClick={() =>
                                    navigate(
                                        "/assessments"
                                    )
                                }
                            >
                                Take Assessment
                            </button>
                        </section>
                    ) : (
                        <>
                            <section className="learning-section">
                                <div className="learning-section-header">
                                    <div>
                                        <span className="learning-section-label">
                                            PRIORITY ROADMAP
                                        </span>
                                        <h2>
                                            Skills To Improve
                                        </h2>
                                        <p>
                                            Skills are ordered
                                            using job importance,
                                            assessment gaps,
                                            required proficiency
                                            and resume coverage.
                                        </p>
                                    </div>
                                </div>
                                <div className="learning-priority-grid">
                                    {
                                        recommendedSkills.map(
                                            (
                                                skill,
                                                index
                                            ) => {
                                                const score =
                                                    clampPercentage(
                                                        skill
                                                            ?.assessment
                                                            ?.effectiveScore
                                                    );
                                                const targetScore =
                                                    clampPercentage(
                                                        skill
                                                            ?.assessment
                                                            ?.targetScore
                                                    );
                                                const skillName =
                                                    getSkillName(
                                                        skill
                                                    );
                                                const trackedSkill =
                                                    progressSkills.find(
                                                        (
                                                            progress
                                                        ) =>
                                                            normalizeProgressKey(
                                                                progress
                                                                    ?.skill
                                                                    ?.name
                                                            ) ===
                                                            normalizeProgressKey(
                                                                skillName
                                                            )
                                                    );
                                                const trackedPercentage =
                                                    clampPercentage(
                                                        trackedSkill
                                                            ?.progress
                                                            ?.overallPercentage
                                                    );
                                                return (
                                                    <button
                                                        type="button"
                                                        className={
                                                            `learning-priority-card ${
                                                                selectedSkillIndex ===
                                                                index
                                                                    ? "active"
                                                                    : ""
                                                            }`
                                                        }
                                                        key={
                                                            skill
                                                                ?.skill
                                                                ?.id ||
                                                            `${skillName}-${index}`
                                                        }
                                                        onClick={() =>
                                                            handleSelectSkill(
                                                                index
                                                            )
                                                        }
                                                    >
                                                        <div className="learning-priority-top">
                                                            <div>
                                                                <span
                                                                    className={
                                                                        `learning-priority-badge ${
                                                                            skill
                                                                                ?.priority ||
                                                                            "low"
                                                                        }`
                                                                    }
                                                                >
                                                                    {
                                                                        getPriorityIcon(
                                                                            skill
                                                                                ?.priority
                                                                        )
                                                                    }
                                                                    {" "}
                                                                    {
                                                                        titleCase(
                                                                            skill
                                                                                ?.priority ||
                                                                            "Priority"
                                                                        )
                                                                    }
                                                                </span>
                                                                <h3>
                                                                    {skillName}
                                                                </h3>
                                                            </div>
                                                            <strong className="learning-priority-number">
                                                                {
                                                                    safeNumber(
                                                                        skill
                                                                            ?.priorityScore
                                                                    )
                                                                }
                                                            </strong>
                                                        </div>
                                                        <div className="learning-priority-score-row">
                                                            <span>
                                                                Current
                                                            </span>
                                                            <strong>
                                                                {
                                                                    skill
                                                                        ?.assessment
                                                                        ?.hasData
                                                                        ? `${Math.round(
                                                                            score
                                                                        )}%`
                                                                        : "Not assessed"
                                                                }
                                                            </strong>
                                                        </div>
                                                        <ProgressBar
                                                            value={
                                                                score
                                                            }
                                                        />
                                                        <div className="learning-priority-target">
                                                            <span>
                                                                Target:{" "}
                                                                <strong>
                                                                    {
                                                                        Math.round(
                                                                            targetScore
                                                                        )
                                                                    }%
                                                                </strong>
                                                            </span>
                                                            <span>
                                                                Gap:{" "}
                                                                <strong>
                                                                    {
                                                                        Math.round(
                                                                            clampPercentage(
                                                                                skill
                                                                                    ?.assessment
                                                                                    ?.scoreGap
                                                                            )
                                                                        )
                                                                    }%
                                                                </strong>
                                                            </span>
                                                        </div>
                                                        {/* =================================
                                                            LEARNING PROGRESS
                                                        ================================= */}
                                                        <div className="learning-priority-progress">
                                                            <div>
                                                                <span>
                                                                    Learning
                                                                </span>
                                                                <strong>
                                                                    {
                                                                        Math.round(
                                                                            trackedPercentage
                                                                        )
                                                                    }%
                                                                </strong>
                                                            </div>
                                                            <ProgressBar
                                                                value={
                                                                    trackedPercentage
                                                                }
                                                            />
                                                        </div>
                                                        <div className="learning-priority-footer">
                                                            <span>
                                                                ⏱{" "}
                                                                {
                                                                    skill
                                                                        ?.estimatedDuration ||
                                                                    "Self paced"
                                                                }
                                                            </span>
                                                            <span>
                                                                {
                                                                    titleCase(
                                                                        trackedSkill
                                                                            ?.status ||
                                                                        skill
                                                                            ?.requiredLevel
                                                                    )
                                                                }
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            }
                                        )
                                    }
                                </div>
                            </section>
                            {
                                selectedSkill && (
                                    <section className="learning-skill-detail">
                                        <div className="learning-skill-detail-header">
                                            <div>
                                                <span className="learning-section-label">
                                                    CURRENT FOCUS
                                                </span>
                                                <h2>
                                                    {
                                                        selectedSkillName
                                                    }
                                                </h2>
                                                <p>
                                                    {
                                                        selectedSkill
                                                            ?.reason ||
                                                        "Complete the recommended topics and practical resources to improve this skill."
                                                    }
                                                </p>
                                            </div>
                                            <div className="learning-focus-priority">
                                                <span>
                                                    Priority Score
                                                </span>
                                                <strong>
                                                    {
                                                        safeNumber(
                                                            selectedSkill
                                                                ?.priorityScore
                                                        )
                                                    }
                                                    /100
                                                </strong>
                                            </div>
                                        </div>
                                        <div className="learning-skill-progress-panel">
                                            <div className="learning-skill-progress-summary">
                                                <div>
                                                    <span>
                                                        Learning Progress
                                                    </span>
                                                    <strong>
                                                        {
                                                            Math.round(
                                                                clampPercentage(
                                                                    selectedSkillProgress
                                                                        ?.progress
                                                                        ?.overallPercentage
                                                                )
                                                            )
                                                        }%
                                                    </strong>
                                                </div>
                                                <ProgressBar
                                                    value={
                                                        selectedSkillProgress
                                                            ?.progress
                                                            ?.overallPercentage
                                                    }
                                                />
                                                <small>
                                                    {
                                                        safeNumber(
                                                            selectedSkillProgress
                                                                ?.progress
                                                                ?.completedItems
                                                        )
                                                    }
                                                    {" / "}
                                                    {
                                                        safeNumber(
                                                            selectedSkillProgress
                                                                ?.progress
                                                                ?.totalItems
                                                        )
                                                    }
                                                    {" "}items completed
                                                </small>
                                            </div>
                                            <div className="learning-progress-category-grid">
                                                <div>
                                                    <span>
                                                        Topics
                                                    </span>
                                                    <strong>
                                                        {
                                                            Math.round(
                                                                clampPercentage(
                                                                    selectedSkillProgress
                                                                        ?.progress
                                                                        ?.topicPercentage
                                                                )
                                                            )
                                                        }%
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span>
                                                        Resources
                                                    </span>
                                                    <strong>
                                                        {
                                                            Math.round(
                                                                clampPercentage(
                                                                    selectedSkillProgress
                                                                        ?.progress
                                                                        ?.resourcePercentage
                                                                )
                                                            )
                                                        }%
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span>
                                                        Projects
                                                    </span>
                                                    <strong>
                                                        {
                                                            Math.round(
                                                                clampPercentage(
                                                                    selectedSkillProgress
                                                                        ?.progress
                                                                        ?.projectPercentage
                                                                )
                                                            )
                                                        }%
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span>
                                                        Status
                                                    </span>
                                                    <strong>
                                                        {
                                                            titleCase(
                                                                selectedSkillProgress
                                                                    ?.status ||
                                                                "Not Started"
                                                            )
                                                        }
                                                    </strong>
                                                </div>
                                            </div>
                                            {
                                                (
                                                    !selectedSkillProgress
                                                        ?.startedAt &&
                                                    selectedSkillProgress
                                                        ?.status !==
                                                        "completed"
                                                ) && (
                                                    <button
                                                        type="button"
                                                        className="learning-start-skill-btn"
                                                        disabled={
                                                            progressUpdating
                                                        }
                                                        onClick={
                                                            handleStartSkill
                                                        }
                                                    >
                                                        {
                                                            progressUpdating
                                                                ? "Starting..."
                                                                : "Start Learning →"
                                                        }
                                                    </button>
                                                )
                                            }
                                        </div>
                                        <div className="learning-score-grid">
                                            <div className="learning-score-card">
                                                <span>
                                                    Current Level
                                                </span>
                                                <strong>
                                                    {
                                                        selectedSkill
                                                            ?.assessment
                                                            ?.hasData
                                                            ? `${Math.round(
                                                                clampPercentage(
                                                                    selectedSkill
                                                                        ?.assessment
                                                                        ?.currentScore
                                                                )
                                                            )}%`
                                                            : "Not Assessed"
                                                    }
                                                </strong>
                                                <small>
                                                    Assessment performance
                                                </small>
                                            </div>
                                            <div className="learning-score-card">
                                                <span>
                                                    Target Score
                                                </span>
                                                <strong>
                                                    {
                                                        Math.round(
                                                            clampPercentage(
                                                                selectedSkill
                                                                    ?.assessment
                                                                    ?.targetScore
                                                            )
                                                        )
                                                    }%
                                                </strong>
                                                <small>
                                                    Role proficiency target
                                                </small>
                                            </div>
                                            <div className="learning-score-card">
                                                <span>
                                                    Job Importance
                                                </span>
                                                <strong>
                                                    {
                                                        safeNumber(
                                                            selectedSkill
                                                                ?.importance
                                                        )
                                                    }
                                                    /100
                                                </strong>
                                                <small>
                                                    Requirement importance
                                                </small>
                                            </div>
                                            <div className="learning-score-card">
                                                <span>
                                                    Learning Level
                                                </span>
                                                <strong className="learning-level-value">
                                                    {
                                                        titleCase(
                                                            selectedSkill
                                                                ?.learningLevel
                                                        )
                                                    }
                                                </strong>
                                                <small>
                                                    Recommended difficulty
                                                </small>
                                            </div>
                                        </div>
                                        <div className="learning-two-column">
                                            <div className="learning-detail-card">
                                                <span className="learning-section-label">
                                                    LEARNING PATH
                                                </span>
                                                <h3>
                                                    Topics To Master
                                                </h3>
                                                <div className="learning-topic-list">
                                                    {
                                                        safeArray(
                                                            selectedSkill
                                                                ?.topics
                                                        ).map(
                                                            (
                                                                topic,
                                                                index
                                                            ) => {
                                                                const topicKey =
                                                                    normalizeProgressKey(
                                                                        topic
                                                                    );
                                                                const topicProgress =
                                                                    safeArray(
                                                                        selectedSkillProgress
                                                                            ?.topics
                                                                    ).find(
                                                                        (
                                                                            item
                                                                        ) =>
                                                                            item
                                                                                ?.key ===
                                                                            topicKey
                                                                    );
                                                                const topicCompleted =
                                                                    Boolean(
                                                                        topicProgress
                                                                            ?.isCompleted
                                                                    );
                                                                return (
                                                                    <button
                                                                        type="button"
                                                                        className={
                                                                            `learning-topic-item learning-progress-topic ${
                                                                                topicCompleted
                                                                                    ? "completed"
                                                                                    : ""
                                                                            }`
                                                                        }
                                                                        key={
                                                                            `${topic}-${index}`
                                                                        }
                                                                        disabled={
                                                                            progressUpdating
                                                                        }
                                                                        onClick={() =>
                                                                            updateProgressItem({
                                                                                itemType:
                                                                                    "topic",
                                                                                key:
                                                                                    topic,
                                                                                completed:
                                                                                    !topicCompleted,
                                                                                item: {
                                                                                    name:
                                                                                        topic
                                                                                }
                                                                            })
                                                                        }
                                                                    >
                                                                        <span className="learning-topic-number">
                                                                            {
                                                                                topicCompleted
                                                                                    ? "✓"
                                                                                    : index + 1
                                                                            }
                                                                        </span>
                                                                        <span>
                                                                            {topic}
                                                                        </span>
                                                                        <span className="learning-topic-status">
                                                                            {
                                                                                topicCompleted
                                                                                    ? "Completed"
                                                                                    : "Mark complete"
                                                                            }
                                                                        </span>
                                                                    </button>
                                                                );
                                                            }
                                                        )
                                                    }
                                                </div>
                                            </div>
                                            <div className="learning-detail-card learning-next-action-card">
                                                <span className="learning-section-label">
                                                    NEXT ACTION
                                                </span>
                                                <h3>
                                                    {
                                                        getAssessmentLabel(
                                                            selectedSkill
                                                                ?.recommendedAssessment
                                                        )
                                                    }
                                                </h3>
                                                <p>
                                                    {
                                                        selectedSkill
                                                            ?.nextAction ||
                                                        "Complete the recommended learning resources and assess your progress."
                                                    }
                                                </p>
                                                <div className="learning-action-meta">
                                                    <span>
                                                        Estimated learning:{" "}
                                                        <strong>
                                                            {
                                                                selectedSkill
                                                                    ?.estimatedDuration ||
                                                                "Self paced"
                                                            }
                                                        </strong>
                                                    </span>
                                                    <span>
                                                        Learning completed:{" "}
                                                        <strong>
                                                            {
                                                                Math.round(
                                                                    clampPercentage(
                                                                        selectedSkillProgress
                                                                            ?.progress
                                                                            ?.overallPercentage
                                                                    )
                                                                )
                                                            }%
                                                        </strong>
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="learning-primary-btn"
                                                    onClick={() =>
                                                        handleAssessment(
                                                            selectedSkill
                                                        )
                                                    }
                                                >
                                                    Take{" "}
                                                    {
                                                        getAssessmentLabel(
                                                            selectedSkill
                                                                ?.recommendedAssessment
                                                        )
                                                    }
                                                    {" →"}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="learning-resources-section">
                                            <div className="learning-section-header learning-resource-section-header">
                                                <div>
                                                    <span className="learning-section-label">
                                                        RECOMMENDED RESOURCES
                                                    </span>
                                                    <h2>
                                                        Recommended Resources
                                                    </h2>
                                                    <p>
                                                        Live YouTube
                                                        recommendations,
                                                        curated documentation,
                                                        courses, practice
                                                        platforms and projects
                                                        matched to your current
                                                        skill level.
                                                    </p>
                                                </div>
                                                <div className="learning-resource-count">
                                                    <strong>
                                                        {
                                                            selectedResources
                                                                .length
                                                        }
                                                    </strong>
                                                    <span>
                                                        Resources
                                                    </span>
                                                </div>
                                            </div>
                                            {
                                                youtubeLoading && (
                                                    <div className="learning-youtube-status">
                                                        <span className="learning-youtube-mini-spinner" />
                                                        <span>
                                                            Finding current YouTube resources...
                                                        </span>
                                                    </div>
                                                )
                                            }
                                            {
                                                !youtubeLoading &&
                                                liveYouTubeResources.length >
                                                    0 && (
                                                    <div className="learning-youtube-source">
                                                        <span>
                                                            ▶
                                                        </span>
                                                        <p>
                                                            YouTube recommendations
                                                            loaded from{" "}
                                                            <strong>
                                                                {
                                                                    youtubeSource ===
                                                                    "youtube-api"
                                                                        ? "live YouTube search"
                                                                        : youtubeSource ===
                                                                          "youtube-cache"
                                                                        ? "recent YouTube cache"
                                                                        : youtubeSource ===
                                                                          "youtube-stale-cache"
                                                                        ? "cached YouTube results"
                                                                        : youtubeSource ===
                                                                          "curated-fallback"
                                                                        ? "curated fallback"
                                                                        : "YouTube recommendations"
                                                                }
                                                            </strong>
                                                        </p>
                                                    </div>
                                                )
                                            }
                                            {
                                                selectedResources
                                                    .length >
                                                    0 && (
                                                    <div className="learning-resource-toolbar">
                                                        <div className="learning-resource-filters">
                                                            <button
                                                                type="button"
                                                                className={
                                                                    resourceFilter ===
                                                                    "all"
                                                                        ? "active"
                                                                        : ""
                                                                }
                                                                onClick={() =>
                                                                    setResourceFilter(
                                                                        "all"
                                                                    )
                                                                }
                                                            >
                                                                All
                                                            </button>
                                                            {
                                                                availableResourceTypes.map(
                                                                    (
                                                                        type
                                                                    ) => (
                                                                        <button
                                                                            type="button"
                                                                            className={
                                                                                resourceFilter ===
                                                                                type
                                                                                    ? "active"
                                                                                    : ""
                                                                            }
                                                                            key={
                                                                                type
                                                                            }
                                                                            onClick={() =>
                                                                                setResourceFilter(
                                                                                    type
                                                                                )
                                                                            }
                                                                        >
                                                                            {
                                                                                getResourceIcon(
                                                                                    type
                                                                                )
                                                                            }
                                                                            {" "}
                                                                            {
                                                                                getResourceTypeLabel(
                                                                                    type
                                                                                )
                                                                            }
                                                                        </button>
                                                                    )
                                                                )
                                                            }
                                                        </div>
                                                        <div className="learning-resource-search">
                                                            <span>
                                                                ⌕
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={
                                                                    resourceSearch
                                                                }
                                                                placeholder="Search resources..."
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    setResourceSearch(
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            {
                                                filteredResources
                                                    .length >
                                                    0 ? (
                                                    <div className="learning-resource-grid">
                                                        {
                                                            filteredResources.map(
                                                                (
                                                                    resource,
                                                                    index
                                                                ) => {
                                                                    const resourceKey =
                                                                        getResourceProgressKey(
                                                                            resource
                                                                        );
                                                                    const trackedResource =
                                                                        safeArray(
                                                                            selectedSkillProgress
                                                                                ?.resources
                                                                        ).find(
                                                                            (
                                                                                item
                                                                            ) =>
                                                                                item
                                                                                    ?.key ===
                                                                                resourceKey
                                                                        );
                                                                    const completed =
                                                                        Boolean(
                                                                            trackedResource
                                                                                ?.isCompleted
                                                                        );
                                                                    return (
                                                                        <ResourceCard
                                                                            key={
                                                                                resource
                                                                                    ?.id ||
                                                                                resource
                                                                                    ?._id ||
                                                                                resource
                                                                                    ?.url ||
                                                                                `${resource?.title}-${index}`
                                                                            }
                                                                            resource={
                                                                                resource
                                                                            }
                                                                            completed={
                                                                                completed
                                                                            }
                                                                            updating={
                                                                                progressUpdating
                                                                            }
                                                                            onAccess={
                                                                                handleResourceAccess
                                                                            }
                                                                            onToggleComplete={(
                                                                                currentResource,
                                                                                nextCompleted
                                                                            ) =>
                                                                                updateProgressItem({
                                                                                    itemType:
                                                                                        "resource",
                                                                                    key:
                                                                                        currentResource
                                                                                            ?.url ||
                                                                                        currentResource
                                                                                            ?.externalId ||
                                                                                        currentResource
                                                                                            ?.id ||
                                                                                        currentResource
                                                                                            ?._id ||
                                                                                        currentResource
                                                                                            ?.title,
                                                                                    completed:
                                                                                        nextCompleted,
                                                                                    item:
                                                                                        currentResource
                                                                                })
                                                                            }
                                                                        />
                                                                    );
                                                                }
                                                            )
                                                        }
                                                    </div>
                                                ) : (
                                                    <div className="learning-empty-resources">
                                                        <span>
                                                            📚
                                                        </span>
                                                        <h3>
                                                            No Resources Found
                                                        </h3>
                                                        <p>
                                                            {
                                                                selectedResources
                                                                    .length >
                                                                0
                                                                    ? "No resources match the selected filter or search."
                                                                    : "Recommended resources are not available for this skill yet."
                                                            }
                                                        </p>
                                                    </div>
                                                )
                                            }
                                        </div>
                                        {
                                            safeArray(
                                                selectedSkill
                                                    ?.projects
                                            ).length >
                                            0 && (
                                                <div className="learning-project-section">
                                                    <div className="learning-section-header">
                                                        <div>
                                                            <span className="learning-section-label">
                                                                BUILD EXPERIENCE
                                                            </span>
                                                            <h2>
                                                                Recommended Projects
                                                            </h2>
                                                            <p>
                                                                Apply your
                                                                learning through
                                                                portfolio-ready
                                                                practical projects.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="learning-project-grid">
                                                        {
                                                            safeArray(
                                                                selectedSkill
                                                                    ?.projects
                                                            ).map(
                                                                (
                                                                    project,
                                                                    index
                                                                ) => {
                                                                    const projectTitle =
                                                                        getProjectTitle(
                                                                            project
                                                                        );
                                                                    const projectKey =
                                                                        normalizeProgressKey(
                                                                            projectTitle
                                                                        );
                                                                    const projectProgress =
                                                                        safeArray(
                                                                            selectedSkillProgress
                                                                                ?.projects
                                                                        ).find(
                                                                            (
                                                                                item
                                                                            ) =>
                                                                                item
                                                                                    ?.key ===
                                                                                projectKey
                                                                        );
                                                                    const projectCompleted =
                                                                        Boolean(
                                                                            projectProgress
                                                                                ?.isCompleted
                                                                        );
                                                                    return (
                                                                        <div
                                                                            className={
                                                                                `learning-project-card ${
                                                                                    projectCompleted
                                                                                        ? "completed"
                                                                                        : ""
                                                                                }`
                                                                            }
                                                                            key={
                                                                                `${projectTitle}-${index}`
                                                                            }
                                                                        >
                                                                            <span className="learning-project-number">
                                                                                {
                                                                                    projectCompleted
                                                                                        ? "✓"
                                                                                        : String(
                                                                                            index +
                                                                                            1
                                                                                        )
                                                                                            .padStart(
                                                                                                2,
                                                                                                "0"
                                                                                            )
                                                                                }
                                                                            </span>
                                                                            <div>
                                                                                <h3>
                                                                                    {projectTitle}
                                                                                </h3>
                                                                                <p>
                                                                                    {
                                                                                        getProjectDescription(
                                                                                            project
                                                                                        )
                                                                                    }
                                                                                </p>
                                                                                <button
                                                                                    type="button"
                                                                                    className={
                                                                                        `learning-project-complete-btn ${
                                                                                            projectCompleted
                                                                                                ? "completed"
                                                                                                : ""
                                                                                        }`
                                                                                    }
                                                                                    disabled={
                                                                                        progressUpdating
                                                                                    }
                                                                                    onClick={() =>
                                                                                        updateProgressItem({
                                                                                            itemType:
                                                                                                "project",
                                                                                            key:
                                                                                                projectTitle,
                                                                                            completed:
                                                                                                !projectCompleted,
                                                                                            item: {
                                                                                                title:
                                                                                                    projectTitle,
                                                                                                description:
                                                                                                    getProjectDescription(
                                                                                                        project
                                                                                                    )
                                                                                            }
                                                                                        })
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        projectCompleted
                                                                                            ? "✓ Project Completed"
                                                                                            : "Mark Project Complete"
                                                                                    }
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                            )
                                                        }
                                                    </div>
                                                </div>
                                            )
                                        }
                                    </section>
                                )
                            }
                        </>
                    )
                }
                {
                    readySkills.length >
                    0 && (
                        <section className="learning-ready-section">
                            <div className="learning-section-header">
                                <div>
                                    <span className="learning-section-label">
                                        CURRENT STRENGTHS
                                    </span>
                                    <h2>
                                        Skills Meeting Target
                                    </h2>
                                    <p>
                                        These skills currently
                                        meet or exceed the expected
                                        level for your target role.
                                    </p>
                                </div>
                            </div>
                            <div className="learning-ready-grid">
                                {
                                    readySkills.map(
                                        (
                                            skill,
                                            index
                                        ) => (
                                            <div
                                                className="learning-ready-card"
                                                key={
                                                    skill
                                                        ?.skill
                                                        ?.id ||
                                                    `${getSkillName(
                                                        skill
                                                    )}-${index}`
                                                }
                                            >
                                                <span className="learning-ready-icon">
                                                    ✓
                                                </span>
                                                <div>
                                                    <h3>
                                                        {
                                                            getSkillName(
                                                                skill
                                                            )
                                                        }
                                                    </h3>
                                                    <p>
                                                        Current:{" "}
                                                        <strong>
                                                            {
                                                                Math.round(
                                                                    clampPercentage(
                                                                        skill
                                                                            ?.assessment
                                                                            ?.effectiveScore
                                                                    )
                                                                )
                                                            }%
                                                        </strong>
                                                        {" · "}
                                                        Target:{" "}
                                                        <strong>
                                                            {
                                                                Math.round(
                                                                    clampPercentage(
                                                                        skill
                                                                            ?.assessment
                                                                            ?.targetScore
                                                                    )
                                                                )
                                                            }%
                                                        </strong>
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    )
                                }
                            </div>
                        </section>
                    )
                }
                <section className="learning-final-action">
                    <div>
                        <span className="learning-section-label">
                            CONTINUOUS IMPROVEMENT
                        </span>
                        <h2>
                            Learn → Practice → Assess → Improve
                        </h2>
                        <p>
                            Your learning progress is now
                            stored persistently. Complete
                            topics, resources and projects,
                            retake the appropriate assessment,
                            and use the updated analytics to
                            measure your improvement.
                        </p>
                    </div>
                    <div className="learning-final-buttons">
                        <button
                            type="button"
                            className="learning-secondary-btn"
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
                            className="learning-primary-btn"
                            onClick={() =>
                                handleAssessment(
                                    selectedSkill ||
                                    topPriority ||
                                    {}
                                )
                            }
                        >
                            Take Assessment →
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};
export default Learning;
