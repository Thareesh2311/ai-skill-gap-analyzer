const mongoose = require("mongoose");


/*
============================================================
SQL TEST CASE SCHEMA
============================================================

Each test case represents a separate database setup
used to validate the student's SQL query.

Public test:
    isHidden: false

Hidden test:
    isHidden: true

IMPORTANT:

The complete testCases array is server-only because
SQLQuestion.testCases uses select:false.

Controllers that need final evaluation must explicitly use:

.select("+testCases")

============================================================
*/

const sqlTestCaseSchema =
    new mongoose.Schema(
        {

            /*
            --------------------------------------------------------
            DATABASE SCHEMA
            --------------------------------------------------------

            Example:

            CREATE TABLE employees (
                id INTEGER PRIMARY KEY,
                name TEXT,
                department TEXT,
                salary INTEGER
            );
            */

            schema: {

                type:
                    String,

                required:
                    true
            },


            /*
            --------------------------------------------------------
            TEST DATA
            --------------------------------------------------------

            Example:

            INSERT INTO employees VALUES
            (1, 'A', 'IT', 50000),
            (2, 'B', 'HR', 40000);
            */

            sampleData: {

                type:
                    String,

                default:
                    ""
            },


            /*
            --------------------------------------------------------
            EXPECTED RESULT
            --------------------------------------------------------

            Example:

            [
                {
                    department: "IT",
                    count: 3
                }
            ]

            This must never be sent to the frontend.
            */

            expectedResult: {

                type:
                    mongoose
                        .Schema
                        .Types
                        .Mixed,

                required:
                    true
            },


            /*
            --------------------------------------------------------
            HIDDEN TEST
            --------------------------------------------------------

            false:
                Can be used as a public validation case if needed.

            true:
                Used only during final submission.
            */

            isHidden: {

                type:
                    Boolean,

                default:
                    true
            }
        },
        {
            _id:
                false
        }
    );


/*
============================================================
SQL QUESTION SCHEMA
============================================================
*/

const sqlQuestionSchema =
    new mongoose.Schema(
        {

            /*
            ========================================================
            SKILL
            ========================================================
            */

            skill: {

                type:
                    mongoose
                        .Schema
                        .Types
                        .ObjectId,

                ref:
                    "Skill",

                required:
                    true
            },


            /*
            ========================================================
            TYPE
            ========================================================
            */

            type: {

                type:
                    String,

                enum: [
                    "sql"
                ],

                default:
                    "sql"
            },


            /*
            ========================================================
            DIFFICULTY
            ========================================================
            */

            difficulty: {

                type:
                    String,

                enum: [
                    "beginner",
                    "intermediate",
                    "advanced"
                ],

                required:
                    true
            },


            /*
            ========================================================
            TITLE
            ========================================================
            */

            title: {

                type:
                    String,

                required:
                    true,

                trim:
                    true
            },


            /*
            ========================================================
            DESCRIPTION
            ========================================================
            */

            description: {

                type:
                    String,

                required:
                    true
            },


            /*
            ========================================================
            PUBLIC DATABASE SCHEMA
            ========================================================

            This CAN be sent to the frontend.

            The candidate needs this information to understand:

                tables
                columns
                relationships
                data types

            This schema is used by the Run Query feature.
            ========================================================
            */

            schema: {

                type:
                    String,

                default:
                    ""
            },


            /*
            ========================================================
            PUBLIC SAMPLE DATA
            ========================================================

            This can also be returned to the candidate.

            It represents the sample database used by:

                ▶ Run Query

            It is NOT the hidden evaluation database.
            ========================================================
            */

            sampleData: {

                type:
                    String,

                default:
                    ""
            },


            /*
            ========================================================
            LEGACY EXPECTED RESULT
            ========================================================

            Kept for old SQL questions that do not yet use
            the testCases array.

            SECURITY:

            select:false prevents the expected answer from
            being sent when the assessment starts.

            Final submission must explicitly request:

                +expectedQueryResult
            ========================================================
            */

            expectedQueryResult: {

                type:
                    mongoose
                        .Schema
                        .Types
                        .Mixed,

                default:
                    [],

                select:
                    false
            },


            /*
            ========================================================
            SQL TEST CASES
            ========================================================

            SECURITY:

            The entire array is server-only.

            It may contain:

                hidden database schema
                hidden sample data
                hidden expected results

            Therefore it must never be returned by:

                startAssessment()

            Backend execution controllers must explicitly use:

                .select("+testCases")

            Final submission may also need:

                .select(
                    "+testCases +expectedQueryResult"
                )

            depending on whether the question uses the new
            or legacy scoring format.
            ========================================================
            */

            testCases: {

                type: [
                    sqlTestCaseSchema
                ],

                default:
                    [],

                select:
                    false
            },


            /*
            ========================================================
            POINTS
            ========================================================
            */

            points: {

                type:
                    Number,

                default:
                    10,

                min:
                    0
            },


            /*
            ========================================================
            ACTIVE STATUS
            ========================================================
            */

            isActive: {

                type:
                    Boolean,

                default:
                    true
            }
        },
        {

            timestamps:
                true
        }
    );


/*
============================================================
INDEXES
============================================================
*/


/*
Skill lookup
*/

sqlQuestionSchema.index({

    skill:
        1,

    isActive:
        1
});


/*
Type lookup
*/

sqlQuestionSchema.index({

    type:
        1,

    isActive:
        1
});


/*
Difficulty lookup
*/

sqlQuestionSchema.index({

    difficulty:
        1,

    isActive:
        1
});


/*
============================================================
MODEL
============================================================
*/

module.exports =
    mongoose.model(
        "SQLQuestion",
        sqlQuestionSchema
    );