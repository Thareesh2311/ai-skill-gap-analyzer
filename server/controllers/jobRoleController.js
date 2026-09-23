const JobRole = require("../models/JobRole");
const getJobRoles = async (req, res) => {
    try {
        const roles = await JobRole.find({
            isActive: true
        }).sort({ name: 1 });
        res.status(200).json({
            success: true,
            count: roles.length,
            data: roles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    getJobRoles
};