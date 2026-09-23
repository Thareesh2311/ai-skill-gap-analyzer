const express = require("express");
const {
    uploadResume
} = require("../controllers/resumeController");
const {
    analyzeResumeSkills
} = require("../controllers/skillAnalysisController");
const protect =
    require("../middleware/authMiddleware");
const upload =
    require("../middleware/uploadMiddleware");
const {
    analyzeSkillGapController
} = require(
    "../controllers/skillGapController"
);
const router = express.Router();
// Upload resume
router.post(
    "/upload",
    protect,
    upload.single("resume"),
    uploadResume
);
// Analyze resume
router.post(
    "/:resumeId/analyze",
    protect,
    analyzeResumeSkills
);
router.post(
    "/:resumeId/skill-gap",
    protect,
    analyzeSkillGapController
);
module.exports = router;