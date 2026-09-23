const {
    spawn
} = require("child_process");

const fs =
    require("fs/promises");

const os =
    require("os");

const path =
    require("path");

const crypto =
    require("crypto");


/*
============================================================
CONFIGURATION
============================================================
*/

const DEFAULT_TIMEOUT_MS =
    3000;

const MAX_OUTPUT_BYTES =
    256 * 1024;


/*
============================================================
NORMALIZE LANGUAGE
============================================================
*/

const normalizeLanguage = (
    language = "python"
) => {

    const value =
        String(
            language ||
            "python"
        )
        .trim()
        .toLowerCase();


    /*
    Python
    */

    if (
        [
            "python",
            "py",
            "python3"
        ].includes(value)
    ) {

        return "python";
    }


    /*
    JavaScript
    */

    if (
        [
            "javascript",
            "js",
            "node",
            "nodejs"
        ].includes(value)
    ) {

        return "javascript";
    }


    /*
    Java
    */

    if (
        value === "java"
    ) {

        return "java";
    }


    return value;
};


/*
============================================================
BUILD SOURCE CODE
============================================================

runnerCode can contain:

{{USER_CODE}}

Example:

runnerCode:

{{USER_CODE}}

arr = list(map(int, input().split()))
print(find_max(arr))

The student's code replaces {{USER_CODE}}.
============================================================
*/

const buildSourceCode = ({
    code,
    runnerCode = ""
}) => {

    if (
        !runnerCode ||
        !runnerCode.includes(
            "{{USER_CODE}}"
        )
    ) {

        return code;
    }


    return runnerCode.replace(
        "{{USER_CODE}}",
        code
    );
};


/*
============================================================
RUN OS COMMAND
============================================================
*/

const runCommand = ({
    command,
    args = [],
    cwd,
    input = "",
    timeoutMs =
        DEFAULT_TIMEOUT_MS
}) => {

    return new Promise(
        (resolve) => {

            const startedAt =
                process.hrtime.bigint();


            let child = null;

            let timer = null;

            let stdout = "";

            let stderr = "";

            let finished = false;

            let outputLimitReached =
                false;


            /*
            --------------------------------------------------------
            ELAPSED TIME
            --------------------------------------------------------
            */

            const elapsedMs =
                () => {

                    return Number(
                        process.hrtime.bigint() -
                        startedAt
                    ) / 1_000_000;
                };


            /*
            --------------------------------------------------------
            FINISH EXECUTION
            --------------------------------------------------------
            */

            const finish =
                (payload) => {

                    if (finished) {
                        return;
                    }


                    finished =
                        true;


                    if (timer) {

                        clearTimeout(
                            timer
                        );
                    }


                    resolve({

                        executionTime:
                            Math.round(
                                elapsedMs()
                            ),

                        timedOut:
                            false,

                        commandNotFound:
                            false,

                        ...payload
                    });
                };


            /*
            --------------------------------------------------------
            OUTPUT HANDLER
            --------------------------------------------------------
            */

            const appendOutput =
                (
                    target,
                    data
                ) => {

                    const current =
                        target ===
                        "stdout"

                            ? stdout

                            : stderr;


                    const next =
                        current +
                        data.toString();


                    /*
                    Output protection
                    */

                    if (
                        Buffer.byteLength(
                            next,
                            "utf8"
                        ) >
                        MAX_OUTPUT_BYTES
                    ) {

                        outputLimitReached =
                            true;


                        try {

                            child?.kill();

                        } catch (_) {

                            // Ignore kill errors.
                        }


                        return;
                    }


                    if (
                        target ===
                        "stdout"
                    ) {

                        stdout =
                            next;

                    } else {

                        stderr =
                            next;
                    }
                };


            /*
            --------------------------------------------------------
            START PROCESS
            --------------------------------------------------------
            */

            try {

                child =
                    spawn(
                        command,
                        args,
                        {

                            cwd,

                            windowsHide:
                                true,

                            stdio: [
                                "pipe",
                                "pipe",
                                "pipe"
                            ]
                        }
                    );


            } catch (error) {

                finish({

                    success:
                        false,

                    output:
                        "",

                    error:
                        error.message,

                    executionTime:
                        0,

                    timedOut:
                        false,

                    commandNotFound:
                        error.code ===
                        "ENOENT"
                });


                return;
            }


            /*
            --------------------------------------------------------
            STDOUT
            --------------------------------------------------------
            */

            child.stdout.on(
                "data",
                (data) => {

                    appendOutput(
                        "stdout",
                        data
                    );
                }
            );


            /*
            --------------------------------------------------------
            STDERR
            --------------------------------------------------------
            */

            child.stderr.on(
                "data",
                (data) => {

                    appendOutput(
                        "stderr",
                        data
                    );
                }
            );


            /*
            --------------------------------------------------------
            PROCESS ERROR
            --------------------------------------------------------
            */

            child.on(
                "error",
                (error) => {

                    finish({

                        success:
                            false,

                        output:
                            stdout.trim(),

                        error:
                            error.message,

                        commandNotFound:
                            error.code ===
                            "ENOENT"
                    });
                }
            );


            /*
            --------------------------------------------------------
            PROCESS CLOSED
            --------------------------------------------------------
            */

            child.on(
                "close",
                (exitCode) => {

                    /*
                    Output limit
                    */

                    if (
                        outputLimitReached
                    ) {

                        finish({

                            success:
                                false,

                            output:
                                stdout.trim(),

                            error:
                                "Program output exceeded the allowed limit."
                        });


                        return;
                    }


                    /*
                    Normal result
                    */

                    finish({

                        success:
                            exitCode ===
                            0,

                        output:
                            stdout.trim(),

                        error:
                            stderr.trim(),

                        exitCode
                    });
                }
            );


            /*
            --------------------------------------------------------
            TIMEOUT
            --------------------------------------------------------
            */

            timer =
                setTimeout(
                    () => {

                        if (
                            finished
                        ) {

                            return;
                        }


                        try {

                            child.kill();

                        } catch (_) {

                            // Ignore kill errors.
                        }


                        finish({

                            success:
                                false,

                            output:
                                stdout.trim(),

                            error:
                                "Execution timed out",

                            timedOut:
                                true
                        });

                    },

                    timeoutMs
                );


            /*
            --------------------------------------------------------
            SEND STDIN
            --------------------------------------------------------
            */

            try {

                child.stdin.write(
                    String(
                        input ?? ""
                    )
                );


                child.stdin.end();


            } catch (error) {

                finish({

                    success:
                        false,

                    output:
                        stdout.trim(),

                    error:
                        error.message
                });
            }
        }
    );
};


