// JOB READINESS EXPLANATION SERVICE
const generateJobReadinessExplanation = ({
    jobReadiness,
    skillPerformance,
    weakSkillAnalysis
}) => {
    const {
        score,
        level,
        resumeCoverage,
        assessmentScore
    } = jobReadiness;
    // STRONG SKILLS
    const strongSkills =
        skillPerformance
            .filter(skill =>
                skill.percentage >= 70
            )
            .sort(
                (a, b) =>
                    b.percentage -
                    a.percentage
            );
    // WEAK SKILLS
    const weakSkills =
        skillPerformance
            .filter(skill =>
                skill.percentage < 70
            )
            .sort(
                (a, b) =>
                    a.percentage -
                    b.percentage
            );
    // HIGHEST PRIORITY SKILL
    const highestPrioritySkill =
        weakSkills.length > 0
            ? weakSkills[0]
            : null;
    // BUILD EXPLANATION
    let explanation = "";
    if (score >= 90) {
        explanation =
            "You demonstrate excellent readiness for this role. " +
            "Your resume coverage and assessment performance " +
            "indicate strong alignment with the required skills.";
    }
    else if (score >= 75) {
        explanation =
            "You demonstrate very good readiness for this role. " +
            "You have strong alignment with most requirements, " +
            "but improving a few weaker skills can make you more competitive.";
    }
    else if (score >= 60) {
        explanation =
            "You demonstrate good potential for this role. " +
            "Your current skills provide a reasonable foundation, " +
            "but additional preparation is recommended before applying.";
    }
    else if (score >= 40) {
        explanation =
            "You have a developing skill foundation for this role. " +
            "Several important skills require improvement before you are fully job ready.";
    }
    else {
        explanation =
            "You currently have significant skill gaps for this role. " +
            "Focus on the recommended areas before attempting the role assessment again.";
    }
    // ADD ASSESSMENT INSIGHT
    if (
        assessmentScore < resumeCoverage
    ) {
        explanation +=
            ` Your assessment performance (${assessmentScore}%) ` +
            `is lower than your resume skill coverage (${resumeCoverage}%), ` +
            "which suggests that some skills listed on your resume " +
            "may need stronger practical understanding.";
    }
    else if (
        assessmentScore > resumeCoverage
    ) {
        explanation +=
            ` Your assessment performance (${assessmentScore}%) ` +
            `is stronger than your resume coverage (${resumeCoverage}%), ` +
            "indicating that your practical ability may be stronger " +
            "than what is currently represented on your resume.";
    }
    // STRONG SKILL SUMMARY
    const strongSkillSummary =
        strongSkills
            .slice(0, 5)
            .map(skill => ({
                skill:
                    skill.skill,
                percentage:
                    skill.percentage,
                level:
                    skill.level
            }));
    // WEAK SKILL SUMMARY
    const weakSkillSummary =
        weakSkills
            .slice(0, 5)
            .map(skill => ({
                skill:
                    skill.skill,
                percentage:
                    skill.percentage,
                level:
                    skill.level
            }));
    // PRIORITY
    let priorityMessage = null;
    if (highestPrioritySkill) {
        priorityMessage =
            `Your highest priority should be improving ` +
            `${highestPrioritySkill.skill}, ` +
            `where your current assessment performance is ` +
            `${highestPrioritySkill.percentage}%.`;
    }
    else {
        priorityMessage =
            "No major skill weaknesses were detected in the assessment.";
    }
    // RETURN
    return {
        summary:
            explanation,
        readiness:
            {
                score,
                level
            },
        comparison:
            {
                resumeCoverage,
                assessmentScore,
                difference:
                    assessmentScore -
                    resumeCoverage
            },
        strongSkills:
            strongSkillSummary,
        areasToImprove:
            weakSkillSummary,
        highestPriority:
            highestPrioritySkill
                ? {
                    skill:
                        highestPrioritySkill.skill,
                    percentage:
                        highestPrioritySkill.percentage,
                    level:
                        highestPrioritySkill.level
                }
                : null,
        priorityMessage,
        recommendationCount:
            weakSkillAnalysis?.recommendations?.length || 0
    };
};
module.exports = {
    generateJobReadinessExplanation
};