// JOB READINESS SERVICE
// NORMALIZE SCORE
const normalizeScore = (value) => {
    return Math.max(
        0,
        Math.min(
            100,
            Number(value) || 0
        )
    );
};
// GET READINESS LEVEL
const getReadinessLevel = (score) => {
    if (score >= 90) {
        return "Excellent";
    }
    if (score >= 75) {
        return "Very Good";
    }
    if (score >= 60) {
        return "Good";
    }
    if (score >= 40) {
        return "Needs Improvement";
    }
    return "Not Ready";
};
// EXISTING JOB READINESS
const calculateJobReadiness = ({
    resumeCoverage,
    assessmentScore
}) => {
    const resumeScore =
        normalizeScore(resumeCoverage);
    const assessmentScoreValue =
        normalizeScore(assessmentScore);
    // WEIGHTS
    const RESUME_WEIGHT = 0.40;
    const ASSESSMENT_WEIGHT = 0.60;
    // CALCULATE
    const readinessScore =
        Math.round(
            (
                resumeScore *
                RESUME_WEIGHT
            ) +
            (
                assessmentScoreValue *
                ASSESSMENT_WEIGHT
            )
        );
    const level =
        getReadinessLevel(
            readinessScore
        );
    return {
        score:
            readinessScore,
        level,
        resumeCoverage:
            resumeScore,
        assessmentScore:
            assessmentScoreValue,
        weights: {
            resume:
                RESUME_WEIGHT,
            assessment:
                ASSESSMENT_WEIGHT
        }
    };
};
// FINAL JOB READINESS
// Combines:
// Resume Coverage
// MCQ
// Coding
// SQL
const calculateFinalJobReadiness = ({
    resumeCoverage = 0,
    mcqScore = 0,
    codingScore = 0,
    sqlScore = 0,
    weights = {}
}) => {
    // NORMALIZE
    const resume =
        normalizeScore(
            resumeCoverage
        );
    const mcq =
        normalizeScore(
            mcqScore
        );
    const coding =
        normalizeScore(
            codingScore
        );
    const sql =
        normalizeScore(
            sqlScore
        );
    // DEFAULT WEIGHTS
    const resumeWeight =
        Number(
            weights.resume ?? 0.30
        );
    const mcqWeight =
        Number(
            weights.mcq ?? 0.20
        );
    const codingWeight =
        Number(
            weights.coding ?? 0.25
        );
    const sqlWeight =
        Number(
            weights.sql ?? 0.25
        );
    // CALCULATE TOTAL WEIGHT
    const totalWeight =
        resumeWeight +
        mcqWeight +
        codingWeight +
        sqlWeight;
    // Prevent invalid configuration
    if (totalWeight <= 0) {
        throw new Error(
            "Invalid job readiness weights"
        );
    }
    // NORMALIZE WEIGHTS
    const normalizedResumeWeight =
        resumeWeight /
        totalWeight;
    const normalizedMcqWeight =
        mcqWeight /
        totalWeight;
    const normalizedCodingWeight =
        codingWeight /
        totalWeight;
    const normalizedSqlWeight =
        sqlWeight /
        totalWeight;
    // FINAL SCORE
    const finalScore =
        Math.round(
            (
                resume *
                normalizedResumeWeight
            )
            +
            (
                mcq *
                normalizedMcqWeight
            )
            +
            (
                coding *
                normalizedCodingWeight
            )
            +
            (
                sql *
                normalizedSqlWeight
            )
        );
    // LEVEL
    const level =
        getReadinessLevel(
            finalScore
        );
    // COMPONENT BREAKDOWN
    const breakdown = {
        resumeCoverage:
            resume,
        mcq:
            mcq,
        coding:
            coding,
        sql:
            sql
    };
    // FIND STRONG COMPONENTS
    const componentScores = [
        {
            component:
                "Resume Skill Coverage",
            score:
                resume
        },
        {
            component:
                "MCQ",
            score:
                mcq
        },
        {
            component:
                "Coding",
            score:
                coding
        },
        {
            component:
                "SQL",
            score:
                sql
        }
    ];
    const strengths =
        componentScores
            .filter(
                item =>
                    item.score >= 70
            )
            .sort(
                (a, b) =>
                    b.score -
                    a.score
            );
    // FIND WEAK AREAS
    const weakAreas =
        componentScores
            .filter(
                item =>
                    item.score < 70
            )
            .sort(
                (a, b) =>
                    a.score -
                    b.score
            );
    // RETURN
    return {
        score:
            finalScore,
        level,
        breakdown,
        weights: {
            resume:
                normalizedResumeWeight,
            mcq:
                normalizedMcqWeight,
            coding:
                normalizedCodingWeight,
            sql:
                normalizedSqlWeight
        },
        strengths,
        weakAreas
    };
};
// EXPORT
module.exports = {
    calculateJobReadiness,
    calculateFinalJobReadiness,
    getReadinessLevel
};