/*
============================================================
COMMAND FALLBACK
============================================================

Windows examples:

python
py

Linux/macOS examples:

python3
python
============================================================
*/

const runWithCommandFallback =
    async ({
        commands,
        args,
        cwd,
        input,
        timeoutMs
    }) => {

        let lastResult =
            null;


        for (
            const command
            of commands
        ) {

            const result =
                await runCommand({

                    command,

                    args,

                    cwd,

                    input,

                    timeoutMs
                });


            lastResult =
                result;


            /*
            Runtime exists.

            Do not try another command.
            */

            if (
                !result
                    .commandNotFound
            ) {

                return result;
            }
        }


        return (

            lastResult ||

            {

                success:
                    false,

                output:
                    "",

                error:
                    "Required runtime is not installed.",

                executionTime:
                    0,

                timedOut:
                    false,

                commandNotFound:
                    true
            }
        );
    };


/*
============================================================
PYTHON EXECUTION
============================================================
*/

const executePython =
    async (
        code,
        input = "",
        timeoutMs =
            DEFAULT_TIMEOUT_MS,
        runnerCode = ""
    ) => {

        const tempDir =
            await fs.mkdtemp(

                path.join(
                    os.tmpdir(),
                    "skill-gap-python-"
                )
            );


        try {

            const filePath =
                path.join(

                    tempDir,

                    `${crypto.randomUUID()}.py`
                );


            /*
            Build executable source
            */

            const source =
                buildSourceCode({

                    code,

                    runnerCode
                });


            /*
            Save temporary file
            */

            await fs.writeFile(
                filePath,
                source,
                "utf8"
            );


            /*
            Python command fallback
            */

            const commands =
                process.platform ===
                "win32"

                    ? [
                        "python",
                        "py"
                    ]

                    : [
                        "python3",
                        "python"
                    ];


            /*
            Execute
            */

            return await
                runWithCommandFallback({

                    commands,

                    args: [
                        filePath
                    ],

                    cwd:
                        tempDir,

                    input,

                    timeoutMs
                });


        } finally {

            /*
            Always remove temporary files
            */

            await fs.rm(
                tempDir,
                {
                    recursive:
                        true,

                    force:
                        true
                }
            );
        }
    };


