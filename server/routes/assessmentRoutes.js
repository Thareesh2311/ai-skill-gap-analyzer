const express =
    require("express");


/*
============================================================
CONTROLLERS
============================================================
*/

const {

    createAssessment,

    startAssessment,

    submitAssessment,

    runCodingQuestion,

    runSQLQuery,

    getAssessmentResult,

    getFinalJobReadinessResult,

    getAssessmentProgress,

    getAssessmentAnalytics

} = require(
    "../controllers/assessmentController"
);


/*
============================================================
MIDDLEWARE
============================================================
*/

const protect =
    require(
        "../middleware/authMiddleware"
    );


/*
============================================================
ROUTER
============================================================
*/

const router =
    express.Router();


/*
============================================================
CREATE ASSESSMENT
============================================================

POST
/api/assessments/create
============================================================
*/

router.post(

    "/create",

    protect,

    createAssessment
);


/*
============================================================
START ASSESSMENT
============================================================

POST
/api/assessments/:assessmentId/start
============================================================
*/

router.post(

    "/:assessmentId/start",

    protect,

    startAssessment
);


/*
============================================================
RUN CODING QUESTION
============================================================

POST
/api/assessments/:assessmentId/run-code

BODY:

{
    "questionId": "...",
    "code": "..."
}

PURPOSE:

Student writes code
        ↓
Run Code
        ↓
Public test cases only
        ↓
Passed / Failed results


IMPORTANT:

This route:

    ✓ Executes public coding tests
    ✓ Returns test-case results
    ✓ Returns runtime information

This route DOES NOT:

    ✗ Calculate final score
    ✗ Complete assessment
    ✗ Execute hidden tests
    ✗ Save final assessment result
============================================================
*/

router.post(

    "/:assessmentId/run-code",

    protect,

    runCodingQuestion
);


/*
============================================================
RUN SQL QUERY
============================================================

POST
/api/assessments/:assessmentId/run-sql


BODY:

{
    "questionId": "...",
    "query": "SELECT ..."
}


PURPOSE:

Student writes SQL
        ↓
Run Query
        ↓
Public schema + sample data
        ↓
SQLite execution
        ↓
Return result table


SUCCESS EXAMPLE:

{
    "success": true,

    "data": {

        "rows": [
            {
                "department": "IT",
                "count": 3
            }
        ],

        "columns": [
            "department",
            "count"
        ],

        "rowCount": 1,

        "executionTime": 4
    }
}


IMPORTANT:

This route:

    ✓ Executes SQL query
    ✓ Uses public schema
    ✓ Uses public sample data
    ✓ Returns rows
    ✓ Returns columns
    ✓ Returns row count
    ✓ Returns execution time
    ✓ Returns SQL errors

This route DOES NOT:

    ✗ Calculate final SQL score
    ✗ Run hidden SQL test cases
    ✗ Expose expectedQueryResult
    ✗ Expose hidden schemas
    ✗ Save final answer
    ✗ Complete assessment
============================================================
*/

router.post(

    "/:assessmentId/run-sql",

    protect,

    runSQLQuery
);


/*
============================================================
SUBMIT ASSESSMENT
============================================================

POST
/api/assessments/:assessmentId/submit


Submission executes:

MCQ:
    → final answer scoring


Coding:
    → public tests
    → hidden tests
    → partial/final scoring


SQL:
    → hidden SQL test databases
    → expected result comparison
    → partial/final scoring
============================================================
*/

router.post(

    "/:assessmentId/submit",

    protect,

    submitAssessment
);


/*
============================================================
GET ASSESSMENT RESULT
============================================================

GET
/api/assessments/:assessmentId/result
============================================================
*/

router.get(

    "/:assessmentId/result",

    protect,

    getAssessmentResult
);


/*
============================================================
GET FINAL JOB READINESS
============================================================

GET
/api/assessments/final-readiness/:resumeId
============================================================
*/

router.get(

    "/final-readiness/:resumeId",

    protect,

    getFinalJobReadinessResult
);


/*
============================================================
GET ASSESSMENT PROGRESS
============================================================

GET
/api/assessments/progress/:resumeId
============================================================
*/

router.get(

    "/progress/:resumeId",

    protect,

    getAssessmentProgress
);


/*
============================================================
GET ASSESSMENT ANALYTICS
============================================================

GET
/api/assessments/analytics/:resumeId
============================================================
*/

router.get(

    "/analytics/:resumeId",

    protect,

    getAssessmentAnalytics
);


/*
============================================================
EXPORT ROUTER
============================================================
*/

module.exports =
    router;