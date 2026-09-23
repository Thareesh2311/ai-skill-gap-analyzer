const {
    executeSQL
} = require(
    "./sqlExecutionService"
);


const {
    compareSQLResults
} = require(
    "./sqlResultComparisonService"
);


/*
============================================================
PERFORMANCE LEVEL
============================================================
*/

const getPerformanceLevel = (
    executionTime
) => {

    const time =
        Number(
            executionTime ||
            0
        );


    if (
        time <=
        100
    ) {

        return "Excellent";
    }


    if (
        time <=
        500
    ) {

        return "Good";
    }


    if (
        time <=
        1000
    ) {

        return "Slow";
    }


    return "Very Slow";
};


/*
============================================================
SAFE TEST CASE RESULT
============================================================

Hidden test cases must never expose:

- schema
- sampleData
- expected result
- actual result

Public tests may include actual / expected rows if needed.
============================================================
*/

const buildTestCaseResult = ({
    index,
    testCase,
    isCorrect,
    executionTime,
    timedOut = false,
    error = "",
    actualRows = [],
    expectedRows = []
}) => {

    const isHidden =
        Boolean(
            testCase
                ?.isHidden
        );


    const base = {

        testCaseNumber:
            index + 1,

        testCase:
            index + 1,

        isCorrect:
            Boolean(
                isCorrect
            ),

        passed:
            Boolean(
                isCorrect
            ),

        executionTime:
            Number(
                executionTime ||
                0
            ),

        timedOut:
            Boolean(
                timedOut
            ),

        error:
            error ||
            "",

        isHidden
    };


    /*
    Hidden tests return status only.
    */

    if (
        isHidden
    ) {

        return base;
    }


    /*
    Public test may safely expose result rows.
    */

    return {

        ...base,

        actualRows:
            Array.isArray(
                actualRows
            )
                ? actualRows
                : [],

        expectedRows:
            Array.isArray(
                expectedRows
            )
                ? expectedRows
                : []
    };
};


/*
============================================================
SCORE SQL ANSWER
============================================================
*/