/*
============================================================
JAVASCRIPT EXECUTION
============================================================
*/

const executeJavaScript =
    async (
        code,
        input = "",
        timeoutMs =
            DEFAULT_TIMEOUT_MS,
        runnerCode = ""
    ) => {

        const tempDir =
            await fs.mkdtemp(

                path.join(
                    os.tmpdir(),
                    "skill-gap-js-"
                )
            );


        try {

            const filePath =
                path.join(

                    tempDir,

                    `${crypto.randomUUID()}.js`
                );


            /*
            Build final source
            */

            const source =
                buildSourceCode({

                    code,

                    runnerCode
                });


            /*
            Save temporary file
            */

            await fs.writeFile(
                filePath,
                source,
                "utf8"
            );


            /*
            Execute using Node
            */

            return await
                runWithCommandFallback({

                    commands: [
                        "node"
                    ],

                    args: [
                        filePath
                    ],

                    cwd:
                        tempDir,

                    input,

                    timeoutMs
                });


        } finally {

            await fs.rm(
                tempDir,
                {
                    recursive:
                        true,

                    force:
                        true
                }
            );
        }
    };


/*
============================================================
JAVA EXECUTION
============================================================
*/

const executeJava =
    async (
        code,
        input = "",
        timeoutMs =
            DEFAULT_TIMEOUT_MS,
        runnerCode = ""
    ) => {

        const tempDir =
            await fs.mkdtemp(

                path.join(
                    os.tmpdir(),
                    "skill-gap-java-"
                )
            );


        try {

            const filePath =
                path.join(
                    tempDir,
                    "Main.java"
                );


            /*
            Build source
            */

            const source =
                buildSourceCode({

                    code,

                    runnerCode
                });


            /*
            Save Main.java
            */

            await fs.writeFile(
                filePath,
                source,
                "utf8"
            );


            /*
            --------------------------------------------------------
            COMPILE JAVA
            --------------------------------------------------------
            */

            const compileResult =
                await runWithCommandFallback({

                    commands: [
                        "javac"
                    ],

                    args: [
                        "Main.java"
                    ],

                    cwd:
                        tempDir,

                    input:
                        "",

                    timeoutMs
                });


            if (
                !compileResult
                    .success
            ) {

                return {

                    ...compileResult,

                    error:
                        compileResult
                            .error ||
                        "Java compilation failed."
                };
            }


            /*
            --------------------------------------------------------
            RUN JAVA
            --------------------------------------------------------
            */

            const runResult =
                await runWithCommandFallback({

                    commands: [
                        "java"
                    ],

                    args: [
                        "-cp",
                        tempDir,
                        "Main"
                    ],

                    cwd:
                        tempDir,

                    input,

                    timeoutMs
                });


            /*
            Compile + run time
            */

            return {

                ...runResult,

                executionTime:

                    Number(
                        compileResult
                            .executionTime ||
                        0
                    ) +

                    Number(
                        runResult
                            .executionTime ||
                        0
                    )
            };


        } finally {

            await fs.rm(
                tempDir,
                {
                    recursive:
                        true,

                    force:
                        true
                }
            );
        }
    };


/*
============================================================
GENERAL EXECUTION
============================================================
*/

const executeCode =
    async ({
        code,
        language = "python",
        input = "",
        timeoutMs =
            DEFAULT_TIMEOUT_MS,
        runnerCode = ""
    }) => {

        const normalizedLanguage =
            normalizeLanguage(
                language
            );


        /*
        Python
        */

        if (
            normalizedLanguage ===
            "python"
        ) {

            return executePython(
                code,
                input,
                timeoutMs,
                runnerCode
            );
        }


        /*
        JavaScript
        */

        if (
            normalizedLanguage ===
            "javascript"
        ) {

            return executeJavaScript(
                code,
                input,
                timeoutMs,
                runnerCode
            );
        }


        /*
        Java
        */

        if (
            normalizedLanguage ===
            "java"
        ) {

            return executeJava(
                code,
                input,
                timeoutMs,
                runnerCode
            );
        }


        /*
        Unsupported language
        */

        return {

            success:
                false,

            output:
                "",

            error:
                `Unsupported language: ${language}`,

            executionTime:
                0,

            timedOut:
                false,

            commandNotFound:
                false
        };
    };


