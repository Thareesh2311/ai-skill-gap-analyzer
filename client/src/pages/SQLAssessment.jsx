import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import Editor from "@monaco-editor/react";

import assessmentService
    from "../services/assessmentService";

import "./sqlAssessment.css";


/*
============================================================
SQL ASSESSMENT
============================================================
*/

const SQLAssessment = () => {

    const navigate =
        useNavigate();


    /*
    ========================================================
    ASSESSMENT ID
    ========================================================
    */

    const assessmentId =
        localStorage.getItem(
            "assessmentId"
        ) || "";


    /*
    ========================================================
    STATE
    ========================================================
    */

    const [
        questions,
        setQuestions
    ] = useState([]);


    const [
        currentQuestion,
        setCurrentQuestion
    ] = useState(0);


    const [
        answers,
        setAnswers
    ] = useState({});


    const [
        savedAnswersLoaded,
        setSavedAnswersLoaded
    ] = useState(false);


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        running,
        setRunning
    ] = useState(false);


    const [
        submitting,
        setSubmitting
    ] = useState(false);


    const [
        error,
        setError
    ] = useState("");


    /*
    Stores Run Query output
    separately for every question.
    */

    const [
        runResults,
        setRunResults
    ] = useState({});


    /*
    ========================================================
    QUESTION ID
    ========================================================
    */

    const getQuestionId =
        (question) => {

            return (
                question?._id ||
                question?.id ||
                question?.questionId ||
                ""
            );
        };


    /*
    ========================================================
    STARTER QUERY
    ========================================================

    Supports optional future backend fields.

    Existing SQLQuestion model does not require starterQuery,
    so default is blank.
    ========================================================
    */

    const getStarterQuery =
        (question) => {

            if (!question) {

                return "";
            }


            return (
                question?.starterQuery ||
                question?.starterCode ||
                question?.queryTemplate ||
                ""
            );
        };


    /*
    ========================================================
    LOAD SAVED SQL ANSWERS
    ========================================================
    */

    useEffect(() => {

        if (
            !assessmentId
        ) {

            setSavedAnswersLoaded(
                true
            );

            return;
        }


        try {

            const saved =
                localStorage.getItem(
                    `sqlAnswers_${assessmentId}`
                );


            if (saved) {

                const parsed =
                    JSON.parse(
                        saved
                    );


                if (
                    parsed &&
                    typeof parsed ===
                        "object" &&
                    !Array.isArray(
                        parsed
                    )
                ) {

                    setAnswers(
                        parsed
                    );
                }
            }


        } catch (storageError) {

            console.error(
                "Failed to load saved SQL answers:",
                storageError
            );


        } finally {

            setSavedAnswersLoaded(
                true
            );
        }

    }, [
        assessmentId
    ]);


    /*
    ========================================================
    AUTO-SAVE SQL ANSWERS
    ========================================================
    */

    useEffect(() => {

        if (
            !assessmentId ||
            !savedAnswersLoaded
        ) {

            return;
        }


        try {

            localStorage.setItem(

                `sqlAnswers_${assessmentId}`,

                JSON.stringify(
                    answers
                )
            );


        } catch (storageError) {

            console.error(
                "Failed to save SQL answers:",
                storageError
            );
        }

    }, [
        assessmentId,
        answers,
        savedAnswersLoaded
    ]);


    /*
    ========================================================
    START / LOAD ASSESSMENT
    ========================================================
    */

    useEffect(() => {

        const loadAssessment =
            async () => {

                try {

                    setLoading(
                        true
                    );

                    setError(
                        ""
                    );


                    /*
                    --------------------------------------------
                    ASSESSMENT ID REQUIRED
                    --------------------------------------------
                    */

                    if (
                        !assessmentId
                    ) {

                        setError(
                            "No assessment found. Please create a SQL assessment first."
                        );

                        setLoading(
                            false
                        );

                        return;
                    }


                    /*
                    --------------------------------------------
                    START ASSESSMENT
                    --------------------------------------------
                    */

                    const response =
                        await assessmentService
                            .startAssessment(
                                assessmentId
                            );


                    console.log(
                        "Started SQL assessment:",
                        response
                    );


                    /*
                    --------------------------------------------
                    NORMALIZE QUESTION RESPONSE
                    --------------------------------------------
                    */

                    let questionList =
                        response?.questions ||

                        response
                            ?.data
                            ?.questions ||

                        response
                            ?.data
                            ?.data
                            ?.questions ||

                        response
                            ?.assessment
                            ?.questions ||

                        response
                            ?.data
                            ?.assessment
                            ?.questions ||

                        [];


                    /*
                    --------------------------------------------
                    LOCAL STORAGE FALLBACK
                    --------------------------------------------
                    */

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
                                        `sqlQuestions_${assessmentId}`
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
                                "Failed to load saved SQL questions:",
                                storageError
                            );
                        }
                    }


                    /*
                    --------------------------------------------
                    NO QUESTIONS
                    --------------------------------------------
                    */

                    if (
                        !Array.isArray(
                            questionList
                        ) ||
                        questionList.length ===
                            0
                    ) {

                        setQuestions(
                            []
                        );

                        setError(
                            "No SQL questions were returned by the server."
                        );

                        setLoading(
                            false
                        );

                        return;
                    }


                    /*
                    --------------------------------------------
                    VERIFY QUESTION IDS
                    --------------------------------------------
                    */

                    const invalidQuestions =
                        questionList.filter(
                            (question) =>
                                !getQuestionId(
                                    question
                                )
                        );


                    if (
                        invalidQuestions.length >
                        0
                    ) {

                        console.warn(
                            "Some SQL questions are missing IDs:",
                            invalidQuestions
                        );
                    }


                    /*
                    --------------------------------------------
                    SAVE QUESTIONS
                    --------------------------------------------
                    */

                    setQuestions(
                        questionList
                    );


                    localStorage.setItem(

                        `sqlQuestions_${assessmentId}`,

                        JSON.stringify(
                            questionList
                        )
                    );


                } catch (
                    requestError
                ) {

                    console.error(
                        "Failed to start SQL assessment:",
                        requestError
                    );


                    setError(
                        requestError
                            ?.response
                            ?.data
                            ?.message ||

                        requestError
                            ?.message ||

                        "Failed to start SQL assessment."
                    );


                } finally {

                    setLoading(
                        false
                    );
                }
            };


        loadAssessment();

    }, [
        assessmentId
    ]);


    /*
    ========================================================
    CURRENT QUESTION
    ========================================================
    */

    const currentQuestionData =
        questions.length >
        0

            ? questions[
                currentQuestion
            ]

            : null;


    const currentQuestionId =
        getQuestionId(
            currentQuestionData
        );


    /*
    ========================================================
    CURRENT RUN RESULT
    ========================================================
    */

    const currentRunResult =
        currentQuestionId

            ? runResults[
                currentQuestionId
            ] ||
            null

            : null;


    /*
    ========================================================
    STARTER QUERY
    ========================================================
    */

    const starterQuery =
        useMemo(
            () => {

                return getStarterQuery(
                    currentQuestionData
                );
            },

            [
                currentQuestionData
            ]
        );


    /*
    ========================================================
    HAS SAVED ANSWER
    ========================================================
    */

    const hasSavedAnswer =
        currentQuestionId

            ? Object.prototype
                .hasOwnProperty
                .call(
                    answers,
                    currentQuestionId
                )

            : false;


    /*
    ========================================================
    CURRENT SQL QUERY
    ========================================================
    */

    const currentQuery =
        currentQuestionId

            ? hasSavedAnswer

                ? answers[
                    currentQuestionId
                ]

                : starterQuery

            : "";


    /*
    ========================================================
    QUERY CHANGE
    ========================================================
    */

    const handleQueryChange =
        (value) => {

            if (
                !currentQuestionId
            ) {

                return;
            }


            const newQuery =
                value ?? "";


            /*
            Save query
            */

            setAnswers(
                (previous) => ({

                    ...previous,

                    [currentQuestionId]:
                        newQuery
                })
            );


            /*
            Clear previous query output when query changes.

            Prevents stale output from appearing for
            modified SQL.
            */

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


            /*
            Clear previous UI error.
            */

            if (error) {

                setError(
                    ""
                );
            }
        };


    /*
    ========================================================
    ANSWERED CHECK
    ========================================================
    */

    const isQuestionAnswered =
        (question) => {

            const questionId =
                getQuestionId(
                    question
                );


            if (
                !questionId
            ) {

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
                String(
                    answers[
                        questionId
                    ] ??
                    ""
                ).trim()
            );
        };


    /*
    ========================================================
    SUBMISSION QUERY
    ========================================================
    */

    const getSubmissionQuery =
        (question) => {

            const questionId =
                getQuestionId(
                    question
                );


            if (
                !questionId
            ) {

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

                return String(
                    answers[
                        questionId
                    ] ??
                    ""
                );
            }


            return "";
        };


    /*
    ========================================================
    ANSWERED COUNT
    ========================================================
    */

    const answeredCount =
        questions.filter(
            isQuestionAnswered
        ).length;


    /*
    ========================================================
    PROGRESS
    ========================================================
    */

    const progressPercentage =
        questions.length >
        0

            ? Math.round(
                (
                    answeredCount /
                    questions.length
                ) * 100
            )

            : 0;


    /*
    ========================================================
    PREVIOUS QUESTION
    ========================================================
    */

    const handlePrevious =
        () => {

            if (
                currentQuestion >
                    0 &&
                !running &&
                !submitting
            ) {

                setCurrentQuestion(
                    (previous) =>
                        previous -
                        1
                );


                setError(
                    ""
                );
            }
        };


    /*
    ========================================================
    NEXT QUESTION
    ========================================================
    */

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
                        previous +
                        1
                );


                setError(
                    ""
                );
            }
        };


    /*
    ========================================================
    QUESTION NAVIGATION
    ========================================================
    */

    const handleQuestionNavigation =
        (index) => {

            if (
                running ||
                submitting
            ) {

                return;
            }


            if (
                index <
                    0 ||
                index >=
                    questions.length
            ) {

                return;
            }


            setCurrentQuestion(
                index
            );


            setError(
                ""
            );
        };


    /*
    ========================================================
    RUN SQL QUERY
    ========================================================
    */

    const handleRunQuery =
        async () => {

            if (
                running ||
                submitting
            ) {

                return;
            }


            /*
            --------------------------------------------
            VALIDATE ASSESSMENT
            --------------------------------------------
            */

            if (
                !assessmentId
            ) {

                setError(
                    "Assessment ID is missing."
                );

                return;
            }


            /*
            --------------------------------------------
            VALIDATE QUESTION
            --------------------------------------------
            */

            if (
                !currentQuestionId
            ) {

                setError(
                    "SQL question ID is missing."
                );

                return;
            }


            /*
            --------------------------------------------
            VALIDATE QUERY
            --------------------------------------------
            */

            if (
                !currentQuery ||
                !currentQuery.trim()
            ) {

                setError(
                    "Please write a SQL query before running."
                );

                return;
            }


            try {

                setRunning(
                    true
                );

                setError(
                    ""
                );


                /*
                --------------------------------------------
                API
                --------------------------------------------
                */

                const response =
                    await assessmentService
                        .runSQLQuery(
                            assessmentId,
                            currentQuestionId,
                            currentQuery
                        );


                console.log(
                    "Run SQL Result:",
                    response
                );


                /*
                Backend returns:

                {
                    success,
                    message,
                    data
                }
                */

                const result =
                    response?.data ||
                    {};


                /*
                Store even failed SQL execution.

                A syntax error is still a valid Run Query
                result that should be displayed.
                */

                const normalizedResult = {

                    ...result,

                    success:
                        Boolean(
                            response
                                ?.success
                        ),

                    message:
                        response
                            ?.message ||
                        "",

                    error:
                        result
                            ?.error ||
                        (
                            response
                                ?.success
                                ? ""
                                : response
                                    ?.message ||
                                "SQL execution failed."
                        )
                };


                setRunResults(
                    (previous) => ({

                        ...previous,

                        [currentQuestionId]:
                            normalizedResult
                    })
                );


            } catch (
                requestError
            ) {

                console.error(
                    "Run SQL Query Error:",
                    requestError
                );


                /*
                Request-level error.

                Example:
                authentication
                route missing
                backend crash
                */

                setError(
                    requestError
                        ?.response
                        ?.data
                        ?.message ||

                    requestError
                        ?.response
                        ?.data
                        ?.error ||

                    requestError
                        ?.message ||

                    "Failed to run SQL query."
                );


            } finally {

                setRunning(
                    false
                );
            }
        };


    /*
    ========================================================
    SUBMIT SQL ASSESSMENT
    ========================================================
    */

    const handleSubmit =
        async () => {

            if (
                submitting ||
                running
            ) {

                return;
            }


            /*
            --------------------------------------------
            UNANSWERED QUESTIONS
            --------------------------------------------
            */

            const unansweredCount =
                questions.filter(
                    (question) =>
                        !isQuestionAnswered(
                            question
                        )
                ).length;


            /*
            --------------------------------------------
            CONFIRM
            --------------------------------------------
            */

            const confirmed =
                window.confirm(

                    unansweredCount >
                    0

                        ? `You have ${unansweredCount} unanswered SQL question(s).\n\nAre you sure you want to submit?`

                        : "Submit your SQL assessment?"
                );


            if (
                !confirmed
            ) {

                return;
            }


            try {

                setSubmitting(
                    true
                );

                setError(
                    ""
                );


                /*
                --------------------------------------------
                BUILD ANSWERS
                --------------------------------------------
                */

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
                                    getSubmissionQuery(
                                        question
                                    )
                            };
                        }
                    );


                /*
                --------------------------------------------
                VALIDATE IDS
                --------------------------------------------
                */

                const missingId =
                    formattedAnswers.find(
                        (answer) =>
                            !answer
                                .questionId
                    );


                if (
                    missingId
                ) {

                    throw new Error(
                        "One or more SQL questions are missing their database ID. Please restart the assessment."
                    );
                }


                console.log(
                    "Submitting SQL assessment:",
                    {
                        assessmentId,
                        answers:
                            formattedAnswers
                    }
                );


                /*
                --------------------------------------------
                SUBMIT
                --------------------------------------------
                */

                const response =
                    await assessmentService
                        .submitAssessment(
                            assessmentId,
                            formattedAnswers
                        );


                console.log(
                    "SQL assessment submitted:",
                    response
                );


                /*
                --------------------------------------------
                SAVE RESULT
                --------------------------------------------
                */

                localStorage.setItem(

                    "assessmentResult",

                    JSON.stringify(
                        response
                    )
                );


                localStorage.setItem(
                    "lastAssessmentType",
                    "sql"
                );


                const normalizedResult =
                    response?.data ||
                    response;


                if (
                    normalizedResult
                ) {

                    localStorage.setItem(

                        `sqlResult_${assessmentId}`,

                        JSON.stringify(
                            normalizedResult
                        )
                    );
                }


                /*
                --------------------------------------------
                CLEAR TEMPORARY ANSWERS
                --------------------------------------------
                */

                localStorage.removeItem(
                    `sqlAnswers_${assessmentId}`
                );


                /*
                --------------------------------------------
                GO TO SQL RESULT
                --------------------------------------------
                */

                navigate(
                    `/sql-result/${assessmentId}`,
                    {
                        replace:
                            true
                    }
                );


            } catch (
                submitError
            ) {

                console.error(
                    "SQL assessment submission failed:",
                    submitError
                );


                setError(
                    submitError
                        ?.response
                        ?.data
                        ?.message ||

                    submitError
                        ?.response
                        ?.data
                        ?.error ||

                    submitError
                        ?.message ||

                    "Failed to submit SQL assessment."
                );


            } finally {

                setSubmitting(
                    false
                );
            }
        };


    /*
    ========================================================
    LOADING
    ========================================================
    */

    if (
        loading
    ) {

        return (

            <div className="sql-loading">

                <div className="sql-loading-card">

                    <div className="sql-spinner" />

                    <h2>
                        Loading SQL Assessment
                    </h2>

                    <p>
                        Preparing your database
                        questions...
                    </p>

                </div>

            </div>
        );
    }


    /*
    ========================================================
    FATAL ERROR
    ========================================================
    */

    if (
        error &&
        questions.length ===
            0
    ) {

        return (

            <div className="sql-error-page">

                <div className="sql-error-card">

                    <div className="sql-error-icon">
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
                        className="sql-primary-btn"
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
    ========================================================
    NO QUESTION
    ========================================================
    */

    if (
        !currentQuestionData
    ) {

        return (

            <div className="sql-error-page">

                <div className="sql-error-card">

                    <h2>
                        No SQL Questions Found
                    </h2>

                    <p>
                        No SQL questions are
                        available for this
                        assessment.
                    </p>

                    <button
                        type="button"
                        className="sql-primary-btn"
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
    ========================================================
    QUESTION DISPLAY DATA
    ========================================================
    */

    const questionTitle =
        currentQuestionData
            ?.title ||
        `SQL Problem ${
            currentQuestion +
            1
        }`;


    const description =
        currentQuestionData
            ?.description ||
        "Write a SQL query that satisfies the given requirement.";


    const difficulty =
        currentQuestionData
            ?.difficulty ||
        "beginner";


    const points =
        Number(
            currentQuestionData
                ?.points ||
            10
        );


    const schema =
        currentQuestionData
            ?.schema ||
        "";


    const sampleData =
        currentQuestionData
            ?.sampleData ||
        "";


    /*
    ========================================================
    RESULT DATA
    ========================================================
    */

    const resultRows =
        Array.isArray(
            currentRunResult
                ?.rows
        )
            ? currentRunResult
                .rows
            : [];


    let resultColumns =
        Array.isArray(
            currentRunResult
                ?.columns
        )
            ? currentRunResult
                .columns
            : [];


    /*
    Column fallback.
    */

    if (
        resultColumns.length ===
            0 &&
        resultRows.length >
            0 &&
        resultRows[0] &&
        typeof resultRows[0] ===
            "object"
    ) {

        resultColumns =
            Object.keys(
                resultRows[0]
            );
    }


    /*
    ========================================================
    RENDER
    ========================================================
    */

    return (

        <div className="sql-page">

            <div className="sql-layout">


                {/* =================================================
                    MAIN CONTENT
                ================================================= */}

                <main className="sql-main">


                    {/* =================================================
                        PROBLEM
                    ================================================= */}

                    <section className="sql-problem-card">


                        {/* HEADER */}

                        <div className="sql-problem-header">

                            <div>

                                <div className="sql-problem-number">

                                    SQL PROBLEM{" "}

                                    {
                                        currentQuestion +
                                        1
                                    }

                                </div>


                                <h1>
                                    {questionTitle}
                                </h1>

                            </div>


                            <div className="sql-problem-badges">

                                <span
                                    className={`sql-difficulty-badge ${String(
                                        difficulty
                                    ).toLowerCase()}`}
                                >
                                    {difficulty}
                                </span>


                                <span className="sql-points-badge">

                                    {points} Pts

                                </span>

                            </div>

                        </div>


                        {/* DESCRIPTION */}

                        <div className="sql-description">

                            <h3>
                                Problem
                            </h3>

                            <p>
                                {description}
                            </p>

                        </div>


                        {/* DATABASE SCHEMA */}

                        <div className="sql-question-section">

                            <div className="sql-section-heading">

                                <div>

                                    <span className="sql-section-kicker">
                                        DATABASE
                                    </span>

                                    <h3>
                                        Schema
                                    </h3>

                                </div>

                            </div>


                            {schema ? (

                                <pre className="sql-schema-code">
                                    {schema}
                                </pre>

                            ) : (

                                <p className="sql-empty-info">
                                    No public schema was
                                    provided for this question.
                                </p>
                            )}

                        </div>


                        {/* SAMPLE DATA */}

                        <div className="sql-question-section">

                            <div className="sql-section-heading">

                                <div>

                                    <span className="sql-section-kicker">
                                        SAMPLE
                                    </span>

                                    <h3>
                                        Sample Data
                                    </h3>

                                </div>

                            </div>


                            {sampleData ? (

                                <pre className="sql-sample-data">
                                    {sampleData}
                                </pre>

                            ) : (

                                <p className="sql-empty-info">
                                    This question does not
                                    include public sample data.
                                </p>
                            )}

                        </div>


                        {/* SECURITY NOTE */}

                        <div className="sql-public-db-note">

                            <span>
                                ⓘ
                            </span>

                            <p>

                                Run Query executes against
                                the public sample database.
                                Final submission is evaluated
                                separately using protected
                                test data.

                            </p>

                        </div>

                    </section>


                    {/* =================================================
                        SQL EDITOR
                    ================================================= */}

                    <section className="sql-editor-card">


                        {/* EDITOR HEADER */}

                        <div className="sql-editor-header">

                            <div>

                                <div className="sql-editor-label">
                                    SQL QUERY
                                </div>

                                <div className="sql-editor-subtitle">

                                    Write a read-only
                                    SELECT or WITH query

                                </div>

                            </div>


                            <div className="sql-language-badge">
                                SQLite
                            </div>

                        </div>


                        {/* MONACO */}

                        <div className="sql-monaco-wrapper">

                            <Editor

                                height="380px"

                                language="sql"

                                theme="vs-dark"

                                value={
                                    currentQuery
                                }

                                onChange={
                                    handleQueryChange
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


                        {/* EDITOR FOOTER */}

                        <div className="sql-editor-footer">

                            <span>
                                SQL Engine: SQLite
                            </span>

                            <span>

                                {hasSavedAnswer
                                    ? "Auto-saved"
                                    : "Not answered"}

                            </span>

                        </div>


                        {/* =================================================
                            RUN QUERY ACTION
                        ================================================= */}

                        <div className="sql-run-actions">

                            <button

                                type="button"

                                className="sql-run-btn"

                                onClick={
                                    handleRunQuery
                                }

                                disabled={
                                    running ||
                                    submitting
                                }
                            >

                                {running
                                    ? "Running Query..."
                                    : "▶ Run Query"}

                            </button>


                            <span className="sql-run-hint">

                                SELECT and WITH queries only.
                                Run Query does not affect
                                your final score.

                            </span>

                        </div>


                        {/* =================================================
                            QUERY RESULT
                        ================================================= */}

                        {currentRunResult && (

                            <div className="sql-result-panel">


                                {/* RESULT HEADER */}

                                <div className="sql-result-header">

                                    <div>

                                        <h3>
                                            Query Result
                                        </h3>

                                        <p>

                                            {currentRunResult
                                                ?.success

                                                ? `${
                                                    Number(
                                                        currentRunResult
                                                            ?.rowCount ??
                                                        resultRows.length
                                                    )
                                                } row(s) returned`

                                                : "Query execution failed"}

                                        </p>

                                    </div>


                                    <div
                                        className={`sql-result-status ${
                                            currentRunResult
                                                ?.success
                                                ? "success"
                                                : "failed"
                                        }`}
                                    >

                                        {currentRunResult
                                            ?.success

                                            ? "✓ Executed"

                                            : currentRunResult
                                                ?.timedOut

                                                ? "◷ Timed Out"

                                                : "✕ Error"}

                                    </div>

                                </div>


                                {/* =================================================
                                    ERROR RESULT
                                ================================================= */}

                                {!currentRunResult
                                    ?.success && (

                                    <div className="sql-query-error">

                                        <div className="sql-query-error-title">

                                            {currentRunResult
                                                ?.timedOut
                                                ? "Time Limit Exceeded"
                                                : "SQL Error"}

                                        </div>


                                        <pre>

                                            {
                                                currentRunResult
                                                    ?.error ||
                                                "The SQL query could not be executed."
                                            }

                                        </pre>


                                        {currentRunResult
                                            ?.errorType && (

                                            <div className="sql-error-type">

                                                Error Type:{" "}

                                                {
                                                    currentRunResult
                                                        .errorType
                                                }

                                            </div>
                                        )}

                                    </div>
                                )}


                                {/* =================================================
                                    SUCCESS RESULT TABLE
                                ================================================= */}

                                {currentRunResult
                                    ?.success && (

                                    <>

                                        {resultColumns.length >
                                            0 ? (

                                            <div className="sql-table-wrapper">

                                                <table className="sql-result-table">

                                                    <thead>

                                                        <tr>

                                                            {resultColumns.map(
                                                                (
                                                                    column,
                                                                    index
                                                                ) => (

                                                                    <th
                                                                        key={`${column}-${index}`}
                                                                    >
                                                                        {
                                                                            column
                                                                        }
                                                                    </th>
                                                                )
                                                            )}

                                                        </tr>

                                                    </thead>


                                                    <tbody>

                                                        {resultRows.length >
                                                            0 ? (

                                                            resultRows.map(
                                                                (
                                                                    row,
                                                                    rowIndex
                                                                ) => (

                                                                    <tr
                                                                        key={
                                                                            rowIndex
                                                                        }
                                                                    >

                                                                        {resultColumns.map(
                                                                            (
                                                                                column,
                                                                                columnIndex
                                                                            ) => {

                                                                                const value =
                                                                                    row
                                                                                        ?.[
                                                                                            column
                                                                                        ];


                                                                                return (

                                                                                    <td
                                                                                        key={`${rowIndex}-${columnIndex}`}
                                                                                    >

                                                                                        {value ===
                                                                                        null

                                                                                            ? (
                                                                                                <span className="sql-null-value">
                                                                                                    NULL
                                                                                                </span>
                                                                                            )

                                                                                            : typeof value ===
                                                                                                "object"

                                                                                                ? JSON.stringify(
                                                                                                    value
                                                                                                )

                                                                                                : String(
                                                                                                    value ??
                                                                                                    ""
                                                                                                )}

                                                                                    </td>
                                                                                );
                                                                            }
                                                                        )}

                                                                    </tr>
                                                                )
                                                            )

                                                        ) : (

                                                            <tr>

                                                                <td
                                                                    colSpan={
                                                                        Math.max(
                                                                            resultColumns.length,
                                                                            1
                                                                        )
                                                                    }
                                                                    className="sql-no-rows"
                                                                >

                                                                    Query executed successfully,
                                                                    but no rows were returned.

                                                                </td>

                                                            </tr>
                                                        )}

                                                    </tbody>

                                                </table>

                                            </div>

                                        ) : (

                                            <div className="sql-no-result-columns">

                                                Query executed successfully,
                                                but no result columns were returned.

                                            </div>
                                        )}


                                        {/* RESULT META */}

                                        <div className="sql-result-meta">

                                            <span>

                                                Rows:{" "}

                                                <strong>

                                                    {
                                                        Number(
                                                            currentRunResult
                                                                ?.rowCount ??
                                                            resultRows.length
                                                        )
                                                    }

                                                </strong>

                                            </span>


                                            <span>

                                                Execution Time:{" "}

                                                <strong>

                                                    {
                                                        Number(
                                                            currentRunResult
                                                                ?.executionTime ||
                                                            0
                                                        )
                                                    }

                                                    {" "}ms

                                                </strong>

                                            </span>

                                        </div>

                                    </>
                                )}


                                {/* FAILED META */}

                                {!currentRunResult
                                    ?.success && (

                                    <div className="sql-result-meta">

                                        <span>

                                            Execution Time:{" "}

                                            <strong>

                                                {
                                                    Number(
                                                        currentRunResult
                                                            ?.executionTime ||
                                                        0
                                                    )
                                                }

                                                {" "}ms

                                            </strong>

                                        </span>

                                    </div>
                                )}

                            </div>
                        )}

                    </section>


                    {/* =================================================
                        NAVIGATION
                    ================================================= */}

                    <div className="sql-navigation">

                        <button

                            type="button"

                            className="sql-secondary-btn"

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

                                className="sql-primary-btn"

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

                                className="sql-primary-btn sql-submit-btn"

                                onClick={
                                    handleSubmit
                                }

                                disabled={
                                    submitting ||
                                    running
                                }
                            >

                                {submitting
                                    ? "Evaluating SQL..."
                                    : "Submit Assessment"}

                            </button>
                        )}

                    </div>


                    {/* =================================================
                        INLINE ERROR
                    ================================================= */}

                    {error && (

                        <div className="sql-inline-error">

                            {error}

                        </div>
                    )}

                </main>


                {/* =================================================
                    SIDEBAR
                ================================================= */}

                <aside className="sql-sidebar">


                    {/* QUESTIONS */}

                    <div className="sql-sidebar-card">

                        <div className="sql-sidebar-title">

                            <span className="sql-sidebar-icon">
                                SQL
                            </span>

                            <h3>
                                Questions
                            </h3>

                        </div>


                        <div className="sql-answered-count">

                            {answeredCount}
                            {" / "}
                            {questions.length}
                            {" "}answered

                        </div>


                        <div className="sql-question-grid">

                            {questions.map(
                                (
                                    question,
                                    index
                                ) => {

                                    const questionId =
                                        getQuestionId(
                                            question
                                        );


                                    const answered =
                                        isQuestionAnswered(
                                            question
                                        );


                                    const isCurrent =
                                        index ===
                                        currentQuestion;


                                    const runResult =
                                        questionId
                                            ? runResults[
                                                questionId
                                            ]
                                            : null;


                                    const queryExecuted =
                                        Boolean(
                                            runResult
                                                ?.success
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

                                            className={`sql-question-dot ${
                                                isCurrent
                                                    ? "current"
                                                    : ""
                                            } ${
                                                answered
                                                    ? "answered"
                                                    : ""
                                            } ${
                                                queryExecuted
                                                    ? "executed"
                                                    : ""
                                            }`}

                                            onClick={() =>
                                                handleQuestionNavigation(
                                                    index
                                                )
                                            }
                                        >

                                            {
                                                index +
                                                1
                                            }

                                        </button>
                                    );
                                }
                            )}

                        </div>


                        {/* LEGEND */}

                        <div className="sql-legend">

                            <div>

                                <span className="sql-legend-dot sql-current-dot" />

                                Current

                            </div>


                            <div>

                                <span className="sql-legend-dot sql-answered-dot" />

                                Answered

                            </div>


                            <div>

                                <span className="sql-legend-dot sql-executed-dot" />

                                Query Executed

                            </div>


                            <div>

                                <span className="sql-legend-dot sql-unanswered-dot" />

                                Unanswered

                            </div>

                        </div>

                    </div>


                    {/* SQL RULES */}

                    <div className="sql-sidebar-card">

                        <div className="sql-sidebar-title">

                            <span className="sql-sidebar-icon">
                                ✓
                            </span>

                            <h3>
                                SQL Rules
                            </h3>

                        </div>


                        <ul className="sql-rules-list">

                            <li>
                                Use SELECT or WITH queries.
                            </li>

                            <li>
                                Only one SQL statement is allowed.
                            </li>

                            <li>
                                Database modification is disabled.
                            </li>

                            <li>
                                Hidden evaluation data is used
                                during final submission.
                            </li>

                        </ul>

                    </div>


                    {/* TIP */}

                    <div className="sql-sidebar-card sql-tip-card">

                        <div className="sql-sidebar-title">

                            <span className="sql-sidebar-icon">
                                💡
                            </span>

                            <h3>
                                Tip
                            </h3>

                        </div>


                        <p>

                            Run the query against the sample
                            database first. Verify column names,
                            joins, filters, grouping and ordering
                            before submitting.

                        </p>

                    </div>


                    {/* PROGRESS */}

                    <div className="sql-sidebar-card">

                        <div className="sql-sidebar-title">

                            <span className="sql-sidebar-icon">
                                %
                            </span>

                            <h3>
                                Progress
                            </h3>

                        </div>


                        <div className="sql-progress-value">

                            {progressPercentage}%

                        </div>


                        <div className="sql-progress-track">

                            <div
                                className="sql-progress-fill"

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


export default SQLAssessment;