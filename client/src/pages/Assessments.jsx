import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import assessmentService from "../services/assessmentService";
import "./assessments.css";
const Assessments = () => {
    const navigate = useNavigate();
    const getStored = (key) => {
        try {
            return localStorage.getItem(key) || "";
        } catch (error) {
            console.error(`Failed to read ${key}:`, error);
            return "";
        }
    };
    const [resumeId, setResumeId] = useState(
        () => getStored("resumeId")
    );
    const [assessmentId, setAssessmentId] = useState(
        () => getStored("assessmentId")
    );
    const [selectedType, setSelectedType] = useState(
        () => getStored("selectedAssessmentType")
    );
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const assessmentTypes = [
        {
            type: "mcq",
            title: "MCQ Assessment",
            shortTitle: "Multiple Choice",
            description:
                "Test your theoretical knowledge and technical concepts.",
            icon: "🧠",
            questions: "10 Questions",
            duration: "15 Minutes",
            color: "pink"
        },
        {
            type: "coding",
            title: "Coding Assessment",
            shortTitle: "Programming",
            description:
                "Solve programming problems and demonstrate your coding skills.",
            icon: "💻",
            questions: "5 Problems",
            duration: "45 Minutes",
            color: "blue"
        },
        {
            type: "sql",
            title: "SQL Assessment",
            shortTitle: "Database",
            description:
                "Write SQL queries and solve practical database problems.",
            icon: "🗄️",
            questions: "5 Problems",
            duration: "30 Minutes",
            color: "purple"
        }
    ];
    useEffect(() => {
        const syncStorage = () => {
            const storedResumeId = getStored("resumeId");
            const storedAssessmentId = getStored("assessmentId");
            const storedType = getStored(
                "selectedAssessmentType"
            );
            setResumeId(storedResumeId);
            setAssessmentId(storedAssessmentId);
            setSelectedType(storedType);
        };
        syncStorage();
        window.addEventListener(
            "storage",
            syncStorage
        );
        return () => {
            window.removeEventListener(
                "storage",
                syncStorage
            );
        };
    }, []);
    const handleSelectType = (type) => {
        setError("");
        setMessage("");
        /*
         * If the user selects a different assessment type,
         * remove the previous assessment because an MCQ ID
         * should not be used for Coding/SQL.
         */
        if (
            selectedType &&
            selectedType !== type
        ) {
            setAssessmentId("");
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
        setSelectedType(type);
        localStorage.setItem(
            "selectedAssessmentType",
            type
        );
    };
    const handleCreateAssessment = async () => {
        setError("");
        setMessage("");
        const storedResumeId =
            getStored("resumeId");
        if (!storedResumeId) {
            setError(
                "Please upload and analyze your resume before starting an assessment."
            );
            return;
        }
        setResumeId(storedResumeId);
        if (!selectedType) {
            setError(
                "Please select an assessment type."
            );
            return;
        }
        try {
            setLoading(true);
            console.log(
                "Creating assessment:",
                {
                    resumeId: storedResumeId,
                    type: selectedType
                }
            );
            const response =
                await assessmentService.createAssessment(
                    storedResumeId,
                    selectedType
                );
            console.log(
                "Assessment API response:",
                response
            );
            const newAssessmentId =
                response?.assessmentId ||
                response?.data?.assessmentId ||
                response?.data?.data?.assessmentId ||
                response?.assessment?._id ||
                response?.assessment?.id ||
                response?._id ||
                response?.id;
            if (!newAssessmentId) {
                console.error(
                    "No assessment ID returned:",
                    response
                );
                throw new Error(
                    "Assessment was created, but no assessment ID was returned by the server."
                );
            }
            console.log(
                "New Assessment ID:",
                newAssessmentId
            );
            localStorage.setItem(
                "assessmentId",
                String(newAssessmentId)
            );
            localStorage.setItem(
                "selectedAssessmentType",
                selectedType
            );
            const createdQuestionIds =
                response?.data?.questionIds ||
                response?.questionIds ||
                [];
            if (
                Array.isArray(createdQuestionIds) &&
                createdQuestionIds.length > 0
            ) {
                localStorage.setItem(
                    `assessmentQuestionIds_${selectedType}`,
                    JSON.stringify(
                        createdQuestionIds
                    )
                );
            }
            localStorage.removeItem(
                "assessmentQuestions"
            );
            localStorage.removeItem(
                "assessmentResult"
            );
            setAssessmentId(
                String(newAssessmentId)
            );
            setMessage(
                "Assessment created successfully!"
            );
        } catch (err) {
            console.error(
                "Assessment creation error:",
                err
            );
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Failed to create assessment."
            );
        } finally {
            setLoading(false);
        }
    };
   const handleStartAssessment = () => {
    setError("");
    if (!assessmentId) {
        setError(
            "No assessment found. Please create an assessment first."
        );
        return;
    }
    if (!selectedType) {
        setError(
            "Please select an assessment type."
        );
        return;
    }
    const type = selectedType.toLowerCase();
    console.log("Starting assessment:", {
        assessmentId,
        type,
        resumeId
    });
    switch (type) {
        case "mcq":
            navigate("/mcq-assessment");
            break;
        case "coding":
            navigate("/coding-assessment");
            break;
        case "sql":
            navigate("/sql-assessment");
            break;
        default:
            setError(
                "Invalid assessment type."
            );
    }
};
    const handleChangeAssessment = () => {
        setAssessmentId("");
        setMessage("");
        setError("");
        localStorage.removeItem(
            "assessmentId"
        );
        localStorage.removeItem(
            "assessmentQuestions"
        );
        localStorage.removeItem(
            "assessmentResult"
        );
        /*
         * Keep selectedType.
         * User can create another assessment
         * of the same type.
         */
    };
    const handleResetAssessment = () => {
        setAssessmentId("");
        setSelectedType("");
        setMessage("");
        setError("");
        localStorage.removeItem(
            "assessmentId"
        );
        localStorage.removeItem(
            "selectedAssessmentType"
        );
        localStorage.removeItem(
            "assessmentQuestions"
        );
        localStorage.removeItem(
            "assessmentResult"
        );
    };
    const selectedAssessment =
        assessmentTypes.find(
            (assessment) =>
                assessment.type === selectedType
        );
    return (
        <div className="assessments-page">
            <div className="assessment-page-header">
                <div>
                    <span className="section-label">
                        SKILL EVALUATION
                    </span>
                    <h1>
                        Technical{" "}
                        <span className="gradient-text">
                            Assessments
                        </span>
                    </h1>
                    <p>
                        Test your skills based on your
                        selected company and job role.
                    </p>
                </div>
            </div>
            {resumeId ? (
                <div className="resume-connected-card">
                    <div className="resume-status-icon">
                        ✓
                    </div>
                    <div className="resume-status-content">
                        <strong>
                            Resume connected
                        </strong>
                        <span>
                            Your resume is ready for
                            skill-based assessments.
                        </span>
                    </div>
                    <div className="resume-status-check">
                        ✓
                    </div>
                </div>
            ) : (
                <div className="assessment-warning">
                    <div className="warning-icon">
                        ⚠️
                    </div>
                    <div>
                        <strong>
                            Resume required
                        </strong>
                        <p>
                            Upload and analyze your
                            resume before taking an
                            assessment.
                        </p>
                    </div>
                    <button
                        className="warning-button"
                        onClick={() =>
                            navigate("/resume")
                        }
                    >
                        Upload Resume →
                    </button>
                </div>
            )}
            <div className="choose-test-section">
                <span className="section-label">
                    CHOOSE YOUR TEST
                </span>
                <h2>
                    Select an assessment
                </h2>
                <p>
                    Choose the assessment that matches
                    the skills you want to evaluate.
               </p>
            </div>
            <div className="assessment-grid">
                {assessmentTypes.map(
                    (assessment) => {
                        const isSelected =
                            selectedType ===
                            assessment.type;
                        return (
                            <div
                                key={
                                    assessment.type
                                }
                                className={`assessment-card ${
                                    isSelected
                                        ? "selected"
                                        : ""
                                }`}
                                onClick={() =>
                                    handleSelectType(
                                        assessment.type
                                    )
                                }
                            >

                                {isSelected && (
                                    <div className="selected-badge">
                                        ✓ SELECTED
                                    </div>
                                )}
                                <div
                                    className={`assessment-icon ${assessment.color}`}
                                >
                                    {
                                        assessment.icon
                                    }
                                </div>
                                <h2>
                                    {
                                        assessment.title
                                    }
                                </h2>
                                <p>
                                    {
                                        assessment.description
                                    }
                                </p>
                                <div className="assessment-meta">
                                    <span>
                                        📄{" "}
                                        {
                                            assessment.questions
                                        }
                                    </span>
                                    <span>
                                        ⏱️{" "}
                                        {
                                            assessment.duration
                                        }
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className={
                                        isSelected
                                            ? "assessment-selected-button"
                                            : "assessment-select-button"
                                    }
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        handleSelectType(
                                            assessment.type
                                        );
                                    }}
                                >
                                    {isSelected
                                        ? "Selected ✓"
                                        : "Select Assessment"}
                                </button>
                            </div>
                        );
                    }
                )}
            </div>
            {error && (
                <div className="assessment-alert error">
                    <div className="alert-icon">
                        ×
                    </div>
                    <div>
                        <strong>
                            Something went wrong
                        </strong>
                        <p>
                            {error}
                        </p>
                    </div>
               </div>
            )}
            {message && (
                <div className="assessment-alert success">
                    <div className="alert-icon">
                        ✓
                    </div>
                    <div>
                        <strong>
                            Assessment saved successfully
                        </strong>
                        <p>
                            Your assessment is ready
                            to begin.
                        </p>
                    </div>
                </div>
            )}
            <div className="assessment-action">
                {!assessmentId ? (
                    <button
                        className="create-assessment-button"
                        onClick={
                            handleCreateAssessment
                        }
                        disabled={
                            loading ||
                            !resumeId ||
                            !selectedType
                        }
                    >
                        {loading ? (
                            <>
                                <span className="button-spinner"></span>

                                Creating Assessment...
                            </>
                        ) : (
                            <>
                                Create Assessment
                                <span>
                                    →
                                </span>
                            </>
                        )}
                    </button>
                ) : (
                    <div className="assessment-actions-group">
                        <button
                            className="start-assessment-button"
                            onClick={
                                handleStartAssessment
                            }
                        >
                            Start Assessment
                            <span>
                                →
                            </span>
                        </button>
                        <button
                            className="change-assessment-button"
                            onClick={
                                handleChangeAssessment
                            }
                        >
                            Change Assessment
                        </button>
                    </div>
                )}
            </div>
            {selectedAssessment && (
                <div className="selected-assessment-section">
                    <div className="selected-section-header">
                        <div>
                            <span className="section-label">
                                SELECTED ASSESSMENT
                            </span>
                            <h2>
                                {
                                    selectedAssessment.title
                                }
                            </h2>
                            <p>
                                {
                                    selectedAssessment.description
                                }
                            </p>
                        </div>
                        <div className="selected-large-icon">
                            {
                                selectedAssessment.icon
                            }
                        </div>
                    </div>
                    <div className="selected-info-grid">
                        <div className="info-box">
                            <span>
                                QUESTIONS
                            </span>
                            <strong>
                                {
                                    selectedAssessment.questions
                                }
                            </strong>
                        </div>
                        <div className="info-box">
                            <span>
                                DURATION
                            </span>
                            <strong>
                                {
                                    selectedAssessment.duration
                                }
                            </strong>
                        </div>
                        <div className="info-box">
                            <span>
                                TYPE
                            </span>
                            <strong>
                                {
                                    selectedAssessment.shortTitle
                                }
                            </strong>
                        </div>
                    </div>
                </div>
            )}
            {assessmentId && (
                <div className="current-assessment-card">
                    <div className="current-assessment-icon">
                        ✓
                    </div>
                    <div className="current-assessment-content">
                        <span className="section-label">
                            CURRENT ASSESSMENT
                        </span>
                        <h2>
                            Assessment Ready
                        </h2>
                        <p>
                            Your{" "}
                            <strong>
                                {
                                    selectedAssessment?.title ||
                                    "technical assessment"
                                }
                            </strong>{" "}
                            has been created
                            successfully.
                        </p>
                        <div className="assessment-id-box">
                            <span>
                                Assessment ID
                            </span>
                            <code>
                                {assessmentId}
                            </code>
                        </div>
                    </div>
                    <div className="current-assessment-actions">
                        <button
                            className="start-assessment-button"
                            onClick={
                                handleStartAssessment
                            }
                        >
                            Start Now →
                        </button>
                    </div>
                </div>
            )}
            <div className="assessment-help">
                <div className="help-icon">
                    💡
                </div>
                <div>
                    <strong>
                        How does it work?
                    </strong>
                    <p>
                        Your questions are generated
                        based on the skills identified
                        from your resume and the selected
                        job requirements.
                    </p>
                </div>
            </div>
            {assessmentId && (
                <div className="reset-assessment-wrapper">
                    <button
                        type="button"
                        className="reset-assessment-button"
                        onClick={
                            handleResetAssessment
                        }
                    >
                        Reset Current Assessment
                    </button>
                </div>
            )}
        </div>
    );
};
export default Assessments;