const express = require("express");
const {
    registerUser,
    loginUser,
    getCurrentUser
} = require("../controllers/authController");
const protect =
    require("../middleware/authMiddleware");
const router = express.Router();
// Register
router.post(
    "/register",
    registerUser
);
// Login
router.post(
    "/login",
    loginUser
);
// Current user
router.get(
    "/me",
    protect,
    getCurrentUser
);
module.exports = router;
///api/auth/register
///api/auth/login
///api/auth/me