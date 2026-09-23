const JobRequirement = require("../models/JobRequirement");
const getRequirements = async (req, res) => {
    try {
        const requirements = await JobRequirement.find()
            .populate("company", "name")
            .populate("role", "name")
            .populate("skill", "name category")
            .sort({ importance: -1 });
        res.status(200).json({
            success: true,
            count: requirements.length,
            data: requirements
        });
    } catch (error) {
        console.error("Get requirements error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    getRequirements
};