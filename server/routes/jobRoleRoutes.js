const express = require("express");
const {
    getJobRoles
} = require("../controllers/jobRoleController");
const router = express.Router();
router.get("/", getJobRoles);
module.exports = router;