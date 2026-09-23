import {
    useEffect,
    useMemo,
    useState
} from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import assessmentService from "../services/assessmentService";
import "./codingAssessment.css";
const CodingAssessment = () => {
    const navigate = useNavigate();
    const assessmentId =
        localStorage.getItem("assessmentId") || "";
    const [questions, setQuestions] =
        useState([]);
    const [currentQuestion, setCurrentQuestion] =
        useState(0);
    const [answers, setAnswers] =
        useState({});
    const [
        savedAnswersLoaded,
        setSavedAnswersLoaded
    ] = useState(false);
    const [loading, setLoading] =
        useState(true);
    const [submitting, setSubmitting] =
        useState(false);
    const [running, setRunning] =
        useState(false);
    const [runResults, setRunResults] =
        useState({});
    const [error, setError] =
        useState("");
    const getQuestionId = (question) => {
        return (
            question?._id ||
            question?.id ||
            question?.questionId ||
            ""
        );
    };
    const getEditorLanguage = (question) => {
        const language =
            question?.language ||
            question?.allowedLanguage ||
            question?.programmingLanguage ||
            "python";
        const normalized =
            String(language)
                .toLowerCase();
        if (
            normalized.includes("python") ||
            normalized === "py"
        ) {
            return "python";
        }
        if (
            normalized.includes("javascript") ||
            normalized === "js"
        ) {
            return "javascript";
        }
        if (
            normalized.includes("typescript") ||
            normalized === "ts"
        ) {
            return "typescript";
        }
        if (
            normalized.includes("java") &&
            !normalized.includes(
                "javascript"
            )
        ) {
            return "java";
        }
        if (
            normalized.includes("c++") ||
            normalized === "cpp"
        ) {
            return "cpp";
        }
        if (
            normalized === "c"
        ) {
            return "c";
        }
        if (
            normalized.includes("sql")
        ) {
            return "sql";
        }
        return "python";
    };
    const getStarterCode = (question) => {
        if (!question) {
            return "";
        }
        if (question.starterCode) {
            return question.starterCode;
        }
        if (question.template) {
            return question.template;
        }
        if (question.codeTemplate) {
            return question.codeTemplate;
        }
        const functionName =
            question.functionName ||
            question.function ||
            "solution";
        const language =
            getEditorLanguage(
                question
            );
        if (
            language === "python"
        ) {
            return `def ${functionName}(arr):
    # Write your solution here
    pass`;
        }
        if (
            language === "javascript"
        ) {
            return `function ${functionName}(arr) {
    // Write your solution here
}`;
        }
        if (
            language === "typescript"
        ) {
            return `function ${functionName}(arr: number[]) {
    // Write your solution here
}`;
        }
        if (
            language === "java"
        ) {

            return `class Solution {
    public static void main(String[] args) {
        // Write your solution here
    }
}`;
        }
        if (
            language === "cpp"
        ) {
            return `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your solution here

    return 0;
}`;
        }
        if (
            language === "c"
        ) {
            return `#include <stdio.h>

int main() {
    // Write your solution here

    return 0;
}`;
        }
        return "";
    };
    useEffect(() => {
        if (!assessmentId) {
            setSavedAnswersLoaded(
                true
            );
            return;
        }
        try {
            const saved =
                localStorage.getItem(
                    `codingAnswers_${assessmentId}`
                );
            if (saved) {
                const parsed =
                    JSON.parse(saved);
                if (
                    parsed &&
                    typeof parsed ===
                        "object" &&
                    !Array.isArray(parsed)
                ) {
                    setAnswers(parsed);
                }
            }
        } catch (err) {
            console.error(
                "Failed to load saved coding answers:",
                err
            );
        } finally {
            setSavedAnswersLoaded(
                true
            );
        }
    }, [assessmentId]);
    useEffect(() => {
        if (
            !assessmentId ||
            !savedAnswersLoaded
        ) {
            return;
        }
        try {

            localStorage.setItem(
                `codingAnswers_${assessmentId}`,
                JSON.stringify(
                    answers
                )
            );
        } catch (err) {
            console.error(
                "Failed to autosave coding answers:",
                err
            );
        }
    }, [
        answers,
        assessmentId,
        savedAnswersLoaded
    ]);
    useEffect(() => {
        const loadAssessment =
            async () => {
                try {
                    setLoading(true);
                    setError("");
                    if (!assessmentId) {
                        setError(
                            "No assessment found. Please create a coding assessment first."
                        );
                        setLoading(false);
                        return;
                    }
                    const response =
                        await assessmentService
                            .startAssessment(
                                assessmentId
                            );
                    console.log(
                        "Started coding assessment:",
                        response
                    );
                    let questionList =
                        response?.questions ||
                        response?.data
                            ?.questions ||
                        response?.data
                            ?.data
                            ?.questions ||
                        response?.assessment
                            ?.questions ||
                        response?.data
                            ?.assessment
                            ?.questions ||
                        [];
                    if (
                        !Array.isArray(
                            questionList
                        ) ||
                        questionList.length ===
                            0
                    ) {
                        try {
                            const savedQuestions =
                                localStorage
                                    .getItem(
                                        `codingQuestions_${assessmentId}`
                                    );
                            if (
                                savedQuestions
                            ) {

                                questionList =
                                    JSON.parse(
                                        savedQuestions
                                    );
                            }
                        } catch (
                            storageError
                        ) {
                            console.error(
                                "Failed to read saved coding questions:",
                                storageError
                            );
                        }
                    }
                    if (
                        !Array.isArray(
                            questionList
                        ) ||
                        questionList.length ===
                            0
                    ) {
                        setError(
                            "No coding questions were returned by the server."
                        );
                        setQuestions([]);
                        setLoading(false);
                        return;
                    }
                    const questionsWithoutIds =
                        questionList.filter(
                            (question) =>
                                !getQuestionId(
                                    question
                                )
                        );
                    if (
                        questionsWithoutIds
                            .length > 0
                    ) {
                        console.warn(
                            "Some coding questions do not have database IDs:",
                            questionsWithoutIds
                        );
                    }
                    setQuestions(
                        questionList
                    );
                    localStorage.setItem(
                        `codingQuestions_${assessmentId}`,
                        JSON.stringify(
                            questionList
                        )
                    );
                    setLoading(false);
                } catch (err) {
                    console.error(
                        "Failed to start coding assessment:",
                        err
                    );
                    setError(
                        err?.response
                            ?.data
                            ?.message ||
                        err?.message ||
                        "Failed to start coding assessment."
                    );
                    setLoading(false);
                }
            };
        loadAssessment();
    }, [assessmentId]);
    const currentQuestionData =
        questions.length > 0
            ? questions[
                currentQuestion
            ]
            : null;
    const currentQuestionId =
        getQuestionId(
            currentQuestionData
        );
    const currentRunResult =
        currentQuestionId
            ? runResults[
                currentQuestionId
            ] || null
            : null;
    const editorLanguage =
        useMemo(() => {
            return getEditorLanguage(
                currentQuestionData
            );
        }, [
            currentQuestionData
        ]);
    const starterCode =
        useMemo(() => {
            return getStarterCode(
                currentQuestionData
            );
        }, [
            currentQuestionData
        ]);
    const hasSavedAnswer =
        currentQuestionId
            ? Object.prototype
                .hasOwnProperty
                .call(
                    answers,
                    currentQuestionId
                )
            : false;
    const currentCode =
        currentQuestionId
            ? hasSavedAnswer
                ? answers[
                    currentQuestionId
                ]
                : starterCode
            : "";
    const handleCodeChange = (
        value
    ) => {
        if (!currentQuestionId) {
            return;
        }
        const newCode =
            value ?? "";
        setAnswers(
            (previous) => ({
                ...previous,
                [currentQuestionId]:
                    newCode
            })
        );
        setRunResults(
            (previous) => {
                if (
                    !previous[
                        currentQuestionId
                    ]
                ) {
                    return previous;
                }
                const updated = {
                    ...previous
                };
                delete updated[
                    currentQuestionId
                ];
                return updated;
            }
        );
    };
    const handlePrevious =
        () => {
            if (
                currentQuestion > 0 &&
                !running &&
                !submitting
            ) {
                setCurrentQuestion(
                    (previous) =>
                        previous - 1
                );
            }
        };
    const handleNext =
        () => {
            if (
                currentQuestion <
                    questions.length -
                        1 &&
                !running &&
                !submitting
            ) {
                setCurrentQuestion(
                    (previous) =>
                        previous + 1
                );
            }
        };
    const handleQuestionNavigation =
        (index) => {
            if (
                running ||
                submitting
            ) {
                return;
            }
            if (
                index >= 0 &&
                index <
                    questions.length
            ) {
                setCurrentQuestion(
                    index
                );
            }
        };
    const isQuestionAnswered =
        (question) => {
            const questionId =
                getQuestionId(
                    question
                );
            if (!questionId) {
                return false;
            }
            if (
                !Object.prototype
                    .hasOwnProperty
                    .call(
                        answers,
                        questionId
                    )
            ) {
                return false;
            }
            return Boolean(
                answers[
                    questionId
                ]?.trim()
            );
        };
    const getSubmissionCode =
        (question) => {
            const questionId =
                getQuestionId(
                    question
                );
            if (!questionId) {
                return "";
            }
            if (
                Object.prototype
                    .hasOwnProperty
                    .call(
                        answers,
                        questionId
                    )
            ) {
                return (
                    answers[
                        questionId
                    ] ?? ""
                );
            }
            return "";
        };
    const answeredCount =
        questions.filter(
            isQuestionAnswered
        ).length;
    const progressPercentage =
        questions.length > 0
            ? Math.round(
                (
                    answeredCount /
                    questions.length
                ) * 100
            )
            : 0;
    const handleRunCode =
        async () => {
            if (
                running ||
                submitting
            ) {
                return;
            }
            if (!assessmentId) {
                setError(
                    "Assessment ID is missing."
                );
                return;
            }
            if (!currentQuestionId) {
                setError(
                    "Question ID is missing."
                );
                return;
            }
            if (
                !currentCode ||
                !currentCode.trim()
            ) {
                setError(
                    "Please write some code before running."
                );
                return;
            }
            try {
                setRunning(true);
                setError("");
                const response =
                    await assessmentService
                        .runCodingQuestion(
                            assessmentId,
                            currentQuestionId,
                            currentCode
                        );
                console.log(
                    "Run Code Result:",
                    response
                );
                const result =
                    response?.data ||
                    response;
                if (!result) {
                    throw new Error(
                        "No execution result was returned."
                    );
                }
                setRunResults(
                    (previous) => ({
                        ...previous,
                        [currentQuestionId]:
                            result
                    })
                );
            } catch (err) {
                console.error(
                    "Run Code Error:",
                    err
                );
                setError(
                    err?.response
                        ?.data
                        ?.message ||
                    err?.response
                        ?.data
                        ?.error ||
                    err?.message ||
                    "Failed to run code."
                );
            } finally {
                setRunning(false);
            }
        };
    const handleSubmit =
        async () => {
            if (
                submitting ||
                running
            ) {
                return;
            }
            const unansweredCount =
                questions.filter(
                    (question) =>
                        !isQuestionAnswered(
                            question
                        )
                ).length;
            const confirmed =
                window.confirm(
                    unansweredCount > 0
                        ? `You have ${unansweredCount} unanswered coding question(s).\n\nAre you sure you want to submit?`
                        : "Submit your coding assessment?"
                );
            if (!confirmed) {
                return;
            }
            try {
                setSubmitting(true);
                setError("");
                const formattedAnswers =
                    questions.map(
                        (question) => {
                            const questionId =
                                getQuestionId(
                                    question
                                );
                            return {
                                questionId,
                                answer:
                                    getSubmissionCode(
                                        question
                                    )
                            };
                        }
                    );
                const missingIdQuestion =
                    formattedAnswers.find(
                        (item) =>
                            !item.questionId
                    );
                if (
                    missingIdQuestion
                ) {

                    throw new Error(
                        "One or more coding questions are missing their database ID. Please restart the assessment."
                    );
                }
                console.log(
                    "Submitting coding assessment:",
                    {
                        assessmentId,
                        answers:
                            formattedAnswers
                    }
                );
                const result =
                    await assessmentService
                        .submitAssessment(
                            assessmentId,
                            formattedAnswers
                        );
                console.log(
                    "Coding assessment result:",
                    result
                );
                localStorage.setItem(
                    "assessmentResult",
                    JSON.stringify(
                        result
                    )
                );
                localStorage.setItem(
                    "lastAssessmentType",
                    "coding"
                );
                const normalizedResult =
                    result?.data ||
                    result;
                if (
                    normalizedResult
                ) {
                    localStorage.setItem(
                        `codingResult_${assessmentId}`,
                        JSON.stringify(
                            normalizedResult
                        )
                    );
                }
                localStorage.removeItem(
                    `codingAnswers_${assessmentId}`
                );
                navigate(
                    `/coding-result/${assessmentId}`,
                    {
                        replace: true
                    }
                );
            } catch (err) {
                console.error(
                    "Coding assessment submission failed:",
                    err
                );
                setError(
                    err?.response
                        ?.data
                        ?.message ||
                    err?.message ||
                    "Failed to submit coding assessment."
                );
            } finally {

                setSubmitting(false);
            }
        };
    if (loading) {
        return (
            <div className="coding-loading">
                <div className="loading-card">
                    <div className="spinner"></div>
                    <h2>
                        Loading Coding Assessment
                    </h2>
                    <p>
                        Preparing your coding
                        questions...
                    </p>
                </div>
            </div>
        );
    }
    if (
        error &&
        questions.length === 0
    ) {
        return (
            <div className="coding-error">
                <div className="error-card">
                    <div className="error-icon">
                        ×
                    </div>
                    <h2>
                        Something went wrong
                    </h2>
                    <p>
                        {error}
                    </p>
                    <button
                        type="button"
                        className="btn-primary"
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
    if (!currentQuestionData) {
        return (
            <div className="coding-error">
                <div className="error-card">
                    <h2>
                        No Coding Questions Found
                    </h2>
                    <p>
                        No coding questions are
                        available for this
                        assessment.
                    </p>
                    <button
                        type="button"
                        className="btn-primary"
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
    const questionTitle =
        currentQuestionData.title ||
        currentQuestionData.name ||
        currentQuestionData
            .questionTitle ||
        `Coding Problem ${
            currentQuestion + 1
        }`;
    const problemDescription =
        currentQuestionData
            .description ||
        currentQuestionData
            .problem ||
        currentQuestionData
            .question ||
        "Solve the given programming problem.";
    const difficulty =
        currentQuestionData
            .difficulty ||
        "Beginner";
    const points =
        currentQuestionData
            .points ??
        10;
    const constraints =
        currentQuestionData
            .constraints;
    return (
        <div className="coding-page">
            <div className="coding-layout">
                <main className="coding-main">
                    <section className="problem-card">
                        <div className="problem-header">
                            <div>
                                <div className="problem-number">
                                    PROBLEM{" "}
                                    {
                                        currentQuestion +
                                        1
                                    }
                                </div>
                                <h1>
                                    {questionTitle}
                                </h1>
                            </div>
                            <div className="problem-badges">
                                <span
                                    className={`difficulty-badge ${String(
                                        difficulty
                                    ).toLowerCase()}`}
                                >
                                    {difficulty}
                                </span>
                                <span className="points-badge">
                                    {points} Pts
                                </span>
                            </div>
                        </div>
                        <div className="problem-description">
                            <h3>
                                Problem
                            </h3>
                            <p>
                                {problemDescription}
                            </p>
                        </div>
                        {currentQuestionData
                            ?.inputFormat && (
                            <div className="problem-section">
                                <h3>
                                    Input Format
                                </h3>
                                <p>
                                    {
                                        currentQuestionData
                                            .inputFormat
                                    }
                                </p>

                            </div>
                        )}
                        {currentQuestionData
                            ?.outputFormat && (
                            <div className="problem-section">
                                <h3>
                                    Output Format
                                </h3>
                                <p>
                                    {
                                        currentQuestionData
                                            .outputFormat
                                    }
                                </p>
                            </div>
                        )}
                        {constraints && (
                            <div className="problem-section">
                                <h3>
                                    Constraints
                                </h3>
                                {Array.isArray(
                                    constraints
                                ) ? (
                                    <ul>
                                        {constraints.map(
                                            (
                                                constraint,
                                                index
                                            ) => (
                                                <li
                                                    key={
                                                        index
                                                    }
                                                >
                                                    {
                                                        constraint
                                                    }
                                                </li>
                                            )
                                        )}
                                    </ul>
                                ) : (
                                    <p>
                                        {constraints}
                                    </p>
                                )}
                            </div>
                        )}
                        {Array.isArray(
                            currentQuestionData
                                ?.examples
                        ) &&
                            currentQuestionData
                                .examples
                                .length > 0 && (
                            <div className="problem-section">
                                <h3>
                                    Examples
                                </h3>
                                {currentQuestionData
                                    .examples
                                    .map(
                                        (
                                            example,
                                            index
                                        ) => (
                                            <div
                                                className="example-card"
                                                key={
                                                    index
                                                }
                                            >
                                                <div>
                                                    <strong>
                                                        Example{" "}
                                                        {
                                                            index +
                                                            1
                                                        }
                                                    </strong>
                                                </div>
                                                {example
                                                    ?.input && (
                                                    <pre>
                                                        <strong>
                                                            Input:
                                                        </strong>{" "}
                                                        {
                                                            example
                                                                .input
                                                        }
                                                    </pre>
                                                )}
                                                {example
                                                    ?.output && (
                                                    <pre>
                                                        <strong>
                                                            Output:
                                                        </strong>{" "}
                                                        {
                                                            example
                                                                .output
                                                        }
                                                    </pre>
                                                )}
                                                {example
                                                    ?.explanation && (
                                                    <p>
                                                        {
                                                            example
                                                                .explanation
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    )}
                            </div>
                        )}
                        {!Array.isArray(
                            currentQuestionData
                                ?.examples
                        ) &&
                            (
                                currentQuestionData
                                    ?.sampleInput ||
                                currentQuestionData
                                    ?.sampleOutput
                            ) && (
                            <div className="problem-section">
                                <h3>
                                    Example
                                </h3>
                                <div className="example-card">
                                    {currentQuestionData
                                        ?.sampleInput && (
                                        <pre>
                                            <strong>
                                                Input:
                                            </strong>{" "}
                                            {
                                                currentQuestionData
                                                    .sampleInput
                                            }
                                        </pre>
                                    )}
                                    {currentQuestionData
                                        ?.sampleOutput && (
                                        <pre>
                                            <strong>
                                                Output:
                                            </strong>{" "}
                                            {
                                                currentQuestionData
                                                    .sampleOutput
                                            }
                                        </pre>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                    <section className="editor-card">
                        <div className="editor-header">
                            <div>
                                <div className="editor-label">
                                    CODE
                                </div>
                                <div className="editor-subtitle">
                                    Write your solution below
                                </div>
                            </div>
                            <div className="language-display">
                                {editorLanguage}
                            </div>
                        </div>
                        <div className="monaco-editor-wrapper">
                            <Editor
                                height="520px"
                                language={
                                    editorLanguage
                                }
                                theme="vs-dark"
                                value={
                                    currentCode
                                }
                                onChange={
                                    handleCodeChange
                                }
                                options={{
                                    automaticLayout:
                                        true,
                                    minimap: {
                                        enabled:
                                            false
                                    },
                                    fontSize:
                                        14,
                                    lineHeight:
                                        22,
                                    tabSize:
                                        4,
                                    insertSpaces:
                                        true,
                                    wordWrap:
                                        "on",
                                    scrollBeyondLastLine:
                                        false,
                                    smoothScrolling:
                                        true,
                                    cursorBlinking:
                                        "smooth",
                                    cursorSmoothCaretAnimation:
                                        "on",
                                    folding:
                                        true,
                                    lineNumbers:
                                        "on",
                                    renderLineHighlight:
                                        "all",
                                    bracketPairColorization:
                                        {
                                            enabled:
                                                true
                                        },
                                    autoClosingBrackets:
                                        "always",
                                    autoClosingQuotes:
                                        "always",
                                    formatOnPaste:
                                        true,
                                    suggestOnTriggerCharacters:
                                        true,
                                    quickSuggestions:
                                        true,
                                    parameterHints:
                                        {
                                            enabled:
                                                true
                                        },
                                    padding: {
                                        top:
                                            16,
                                        bottom:
                                            16
                                    },
                                    scrollbar: {
                                        verticalScrollbarSize:
                                            10,
                                        horizontalScrollbarSize:
                                            10
                                    }
                                }}
                            />
                        </div>
                        <div className="editor-footer">
                            <span>
                                Language:{" "}
                                {editorLanguage}
                            </span>
                            <span>
                                {hasSavedAnswer
                                    ? "Auto-saved"
                                    : "Starter code"}
                            </span>
                        </div>
                        <div className="coding-run-actions">
                            <button
                                type="button"
                                className="run-code-btn"
                                onClick={
                                    handleRunCode
                                }
                                disabled={
                                    running ||
                                    submitting
                                }
                            >
                                {running
                                    ? "Running..."
                                    : "▶ Run Code"}
                            </button>
                            <span className="run-code-hint">
                                Runs public test cases only.
                                Hidden tests run when the
                                assessment is submitted.
                            </span>
                        </div>
                        {currentRunResult && (
                            <div className="run-results-panel">
                                <div className="run-results-header">
                                    <div>
                                        <h3>
                                            Test Results
                                        </h3>
                                        <p>
                                            {
                                                Number(
                                                    currentRunResult
                                                        ?.passedCount ||
                                                    0
                                                )
                                            }
                                            {" / "}
                                            {
                                                Number(
                                                    currentRunResult
                                                        ?.totalTestCases ||
                                                    0
                                                )
                                            }
                                            {" "}public test cases passed
                                        </p>
                                    </div>
                                    <div
                                        className={`run-overall-status ${
                                            currentRunResult
                                                ?.allPassed
                                                ? "passed"
                                                : "failed"
                                        }`}
                                    >
                                        {currentRunResult
                                            ?.allPassed
                                            ? "✓ All Passed"
                                            : "✕ Tests Failed"}
                                    </div>
                                </div>
                                <div className="run-progress-track">
                                    <div
                                        className="run-progress-fill"
                                        style={{
                                            width:
                                                `${
                                                    Number(
                                                        currentRunResult
                                                            ?.passPercentage ||
                                                        0
                                                    )
                                                }%`
                                        }}
                                    />
                                </div>
                                <div className="run-test-list">
                                    {Array.isArray(
                                        currentRunResult
                                            ?.testCases
                                    ) &&
                                        currentRunResult
                                            .testCases
                                            .map(
                                                (
                                                    testCase,
                                                    index
                                                ) => (
                                                    <div
                                                        className={`run-test-case ${
                                                            testCase
                                                                ?.passed
                                                                ? "passed"
                                                                : "failed"
                                                        }`}
                                                        key={
                                                            testCase
                                                                ?.testCaseNumber ||
                                                            index
                                                        }
                                                    >
                                                        <div className="run-test-case-header">
                                                            <strong>
                                                                Test Case{" "}
                                                                {
                                                                    testCase
                                                                        ?.testCaseNumber ||
                                                                    index +
                                                                        1
                                                                }
                                                            </strong>
                                                            <span>
                                                                {testCase
                                                                    ?.passed
                                                                    ? "✓ Passed"
                                                                    : "✕ Failed"}
                                                            </span>
                                                        </div>
                                                        <div className="run-test-values">
                                                            <div>
                                                                <span>
                                                                    Input
                                                                </span>
                                                                <pre>
                                                                    {
                                                                        testCase
                                                                            ?.input ??
                                                                        "-"
                                                                    }
                                                                </pre>
                                                            </div>
                                                            <div>
                                                                <span>
                                                                    Expected
                                                                </span>
                                                                <pre>
                                                                    {
                                                                        testCase
                                                                            ?.expected ??
                                                                        "-"
                                                                    }
                                                                </pre>
                                                            </div>
                                                            <div>
                                                                <span>
                                                                    Your Output
                                                                </span>
                                                                <pre>
                                                                    {
                                                                        testCase
                                                                            ?.actual !==
                                                                            undefined &&
                                                                        testCase
                                                                            ?.actual !==
                                                                            ""
                                                                            ? testCase
                                                                                .actual
                                                                            : "-"
                                                                    }
                                                                </pre>
                                                            </div>
                                                        </div>
                                                        {testCase
                                                            ?.error && (
                                                            <div className="run-test-error">
                                                                <strong>
                                                                    Runtime Error
                                                                </strong>
                                                                <pre>
                                                                    {
                                                                        testCase
                                                                            .error
                                                                    }
                                                                </pre>
                                                            </div>
                                                        )}
                                                        {testCase
                                                            ?.timedOut && (
                                                            <div className="run-test-error">
                                                                <strong>
                                                                    Time Limit Exceeded
                                                                </strong>
                                                                <p>
                                                                    This test
                                                                    case exceeded
                                                                    the allowed
                                                                    execution
                                                                    time.
                                                                </p>
                                                            </div>
                                                        )}
                                                        <div className="run-test-time">
                                                            Execution Time:{" "}
                                                            {
                                                                Number(
                                                                    testCase
                                                                        ?.executionTime ||
                                                                    0
                                                                )
                                                            }
                                                            {" "}ms
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                </div>
                                <div className="run-result-summary">
                                    <span className="run-summary-passed">
                                        ✓{" "}
                                        {
                                            Number(
                                                currentRunResult
                                                    ?.passedCount ||
                                                0
                                            )
                                        }
                                        {" "}Passed
                                    </span>
                                    <span className="run-summary-failed">
                                        ✕{" "}
                                        {
                                            Number(
                                                currentRunResult
                                                    ?.failedCount ||
                                                0
                                            )
                                        }
                                        {" "}Failed
                                    </span>
                                    <span>
                                        ◷{" "}
                                        {
                                            Number(
                                                currentRunResult
                                                    ?.executionTime ||
                                                0
                                            )
                                        }
                                        {" "}ms
                                    </span>
                                </div>
                            </div>
                        )}
                    </section>
                    <div className="coding-navigation">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={
                                handlePrevious
                            }
                            disabled={
                                currentQuestion ===
                                    0 ||
                                running ||
                                submitting
                            }
                        >
                            ← Previous
                        </button>
                        {currentQuestion <
                        questions.length -
                            1 ? (
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={
                                    handleNext
                                }
                                disabled={
                                    running ||
                                    submitting
                                }
                            >
                                Next →
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn-primary submit-coding"
                                onClick={
                                    handleSubmit
                                }
                                disabled={
                                    submitting ||
                                    running
                                }
                            >
                                {submitting
                                    ? "Evaluating Code..."
                                    : "Submit Assessment"}

                            </button>
                        )}
                    </div>
                    {error && (
                        <div className="inline-error">
                            {error}
                        </div>
                    )}
                </main>
                <aside className="coding-sidebar">
                    <div className="sidebar-card">
                        <div className="sidebar-title">
                            <span className="sidebar-icon">
                                #
                            </span>
                            <h3>
                                Questions
                            </h3>
                        </div>
                        <div className="answered-count">
                            {answeredCount}
                            {" / "}
                            {questions.length}
                            {" "}answered
                        </div>
                        <div className="coding-question-grid">
                            {questions.map(
                                (
                                    question,
                                    index
                                ) => {
                                    const answered =
                                        isQuestionAnswered(
                                            question
                                        );
                                    const isCurrent =
                                        index ===
                                        currentQuestion;
                                    const questionId =
                                        getQuestionId(
                                            question
                                        );
                                    const runResult =
                                        questionId
                                            ? runResults[
                                                questionId
                                            ]
                                            : null;
                                    const runPassed =
                                        Boolean(
                                            runResult
                                                ?.allPassed
                                        );
                                    return (
                                        <button
                                            type="button"
                                            key={
                                                questionId ||
                                                index
                                            }
                                            disabled={
                                                running ||
                                                submitting
                                            }
                                            className={`coding-question-dot ${
                                                isCurrent
                                                    ? "current"
                                                    : ""
                                            } ${
                                                answered
                                                    ? "answered"
                                                    : ""
                                            } ${
                                                runPassed
                                                    ? "run-passed"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                handleQuestionNavigation(
                                                    index
                                                )
                                            }
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                }
                            )}
                        </div>
                        <div className="coding-legend">
                            <div>
                                <span className="legend-dot current-dot"></span>
                                Current
                            </div>
                            <div>
                                <span className="legend-dot answered-dot"></span>
                                Answered
                            </div>
                            <div>
                                <span className="legend-dot unanswered-dot"></span>
                                Unanswered
                            </div>
                        </div>
                    </div>
                    <div className="sidebar-card tip-card">
                        <div className="sidebar-title">
                            <span className="sidebar-icon">
                                💡
                            </span>
                            <h3>
                                Tip
                            </h3>
                        </div>
                        <p>
                            Run your solution against
                            the public test cases before
                            submitting. Passing public
                            tests does not guarantee
                            hidden tests will pass.
                        </p>
                    </div>
                    <div className="sidebar-card">
                        <div className="sidebar-title">
                            <span className="sidebar-icon">
                                ✓
                            </span>
                            <h3>
                                Progress
                            </h3>
                        </div>
                        <div className="progress-value">
                            {progressPercentage}%
                        </div>
                        <div className="sidebar-progress">
                            <div
                                className="sidebar-progress-fill"
                                style={{
                                    width:
                                        `${progressPercentage}%`
                                }}
                            />
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};
export default CodingAssessment;