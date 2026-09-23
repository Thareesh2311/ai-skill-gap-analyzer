const express = require("express");
const {
    getSkills
} = require("../controllers/skillController")
const router = express.Router();
router.get("/", getSkills);
module.exports = router;