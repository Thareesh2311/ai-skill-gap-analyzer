const Skill = require("../models/Skill");
const normalizeText = (text) => {
    return text
        .toLowerCase()
        .replace(/[^\w\s+#.-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};
const escapeRegex = (text) => {
    return text.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
};
const extractSkills = async (resumeText) => {
    if (!resumeText) {
        return [];
    }
    const normalizedText =
        normalizeText(resumeText);
    const skills =
        await Skill.find({
            isActive: true
        });
    const detectedSkills = [];
    for (const skill of skills) {
        const possibleMatches = [
            skill.name,
            ...(skill.aliases || [])
        ];
        let matchedText = null;
        for (
            const candidate
            of possibleMatches
        ) {
            const normalizedCandidate =
                normalizeText(candidate);
            if (!normalizedCandidate) {
                continue;
            }
            const regex =
                new RegExp(
                    `\\b${escapeRegex(
                        normalizedCandidate
                    )}\\b`,
                    "i"
                );
            if (
                regex.test(
                    normalizedText
                )
            ) {
                matchedText =
                    candidate;
                break;
            }
        }
        if (matchedText) {
            detectedSkills.push({
                skill: skill._id,
                name: skill.name,
                matchedText,
                confidence: 1
            });
        }
    }
    return detectedSkills;
};
module.exports = {
    extractSkills
};