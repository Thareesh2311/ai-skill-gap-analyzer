/*
 * SQL RESULT COMPARISON SERVICE
 */
const normalizeValue = (value) => {
    if (value === null) {
        return null;
    }
    if (
        typeof value === "string"
    ) {
        return value.trim();
    }
    if (
        typeof value === "number"
    ) {
        return Number(
            value.toFixed(6)
        );
    }
    return value;
};
const normalizeRow = (row) => {
    const normalized = {};
    Object.keys(row)
        .sort()
        .forEach(key => {
            normalized[key] =
                normalizeValue(
                    row[key]
                );
        });
    return normalized;
};
const normalizeRows = (
    rows = []
) => {
    return rows
        .map(normalizeRow)
        .sort(
            (a, b) =>
                JSON.stringify(a)
                    .localeCompare(
                        JSON.stringify(b)
                    )
        );
};
const compareSQLResults = (
    actualRows = [],
    expectedRows = []
) => {
    const actual =
        normalizeRows(
            actualRows
        );
    const expected =
        normalizeRows(
            expectedRows
        );
    const isCorrect =
        JSON.stringify(actual) ===
        JSON.stringify(expected);
    return {
        isCorrect,
        actual,
        expected
    };
};
module.exports = {
    normalizeValue,
    normalizeRow,
    normalizeRows,
    compareSQLResults
};