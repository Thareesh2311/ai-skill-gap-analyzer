const normalizeSkillName = (name) => {
    return name
        .toLowerCase()
        .replace(/[.\-_]/g, "")
        .replace(/\s+/g, "")
        .trim();
};
const analyzeSkillGap = (
    extractedSkills,
    jobRequirements
) => {
    const matchedSkills = [];
    const missingSkills = [];
    const studentSkills = new Map();
    extractedSkills.forEach((skill) => {
        if (!skill || !skill.name) {
            return;
        }
        studentSkills.set(
            normalizeSkillName(skill.name),
            skill
        );
    });
    let totalImportance = 0;
    let matchedImportance = 0;
    jobRequirements.forEach(
        (requiredSkill) => {
            if (!requiredSkill) {
                return;
            }
            if (
                !requiredSkill.skill ||
                !requiredSkill.skill.name
            ) {
                console.log(
                    "Skipping requirement because skill was not found:",
                    requiredSkill._id
                );
                return;
            }
            totalImportance +=
                requiredSkill.importance;
            const requiredSkillName =
                requiredSkill.skill.name;
            const normalizedRequired =
                normalizeSkillName(
                    requiredSkillName
                );
            const studentSkill =
                studentSkills.get(
                    normalizedRequired
                );
            if (studentSkill) {
                matchedImportance +=
                    requiredSkill.importance;
                matchedSkills.push({
                    skill:
                        studentSkill.skill,
                    name:
                        requiredSkillName,
                    importance:
                        requiredSkill.importance,
                    status:
                        "matched"
                });
            }
            else {
                missingSkills.push({
                    skill:
                        requiredSkill.skill._id,
                    name:
                        requiredSkillName,
                    importance:
                        requiredSkill.importance,
                    status:
                        "missing"
                });
            }
        }
    );
    const coverageScore =
        totalImportance === 0
            ? 0
            : Math.round(
                (
                    matchedImportance /
                    totalImportance
                ) * 100
            );
    return {
        coverageScore,
        matchedSkills,
        missingSkills
    };
};
module.exports = {
    analyzeSkillGap
};