const Company = require("../models/company");
const getCompanies = async (req, res) => {
    try {
        const companies = await Company.find({
            isActive: true
        }).sort({ name: 1});
        res.status(200).json({
            success: true,
            count: companies.length,
            data: companies
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = { 
    getCompanies
};