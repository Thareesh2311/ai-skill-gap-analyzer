const calculateImprovement = (previous, current) => {
    const prev = Number(previous) || 0;
    const curr = Number(current) || 0;
    return {
        previous: prev,
        current: curr,
        improvement: Math.round((curr - prev) * 100) / 100
    };
};
const calculateAssessmentProgress = (attempts = []) => {
    if (!attempts.length) {
        return {
            currentScore: 0,
            previousScore: 0,
            improvement: 0,
            attempts: []
        };
    }
    const current =
        Number(attempts[0].percentage) || 0;
    const previous =
        attempts.length > 1
            ? Number(attempts[1].percentage) || 0
            : 0;
    return {
        currentScore: current,
        previousScore: previous,
        improvement:
            Math.round((current - previous) * 100) / 100,
        attempts: attempts.map((attempt) => ({
            score: Number(attempt.score) || 0,
            percentage:
                Number(attempt.percentage) || 0,
            submittedAt: attempt.submittedAt,
            status: attempt.status
        }))
    };
};
const calculateSkillProgress = (
    currentSkills = {},
    previousSkills = {}
) => {
    const skillNames = new Set([
        ...Object.keys(currentSkills),
        ...Object.keys(previousSkills)
    ]);
    const progress = Array.from(skillNames).map((skill) => {
        const current =
            Number(currentSkills[skill]) || 0;
        const previous =
            Number(previousSkills[skill]) || 0;
        const improvement =
            Math.round((current - previous) * 100) / 100;
        return {
            skill,
            previous,
            current,
            improvement
        };
    });
    progress.sort(
        (a, b) => b.improvement - a.improvement
    );
    return progress;
};
const calculateAttemptSkillScores = ({
    attempt,
    questions
}) => {
    const skillStats = {};
    if (!attempt || !questions) {
        return {};
    }
    attempt.answers.forEach((answer) => {
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
                earned: 0,
                total: 0
            };
        }
        const points =
            Number(question.points) || 0;
        skillStats[skillName].total += points;
        skillStats[skillName].earned +=
            Number(answer.pointsEarned) || 0;
    });
    const skillScores = {};
    Object.entries(skillStats).forEach(
        ([skill, stats]) => {
            const percentage =
                stats.total > 0
                    ? (stats.earned / stats.total) * 100
                    : 0;
            skillScores[skill] =
                Math.round(percentage);
        }
    );
    return skillScores;
};
const calculateAttemptSkillProgress = ({
    currentAttempt,
    currentQuestions,
    previousAttempt,
    previousQuestions
}) => {
    const currentSkills = calculateAttemptSkillScores({
        attempt: currentAttempt,
        questions: currentQuestions
    });
    const previousSkills = calculateAttemptSkillScores({
        attempt: previousAttempt,
        questions: previousQuestions
    });
    return calculateSkillProgress(
        currentSkills,
        previousSkills
    );
};
const analyzeSkillProgress = (skillProgress = []) => {
    if (!skillProgress.length) {
        return {
            strongestSkill: null,
            weakestSkill: null,
            biggestImprovement: null,
            biggestDecline: null
        };
    }
    // Strongest skill = highest current score
    const strongestSkill = [...skillProgress].sort(
        (a, b) => b.current - a.current
    )[0];
    // Weakest skill = lowest current score
    const weakestSkill = [...skillProgress].sort(
        (a, b) => a.current - b.current
    )[0];
    // Biggest improvement
    const biggestImprovement = [...skillProgress].sort(
        (a, b) => b.improvement - a.improvement
    )[0];
    // Biggest decline
    const biggestDecline = [...skillProgress]
        .filter((skill) => skill.improvement < 0)
        .sort(
            (a, b) => a.improvement - b.improvement
        )[0] || null;
    return {
        strongestSkill,
        weakestSkill,
        biggestImprovement,
        biggestDecline
    };
};
module.exports = {
    calculateImprovement,
    calculateAssessmentProgress,
    calculateSkillProgress,
    calculateAttemptSkillScores,
    calculateAttemptSkillProgress,
    analyzeSkillProgress
};