/*
============================================================
NORMALIZE OUTPUT
============================================================

Prevents common formatting differences from causing
incorrect failures.

Example:

"10\r\n"
and
"10"

both become:

"10"
============================================================
*/

const normalizeOutput =
    (value) => {

        return String(
            value ?? ""
        )
        .replace(
            /\r\n/g,
            "\n"
        )
        .trim();
    };


/*
============================================================
NORMALIZE RUN TEST CASE ARGUMENTS
============================================================

Supports BOTH:

NEW:

runTestCases({
    code,
    language,
    testCases,
    runnerCode
});

AND legacy:

runTestCases(
    code,
    testCases
);

This prevents older controller code from breaking.
============================================================
*/

const normalizeRunTestCaseArguments =
    (
        options,
        legacyTestCases = [],
        legacyLanguage = "python",
        legacyRunnerCode = ""
    ) => {

        /*
        --------------------------------------------------------
        New object syntax
        --------------------------------------------------------
        */

        if (
            options &&
            typeof options ===
                "object" &&
            !Array.isArray(options)
        ) {

            return {

                code:
                    options.code ??
                    "",

                language:
                    options.language ??
                    "python",

                testCases:
                    Array.isArray(
                        options.testCases
                    )
                        ? options.testCases
                        : [],

                runnerCode:
                    options.runnerCode ??
                    "",

                timeoutMs:
                    Number(
                        options.timeoutMs ||
                        DEFAULT_TIMEOUT_MS
                    )
            };
        }


        /*
        --------------------------------------------------------
        Legacy syntax
        --------------------------------------------------------
        */

        return {

            code:
                String(
                    options ?? ""
                ),

            language:
                legacyLanguage ||
                "python",

            testCases:
                Array.isArray(
                    legacyTestCases
                )
                    ? legacyTestCases
                    : [],

            runnerCode:
                legacyRunnerCode ||
                "",

            timeoutMs:
                DEFAULT_TIMEOUT_MS
        };
    };


/*
============================================================
RUN TEST CASES
============================================================

Recommended usage:

const result =
    await runTestCases({
        code,
        language: question.language,
        testCases: question.testCases,
        runnerCode: question.runnerCode
    });

Returns:

{
    allPassed,
    passedCount,
    failedCount,
    testCasesPassed,
    testCasesFailed,
    totalTestCases,
    passPercentage,
    executionTime,
    totalExecutionTime,
    averageExecutionTime,
    error,
    timedOut,
    results,
    testCaseResults
}
============================================================
*/

