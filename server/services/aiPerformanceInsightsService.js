const generateAIPerformanceInsights = ({
    jobReadiness = {},
    overallAnalytics = {},
    skillPerformance = [],
    difficultyPerformance = [],
    typeAnalytics = {},
    performanceTrend = {},
    momentum = {},
    learningRecommendations = []
}) => {
    const insights = [];
    const readinessScore =
        Number(jobReadiness?.score) || 0;
    const readinessLevel =
        jobReadiness?.level || "Not Ready";
    const overallPercentage =
        Number(overallAnalytics?.averagePercentage) || 0;
    const trend =
        performanceTrend?.trend || "No Data";
    const direction =
        performanceTrend?.direction || "stable";
    const improvement =
        Number(performanceTrend?.improvement) || 0;
    /*
     * 1. OVERALL PERFORMANCE
     */
    let overallSummary;
    if (readinessScore >= 90) {
        overallSummary =
            "Your current performance indicates excellent job readiness. " +
            "You are performing strongly across assessments and should focus " +
            "on advanced real-world problems.";
    } else if (readinessScore >= 75) {
        overallSummary =
            "You are very close to strong job readiness. " +
            "Your foundation is good, but improving a few weaker areas " +
            "can significantly increase your readiness.";
    } else if (readinessScore >= 60) {
        overallSummary =
            "You have a good foundation but still need additional practice " +
            "to become consistently job-ready.";
    } else if (readinessScore >= 40) {
        overallSummary =
            "You are making progress, but several skills require improvement. " +
            "Focus on your high-priority weaknesses before attempting advanced assessments.";
    } else {
        overallSummary =
            "Your current performance indicates that you should strengthen " +
            "your fundamentals before progressing to advanced assessments.";
    }
    /*
     * 2. TREND ANALYSIS
     */
    let trendInsight;
    if (direction === "improving") {
        trendInsight =
            `Your performance is improving with an overall gain of ` +
            `${improvement} percentage points. Continue practicing consistently.`;
    } else if (direction === "declining") {
        trendInsight =
            `Your performance has declined by ${Math.abs(improvement)} ` +
            `percentage points. Review weak areas before taking another assessment.`;
    } else {
        trendInsight =
            "Your performance is currently stable. Consistent practice " +
            "can help you achieve further improvement.";
    }
    /*
     * 3. STRONGEST / WEAKEST SKILLS
     */
    const sortedSkills = [...skillPerformance]
        .filter(skill => Number(skill.score) >= 0)
        .sort((a, b) => b.score - a.score);
    const strongestSkill =
        sortedSkills.length > 0
            ? sortedSkills[0]
            : null;
    const weakestSkill =
        sortedSkills.length > 0
            ? sortedSkills[sortedSkills.length - 1]
            : null;
    let skillInsight;
    if (strongestSkill && weakestSkill) {
        skillInsight =
            `${strongestSkill.skill} is currently your strongest skill ` +
            `with a score of ${strongestSkill.score}%, while ` +
            `${weakestSkill.skill} is your weakest skill with ` +
            `${weakestSkill.score}%.`;
    } else {
        skillInsight =
            "There is not enough skill-level data to generate a detailed comparison.";
    }
    /*
     * 4. ASSESSMENT TYPE ANALYSIS
     */
    const availableTypes = Object.entries(typeAnalytics)
        .filter(([, data]) => Number(data.attempts) > 0);
    let strongestType = null;
    let weakestType = null;
    if (availableTypes.length > 0) {
        strongestType =
            [...availableTypes]
                .sort(
                    (a, b) =>
                        b[1].averagePercentage -
                        a[1].averagePercentage
                )[0];
        weakestType =
            [...availableTypes]
                .sort(
                    (a, b) =>
                        a[1].averagePercentage -
                        b[1].averagePercentage
                )[0];
    }
    let assessmentTypeInsight;
    if (strongestType && weakestType) {
        assessmentTypeInsight =
            `You perform best in ${strongestType[0].toUpperCase()} ` +
            `assessments with an average score of ` +
            `${strongestType[1].averagePercentage}%, while ` +
            `${weakestType[0].toUpperCase()} assessments are currently ` +
            `your weakest area at ${weakestType[1].averagePercentage}%.`;
    } else {
        assessmentTypeInsight =
            "There is not enough assessment-type data for comparison.";
    }
   /*
    * 5. DIFFICULTY ANALYSIS
    */
    const normalizedDifficultyPerformance =
        Array.isArray(difficultyPerformance)
            ? difficultyPerformance
            : Object.values(difficultyPerformance || {}).map((item) => ({
                difficulty: item.difficulty || "Unknown",
                // Support both possible field names
                questionsAttempted:
                    Number(item.questionsAttempted ?? item.attempts) || 0,
                score:
                    Number(item.score ?? item.averageScore) || 0
            }));
    const attemptedDifficulty =
        normalizedDifficultyPerformance.filter(
            (item) => Number(item.questionsAttempted) > 0
        );
    let difficultyInsight;
    if (attemptedDifficulty.length > 0) {
        const bestDifficulty =
            [...attemptedDifficulty].sort(
                (a, b) => b.score - a.score
            )[0];
        const weakestDifficulty =
            [...attemptedDifficulty].sort(
                (a, b) => a.score - b.score
            )[0];
        difficultyInsight =
            `You currently perform best at ${bestDifficulty.difficulty} ` +
            `difficulty (${bestDifficulty.score}%), while ` +
            `${weakestDifficulty.difficulty} difficulty requires the most improvement ` +
            `(${weakestDifficulty.score}%).`;
    } else {
        difficultyInsight =
            "There is not enough difficulty-level data available.";
    }
    /*
     * 6. MOMENTUM
     */
    let momentumInsight;
    if (momentum?.momentum === "strong-positive") {
        momentumInsight =
            "Your recent performance shows strong positive momentum. " +
            "This is a good time to gradually increase problem difficulty.";
    } else if (momentum?.momentum === "positive") {
        momentumInsight =
            "Your recent performance is improving. Continue your current learning routine.";
    } else if (momentum?.momentum === "strong-negative") {
        momentumInsight =
            "Your recent performance has dropped significantly. " +
            "Spend additional time reviewing concepts before attempting another assessment.";
    } else if (momentum?.momentum === "negative") {
        momentumInsight =
            "Your recent performance has declined slightly. " +
            "Review recent mistakes and practice the affected skills.";
    } else {
        momentumInsight =
            "Your recent performance is relatively stable.";
    }
    /*
     * 7. HIGH PRIORITY SKILLS
     */
    const highPrioritySkills =
        learningRecommendations
            .filter(
                item => item.priority === "High"
            )
            .slice(0, 5);
    /*
     * 8. AI-STYLE RECOMMENDATIONS
     */
    const recommendations = [];
    if (weakestSkill) {
        recommendations.push(
            `Prioritize ${weakestSkill.skill} because it currently has ` +
            `the lowest performance score (${weakestSkill.score}%).`
        );
    }
    if (weakestType) {
        recommendations.push(
            `Spend additional practice time on ` +
            `${weakestType[0].toUpperCase()} assessments.`
        );
    }
    if (direction === "declining") {
        recommendations.push(
            "Review incorrect answers and repeat weak questions before progressing."
        );
    }
    if (readinessScore < 75) {
        recommendations.push(
            "Complete another assessment after following the recommended learning plan."
        );
    } else {
        recommendations.push(
            "Challenge yourself with advanced coding, SQL, and real-world problems."
        );
    }
    /*
     * FINAL RESULT
     */

    return {
        generatedAt: new Date(),
        readiness: {
            score: readinessScore,
            level: readinessLevel
        },
        overallPerformance: {
            averagePercentage: overallPercentage,
            trend,
            direction,
            improvement
        },
        summary: overallSummary,
        trendInsight,
        skillInsight,
        assessmentTypeInsight,
        difficultyInsight,
        momentumInsight,
        strongestSkill,
        weakestSkill,
        strongestAssessmentType:
            strongestType
                ? {
                    type: strongestType[0],
                    ...strongestType[1]
                }
                : null,
        weakestAssessmentType:
            weakestType
                ? {
                    type: weakestType[0],
                    ...weakestType[1]
                }
                : null,
        highPrioritySkills,
        recommendations,
        nextAction:
            readinessScore >= 75
                ? "Attempt advanced real-world problems"
                : "Improve weak skills and retake assessments"
    };
};
module.exports = {
    generateAIPerformanceInsights
};