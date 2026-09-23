const Database = require("better-sqlite3");


/*
============================================================
SQL EXECUTION CONFIGURATION
============================================================
*/

const MAX_RESULT_ROWS = 1000;

const MAX_QUERY_LENGTH = 5000;

const SQL_TIMEOUT_MS = 2000;


/*
============================================================
CREATE ISOLATED DATABASE
============================================================
*/

const createDatabase = () => {

    const db =
        new Database(
            ":memory:"
        );


    /*
    Basic SQLite safety / consistency settings.
    */

    try {

        db.pragma(
            "foreign_keys = ON"
        );

        db.pragma(
            "temp_store = MEMORY"
        );

        db.pragma(
            "trusted_schema = OFF"
        );

    } catch (error) {

        console.warn(
            "SQLite pragma warning:",
            error.message
        );
    }


    return db;
};


/*
============================================================
SETUP DATABASE
============================================================

The schema and sample data are controlled by the server,
not by the candidate.
============================================================
*/

const setupDatabase = (
    db,
    schema = "",
    sampleData = ""
) => {

    if (
        schema &&
        String(schema).trim()
    ) {

        db.exec(
            String(schema)
        );
    }


    if (
        sampleData &&
        String(sampleData).trim()
    ) {

        db.exec(
            String(sampleData)
        );
    }


    /*
    ========================================================
    QUERY-ONLY MODE

    After the assessment database is initialized, candidate
    SQL must not modify it.
    ========================================================
    */

    try {

        db.pragma(
            "query_only = ON"
        );

    } catch (error) {

        console.warn(
            "Unable to enable SQLite query_only mode:",
            error.message
        );
    }
};


/*
============================================================
NORMALIZE QUERY
============================================================
*/

const normalizeSQLQuery = (
    query
) => {

    return String(
        query ?? ""
    )
        .trim()
        .replace(
            /;\s*$/,
            ""
        )
        .trim();
};


/*
============================================================
VALIDATE SQL QUERY
============================================================
*/

