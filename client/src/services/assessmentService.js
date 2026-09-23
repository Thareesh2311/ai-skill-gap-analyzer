import api from "./api";


/*
============================================================
CREATE ASSESSMENT
============================================================

POST
/api/assessments/create
============================================================
*/

const createAssessment = async (
    resumeId,
    type
) => {

    const response =
        await api.post(
            "/assessments/create",
            {
                resumeId,
                type
            }
        );


    return response.data;
};


/*
============================================================
START ASSESSMENT
============================================================

POST
/api/assessments/:assessmentId/start
============================================================
*/

const startAssessment = async (
    assessmentId
) => {

    const response =
        await api.post(
            `/assessments/${assessmentId}/start`
        );


    return response.data;
};


/*
============================================================
RUN CODING QUESTION
============================================================

POST
/api/assessments/:assessmentId/run-code

BODY:

{
    questionId,
    code
}

Used by:

CodingAssessment.jsx
        ↓
Run Code
        ↓
Public coding tests only
============================================================
*/

const runCodingQuestion = async (
    assessmentId,
    questionId,
    code
) => {

    const response =
        await api.post(

            `/assessments/${assessmentId}/run-code`,

            {
                questionId,
                code
            }
        );


    return response.data;
};


/*
============================================================
RUN SQL QUERY
============================================================

POST
/api/assessments/:assessmentId/run-sql


BODY:

{
    questionId,
    query
}


Used by:

SQLAssessment.jsx
        ↓
Run Query
        ↓
Public schema + sample data
        ↓
SQLite execution
        ↓
Rows / Columns / Execution Time


IMPORTANT:

This does NOT:

- calculate final score
- execute hidden SQL tests
- complete the assessment
============================================================
*/

const runSQLQuery = async (
    assessmentId,
    questionId,
    query
) => {

    const response =
        await api.post(

            `/assessments/${assessmentId}/run-sql`,

            {
                questionId,
                query
            }
        );


    return response.data;
};


/*
============================================================
SUBMIT ASSESSMENT
============================================================

POST
/api/assessments/:assessmentId/submit


Used for:

MCQ
Coding
SQL


Coding submission:
    public tests
    +
    hidden tests


SQL submission:
    hidden SQL databases
    +
    expected result comparison
============================================================
*/

const submitAssessment = async (
    assessmentId,
    answers
) => {

    const response =
        await api.post(

            `/assessments/${assessmentId}/submit`,

            {
                answers
            }
        );


    return response.data;
};


/*
============================================================
GET ASSESSMENT RESULT
============================================================

GET
/api/assessments/:assessmentId/result
============================================================
*/

const getAssessmentResult = async (
    assessmentId
) => {

    const response =
        await api.get(
            `/assessments/${assessmentId}/result`
        );


    return response.data;
};


/*
============================================================
GET FINAL JOB READINESS
============================================================

GET
/api/assessments/final-readiness/:resumeId
============================================================
*/

const getFinalReadiness = async (
    resumeId
) => {

    const response =
        await api.get(
            `/assessments/final-readiness/${resumeId}`
        );


    return response.data;
};


/*
============================================================
GET ASSESSMENT PROGRESS
============================================================

GET
/api/assessments/progress/:resumeId
============================================================
*/

const getAssessmentProgress = async (
    resumeId
) => {

    const response =
        await api.get(
            `/assessments/progress/${resumeId}`
        );


    return response.data;
};


/*
============================================================
GET OVERALL PROGRESS
============================================================

Kept for compatibility with existing components.
============================================================
*/

const getOverallProgress = async (
    resumeId
) => {

    const response =
        await api.get(
            `/assessments/progress/${resumeId}`
        );


    return response.data;
};


/*
============================================================
GET ASSESSMENT ANALYTICS
============================================================

GET
/api/assessments/analytics/:resumeId
============================================================
*/

const getAssessmentAnalytics = async (
    resumeId
) => {

    const response =
        await api.get(
            `/assessments/analytics/${resumeId}`
        );


    return response.data;
};


/*
============================================================
EXPORT SERVICE
============================================================
*/

const assessmentService = {

    createAssessment,

    startAssessment,

    runCodingQuestion,

    runSQLQuery,

    submitAssessment,

    getAssessmentResult,

    getFinalReadiness,

    getAssessmentProgress,

    getOverallProgress,

    getAssessmentAnalytics
};


export default assessmentService;