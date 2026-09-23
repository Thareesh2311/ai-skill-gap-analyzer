const mongoose = require("mongoose");


/*
============================================================
TEST CASE SCHEMA
============================================================

Test cases are stored only on the backend.

Public tests:
    isHidden: false

Hidden tests:
    isHidden: true

The whole testCases array is select:false in the parent
schema so hidden tests cannot accidentally be returned
to the frontend.

Controllers that actually execute code must explicitly use:

.select("+testCases +runnerCode")
============================================================
*/

const testCaseSchema =
    new mongoose.Schema(
        {
            /*
            --------------------------------------------------------
            INPUT
            --------------------------------------------------------
            */

            input: {
                type: String,
                required: true
            },


            /*
            --------------------------------------------------------
            EXPECTED OUTPUT
            --------------------------------------------------------
            */

            expectedOutput: {
                type: String,
                required: true
            },


            /*
            --------------------------------------------------------
            HIDDEN TEST FLAG
            --------------------------------------------------------

            false:
                Used by Run Code

            true:
                Used only during final assessment submission
            --------------------------------------------------------
            */

            isHidden: {
                type: Boolean,
                default: false
            }
        },
        {
            _id: false
        }
    );


/*
============================================================
CODING QUESTION SCHEMA
============================================================
*/

const codingQuestionSchema =
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
            QUESTION TYPE
            ========================================================
            */

            type: {

                type:
                    String,

                enum: [
                    "coding"
                ],

                default:
                    "coding"
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
            INPUT FORMAT
            ========================================================
            */

            inputFormat: {

                type:
                    String,

                default:
                    ""
            },


            /*
            ========================================================
            OUTPUT FORMAT
            ========================================================
            */

            outputFormat: {

                type:
                    String,

                default:
                    ""
            },


            /*
            ========================================================
            CONSTRAINTS
            ========================================================
            */

            constraints: {

                type:
                    String,

                default:
                    ""
            },


            /*
            ========================================================
            SAMPLE INPUT
            ========================================================

            This CAN be sent to the frontend because it is intended
            to be visible to the candidate.
            ========================================================
            */

            sampleInput: {

                type:
                    String,

                default:
                    ""
            },


            /*
            ========================================================
            SAMPLE OUTPUT
            ========================================================
            */

            sampleOutput: {

                type:
                    String,

                default:
                    ""
            },


            /*
            ========================================================
            STARTER CODE
            ========================================================

            This is sent to Monaco Editor.
            ========================================================
            */

            starterCode: {

                type:
                    String,

                default:
                    ""
            },


            /*
            ========================================================
            LANGUAGE
            ========================================================
            */

            language: {

                type:
                    String,

                enum: [
                    "python",
                    "javascript",
                    "java"
                ],

                default:
                    "python"
            },


            /*
            ========================================================
            SERVER-ONLY RUNNER CODE
            ========================================================

            runnerCode wraps the student's submitted code.

            Example:

            {{USER_CODE}}

            arr = list(map(int, input().split()))
            print(find_max(arr))


            The code execution service replaces:

            {{USER_CODE}}

            with the student's code.


            SECURITY:

            select:false prevents the frontend from receiving
            runnerCode during:

            POST /api/assessments/:assessmentId/start


            Controllers that need execution must explicitly use:

            .select("+runnerCode")
            ========================================================
            */

            runnerCode: {

                type:
                    String,

                default:
                    "",

                select:
                    false
            },


            /*
            ========================================================
            TEST CASES
            ========================================================

            SECURITY IMPORTANT:

            Test cases are NOT automatically returned when querying
            CodingQuestion.

            This prevents:

            - hidden inputs leaking
            - hidden expected outputs leaking
            - students inspecting the network response
            - hidden tests appearing in React state/localStorage


            To execute tests, backend controllers must explicitly use:

            CodingQuestion.findById(id)
                .select("+testCases +runnerCode");


            RUN CODE:
                uses testCases where:

                isHidden === false


            SUBMIT ASSESSMENT:
                uses ALL test cases
            ========================================================
            */

            testCases: {

                type: [
                    testCaseSchema
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
Skill-based coding-question search
*/

codingQuestionSchema.index({
    skill:
        1,

    isActive:
        1
});


/*
Question-type lookup
*/

codingQuestionSchema.index({
    type:
        1,

    isActive:
        1
});


/*
Language lookup
*/

codingQuestionSchema.index({
    language:
        1,

    isActive:
        1
});


/*
Difficulty lookup
*/

codingQuestionSchema.index({
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
        "CodingQuestion",
        codingQuestionSchema
    );