const scoreSQLAnswer = ({
    query,
    schema = "",
    sampleData = "",
    expectedRows = [],
    testCases = [],
    points = 10
}) => {

    const totalPoints =
        Math.max(
            Number(
                points
            ) ||
            0,
            0
        );


    /*
    ========================================================
    MULTI TEST CASE EVALUATION
    ========================================================
    */

    if (
        Array.isArray(
            testCases
        ) &&
        testCases.length >
            0
    ) {

        let passedTestCases =
            0;

        let totalExecutionTime =
            0;

        let timedOutTestCases =
            0;


        const testCaseResults =
            [];


        /*
        --------------------------------------------------------
        EXECUTE EACH TEST DATABASE
        --------------------------------------------------------
        */

        for (
            let i = 0;
            i <
            testCases.length;
            i++
        ) {

            const testCase =
                testCases[i];


            /*
            Each test case can override the default database.

            If it doesn't provide its own schema/sampleData,
            fall back to the question-level values.
            */

            const testSchema =
                testCase
                    ?.schema ??
                schema ??
                "";


            const testSampleData =
                testCase
                    ?.sampleData ??
                sampleData ??
                "";


            const expectedResult =
                Array.isArray(
                    testCase
                        ?.expectedResult
                )

                    ? testCase
                        .expectedResult

                    : Array.isArray(
                        testCase
                            ?.expectedRows
                    )

                        ? testCase
                            .expectedRows

                        : [];


            /*
            --------------------------------------------------------
            EXECUTE SQL
            --------------------------------------------------------
            */

            const executionResult =
                executeSQL({

                    query,

                    schema:
                        testSchema,

                    sampleData:
                        testSampleData
                });


            const executionTime =
                Number(
                    executionResult
                        ?.executionTime ||
                    0
                );


            totalExecutionTime +=
                executionTime;


            /*
            --------------------------------------------------------
            EXECUTION FAILED
            --------------------------------------------------------
            */

            if (
                !executionResult
                    ?.success
            ) {

                const timedOut =
                    Boolean(
                        executionResult
                            ?.timedOut
                    );


                if (
                    timedOut
                ) {

                    timedOutTestCases++;
                }


                testCaseResults.push(

                    buildTestCaseResult({

                        index:
                            i,

                        testCase,

                        isCorrect:
                            false,

                        executionTime,

                        timedOut,

                        error:
                            timedOut

                                ? "SQL query execution timed out."

                                : (
                                    executionResult
                                        ?.error ||

                                    "SQL execution failed."
                                )
                    })
                );


                continue;
            }


            /*
            --------------------------------------------------------
            COMPARE QUERY RESULT
            --------------------------------------------------------
            */

            let comparison;


            try {

                comparison =
                    compareSQLResults(

                        executionResult
                            .rows,

                        expectedResult
                    );


            } catch (
                comparisonError
            ) {

                testCaseResults.push(

                    buildTestCaseResult({

                        index:
                            i,

                        testCase,

                        isCorrect:
                            false,

                        executionTime,

                        error:
                            comparisonError
                                .message ||
                            "Failed to compare SQL results.",

                        actualRows:
                            executionResult
                                .rows,

                        expectedRows:
                            expectedResult
                    })
                );


                continue;
            }


            /*
            --------------------------------------------------------
            CORRECT
            --------------------------------------------------------
            */

            if (
                comparison
                    ?.isCorrect
            ) {

                passedTestCases++;


                testCaseResults.push(

                    buildTestCaseResult({

                        index:
                            i,

                        testCase,

                        isCorrect:
                            true,

                        executionTime,

                        actualRows:
                            comparison
                                ?.actual ??
                            executionResult
                                .rows,

                        expectedRows:
                            comparison
                                ?.expected ??
                            expectedResult
                    })
                );


                continue;
            }


            /*
            --------------------------------------------------------
            INCORRECT RESULT
            --------------------------------------------------------
            */

            testCaseResults.push(

                buildTestCaseResult({

                    index:
                        i,

                    testCase,

                    isCorrect:
                        false,

                    executionTime,

                    error:
                        "Query executed successfully, but the result is incorrect.",

                    actualRows:
                        comparison
                            ?.actual ??
                        executionResult
                            .rows,

                    expectedRows:
                        comparison
                            ?.expected ??
                        expectedResult
                })
            );
        }


        /*
        ========================================================
        FINAL MULTI-TEST METRICS
        ========================================================
        */

        const totalTestCases =
            testCases.length;


        const failedTestCases =
            Math.max(

                totalTestCases -
                passedTestCases,

                0
            );


        const isCorrect =
            totalTestCases >
                0 &&
            passedTestCases ===
                totalTestCases;


        const passPercentage =
            totalTestCases >
                0

                ? Math.round(
                    (
                        passedTestCases /
                        totalTestCases
                    ) * 100
                )

                : 0;


        /*
        Partial scoring
        */

        const pointsEarned =
            totalTestCases >
                0

                ? Math.round(
                    (
                        passedTestCases /
                        totalTestCases
                    ) *
                    totalPoints
                )

                : 0;


        const averageExecutionTime =
            totalTestCases >
                0

                ? Math.round(
                    totalExecutionTime /
                    totalTestCases
                )

                : 0;


        /*
        IMPORTANT:

        Your previous version incorrectly used:

        getPerformanceLevel(executionTime)

        here even though executionTime belonged to the loop.

        Use averageExecutionTime instead.
        */

        const performance =
            getPerformanceLevel(
                averageExecutionTime
            );


        return {

            isCorrect,

            pointsEarned,

            totalPoints,

            testCasesPassed:
                passedTestCases,

            testCasesFailed:
                failedTestCases,

            totalTestCases,

            passPercentage,

            executionTime:
                totalExecutionTime,

            totalExecutionTime,

            averageExecutionTime,

            performance,

            timedOut:
                timedOutTestCases >
                0,

            timedOutTestCases,

            error:
                isCorrect

                    ? ""

                    : `${passedTestCases}/${totalTestCases} test cases passed.`,

            testCaseResults
        };
    }


    /*
    ========================================================
    LEGACY SINGLE TEST CASE
    ========================================================

    Keeps existing SQL questions working if they do not
    contain the new testCases array.
    ========================================================
    */

    const executionResult =
        executeSQL({

            query,

            schema,

            sampleData
        });


    const executionTime =
        Number(
            executionResult
                ?.executionTime ||
            0
        );


    /*
    --------------------------------------------------------
    EXECUTION FAILED
    --------------------------------------------------------
    */

    if (
        !executionResult
            ?.success
    ) {

        return {

            isCorrect:
                false,

            pointsEarned:
                0,

            totalPoints,

            testCasesPassed:
                0,

            testCasesFailed:
                1,

            totalTestCases:
                1,

            passPercentage:
                0,

            executionTime,

            totalExecutionTime:
                executionTime,

            averageExecutionTime:
                executionTime,

            performance:
                getPerformanceLevel(
                    executionTime
                ),

            timedOut:
                Boolean(
                    executionResult
                        ?.timedOut
                ),

            timedOutTestCases:
                executionResult
                    ?.timedOut
                    ? 1
                    : 0,

            error:
                executionResult
                    ?.error ||
                "SQL execution failed.",

            actualRows:
                [],

            expectedRows:
                Array.isArray(
                    expectedRows
                )
                    ? expectedRows
                    : [],

            testCaseResults: [

                {

                    testCaseNumber:
                        1,

                    testCase:
                        1,

                    isCorrect:
                        false,

                    passed:
                        false,

                    executionTime,

                    timedOut:
                        Boolean(
                            executionResult
                                ?.timedOut
                        ),

                    error:
                        executionResult
                            ?.error ||
                        "SQL execution failed.",

                    isHidden:
                        false,

                    actualRows:
                        [],

                    expectedRows:
                        Array.isArray(
                            expectedRows
                        )
                            ? expectedRows
                            : []
                }
            ]
        };
    }


    /*
    --------------------------------------------------------
    COMPARE RESULTS
    --------------------------------------------------------
    */

    let comparison;


    try {

        comparison =
            compareSQLResults(

                executionResult
                    .rows,

                Array.isArray(
                    expectedRows
                )
                    ? expectedRows
                    : []
            );


    } catch (
        comparisonError
    ) {

        return {

            isCorrect:
                false,

            pointsEarned:
                0,

            totalPoints,

            testCasesPassed:
                0,

            testCasesFailed:
                1,

            totalTestCases:
                1,

            passPercentage:
                0,

            executionTime,

            totalExecutionTime:
                executionTime,

            averageExecutionTime:
                executionTime,

            performance:
                getPerformanceLevel(
                    executionTime
                ),

            timedOut:
                false,

            timedOutTestCases:
                0,

            error:
                comparisonError
                    .message ||
                "Failed to compare SQL results.",

            actualRows:
                executionResult
                    .rows,

            expectedRows:
                Array.isArray(
                    expectedRows
                )
                    ? expectedRows
                    : [],

            testCaseResults:
                []
        };
    }


    /*
    --------------------------------------------------------
    CORRECT
    --------------------------------------------------------
    */

    if (
        comparison
            ?.isCorrect
    ) {

        const actual =
            comparison
                ?.actual ??
            executionResult
                .rows;


        const expected =
            comparison
                ?.expected ??
            expectedRows;


        return {

            isCorrect:
                true,

            pointsEarned:
                totalPoints,

            totalPoints,

            testCasesPassed:
                1,

            testCasesFailed:
                0,

            totalTestCases:
                1,

            passPercentage:
                100,

            executionTime,

            totalExecutionTime:
                executionTime,

            averageExecutionTime:
                executionTime,

            performance:
                getPerformanceLevel(
                    executionTime
                ),

            timedOut:
                false,

            timedOutTestCases:
                0,

            error:
                "",

            actualRows:
                actual,

            expectedRows:
                expected,

            testCaseResults: [

                {

                    testCaseNumber:
                        1,

                    testCase:
                        1,

                    isCorrect:
                        true,

                    passed:
                        true,

                    executionTime,

                    timedOut:
                        false,

                    error:
                        "",

                    isHidden:
                        false,

                    actualRows:
                        actual,

                    expectedRows:
                        expected
                }
            ]
        };
    }


    /*
    --------------------------------------------------------
    INCORRECT
    --------------------------------------------------------
    */

    const actual =
        comparison
            ?.actual ??
        executionResult
            .rows;


    const expected =
        comparison
            ?.expected ??
        expectedRows;


    return {

        isCorrect:
            false,

        pointsEarned:
            0,

        totalPoints,

        testCasesPassed:
            0,

        testCasesFailed:
            1,

        totalTestCases:
            1,

        passPercentage:
            0,

        executionTime,

        totalExecutionTime:
            executionTime,

        averageExecutionTime:
            executionTime,

        performance:
            getPerformanceLevel(
                executionTime
            ),

        timedOut:
            false,

        timedOutTestCases:
            0,

        error:
            "Query executed successfully, but the result is incorrect.",

        actualRows:
            actual,

        expectedRows:
            expected,

        testCaseResults: [

            {

                testCaseNumber:
                    1,

                testCase:
                    1,

                isCorrect:
                    false,

                passed:
                    false,

                executionTime,

                timedOut:
                    false,

                error:
                    "Query executed successfully, but the result is incorrect.",

                isHidden:
                    false,

                actualRows:
                    actual,

                expectedRows:
                    expected
            }
        ]
    };
};


/*
============================================================
EXPORTS
============================================================
*/

module.exports = {

    scoreSQLAnswer,

    getPerformanceLevel
};