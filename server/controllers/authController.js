const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password
        } = req.body;
        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }
        // Check password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters"
            });
        }
        // Check if user already exists
        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(
            password,
            salt
        );
        // Create user
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword
        });
        // Generate JWT
        const token = generateToken(user._id);
        // Send response
        res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error(
            "Registration error:",
            error
        );
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
const loginUser = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;
        // Validate
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }
        // Find user
        const user = await User
            .findOne({
                email: email.toLowerCase()
            })
            .select("+password");
        // User not found
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        // Compare password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );
        // Password doesn't match
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        // Generate JWT
        const token = generateToken(user._id);
        // Send response
        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error(
            "Login error:",
            error
        );
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};



const getCurrentUser = async (req, res) => {

    try {

        // JWT contains "id"
        // Therefore use req.user.id

        const user = await User
            .findById(req.user.id)
            .select("-password");


        // User not found

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        // Send user data

        res.status(200).json({
            success: true,
            user
        });

    } catch (error) {

        console.error(
            "Get user error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};




module.exports = {
    registerUser,
    loginUser,
    getCurrentUser
};