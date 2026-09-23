const generateFinalProgressSummary = ({
    jobReadiness,
    overallProgress,
    skillAnalysis,
    learningRecommendations = [],
    topLearningPriorities = []
}) => {
    const readinessScore = Number(jobReadiness?.score) || 0;
    const readinessLevel = jobReadiness?.level || "Not Ready";
    const improvement =
        Number(overallProgress?.improvement) || 0;
    const strongestSkill =
        skillAnalysis?.strongestSkill || null;
    const weakestSkill =
        skillAnalysis?.weakestSkill || null;
    const biggestImprovement =
        skillAnalysis?.biggestImprovement || null;
    let summary;
    if (readinessScore >= 90) {
        summary =
            "You are highly job-ready. Your assessment performance and skill coverage are excellent. Continue practicing advanced problems to maintain your performance.";
    } else if (readinessScore >= 75) {
        summary =
            "You are very close to strong job readiness. Focus on your remaining weak skills and continue practicing real-world problems.";
    } else if (readinessScore >= 60) {
        summary =
            "You have a good foundation but need additional practice in weaker areas before becoming fully job-ready.";
    } else if (readinessScore >= 40) {
        summary =
            "You are making progress, but several skills require improvement. Follow the recommended learning plan and retake assessments.";
    } else {
        summary =
            "You currently need significant improvement before becoming job-ready. Start with fundamentals and gradually progress to practical assessments.";
    }
    const improvementMessage =
        improvement > 0
            ? `Your assessment performance improved by ${improvement} points.`
            : improvement < 0
                ? `Your assessment performance decreased by ${Math.abs(improvement)} points.`
                : "Your assessment performance has remained stable.";
    const nextSteps = [];
    if (weakestSkill) {
        nextSteps.push(
            `Improve ${weakestSkill.skill} (${weakestSkill.current}%).`
        );
    }
    topLearningPriorities
        .slice(0, 3)
        .forEach((item) => {
            if (
                item.skill &&
                !nextSteps.some(
                    (step) => step.includes(item.skill)
                )
            ) {
                nextSteps.push(
                    `Practice ${item.skill} at ${item.nextDifficulty} level.`
                );
            }
        });
    if (readinessScore < 75) {
        nextSteps.push(
            "Complete another assessment after improving your weak skills."
        );
    } else {
        nextSteps.push(
            "Attempt advanced real-world coding and SQL problems."
        );
    }
    return {
        readiness: {
            score: readinessScore,
            level: readinessLevel
        },
        progress: {
            currentScore:
                Number(overallProgress?.currentScore) || 0,
            previousScore:
                Number(overallProgress?.previousScore) || 0,
            improvement
        },
        strongestSkill,
        weakestSkill,
        biggestImprovement,
        improvementMessage,
        summary,
        learningPriorities:
            topLearningPriorities.slice(0, 5),
        nextSteps,
        recommendationCount:
            learningRecommendations.length
    };
};
module.exports = {
    generateFinalProgressSummary
};