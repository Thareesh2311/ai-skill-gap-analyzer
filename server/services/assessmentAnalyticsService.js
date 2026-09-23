const calculateAverage = (values = []) => {
    if (!values.length) {
        return 0;
    }
    const total = values.reduce(
        (sum, value) => sum + (Number(value) || 0),
        0
    );
    return Math.round((total / values.length) * 100) / 100;
};
const calculateAssessmentAnalytics = (attempts = []) => {
    if (!attempts.length) {
        return {
            totalAttempts: 0,
            completedAttempts: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            averagePercentage: 0,
            bestPercentage: 0,
            worstPercentage: 0
        };
    }
    const evaluatedAttempts = attempts.filter(
        (attempt) =>
            attempt.status === "evaluated" ||
            attempt.status === "submitted"
    );
    if (!evaluatedAttempts.length) {
        return {
            totalAttempts: attempts.length,
            completedAttempts: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            averagePercentage: 0,
            bestPercentage: 0,
            worstPercentage: 0
        };
    }
    const scores = evaluatedAttempts.map(
        (attempt) => Number(attempt.score) || 0
    );
    const percentages = evaluatedAttempts.map(
        (attempt) => Number(attempt.percentage) || 0
    );
    return {
        totalAttempts: attempts.length,
        completedAttempts:
            evaluatedAttempts.length,
        averageScore:
            calculateAverage(scores),
        highestScore:
            Math.max(...scores),
        lowestScore:
            Math.min(...scores),
        averagePercentage:
            calculateAverage(percentages),
        bestPercentage:
            Math.max(...percentages),
        worstPercentage:
            Math.min(...percentages)
    };
};
const calculateAttemptTrend = (attempts = []) => {
    const evaluatedAttempts = attempts
        .filter(
            (attempt) =>
                attempt.status === "evaluated" ||
                attempt.status === "submitted"
        )
        .sort(
            (a, b) =>
                new Date(a.submittedAt) -
                new Date(b.submittedAt)
        );
    return evaluatedAttempts.map(
        (attempt, index) => ({
            attemptNumber: index + 1,
            score:
                Number(attempt.score) || 0,
            percentage:
                Number(attempt.percentage) || 0,
            submittedAt:
                attempt.submittedAt
        })
    );
};
const calculateScoreDistribution = (attempts = []) => {
    const distribution = {
        beginner: 0,
        intermediate: 0,
        advanced: 0,
        expert: 0
    };
    attempts.forEach((attempt) => {
        const percentage =
            Number(attempt.percentage) || 0;
        if (percentage < 40) {
            distribution.beginner++;
        } else if (percentage < 70) {
            distribution.intermediate++;
        } else if (percentage < 90) {
            distribution.advanced++;
        } else {
            distribution.expert++;
        }
    });
    return distribution;
};
const calculateSkillWisePerformance = ({
    attempts = [],
    questions = []
}) => {
    const skillStats = {};
    attempts.forEach((attempt) => {
        if (
            attempt.status !== "evaluated" &&
            attempt.status !== "submitted"
        ) {
            return;
        }
        (attempt.answers || []).forEach((answer) => {
            const question = questions.find(
                (q) =>
                    q._id.toString() ===
                    answer.question.toString()
            );
            if (!question || !question.skill) {
                return;
            }
            const skillName =
                typeof question.skill === "object"
                    ? question.skill.name
                    : question.skill.toString();
            if (!skillName) {
                return;
            }
            if (!skillStats[skillName]) {
                skillStats[skillName] = {
                    earnedPoints: 0,
                    totalPoints: 0,
                    questionsAttempted: 0,
                    correctAnswers: 0
                };
            }
            const points =
                Number(question.points) || 0;
            const earnedPoints =
                Number(answer.pointsEarned) || 0;
            skillStats[skillName].totalPoints += points;
            skillStats[skillName].earnedPoints +=
                earnedPoints;
            skillStats[skillName].questionsAttempted++;
            if (answer.isCorrect) {
                skillStats[skillName].correctAnswers++;
            }
        });
    });
    const results = Object.entries(skillStats).map(
        ([skill, stats]) => {
            const percentage =
                stats.totalPoints > 0
                    ? (stats.earnedPoints /
                        stats.totalPoints) * 100
                    : 0;
            let level;
            if (percentage >= 90) {
                level = "Expert";
            } else if (percentage >= 70) {
                level = "Advanced";
            } else if (percentage >= 40) {
                level = "Intermediate";
            } else {
                level = "Beginner";
            }
            const accuracy =
                stats.questionsAttempted > 0
                    ? (stats.correctAnswers /
                        stats.questionsAttempted) * 100
                    : 0;
            return {
                skill,
                score:
                    Math.round(percentage),
                level,
                earnedPoints:
                    stats.earnedPoints,
                totalPoints:
                    stats.totalPoints,
                questionsAttempted:
                    stats.questionsAttempted,
                correctAnswers:
                    stats.correctAnswers,
                accuracy:
                    Math.round(accuracy)
            };
        }
    );
    return results.sort(
        (a, b) => b.score - a.score
    );
};
const analyzeSkillPerformance = (
    skillPerformance = []
) => {
    if (!skillPerformance.length) {
        return {
            strongestSkill: null,
            weakestSkill: null,
            averageScore: 0,
            strongSkills: [],
            moderateSkills: [],
            weakSkills: []
        };
    }
    const strongestSkill =
        [...skillPerformance]
            .sort((a, b) => b.score - a.score)[0];
    const weakestSkill =
        [...skillPerformance]
            .sort((a, b) => a.score - b.score)[0];
    const averageScore =
        skillPerformance.reduce(
            (sum, skill) =>
                sum + skill.score,
            0
        ) / skillPerformance.length;
    const strongSkills =
        skillPerformance.filter(
            (skill) => skill.score >= 70
        );
    const moderateSkills =
        skillPerformance.filter(
            (skill) =>
                skill.score >= 40 &&
                skill.score < 70
        );
    const weakSkills =
        skillPerformance.filter(
            (skill) => skill.score < 40
        );
    return {
        strongestSkill,
        weakestSkill,
        averageScore:
            Math.round(averageScore),
        strongSkills,
        moderateSkills,
        weakSkills
    };
};
const calculateSkillPriorities = (
    skillPerformance = []
) => {
    return [...skillPerformance]
        .map((skill) => {
            let priority;
            if (skill.score < 40) {
                priority = "High";
            } else if (skill.score < 70) {
                priority = "Medium";
            } else {
                priority = "Low";
            }
            return {
                skill: skill.skill,
                score: skill.score,
                accuracy: skill.accuracy,
                level: skill.level,
                priority
            };
        })
        .sort((a, b) => {
            const priorityOrder = {
                High: 3,
                Medium: 2,
                Low: 1
            };
            const difference =
                priorityOrder[b.priority] -
                priorityOrder[a.priority];
            if (difference !== 0) {
                return difference;
            }
            return a.score - b.score;
        });
};
const calculateDifficultyWisePerformance = ({
    attempts = [],
    questions = []
}) => {
    const difficultyStats = {
        beginner: {
            earnedPoints: 0,
            totalPoints: 0,
            questionsAttempted: 0,
            correctAnswers: 0
        },
        intermediate: {
            earnedPoints: 0,
            totalPoints: 0,
            questionsAttempted: 0,
            correctAnswers: 0
        },
        advanced: {
            earnedPoints: 0,
            totalPoints: 0,
            questionsAttempted: 0,
            correctAnswers: 0
        }
    };
    attempts.forEach((attempt) => {
        if (
            attempt.status !== "evaluated" &&
            attempt.status !== "submitted"
        ) {
            return;
        }
        (attempt.answers || []).forEach((answer) => {
            const question = questions.find(
                (q) =>
                    q._id.toString() ===
                    answer.question.toString()
            );
            if (!question || !question.difficulty) {
                return;
            }
            const difficulty =
                question.difficulty.toLowerCase();
            if (!difficultyStats[difficulty]) {
                return;
            }
            const points =
                Number(question.points) || 0;
            const earnedPoints =
                Number(answer.pointsEarned) || 0;
            difficultyStats[difficulty]
                .totalPoints += points;
            difficultyStats[difficulty]
                .earnedPoints += earnedPoints;
            difficultyStats[difficulty]
                .questionsAttempted++;
            if (answer.isCorrect) {
                difficultyStats[difficulty]
                    .correctAnswers++;
            }
        });
    });
    return Object.entries(difficultyStats)
        .map(([difficulty, stats]) => {
            const score =
                stats.totalPoints > 0
                    ? (
                        stats.earnedPoints /
                        stats.totalPoints
                    ) * 100
                    : 0;
            const accuracy =
                stats.questionsAttempted > 0
                    ? (
                        stats.correctAnswers /
                        stats.questionsAttempted
                    ) * 100
                    : 0;
            let performanceLevel;
            if (score >= 90) {
                performanceLevel = "Expert";
            } else if (score >= 70) {
                performanceLevel = "Advanced";
            } else if (score >= 40) {
                performanceLevel = "Intermediate";
            } else {
                performanceLevel = "Beginner";
            }
            return {
                difficulty,
                score:
                    Math.round(score),
                accuracy:
                    Math.round(accuracy),
                earnedPoints:
                    stats.earnedPoints,
                totalPoints:
                    stats.totalPoints,
                questionsAttempted:
                    stats.questionsAttempted,
                correctAnswers:
                    stats.correctAnswers,
                performanceLevel
            };
        });
};
const analyzeDifficultyPerformance = (
    difficultyPerformance = []
) => {
    const attempted =
        difficultyPerformance.filter(
            (item) =>
                item.questionsAttempted > 0
        );
    if (!attempted.length) {
        return {
            strongestDifficulty: null,
            weakestDifficulty: null,
            averageScore: 0
        };
    }
    const strongestDifficulty =
        [...attempted]
            .sort(
                (a, b) =>
                    b.score - a.score
            )[0];
    const weakestDifficulty =
        [...attempted]
            .sort(
                (a, b) =>
                    a.score - b.score
            )[0];
    const averageScore =
        attempted.reduce(
            (sum, item) =>
                sum + item.score,
            0
        ) / attempted.length;
    return {
        strongestDifficulty,
        weakestDifficulty,
        averageScore:
            Math.round(averageScore)
    };
};
const recommendNextDifficulty = (
    difficultyPerformance = []
) => {
    const beginner =
        difficultyPerformance.find(
            (item) =>
                item.difficulty === "beginner"
        );
    const intermediate =
        difficultyPerformance.find(
            (item) =>
                item.difficulty === "intermediate"
        );
    const advanced =
        difficultyPerformance.find(
            (item) =>
                item.difficulty === "advanced"
        );
    // No data
    if (
        (!beginner || beginner.questionsAttempted === 0) &&
        (!intermediate || intermediate.questionsAttempted === 0) &&
        (!advanced || advanced.questionsAttempted === 0)
    ) {
        return {
            recommendedDifficulty: "beginner",
            reason: "Start with beginner-level questions to establish your baseline."
        };
    }
    // Strong advanced performance
    if (
        advanced &&
        advanced.questionsAttempted > 0 &&
        advanced.score >= 80
    ) {
        return {
            recommendedDifficulty: "advanced",
            reason: "You are performing strongly on advanced questions. Continue challenging yourself with advanced problems."
        };
    }
    // Strong intermediate performance
    if (
        intermediate &&
        intermediate.questionsAttempted > 0 &&
        intermediate.score >= 75
    ) {
        return {
            recommendedDifficulty: "advanced",
            reason: "Your intermediate performance is strong. You are ready to attempt more advanced questions."
        };
    }
    // Weak intermediate performance
    if (
        intermediate &&
        intermediate.questionsAttempted > 0 &&
        intermediate.score < 50
    ) {
        return {
            recommendedDifficulty: "intermediate",
            reason: "Strengthen your intermediate skills before progressing to advanced questions."
        };
    }
    // Strong beginner performance
    if (
        beginner &&
        beginner.questionsAttempted > 0 &&
        beginner.score >= 80
    ) {
        return {
            recommendedDifficulty: "intermediate",
            reason: "You have demonstrated strong fundamentals and should progress to intermediate questions."
        };
    }
    // Weak beginner performance
    if (
        beginner &&
        beginner.questionsAttempted > 0 &&
        beginner.score < 50
    ) {
        return {
            recommendedDifficulty: "beginner",
            reason: "Focus on fundamentals and beginner-level practice before increasing difficulty."
        };
    }
    return {
        recommendedDifficulty: "intermediate",
        reason: "Continue building your skills with intermediate-level questions."
    };
};
const calculateQuestionAccuracy = ({
    attempts = [],
    questions = []
}) => {
    const questionStats = {};
    attempts.forEach((attempt) => {
        if (
            attempt.status !== "evaluated" &&
            attempt.status !== "submitted"
        ) {
            return;
        }
        (attempt.answers || []).forEach((answer) => {
            const questionId =
                answer.question?.toString();
            if (!questionId) {
                return;
            }
            const question = questions.find(
                (q) =>
                    q._id.toString() === questionId
            );
            if (!question) {
                return;
            }
            if (!questionStats[questionId]) {
                questionStats[questionId] = {
                    questionId,
                    skill:
                        typeof question.skill === "object"
                            ? question.skill?.name
                            : question.skill?.toString(),
                    difficulty:
                        question.difficulty || null,
                    attempts: 0,
                    correct: 0,
                    incorrect: 0,
                    totalPoints: 0,
                    earnedPoints: 0,
                    totalTestCases: 0,
                    passedTestCases: 0,
                    executionTimes: [],
                    errors: []
                };
            }
            const stats =
                questionStats[questionId];
            stats.attempts++;
            if (answer.isCorrect) {
                stats.correct++;
            } else {
                stats.incorrect++;
            }
            const points =
                Number(question.points) || 0;
            const earnedPoints =
                Number(answer.pointsEarned) || 0;
            stats.totalPoints += points;
            stats.earnedPoints += earnedPoints;
            // Coding assessment information
            stats.totalTestCases +=
                Number(answer.totalTestCases) || 0;
            stats.passedTestCases +=
                Number(answer.testCasesPassed) || 0;
            if (
                answer.executionTime !== undefined &&
                answer.executionTime !== null
            ) {
                stats.executionTimes.push(
                    Number(answer.executionTime) || 0
                );
            }
            if (answer.error) {
                stats.errors.push(answer.error);
            }
        });
    });
    return Object.values(questionStats)
        .map((stats) => {
            const accuracy =
                stats.attempts > 0
                    ? (
                        stats.correct /
                        stats.attempts
                    ) * 100
                    : 0;
            const averagePoints =
                stats.attempts > 0
                    ? (
                        stats.earnedPoints /
                        stats.attempts
                    )
                    : 0;
            const testCaseAccuracy =
                stats.totalTestCases > 0
                    ? (
                        stats.passedTestCases /
                        stats.totalTestCases
                    ) * 100
                    : 0;
            const averageExecutionTime =
                stats.executionTimes.length > 0
                    ? (
                        stats.executionTimes.reduce(
                            (sum, time) =>
                                sum + time,
                            0
                        ) /
                        stats.executionTimes.length
                    )
                    : 0;
            let performance;
            if (accuracy >= 90) {
                performance = "Excellent";
            } else if (accuracy >= 70) {
                performance = "Good";
            } else if (accuracy >= 40) {
                performance = "Needs Improvement";
            } else {
                performance = "Weak";
            }
            return {
                questionId:
                    stats.questionId,
                skill:
                    stats.skill,
                difficulty:
                    stats.difficulty,
                attempts:
                    stats.attempts,
                correct:
                    stats.correct,
                incorrect:
                    stats.incorrect,
                accuracy:
                    Math.round(accuracy),
                totalPoints:
                    stats.totalPoints,
                earnedPoints:
                    stats.earnedPoints,
                averagePoints:
                    Math.round(
                        averagePoints * 100
                    ) / 100,
                totalTestCases:
                    stats.totalTestCases,
                passedTestCases:
                    stats.passedTestCases,
                testCaseAccuracy:
                    Math.round(
                        testCaseAccuracy
                    ),
                averageExecutionTime:
                    Math.round(
                        averageExecutionTime * 100
                    ) / 100,
                errorCount:
                    stats.errors.length,

                performance
            };
        });
};
const getMostDifficultQuestions = (
    questionAccuracy = [],
    limit = 5
) => {
    return [...questionAccuracy]
        .filter(
            (question) =>
                question.attempts > 0
        )
        .sort((a, b) => {
            if (a.accuracy !== b.accuracy) {
                return a.accuracy - b.accuracy;
            }
            return b.attempts - a.attempts;
        })
        .slice(0, limit);
};
const getFrequentlyMissedQuestions = (
    questionAccuracy = [],
    limit = 5
) => {
    return [...questionAccuracy]
        .filter(
            (question) =>
                question.incorrect > 0
        )
        .sort((a, b) => {
            if (a.incorrect !== b.incorrect) {
                return b.incorrect - a.incorrect;
            }
            return a.accuracy - b.accuracy;
        })
        .slice(0, limit);
};
const analyzeCodingPerformance = (
    questionAccuracy = []
) => {
    const codingQuestions =
        questionAccuracy.filter(
            (question) =>
                question.totalTestCases > 0
        );
    if (!codingQuestions.length) {
        return {
            totalCodingQuestions: 0,
            averageTestCaseAccuracy: 0,
            averageExecutionTime: 0,
            questionsWithErrors: 0
        };
    }
    const testCaseAccuracies =
        codingQuestions.map(
            (question) =>
                question.testCaseAccuracy
        );
    const executionTimes =
        codingQuestions
            .map(
                (question) =>
                    question.averageExecutionTime
            )
            .filter(
                (time) => time > 0
            );
    const averageTestCaseAccuracy =
        testCaseAccuracies.reduce(
            (sum, value) =>
                sum + value,
            0
        ) / testCaseAccuracies.length;
    const averageExecutionTime =
        executionTimes.length > 0
            ? executionTimes.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) / executionTimes.length
            : 0;
    const questionsWithErrors =
        codingQuestions.filter(
            (question) =>
                question.errorCount > 0
        ).length;
    return {
        totalCodingQuestions:
            codingQuestions.length,
        averageTestCaseAccuracy:
            Math.round(
                averageTestCaseAccuracy
            ),
        averageExecutionTime:
            Math.round(
                averageExecutionTime * 100
            ) / 100,
        questionsWithErrors
    };
};
const calculateAssessmentTypeAnalytics = ({
    attempts = [],
    assessments = []
}) => {
    const typeStats = {
        mcq: {
            attempts: 0,
            scores: [],
            percentages: []
        },
        coding: {
            attempts: 0,
            scores: [],
            percentages: [],
            testCaseAccuracies: [],
            executionTimes: []
        },
        sql: {
            attempts: 0,
            scores: [],
            percentages: []
        }
    };
    attempts.forEach((attempt) => {
        if (
            attempt.status !== "evaluated" &&
            attempt.status !== "submitted"
        ) {
            return;
        }
        const assessmentId =
            attempt.assessment?._id?.toString() ||
            attempt.assessment?.toString();
        if (!assessmentId) {
            return;
        }
        const assessment =
            assessments.find(
                (item) =>
                    item._id.toString() ===
                    assessmentId
            );
        if (!assessment) {
            return;
        }
        const type =
            assessment.type?.toLowerCase();
        if (!typeStats[type]) {
            return;
        }
        const stats =
            typeStats[type];
        stats.attempts++;
        stats.scores.push(
            Number(attempt.score) || 0
        );
        stats.percentages.push(
            Number(attempt.percentage) || 0
        );
        // Coding-specific analytics
        if (type === "coding") {
            const answers =
                attempt.answers || [];
            let totalTestCases = 0;
            let passedTestCases = 0;
            const executionTimes = [];
            answers.forEach((answer) => {
                totalTestCases +=
                    Number(
                        answer.totalTestCases
                    ) || 0;
                passedTestCases +=
                    Number(
                        answer.testCasesPassed
                    ) || 0;
                if (
                    answer.executionTime !==
                    undefined &&
                    answer.executionTime !== null
                ) {
                    const time =
                        Number(
                            answer.executionTime
                        ) || 0;
                    if (time > 0) {
                        executionTimes.push(time);
                    }
                }
            });
            if (totalTestCases > 0) {
                stats.testCaseAccuracies.push(
                    (
                        passedTestCases /
                        totalTestCases
                    ) * 100
                );
            }
            if (executionTimes.length > 0) {
                const averageTime =
                    executionTimes.reduce(
                        (sum, time) =>
                            sum + time,
                        0
                    ) /
                    executionTimes.length;
                stats.executionTimes.push(
                    averageTime
                );
            }
        }
    });
    const result = {};
    Object.entries(typeStats).forEach(
        ([type, stats]) => {
            const averageScore =
                stats.scores.length > 0
                    ? stats.scores.reduce(
                        (sum, value) =>
                            sum + value,
                        0
                    ) / stats.scores.length
                    : 0;
            const averagePercentage =
                stats.percentages.length > 0
                    ? stats.percentages.reduce(
                        (sum, value) =>
                            sum + value,
                        0
                    ) /
                    stats.percentages.length
                    : 0;
            result[type] = {
                attempts:
                    stats.attempts,
                averageScore:
                    Math.round(
                        averageScore * 100
                    ) / 100,
                averagePercentage:
                    Math.round(
                        averagePercentage
                    ),
                bestScore:
                    stats.scores.length > 0
                        ? Math.max(
                            ...stats.scores
                        )
                        : 0,
                worstScore:
                    stats.scores.length > 0
                        ? Math.min(
                            ...stats.scores
                        )
                        : 0,
                bestPercentage:
                    stats.percentages.length > 0
                        ? Math.max(
                            ...stats.percentages
                        )
                        : 0,
                worstPercentage:
                    stats.percentages.length > 0
                        ? Math.min(
                            ...stats.percentages
                        )
                        : 0
            };
            if (type === "coding") {
                const averageTestCaseAccuracy =
                    stats.testCaseAccuracies.length > 0
                        ? stats.testCaseAccuracies.reduce(
                            (sum, value) =>
                                sum + value,
                            0
                        ) /
                        stats.testCaseAccuracies.length
                        : 0;
                const averageExecutionTime =
                    stats.executionTimes.length > 0
                        ? stats.executionTimes.reduce(
                            (sum, value) =>
                                sum + value,
                            0
                        ) /
                        stats.executionTimes.length
                        : 0;
                result[type].averageTestCaseAccuracy =
                    Math.round(
                        averageTestCaseAccuracy
                    );
                result[type].averageExecutionTime =
                    Math.round(
                        averageExecutionTime * 100
                    ) / 100;
            }
        }
    );
    return result;
};
const compareAssessmentTypes = (
    typeAnalytics = {}
) => {
    const types = Object.entries(
        typeAnalytics
    )
        .filter(
            ([, data]) =>
                data.attempts > 0
        );
    if (!types.length) {
        return {
            strongestType: null,
            weakestType: null
        };
    }
    const strongest =
        [...types].sort(
            (a, b) =>
                b[1].averagePercentage -
                a[1].averagePercentage
        )[0];
    const weakest =
        [...types].sort(
            (a, b) =>
                a[1].averagePercentage -
                b[1].averagePercentage
        )[0];
    return {
        strongestType: {
            type: strongest[0],
            ...strongest[1]
        },
        weakestType: {
            type: weakest[0],
            ...weakest[1]
        }
    };
};
const generateAssessmentTypeRecommendations = (
    typeAnalytics = {}
) => {
    const recommendations = [];
    const mcq = typeAnalytics.mcq;
    const coding = typeAnalytics.coding;
    const sql = typeAnalytics.sql;
    if (
        mcq &&
        mcq.attempts > 0 &&
        mcq.averagePercentage < 60
    ) {
        recommendations.push({
            type: "mcq",
            priority: "High",
            recommendation:
                "Review conceptual fundamentals and practice more MCQ questions."
        });
    }
    if (
        mcq &&
        mcq.attempts > 0 &&
        mcq.averagePercentage >= 60 &&
        mcq.averagePercentage < 75
    ) {
        recommendations.push({
            type: "mcq",
            priority: "Medium",
            recommendation:
                "Continue practicing conceptual questions to improve MCQ accuracy."
        });
    }
    if (
        coding &&
        coding.attempts > 0 &&
        coding.averagePercentage < 60
    ) {
        recommendations.push({
            type: "coding",
            priority: "High",
            recommendation:
                "Practice more coding problems and focus on solving edge cases and hidden test cases."
        });
    }
    if (
        coding &&
        coding.attempts > 0 &&
        coding.averageTestCaseAccuracy < 60
    ) {
        recommendations.push({
            type: "coding",
            priority: "High",
            recommendation:
                "Improve coding test-case coverage by handling edge cases and validating solutions against multiple inputs."
        });
    }
    if (
        sql &&
        sql.attempts > 0 &&
        sql.averagePercentage < 60
    ) {
        recommendations.push({
            type: "sql",
            priority: "High",
            recommendation:
                "Practice SQL queries involving joins, aggregation, filtering, and subqueries."
        });
    }
    if (
        sql &&
        sql.attempts > 0 &&
        sql.averagePercentage >= 60 &&
        sql.averagePercentage < 75
    ) {
        recommendations.push({
            type: "sql",
            priority: "Medium",
            recommendation:
                "Continue practicing intermediate SQL problems to improve query accuracy."
        });
    }
    return recommendations;
};
const groupAttemptsByAssessmentType = (
    attempts = [],
    assessments = []
) => {
    const grouped = {
        mcq: [],
        coding: [],
        sql: []
    };
    attempts.forEach((attempt) => {
        const assessmentId =
            attempt.assessment?._id?.toString() ||
            attempt.assessment?.toString();
        if (!assessmentId) {
            return;
        }
        const assessment =
            assessments.find(
                (item) =>
                    item._id.toString() ===
                    assessmentId
            );
        if (!assessment) {
            return;
        }
        const type =
            assessment.type?.toLowerCase();
        if (grouped[type]) {
            grouped[type].push(attempt);
        }
    });
    Object.keys(grouped).forEach((type) => {
        grouped[type].sort(
            (a, b) =>
                new Date(b.submittedAt) -
                new Date(a.submittedAt)
        );
    });
    return grouped;
};
const calculatePerformanceTrend = (attempts = []) => {
    const evaluatedAttempts = attempts
        .filter(
            (attempt) =>
                attempt.status === "evaluated" ||
                attempt.status === "submitted"
        )
        .sort(
            (a, b) =>
                new Date(a.submittedAt) -
                new Date(b.submittedAt)
        );
    if (!evaluatedAttempts.length) {
        return {
            trend: "No Data",
            direction: "stable",
            improvement: 0,
            averageImprovement: 0,
            bestAttempt: null,
            worstAttempt: null,
            history: []
        };
    }
    const history = evaluatedAttempts.map(
        (attempt, index) => ({
            attemptNumber: index + 1,
            attemptId: attempt._id,
            score: Number(attempt.score) || 0,
            percentage: Number(attempt.percentage) || 0,
            submittedAt: attempt.submittedAt
        })
    );
    const firstScore = history[0].percentage;
    const latestScore =
        history[history.length - 1].percentage;
    const improvement =
        Math.round((latestScore - firstScore) * 100) / 100;
    const bestAttempt = [...history].sort(
        (a, b) => b.percentage - a.percentage
    )[0];
    const worstAttempt = [...history].sort(
        (a, b) => a.percentage - b.percentage
    )[0];
    let direction;
    let trend;
    if (improvement >= 10) {
        direction = "improving";
        trend = "Strong Improvement";
    } else if (improvement > 0) {
        direction = "improving";
        trend = "Slight Improvement";
    } else if (improvement <= -10) {
        direction = "declining";
        trend = "Significant Decline";
    } else if (improvement < 0) {
        direction = "declining";
        trend = "Slight Decline";
    } else {
        direction = "stable";
        trend = "Stable";
    }
    const improvements = [];
    for (let i = 1; i < history.length; i++) {
        improvements.push(
            history[i].percentage -
            history[i - 1].percentage
        );
    }
    const averageImprovement =
        improvements.length > 0
            ? improvements.reduce(
                (sum, value) => sum + value,
                0
            ) / improvements.length
            : 0;
    return {
        trend,
        direction,
        improvement,
        averageImprovement:
            Math.round(averageImprovement * 100) / 100,
        bestAttempt,
        worstAttempt,
        history
    };
};
const calculateMovingAverage = (
    history = [],
    windowSize = 3
) => {
    if (!history.length) {
        return [];
    }
    return history.map((item, index) => {
        const start = Math.max(
            0,
            index - windowSize + 1
        );
        const window = history.slice(
            start,
            index + 1
        );
        const average =
            window.reduce(
                (sum, value) =>
                    sum + Number(value.percentage || 0),
                0
            ) / window.length;
        return {
            attemptNumber: item.attemptNumber,
            percentage: item.percentage,
            movingAverage:
                Math.round(average * 100) / 100,
            submittedAt: item.submittedAt
        };
    });
};
const calculatePerformanceMomentum = (
    history = []
) => {
    if (history.length < 2) {
        return {
            momentum: "stable",
            change: 0,
            message:
                "Not enough attempts to determine performance momentum."
        };
    }
    const latest =
        history[history.length - 1].percentage;
    const previous =
        history[history.length - 2].percentage;
    const change =
        Math.round((latest - previous) * 100) / 100;
    let momentum;
    let message;
    if (change >= 10) {
        momentum = "strong-positive";
        message =
            "Your recent performance is improving strongly.";
    } else if (change > 0) {
        momentum = "positive";
        message =
            "Your recent performance is improving.";
    } else if (change <= -10) {
        momentum = "strong-negative";
        message =
            "Your recent performance has declined significantly.";
    } else if (change < 0) {
        momentum = "negative";
        message =
            "Your recent performance has declined slightly.";
    } else {
        momentum = "stable";
        message =
            "Your recent performance is stable.";
    }
    return {
        momentum,
        change,
        message
    };
};
const calculateTypePerformanceTrends = ({
    attempts = [],
    assessments = []
}) => {
    const grouped = {
        mcq: [],
        coding: [],
        sql: []
    };
    attempts
        .filter(
            (attempt) =>
                attempt.status === "evaluated" ||
                attempt.status === "submitted"
        )
        .forEach((attempt) => {
            const assessmentId =
                attempt.assessment?._id?.toString() ||
                attempt.assessment?.toString();
            if (!assessmentId) return;
            const assessment = assessments.find(
                (item) =>
                    item._id.toString() ===
                    assessmentId
            );
            if (!assessment) return;
            const type =
                assessment.type?.toLowerCase();
            if (!grouped[type]) return;
            grouped[type].push(attempt);
        });
    const result = {};
    Object.entries(grouped).forEach(
        ([type, typeAttempts]) => {
            const trend =
                calculatePerformanceTrend(
                    typeAttempts
                );
            result[type] = {
                attempts: typeAttempts.length,
                trend: trend.trend,
                direction: trend.direction,
                improvement: trend.improvement,
                averageImprovement:
                    trend.averageImprovement,
                bestAttempt: trend.bestAttempt,
                worstAttempt: trend.worstAttempt,
                history: trend.history
            };
        }
    );
    return result;
};
const generatePerformanceTrendInsights = ({
    overallTrend,
    momentum,
    typeTrends = {}
}) => {
    const insights = [];
    if (overallTrend.direction === "improving") {
        insights.push({
            type: "positive",
            message:
                `Your performance is improving. You gained ${overallTrend.improvement} percentage points from your first to latest attempt.`
        });
    }
    if (overallTrend.direction === "declining") {
        insights.push({
            type: "warning",
            message:
                `Your performance has declined by ${Math.abs(overallTrend.improvement)} percentage points. Review your weak skills before taking another assessment.`
        });
    }
    if (overallTrend.direction === "stable") {
        insights.push({
            type: "info",
            message:
                "Your performance is currently stable. Continue practicing to achieve further improvement."
        });
    }
    if (momentum?.momentum === "strong-positive") {
        insights.push({
            type: "positive",
            message:
                "You have strong positive momentum in your recent assessment performance."
        });
    }
    if (momentum?.momentum === "strong-negative") {
        insights.push({
            type: "warning",
            message:
                "Your recent performance has dropped significantly. Focus on revision and practice."
        });
    }
    Object.entries(typeTrends).forEach(
        ([type, data]) => {
            if (data.attempts < 2) return;
            if (data.direction === "improving") {
                insights.push({
                    type: "positive",
                    assessmentType: type,
                    message:
                        `${type.toUpperCase()} performance is improving.`
                });
            }
            if (data.direction === "declining") {
                insights.push({
                    type: "warning",
                    assessmentType: type,
                    message:
                        `${type.toUpperCase()} performance is declining.`
                });
            }
        }
    );
    return insights;
};
module.exports = {
    calculateAverage,
    calculateAssessmentAnalytics,
    calculateAttemptTrend,
    calculateScoreDistribution,
    calculateSkillWisePerformance,
    analyzeSkillPerformance,
    calculateSkillPriorities,
    calculateDifficultyWisePerformance,
    analyzeDifficultyPerformance,
    recommendNextDifficulty,
    calculateQuestionAccuracy,
    getMostDifficultQuestions,
    getFrequentlyMissedQuestions,
    analyzeCodingPerformance,
    calculateAssessmentTypeAnalytics,
    compareAssessmentTypes,
    generateAssessmentTypeRecommendations,
    groupAttemptsByAssessmentType,
    calculatePerformanceTrend,
    calculatePerformanceMomentum,
    calculateTypePerformanceTrends,
    calculateMovingAverage,
    generatePerformanceTrendInsights
};