const runTestCases =
    async (
        options,
        legacyTestCases = [],
        legacyLanguage =
            "python",
        legacyRunnerCode = ""
    ) => {

        /*
        --------------------------------------------------------
        Normalize arguments
        --------------------------------------------------------
        */

        const {
            code,
            language,
            testCases,
            runnerCode,
            timeoutMs
        } =
            normalizeRunTestCaseArguments(
                options,
                legacyTestCases,
                legacyLanguage,
                legacyRunnerCode
            );


        /*
        --------------------------------------------------------
        Counters
        --------------------------------------------------------
        */

        let passed =
            0;

        let totalTime =
            0;

        let firstError =
            "";

        let anyTimedOut =
            false;


        /*
        Detailed result for every test case.
        */

        const testCaseResults =
            [];


        /*
        --------------------------------------------------------
        No test cases
        --------------------------------------------------------
        */

        if (
            testCases.length ===
            0
        ) {

            return {

                allPassed:
                    false,

                passedCount:
                    0,

                failedCount:
                    0,

                testCasesPassed:
                    0,

                testCasesFailed:
                    0,

                totalTestCases:
                    0,

                passPercentage:
                    0,

                executionTime:
                    0,

                totalExecutionTime:
                    0,

                averageExecutionTime:
                    0,

                error:
                    "No test cases configured.",

                timedOut:
                    false,

                results:
                    [],

                testCaseResults:
                    []
            };
        }


        /*
        ========================================================
        EXECUTE EACH TEST CASE
        ========================================================
        */

        for (
            let index = 0;
            index <
            testCases.length;
            index++
        ) {

            const testCase =
                testCases[index];


            /*
            --------------------------------------------------------
            Execute code
            --------------------------------------------------------
            */

            let result;


            try {

                result =
                    await executeCode({

                        code,

                        language,

                        input:
                            testCase
                                ?.input ??
                            "",

                        timeoutMs,

                        runnerCode
                    });


            } catch (error) {

                /*
                Unexpected execution service error.
                */

                result = {

                    success:
                        false,

                    output:
                        "",

                    error:
                        error.message ||
                        "Execution failed.",

                    executionTime:
                        0,

                    timedOut:
                        false
                };
            }


            /*
            --------------------------------------------------------
            Execution metrics
            --------------------------------------------------------
            */

            const executionTime =
                Number(
                    result
                        ?.executionTime ||
                    0
                );


            totalTime +=
                executionTime;


            const currentTimedOut =
                Boolean(
                    result
                        ?.timedOut
                );


            anyTimedOut =
                anyTimedOut ||
                currentTimedOut;


            /*
            --------------------------------------------------------
            Normalize actual output
            --------------------------------------------------------
            */

            const actual =
                normalizeOutput(
                    result
                        ?.output
                );


            /*
            --------------------------------------------------------
            Normalize expected output
            --------------------------------------------------------
            */

            const expected =
                normalizeOutput(
                    testCase
                        ?.expectedOutput
                );


            /*
            --------------------------------------------------------
            Pass / Fail
            --------------------------------------------------------
            */

            const isPassed =
                Boolean(
                    result
                        ?.success
                ) &&
                actual ===
                    expected;


            if (isPassed) {

                passed++;
            }


            /*
            --------------------------------------------------------
            First execution error
            --------------------------------------------------------
            */

            if (
                !result
                    ?.success &&
                !firstError
            ) {

                firstError =
                    result
                        ?.error ||
                    "Execution failed";
            }


            /*
            --------------------------------------------------------
            Test case result
            --------------------------------------------------------

            IMPORTANT:

            Hidden test input is NOT placed in this result.

            Public test input can be returned.

            The controller should still sanitize hidden test
            details before sending final assessment results.
            --------------------------------------------------------
            */

            const isHidden =
                Boolean(
                    testCase
                        ?.isHidden
                );


            testCaseResults.push({

                testCaseNumber:
                    index + 1,

                passed:
                    isPassed,

                /*
                Never expose hidden input here.
                */

                input:
                    isHidden
                        ? undefined
                        : String(
                            testCase
                                ?.input ??
                            ""
                        ),

                actual,

                expected:
                    isHidden
                        ? ""
                        : expected,

                executionTime,

                error:
                    result
                        ?.error ||
                    "",

                timedOut:
                    currentTimedOut,

                isHidden
            });
        }


        /*
        ========================================================
        FINAL METRICS
        ========================================================
        */

        const totalTestCases =
            testCases.length;


        const failed =
            Math.max(
                totalTestCases -
                passed,
                0
            );


        const allPassed =
            totalTestCases >
                0 &&
            passed ===
                totalTestCases;


        const passPercentage =
            totalTestCases >
                0

                ? Math.round(
                    (
                        passed /
                        totalTestCases
                    ) * 100
                )

                : 0;


        const averageExecutionTime =
            totalTestCases >
                0

                ? Math.round(
                    totalTime /
                    totalTestCases
                )

                : 0;


        /*
        ========================================================
        RESPONSE
        ========================================================
        */

        return {

            /*
            Convenient Run Code properties
            */

            allPassed,

            passedCount:
                passed,

            failedCount:
                failed,

            passPercentage,


            /*
            Existing assessment properties
            */

            testCasesPassed:
                passed,

            testCasesFailed:
                failed,

            totalTestCases,

            executionTime:
                totalTime,

            totalExecutionTime:
                totalTime,

            averageExecutionTime,

            error:
                firstError,

            timedOut:
                anyTimedOut,


            /*
            Keep BOTH names for compatibility.

            Older code can use:
                result.results

            New code can use:
                result.testCaseResults
            */

            results:
                testCaseResults,

            testCaseResults
        };
    };


/*
============================================================
EXPORTS
============================================================
*/

module.exports = {

    normalizeLanguage,

    buildSourceCode,

    executePython,

    executeJavaScript,

    executeJava,

    executeCode,

    normalizeOutput,

    runTestCases
};