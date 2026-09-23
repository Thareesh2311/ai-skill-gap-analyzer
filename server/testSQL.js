const { executeSQL } = require("./services/sqlExecutionService");

const result = executeSQL({
    schema: `
        CREATE TABLE students (
            id INTEGER,
            name TEXT,
            score INTEGER
        );
    `,

    sampleData: `
        INSERT INTO students
        VALUES
        (1, 'Rahul', 80),
        (2, 'Priya', 90),
        (3, 'Arjun', 70);
    `,

    query: `
        SELECT name, score
        FROM students
        WHERE score >= 80
        ORDER BY score DESC;
    `
});

console.log(JSON.stringify(result, null, 2));