const Assessment = require("../models/Assessment");
const {
    calculateFinalJobReadiness
} = require("./jobReadinessService");
// CALCULATE FINAL JOB READINESS
const getFinalJobReadiness = async ({
    userId,
    resumeId
}) => {
    // FIND COMPLETED ASSESSMENTS
    const assessments =
        await Assessment.find({
            user:
                userId,
            resume:
                resumeId,
            status:
                "evaluated"
        }).sort({
            createdAt: -1
        });
    // DEFAULT SCORES
    let mcqScore = 0;
    let codingScore = 0;
    let sqlScore = 0;
    // TRACK COMPLETED TYPES
    let mcqCompleted = false;
    let codingCompleted = false;
    let sqlCompleted = false;
    // PROCESS ASSESSMENTS
    for (
        const assessment
        of assessments
    ) {
        const score =
            Number(
                assessment.score
            ) || 0;
        // MCQ
        if (
            assessment.type === "mcq" &&
            !mcqCompleted
        ) {
            mcqScore =
                score;
            mcqCompleted =
                true;
        }
        // CODING
        if (
            assessment.type === "coding" &&
            !codingCompleted
        ) {
            codingScore =
                score;
            codingCompleted =
                true;
        }
        // SQL
        if (
            assessment.type === "sql" &&
            !sqlCompleted
        ) {
            sqlScore =
                score;
            sqlCompleted =
                true;
        }
    }
    // FIND RESUME
    const Resume =
        require("../models/Resume");
    const resume =
        await Resume.findOne({
            _id:
                resumeId,
            user:
                userId
        });
    if (!resume) {
        throw new Error(
            "Resume not found"
        );
    }
    // RESUME COVERAGE
    const resumeCoverage =
        Number(
            resume
                ?.skillGapAnalysis
                ?.coverageScore
        ) || 0;
    // CALCULATE FINAL SCORE
    const result =
        calculateFinalJobReadiness({
            resumeCoverage,
            mcqScore,
            codingScore,
            sqlScore
        });
    // RETURN
    return {
        ...result,
        assessments: {
            mcq: {
                score:
                    mcqScore,
                completed:
                    mcqCompleted
            },
            coding: {
                score:
                    codingScore,
                completed:
                    codingCompleted
            },
            sql: {
                score:
                    sqlScore,
                completed:
                    sqlCompleted
            }
        }
    };
};
// EXPORT
module.exports = {
    getFinalJobReadiness
};