const validateSQLQuery = (
    query
) => {

    /*
    --------------------------------------------------------
    QUERY REQUIRED
    --------------------------------------------------------
    */

    if (
        !query ||
        typeof query !==
            "string"
    ) {

        return {

            valid:
                false,

            reason:
                "SQL query is required.",

            query:
                ""
        };
    }


    const trimmedQuery =
        query.trim();


    /*
    --------------------------------------------------------
    EMPTY QUERY
    --------------------------------------------------------
    */

    if (
        !trimmedQuery
    ) {

        return {

            valid:
                false,

            reason:
                "SQL query cannot be empty.",

            query:
                ""
        };
    }


    /*
    --------------------------------------------------------
    MAX QUERY LENGTH
    --------------------------------------------------------
    */

    if (
        trimmedQuery.length >
        MAX_QUERY_LENGTH
    ) {

        return {

            valid:
                false,

            reason:
                `SQL query cannot exceed ${MAX_QUERY_LENGTH} characters.`,

            query:
                ""
        };
    }


    /*
    --------------------------------------------------------
    REMOVE TRAILING SEMICOLON
    --------------------------------------------------------
    */

    const normalizedQuery =
        normalizeSQLQuery(
            trimmedQuery
        );


    /*
    --------------------------------------------------------
    SELECT / WITH ONLY
    --------------------------------------------------------
    */

    if (
        !/^(SELECT|WITH)\b/i
            .test(
                normalizedQuery
            )
    ) {

        return {

            valid:
                false,

            reason:
                "Only SELECT and WITH queries are allowed.",

            query:
                normalizedQuery
        };
    }


    /*
    --------------------------------------------------------
    MULTIPLE STATEMENTS
    --------------------------------------------------------
    */

    if (
        normalizedQuery
            .includes(";")
    ) {

        return {

            valid:
                false,

            reason:
                "Multiple SQL statements are not allowed.",

            query:
                normalizedQuery
        };
    }


    /*
    --------------------------------------------------------
    COMMENTS

    Disable comments so they cannot be used to disguise
    restricted operations.
    --------------------------------------------------------
    */

    if (
        /--/.test(
            normalizedQuery
        ) ||
        /\/\*/.test(
            normalizedQuery
        ) ||
        /\*\//.test(
            normalizedQuery
        )
    ) {

        return {

            valid:
                false,

            reason:
                "SQL comments are not allowed.",

            query:
                normalizedQuery
        };
    }


    /*
    --------------------------------------------------------
    BLOCK WRITE / ADMIN OPERATIONS
    --------------------------------------------------------
    */

    const blockedKeywords = [

        "INSERT",

        "UPDATE",

        "DELETE",

        "DROP",

        "ALTER",

        "TRUNCATE",

        "CREATE",

        "REPLACE",

        "ATTACH",

        "DETACH",

        "PRAGMA",

        "VACUUM",

        "REINDEX",

        "ANALYZE"
    ];


    for (
        const keyword
        of blockedKeywords
    ) {

        const pattern =
            new RegExp(
                `\\b${keyword}\\b`,
                "i"
            );


        if (
            pattern.test(
                normalizedQuery
            )
        ) {

            return {

                valid:
                    false,

                reason:
                    `SQL operation '${keyword.toLowerCase()}' is not allowed.`,

                query:
                    normalizedQuery
            };
        }
    }


    /*
    --------------------------------------------------------
    SQLITE INTERNAL TABLES
    --------------------------------------------------------
    */

    const blockedSystemObjects = [

        "sqlite_master",

        "sqlite_schema",

        "sqlite_temp_master",

        "sqlite_sequence"
    ];


    for (
        const objectName
        of blockedSystemObjects
    ) {

        const pattern =
            new RegExp(
                `\\b${objectName}\\b`,
                "i"
            );


        if (
            pattern.test(
                normalizedQuery
            )
        ) {

            return {

                valid:
                    false,

                reason:
                    "Access to SQLite system tables is not allowed.",

                query:
                    normalizedQuery
            };
        }
    }


    /*
    --------------------------------------------------------
    DANGEROUS FUNCTIONS
    --------------------------------------------------------
    */

    const blockedFunctions = [

        "load_extension",

        "writefile",

        "readfile"
    ];


    for (
        const functionName
        of blockedFunctions
    ) {

        const pattern =
            new RegExp(
                `\\b${functionName}\\s*\\(`,
                "i"
            );


        if (
            pattern.test(
                normalizedQuery
            )
        ) {

            return {

                valid:
                    false,

                reason:
                    `SQL function '${functionName}' is not allowed.`,

                query:
                    normalizedQuery
            };
        }
    }


    /*
    --------------------------------------------------------
    VALID
    --------------------------------------------------------
    */

    return {

        valid:
            true,

        reason:
            null,

        query:
            normalizedQuery
    };
};


/*
============================================================
EXECUTE SELECT QUERY
============================================================

Uses statement.iterate() instead of statement.all().

That allows us to stop collecting rows once limits are
exceeded instead of loading an arbitrarily large result set
into memory.
============================================================
*/

const executeSQLQuery = (
    db,
    query,
    timeoutMs =
        SQL_TIMEOUT_MS
) => {

    const statement =
        db.prepare(
            query
        );


    /*
    ========================================================
    SECOND SAFETY LAYER

    SQLite itself tells us whether this statement is
    read-only.

    This protects against write operations hidden inside
    more complex SQL structures.
    ========================================================
    */

    if (
        statement.readonly ===
        false
    ) {

        throw new Error(
            "Only read-only SQL queries are allowed."
        );
    }


    /*
    A candidate query should return rows.
    */

    if (
        statement.reader ===
        false
    ) {

        throw new Error(
            "SQL query must return a result set."
        );
    }


    /*
    --------------------------------------------------------
    COLUMN INFORMATION
    --------------------------------------------------------
    */

    const columns =
        statement
            .columns()
            .map(
                (column) =>
                    column.name
            );


    /*
    --------------------------------------------------------
    EXECUTE
    --------------------------------------------------------
    */

    const rows = [];

    const startedAt =
        Date.now();


    for (
        const row
        of statement.iterate()
    ) {

        /*
        Result size protection
        */

        if (
            rows.length >=
            MAX_RESULT_ROWS
        ) {

            const error =
                new Error(
                    `Query returned too many rows. Maximum allowed is ${MAX_RESULT_ROWS}.`
                );


            error.code =
                "ROW_LIMIT";


            throw error;
        }


        /*
        Soft execution-time protection.

        better-sqlite3 is synchronous, so this can stop
        iteration between SQLite steps but cannot pre-empt
        a single long-running SQLite step.
        */

        if (
            Date.now() -
            startedAt >
            timeoutMs
        ) {

            const error =
                new Error(
                    `SQL query execution exceeded the ${timeoutMs}ms time limit.`
                );


            error.code =
                "SQL_TIMEOUT";


            throw error;
        }


        rows.push(
            row
        );
    }


    return {

        rows,

        columns,

        rowCount:
            rows.length
    };
};


