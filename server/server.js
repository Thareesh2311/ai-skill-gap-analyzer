const express = require("express");
const cors = require("cors");
const path = require("path");

// Load environment variables ONCE
require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const connectDB = require("./config/db");

const companyRoutes = require("./routes/companyRoutes");
const jobRoleRoutes = require("./routes/jobRoleRoutes");
const skillRoutes = require("./routes/skillRoutes");
const authRoutes = require("./routes/authRoutes");
const jobRequirementRoutes = require("./routes/jobRequirementRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const learningRoutes = require("./routes/learningRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.json({
        message: "AI Skill Gap Analyzer API is running 🚀"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "success",
        message: "Backend is connected and running 🚀"
    });
});

app.use("/api/companies", companyRoutes);
app.use("/api/job-roles", jobRoleRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/job-requirements", jobRequirementRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/learning", learningRoutes);

const PORT = process.env.PORT || 5000;

// Start server only after MongoDB connects
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();