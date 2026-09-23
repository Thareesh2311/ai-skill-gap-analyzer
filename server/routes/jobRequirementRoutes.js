const express = require("express");
const {
    getRequirements
} = require("../controllers/jobRequirementController");
const router = express.Router();
router.get("/", getRequirements);
module.exports = router;