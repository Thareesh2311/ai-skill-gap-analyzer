const getLevel = (score) => {
    const value = Number(score) || 0;
    if (value >= 90) return "Expert";
    if (value >= 70) return "Advanced";
    if (value >= 40) return "Intermediate";
    return "Beginner";
};
const getPriority = (score, improvement) => {
    const current = Number(score) || 0;
    const change = Number(improvement) || 0;
    // Very low current score
    if (current < 40) {
        return "High";
    }
    // Score dropped significantly
    if (change <= -15) {
        return "High";
    }
    // Moderate performance
    if (current < 70) {
        return "Medium";
    }
    // Good performance
    return "Low";
};
const getRecommendation = (skill, score, improvement) => {
    const current = Number(score) || 0;
    const change = Number(improvement) || 0;
    if (current < 40) {
        return `Focus on ${skill} fundamentals and practice beginner-level problems before attempting advanced questions.`;
    }
    if (current < 70 && change > 0) {
        return `Your ${skill} performance is improving. Continue practicing intermediate-level problems to strengthen your skills.`;
    }
    if (current < 70) {
        return `Strengthen your ${skill} fundamentals and practice more problems to reach an advanced level.`;
    }
    if (change >= 15) {
        return `Excellent improvement in ${skill}. Continue with advanced problems to maintain your progress.`;
    }
    if (change < 0) {
        return `Your ${skill} score has decreased. Review weak areas and practice additional problems before your next assessment.`;
    }
    return `Your ${skill} performance is strong. Continue practicing advanced problems to maintain your proficiency.`;
};
const getNextAction = (score, improvement) => {
    const current = Number(score) || 0;
    const change = Number(improvement) || 0;
    if (current < 40) {
        return "Learn Fundamentals";
    }
    if (current < 70) {
        return "Practice";
    }
    if (change >= 15) {
        return "Challenge Yourself";
    }
    if (change < 0) {
        return "Review Weak Areas";
    }
    return "Maintain";
};
const getNextDifficulty = (score) => {
    const current = Number(score) || 0;
    if (current < 40) {
        return "beginner";
    }
    if (current < 70) {
        return "intermediate";
    }
    return "advanced";
};
const generateLearningRecommendations = (skillProgress = []) => {
    return skillProgress.map((skill) => {
        const current = Number(skill.current) || 0;
        const previous = Number(skill.previous) || 0;
        const improvement = Number(skill.improvement) || 0;
        const level = getLevel(current);
        const priority = getPriority(current, improvement);
        return {
            skill: skill.skill,
            previousScore: previous,
            currentScore: current,
            improvement,
            level,
            priority,
            recommendation: getRecommendation(
                skill.skill,
                current,
                improvement
            ),
            nextAction: getNextAction(
                current,
                improvement
            ),
            nextDifficulty: getNextDifficulty(current)
        };
    });
};
const getTopLearningPriorities = (
    recommendations = [],
    limit = 5
) => {
    return [...recommendations]
        .sort((a, b) => {
            const priorityOrder = {
                High: 3,
                Medium: 2,
                Low: 1
            };
            const priorityDifference =
                priorityOrder[b.priority] -
                priorityOrder[a.priority];
            if (priorityDifference !== 0) {
                return priorityDifference;
            }
            return a.currentScore - b.currentScore;
        })
        .slice(0, limit);
};
module.exports = {
    getLevel,
    getPriority,
    getRecommendation,
    getNextAction,
    getNextDifficulty,
    generateLearningRecommendations,
    getTopLearningPriorities
};