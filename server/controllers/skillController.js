const skill = require("../models/Skill");
const getSkills = async (req, res) => {
    try {
        const skills = await skill.find({
            isActive: true
        }).sort({ name: 1 });
        res.status(200).json({
            success: true,
            count: skills.length,
            data: skills
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    getSkills
};