/*
============================================================
MAIN SQL EXECUTION
============================================================
*/

const executeSQL = ({
    query,
    schema = "",
    sampleData = "",
    timeoutMs =
        SQL_TIMEOUT_MS
}) => {

    /*
    --------------------------------------------------------
    VALIDATE QUERY
    --------------------------------------------------------
    */

    const validation =
        validateSQLQuery(
            query
        );


    if (
        !validation.valid
    ) {

        return {

            success:
                false,

            rows:
                [],

            columns:
                [],

            rowCount:
                0,

            error:
                validation.reason,

            errorType:
                "VALIDATION_ERROR",

            executionTime:
                0,

            timedOut:
                false
        };
    }


    /*
    --------------------------------------------------------
    CREATE DATABASE
    --------------------------------------------------------
    */

    const db =
        createDatabase();


    try {

        /*
        ====================================================
        SERVER DATABASE SETUP
        ====================================================
        */

        try {

            setupDatabase(
                db,
                schema,
                sampleData
            );


        } catch (setupError) {

            return {

                success:
                    false,

                rows:
                    [],

                columns:
                    [],

                rowCount:
                    0,

                error:
                    setupError.message ||
                    "Failed to initialize SQL assessment database.",

                errorType:
                    "DATABASE_SETUP_ERROR",

                executionTime:
                    0,

                timedOut:
                    false
            };
        }


        /*
        ====================================================
        EXECUTE STUDENT QUERY
        ====================================================
        */

        const startTime =
            Date.now();


        try {

            const result =
                executeSQLQuery(

                    db,

                    validation.query,

                    timeoutMs
                );


            const executionTime =
                Date.now() -
                startTime;


            /*
            Final timeout check.

            better-sqlite3 is synchronous and cannot be safely
            interrupted from this same event-loop thread once
            SQLite is inside a long native call.
            */

            if (
                executionTime >
                timeoutMs
            ) {

                return {

                    success:
                        false,

                    rows:
                        [],

                    columns:
                        [],

                    rowCount:
                        0,

                    error:
                        `SQL query execution exceeded the ${timeoutMs}ms time limit.`,

                    errorType:
                        "TIMEOUT",

                    executionTime,

                    timedOut:
                        true
                };
            }


            return {

                success:
                    true,

                rows:
                    result.rows,

                columns:
                    result.columns,

                rowCount:
                    result.rowCount,

                executionTime,

                error:
                    null,

                errorType:
                    null,

                timedOut:
                    false
            };


        } catch (error) {

            const executionTime =
                Date.now() -
                startTime;


            const timedOut =
                error.code ===
                    "SQL_TIMEOUT" ||
                executionTime >
                    timeoutMs;


            let errorType =
                "EXECUTION_ERROR";


            if (
                timedOut
            ) {

                errorType =
                    "TIMEOUT";

            } else if (
                error.code ===
                "ROW_LIMIT"
            ) {

                errorType =
                    "ROW_LIMIT";
            }


            return {

                success:
                    false,

                rows:
                    [],

                columns:
                    [],

                rowCount:
                    0,

                error:
                    error.message ||
                    "SQL execution failed.",

                errorType,

                executionTime,

                timedOut
            };
        }


    } finally {

        /*
        --------------------------------------------------------
        ALWAYS CLOSE DATABASE
        --------------------------------------------------------
        */

        try {

            db.close();

        } catch (error) {

            console.error(
                "Failed to close SQL database:",
                error.message
            );
        }
    }
};


/*
============================================================
EXPORTS
============================================================
*/

module.exports = {

    createDatabase,

    setupDatabase,

    normalizeSQLQuery,

    validateSQLQuery,

    executeSQLQuery,

    executeSQL,

    MAX_RESULT_ROWS,

    MAX_QUERY_LENGTH,

    SQL_TIMEOUT_MS
};