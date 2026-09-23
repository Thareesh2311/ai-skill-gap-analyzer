import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import assessmentService from "../services/assessmentService";
import "./mcqAssessment.css";

const MCQAssessment = () => {
    const navigate = useNavigate();
    const storedAssessmentId =
        localStorage.getItem("assessmentId") || "";
    const storedQuestions =
        localStorage.getItem("assessmentQuestions");
    const [assessmentId] =
        useState(storedAssessmentId);
    const [assessment, setAssessment] =
        useState(null);
    const [questions, setQuestions] =
        useState([]);
    const [currentQuestion, setCurrentQuestion] =
        useState(0);
    const [answers, setAnswers] =
        useState({});
    const [loading, setLoading] =
        useState(true);
    const [submitting, setSubmitting] =
        useState(false);
    const [submitted, setSubmitted] =
        useState(false);
    const [error, setError] =
        useState("");
    const getQuestionKey = (question, index) => {
        return (
            question?._id ||
            question?.id ||
            question?.questionId ||
            `question-${index}`
        );
    };
    useEffect(() => {
        const loadAssessment = async () => {
            try {
                setLoading(true);
                setError("");
                if (!assessmentId) {
                    setError(
                        "No assessment found. Please create an assessment first."
                    );
                    setLoading(false);
                    return;
                }
                console.log(
                    "======================================"
                );
                console.log(
                    "Loading MCQ Assessment"
                );
                console.log(
                    "Assessment ID:",
                    assessmentId
                );
                console.log(
                    "======================================"
                );
                let savedQuestionList = [];
                if (storedQuestions) {
                    try {
                        const parsed =
                            JSON.parse(storedQuestions);
                        if (
                            Array.isArray(parsed) &&
                            parsed.length > 0
                        ) {
                            savedQuestionList =
                                parsed;
                            console.log(
                                "Questions from localStorage:",
                                parsed
                            );
                        }
                    } catch (parseError) {
                        console.error(
                            "Failed to parse saved questions:",
                            parseError
                        );
                    }
                }
                const response =
                    await assessmentService.startAssessment(
                        assessmentId
                    );
                console.log(
                    "Start assessment response:",
                    response
                );
                setAssessment(response);
                let questionList = [];
                if (
                    Array.isArray(
                        response?.data?.questions
                    )
                ) {
                    questionList =
                        response.data.questions;
                }
                else if (
                    Array.isArray(
                        response?.questions
                    )
                ) {
                    questionList =
                        response.questions;
                }
                else if (
                    Array.isArray(
                        response?.data?.data?.questions
                    )
                ) {
                    questionList =
                        response.data.data.questions;
                }
                if (
                    questionList.length === 0 &&
                    savedQuestionList.length > 0
                ) {
                    questionList =
                        savedQuestionList;

                    console.log(
                        "Using questions from localStorage."
                    );
                }
                if (
                    questionList.length === 0
                ) {
                    setError(
                        "This assessment was created, but no questions were returned by the backend."
                    );

                    setLoading(false);
                    return;
                }
                console.log(
                    "========== QUESTIONS =========="
                );
                questionList.forEach(
                    (item, index) => {
                        console.log(
                            `Question ${index + 1}:`,
                            {
                                _id: item?._id,
                                id: item?.id,
                                questionId:
                                    item?.questionId,
                                question:
                                    item?.question,
                                correctAnswer:
                                    item?.correctAnswer
                            }
                        );
                    }
                );
                console.log(
                    "==============================="
                );
                setQuestions(
                    questionList
                );
                localStorage.setItem(
                    "assessmentQuestions",
                    JSON.stringify(questionList)
                );
                localStorage.setItem(
                    "assessmentId",
                    assessmentId
                );
                setLoading(false);
            } catch (err) {
                console.error(
                    "Failed to load assessment:",
                    err
                );
                console.error(
                    "Backend response:",
                    err.response?.data
                );
                setError(
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to load assessment."
                );
                setLoading(false);
            }
        };
        loadAssessment();
    }, [assessmentId]);
    const handleAnswer = (
        questionKey,
        optionIndex
    ) => {
        if (submitted) {
            return;
        }
        setAnswers(
            (previousAnswers) => ({
                ...previousAnswers,
                [questionKey]:
                    optionIndex
            })
        );
        setError("");
    };
    const handleNext = () => {
        if (
            currentQuestion <
            questions.length - 1
        ) {
            setCurrentQuestion(
                (previous) =>
                    previous + 1
            );
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    };
    const handlePrevious = () => {
        if (
            currentQuestion > 0
        ) {
            setCurrentQuestion(
                (previous) =>
                    previous - 1
            );
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    };
    const handleQuestionNavigation = (
        index
    ) => {
        setCurrentQuestion(index);
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };
    const handleSubmit = async () => {
        if (submitting || submitted) {
            return;
        }
        const answeredCount =
            Object.keys(answers).length;
        const unansweredCount =
            questions.length -
            answeredCount;
        const confirmed =
            window.confirm(
                unansweredCount > 0
                    ? `You have ${unansweredCount} unanswered question(s).\n\nAre you sure you want to submit?`
                    : "You have answered all questions.\n\nSubmit your assessment?"
            );
        if (!confirmed) {
            return;
        }
        try {
            setSubmitting(true);
            setError("");
            const formattedAnswers =
                questions.map(
                    (question, index) => {
                        const questionId =
                            question?._id ||
                            question?.id ||
                            question?.questionId ||
                            null;
                        const questionKey =
                            getQuestionKey(
                                question,
                                index
                            );
                        const selectedAnswer =
                            answers[
                                questionKey
                            ];
                        return {
                            questionId:
                                questionId,
                            questionIndex:
                                index,
                            question:
                                question?.question ||
                                question?.title ||
                                question?.description ||
                                "",
                            answer:
                                selectedAnswer !==
                                undefined
                                    ? selectedAnswer
                                    : ""
                        };
                    }
                );
            console.log(
                "=========================================="
            );
            console.log(
                "MCQ SUBMISSION"
            );
            console.log(
                "Assessment ID:",
                assessmentId
            );
            console.log(
                "Selected answers:",
                answers
            );
            console.log(
                "Formatted answers:",
                formattedAnswers
            );
            console.log(
                "=========================================="
            );
            const result =
                await assessmentService.submitAssessment(
                    assessmentId,
                    formattedAnswers
                );
            console.log(
                "=========================================="
            );
            console.log(
                "MCQ SUBMISSION RESULT"
            );
            console.log(
                result
            );
            console.log(
                "=========================================="
            );
            localStorage.setItem(
                "assessmentResult",
                JSON.stringify(result)
            );
            const score =
                result?.score ??
                result?.data?.score ??
                result?.result?.score ??
                0;
            const maxScore =
                result?.maxScore ??
                result?.data?.maxScore ??
                result?.result?.maxScore ??
                questions.reduce(
                    (
                        total,
                        item
                    ) =>
                        total +
                        Number(
                            item?.points ||
                            1
                        ),
                    0
                );
            const percentage =
                result?.percentage ??
                result?.data?.percentage ??
                result?.result?.percentage ??
                0;
            setSubmitted(true);
            alert(
                `Assessment submitted successfully!\n\n` +
                `Score: ${score}/${maxScore}\n` +
                `Percentage: ${percentage}%`
            );
        } catch (err) {
            console.error(
                "=========================================="
            );
            console.error(
                "MCQ SUBMISSION ERROR"
            );
            console.error(
                err
            );
            console.error(
                "Backend response:",
                err.response?.data
            );
            console.error(
                "=========================================="
            );
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Failed to submit assessment."
            );
        } finally {

            setSubmitting(false);
        }
    };
    if (loading) {
        return (
            <div className="assessment-loading">
                <div className="loading-card">
                    <div className="loading-icon">
                        ⚡
                    </div>
                    <div className="spinner"></div>
                    <span className="section-label">
                        MCQ ASSESSMENT
                    </span>
                    <h2>
                        Preparing your test...
                    </h2>
                    <p>
                        Loading your questions
                        and preparing your
                        assessment.
                    </p>
                </div>
            </div>
        );
    }
    if (error && !questions.length) {
        return (
            <div className="assessment-error">
                <div className="error-card">
                    <div className="error-icon">
                        !
                    </div>
                    <span className="section-label">
                        ASSESSMENT ERROR
                    </span>
                    <h2>
                        Unable to load assessment
                    </h2>
                    <p>
                        {error}
                    </p>
                    <div className="error-actions">
                        <button
                            className="btn-secondary"
                            onClick={() =>
                                navigate(
                                    "/assessments"
                                )
                            }
                        >
                            ← Back to Assessments
                        </button>
                        <button
                            className="btn-primary"
                            onClick={() =>
                                window.location.reload()
                            }
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    if (!questions.length) {
        return (
            <div className="assessment-error">
                <div className="error-card">
                    <div className="error-icon">
                        ?
                    </div>

                    <span className="section-label">
                        EMPTY ASSESSMENT
                    </span>
                    <h2>
                        No Questions Found
                    </h2>
                    <p>
                        This assessment does not
                        contain any questions.
                    </p>
                    <button
                        className="btn-primary"
                        onClick={() =>
                            navigate(
                                "/assessments"
                            )
                        }
                    >
                        ← Back to Assessments
                    </button>
                </div>
            </div>
        );
    }
    const question =
        questions[currentQuestion];
    const questionKey =
        getQuestionKey(
            question,
            currentQuestion
        );
    const selectedAnswer =
        answers[questionKey];
    const progress =
        (
            (currentQuestion + 1) /
            questions.length
        ) * 100;
    const isLastQuestion =
        currentQuestion ===
        questions.length - 1;
    const answeredCount =
        Object.keys(answers).length;
    const skillName =
        typeof question?.skill ===
        "string"
            ? question.skill
            : question?.skill?.name ||
              "";
    const questionText =
        question?.question ||
        question?.title ||
        question?.description ||
        "Question";
    return (
        <div className="mcq-page">
            <div className="mcq-header">
                <div className="mcq-header-content">
                    <span className="section-label">
                        MCQ ASSESSMENT
                    </span>
                    <h1>
                        Technical{" "}
                        <span className="gradient-text">
                            Knowledge Test
                        </span>
                    </h1>
                    <p>
                        Test your technical knowledge
                        based on your resume skills.
                    </p>
                </div>
                <div className="question-counter">
                    <span>
                        QUESTION
                    </span>
                    <div className="counter-number">
                        {currentQuestion + 1}
                        <small>
                            / {questions.length}
                        </small>
                    </div>
                </div>
            </div>
            <div className="mcq-progress-wrapper">
                <div className="progress-top">
                    <span>
                        Assessment Progress
                    </span>
                    <strong>
                        {Math.round(progress)}%
                    </strong>
                </div>
                <div className="mcq-progress-bar">
                    <div
                        className="mcq-progress-fill"
                        style={{
                            width:
                                `${progress}%`
                        }}
                    />
                </div>
            </div>
            <div
                className={`question-card ${
                    submitted
                        ? "submitted"
                        : ""
                }`}
            >
                <div className="question-top">
                    <div className="question-meta">
                        <span className="question-number">
                            Q{currentQuestion + 1}
                        </span>
                        {skillName && (
                            <span className="skill-badge">
                                {skillName}
                            </span>
                        )}
                        {question?.difficulty && (
                            <span
                                className={`difficulty-badge ${String(
                                    question.difficulty
                                ).toLowerCase()}`}
                            >
                                {
                                    question.difficulty
                                }
                            </span>
                        )}
                    </div>
                    <span className="points-badge">
                        {question?.points ||
                            1}{" "}
                        point
                        {(question?.points ||
                            1) > 1
                            ? "s"
                            : ""}
                    </span>
                </div>
                <h2 className="question-title">
                    {questionText}
                </h2>
                <div className="options-container">
                    {Array.isArray(
                        question?.options
                    ) &&
                        question.options.map(
                            (
                                option,
                                index
                            ) => {
                                const optionText =
                                    typeof option ===
                                    "string"
                                        ? option
                                        : option?.text ||
                                          option?.label ||
                                          option?.value ||
                                          "";
                                const isSelected =
                                    selectedAnswer ===
                                    index;
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        disabled={
                                            submitted ||
                                            submitting
                                        }
                                        className={`option ${
                                            isSelected
                                                ? "selected"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            handleAnswer(
                                                questionKey,
                                                index
                                            )
                                        }
                                    >
                                        <span className="option-letter">
                                            {String.fromCharCode(
                                                65 +
                                                    index
                                            )}
                                        </span>
                                        <span className="option-text">
                                            {optionText}
                                        </span>
                                        <span className="option-check">
                                            {isSelected
                                                ? "✓"
                                                : ""}
                                        </span>
                                    </button>
                                );
                            }
                        )}
                </div>
                {error && questions.length > 0 && (
                    <div className="submit-error">
                        <span>
                            !
                        </span>
                        <p>
                            {error}
                        </p>

                    </div>
                )}
                <div className="question-navigation">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={
                            handlePrevious
                        }
                        disabled={
                            currentQuestion ===
                                0 ||
                            submitting ||
                            submitted
                        }
                    >
                        <span>
                            ←
                        </span>
                        Previous
                    </button>
                    <div className="navigation-status">
                        {selectedAnswer !==
                        undefined ? (
                            <span className="answered-status">
                                ✓ Answer selected
                            </span>
                        ) : (
                            <span className="unanswered-status">
                                Select an answer
                            </span>
                        )}
                    </div>
                    {!isLastQuestion ? (
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={
                                handleNext
                            }
                            disabled={
                                submitting ||
                                submitted
                            }
                        >
                            Next
                            <span>
                                →
                            </span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn-primary submit-btn"
                            onClick={
                                handleSubmit
                            }
                            disabled={
                                submitting ||
                                submitted
                            }
                        >
                            {submitted ? (
                                <>
                                    Submitted ✓
                                </>
                            ) : submitting ? (
                                <>
                                    <span className="button-spinner"></span>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    Submit Assessment
                                    <span>
                                        ✓
                                    </span>
                                </>
                            )}

                        </button>
                    )}
                </div>
            </div>
            <div className="question-navigator">
                <div className="navigator-header">
                    <div>
                        <span className="section-label">
                            ASSESSMENT PROGRESS
                        </span>
                        <h3>
                            Questions
                        </h3>
                    </div>
                    <div className="navigator-count">
                        <strong>
                            {answeredCount}
                        </strong>
                        <span>
                            / {questions.length}{" "}
                            answered
                        </span>
                    </div>
                </div>
                <div className="question-dots">
                    {questions.map(
                        (
                            item,
                            index
                        ) => {
                            const id =
                                getQuestionKey(
                                    item,
                                    index
                                );
                            const answered =
                                answers[id] !==
                                undefined;
                            return (
                                <button
                                    type="button"
                                    key={id}
                                    disabled={
                                        submitted
                                    }
                                    className={`
                                        question-dot
                                        ${
                                            index ===
                                            currentQuestion
                                                ? "active"
                                                : ""
                                        }
                                        ${
                                            answered
                                                ? "answered"
                                                : ""
                                        }
                                    `}
                                    onClick={() =>
                                        handleQuestionNavigation(
                                            index
                                        )
                                    }
                                >
                                    <span>
                                        {index + 1}
                                    </span>
                                </button>
                            );
                        }
                    )}

                </div>
                <div className="navigator-legend">
                    <span>
                        <i className="legend-current"></i>
                        Current
                    </span>
                    <span>
                        <i className="legend-answered"></i>
                        Answered
                    </span>
                    <span>
                        <i className="legend-unanswered"></i>
                        Unanswered
                    </span>
                </div>
            </div>
        </div>
    );
};
export default MCQAssessment;