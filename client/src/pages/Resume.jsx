import { useEffect, useState } from "react";
import resumeService from "../services/resumeService";

const companies = [
    "TCS",
    "Infosys",
    "Accenture"
];
const roles = [
    "Data Analyst",
    "Data Scientist",
    "Software Developer",
    "Java Developer",
    "Python Developer"
];
const getSkillName = (skill) => {
    if (typeof skill === "string") {
        return skill;
    }
    if (skill?.name) {
        return skill.name;
    }
    if (skill?.skill?.name) {
        return skill.skill.name;
    }
    return "Unknown Skill";
};
const getSkillLevel = (skill) => {
    if (skill?.requiredLevel) {
        return skill.requiredLevel;
    }
    if (skill?.level) {
        return skill.level;
    }
    return null;
};
function Resume() {
    const [file, setFile] = useState(null);
    const [company, setCompany] = useState(
        localStorage.getItem("resumeCompany") || ""
    );
    const [role, setRole] = useState(
        localStorage.getItem("resumeRole") || ""
    );
    const [resumeId, setResumeId] = useState(
        localStorage.getItem("resumeId") || ""
    );
    const [resumeFileName, setResumeFileName] = useState(
        localStorage.getItem("resumeFileName") || ""
    );
    const [analysis, setAnalysis] = useState(() => {
        try {
            const savedAnalysis =
                localStorage.getItem("resumeAnalysis");
            return savedAnalysis
                ? JSON.parse(savedAnalysis)
                : null;
        } catch (error) {
            console.error(
                "Failed to restore saved analysis:",
                error
            );
            return null;
        }
    });
    const [skillGap, setSkillGap] = useState(() => {
        try {
            const savedSkillGap =
                localStorage.getItem("resumeSkillGap");
            return savedSkillGap
                ? JSON.parse(savedSkillGap)
                : null;
        } catch (error) {
            console.error(
                "Failed to restore saved skill gap:",
                error
            );
            return null;
        }
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const storedResumeId =
            localStorage.getItem("resumeId");
        const storedCompany =
            localStorage.getItem("resumeCompany");
        const storedRole =
            localStorage.getItem("resumeRole");
        const storedFileName =
            localStorage.getItem("resumeFileName");

        console.log(
            "Restoring Resume page data..."
        );
        console.log(
            "Stored Resume ID:",
            storedResumeId
        );
        console.log(
            "Stored Company:",
            storedCompany
        );
        console.log(
            "Stored Role:",
            storedRole
        );
        if (storedResumeId) {
            setResumeId(storedResumeId);
            restoreResumeAnalysis(storedResumeId);
        }
        if (storedCompany) {
            setCompany(storedCompany);
        }
        if (storedRole) {
            setRole(storedRole);
        }
        if (storedFileName) {
            setResumeFileName(storedFileName);
        }
    }, []);
    const restoreResumeAnalysis = async (id) => {
        if (!id) {
            return;
        }
        try {
            console.log(
                "Refreshing resume analysis for:",
                id
            );
            setStatus(
                "Refreshing your resume analysis..."
            );
            setError("");
            const analysisResponse =
                await resumeService.analyzeResume(id);
            console.log(
                "Restored skill analysis:",
                analysisResponse
            );
            setAnalysis(
                analysisResponse
            );
            localStorage.setItem(
                "resumeAnalysis",
                JSON.stringify(
                    analysisResponse
                )
            );
            const skillGapResponse =
                await resumeService.getSkillGap(id);
            console.log(
                "Restored skill gap:",
                skillGapResponse
            );
            setSkillGap(
                skillGapResponse
            );
            localStorage.setItem(
                "resumeSkillGap",
                JSON.stringify(
                    skillGapResponse
                )
            );
            setStatus(
                "Resume analysis restored successfully."
            );
        } catch (err) {
            console.error(
                "Failed to restore resume analysis:",
                err
            );
            console.error(
                "Backend response:",
                err?.response?.data
            );
            const hasCachedData =
                localStorage.getItem(
                    "resumeAnalysis"
                ) ||
                localStorage.getItem(
                    "resumeSkillGap"
                );
            if (hasCachedData) {
                setStatus(
                    "Showing your saved resume analysis."
                );
            } else {
                setError(
                    err?.response?.data?.message ||
                    "Failed to restore resume analysis."
                );
                setStatus("");
            }
        }
    };
    const handleFileChange = (e) => {
        const selectedFile =
            e.target.files?.[0];
        setError("");
        setStatus("");
        if (!selectedFile) {
            setFile(null);
            return;
        }
        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword"
        ];
        const fileName =
            selectedFile.name.toLowerCase();
        const isValidType =
            allowedTypes.includes(
                selectedFile.type
            ) ||
            fileName.endsWith(".pdf") ||
            fileName.endsWith(".docx") ||
            fileName.endsWith(".doc");
        if (!isValidType) {
            setError(
                "Please upload a PDF or DOCX resume."
            );
            setFile(null);
            return;
        }
        if (
            selectedFile.size >
            5 * 1024 * 1024
        ) {
            setError(
                "Resume size must be less than 5 MB."
            );
            setFile(null);
            return;
        }
        setFile(
            selectedFile
        );
        setResumeFileName(
            selectedFile.name
        );
    };
    const handleCompanyChange = (e) => {
        const value =
            e.target.value;
        setCompany(value);
        if (value) {
            localStorage.setItem(
                "resumeCompany",
                value
            );
        } else {
            localStorage.removeItem(
                "resumeCompany"
            );
        }
    };
    const handleRoleChange = (e) => {
        const value =
            e.target.value;
        setRole(value);
        if (value) {
            localStorage.setItem(
                "resumeRole",
                value
            );
        } else {
            localStorage.removeItem(
                "resumeRole"
            );
        }
    };
    const handleAnalyze = async (id) => {
        if (!id) {
            return;
        }
        try {
            setStatus(
                "Extracting skills from your resume..."
            );
            setError("");
            const analysisResponse =
                await resumeService.analyzeResume(id);
            console.log(
                "Skill analysis response:",
                analysisResponse
            );
            setAnalysis(
                analysisResponse
            );
            localStorage.setItem(
                "resumeAnalysis",
                JSON.stringify(
                    analysisResponse
                )
            );
            setStatus(
                "Calculating skill gap..."
            );
            const skillGapResponse =
                await resumeService.getSkillGap(id);
            console.log(
                "Skill gap response:",
                skillGapResponse
            );
            setSkillGap(
                skillGapResponse
            );
            localStorage.setItem(
                "resumeSkillGap",
                JSON.stringify(
                    skillGapResponse
                )
            );
            setStatus(
                "Analysis completed successfully."
            );
        } catch (err) {
            console.error(
                "Analysis error:",
                err
            );
            console.error(
                "Backend response:",
                err?.response?.data
            );
            setError(
                err?.response?.data?.message ||
                "Failed to analyze resume."
            );
            setStatus("");
        }
    };
    const handleUpload = async () => {
        setError("");
        setStatus("");
        if (!file) {
            if (resumeId) {
                setStatus(
                    "Your resume is already uploaded. Restoring analysis..."
                );
                await handleAnalyze(
                    resumeId
                );
                return;
            }
            setError(
                "Please select a resume first."
            );
            return;
        }
        if (!company) {
            setError(
                "Please select a company."
            );
            return;
        }
        if (!role) {
            setError(
                "Please select a job role."
            );
            return;
        }
        try {
            setLoading(true);
            setStatus(
                "Uploading resume..."
            );
            const response =
                await resumeService.uploadResume(
                    file,
                    company,
                    role
                );
            console.log(
                "Upload response:",
                response
            );
            const id =
                response?.resumeId ||
                response?.resume?.id ||
                response?.resume?._id ||
                response?.data?.resumeId ||
                response?.data?.resume?.id ||
                response?.data?.resume?._id;
            if (!id) {
                throw new Error(
                    "Resume ID was not returned by backend."
                );
            }
            console.log(
                "New Resume ID:",
                id
            );
            setResumeId(
                id
            );
            localStorage.setItem(
                "resumeId",
                id
            );
            localStorage.setItem(
                "resumeCompany",
                company
            );
            localStorage.setItem(
                "resumeRole",
                role
            );
            localStorage.setItem(
                "resumeFileName",
                file.name
            );
            setResumeFileName(
                file.name
            );
            localStorage.removeItem(
                "resumeAnalysis"
            );
            localStorage.removeItem(
                "resumeSkillGap"
            );
            setAnalysis(null);
            setSkillGap(null);
            await handleAnalyze(
                id
            );
        } catch (err) {
            console.error(
                "Upload error:",
                err
            );
            console.error(
                "Backend response:",
                err?.response?.data
            );
            setError(
                err?.response?.data?.message ||
                err.message ||
                "Failed to upload resume."
            );
            setStatus("");
        } finally {
            setLoading(false);
        }
    };
    const extractedSkills =
        analysis?.data?.skills ||
        analysis?.skills ||
        analysis?.data?.extractedSkills ||
        analysis?.extractedSkills ||
        [];
    const matchedSkills =
        skillGap?.data?.matchedSkills ||
        skillGap?.matchedSkills ||
        [];
    const missingSkills =
        skillGap?.data?.missingSkills ||
        skillGap?.missingSkills ||
        [];
    const coverageScore =
        skillGap?.data?.coverageScore ??
        skillGap?.coverageScore ??
        0;
    const displayCompany =
        skillGap?.data?.company ||
        skillGap?.company ||
        company;
    const displayRole =
        skillGap?.data?.role ||
        skillGap?.role ||
        role;
    return (
        <div className="resume-page">
            <div className="resume-header">
                <div>
                    <span className="section-label">
                        AI CAREER ANALYSIS
                    </span>
                    <h1>
                        Resume{" "}
                        <span>
                            Skill Gap Analyzer
                        </span>
                    </h1>
                    <p>
                        Compare your resume against real job
                        requirements and discover what skills
                        you need to improve.
                    </p>
                </div>
            </div>

            <div className="resume-analyzer-card">
                <div className="analyzer-step">
                    <div className="step-number">
                        01
                    </div>

                    <div className="step-content">
                        <h3>
                            Upload Resume
                        </h3>

                        <p>
                            Upload your latest PDF or DOCX resume.
                        </p>

                        <label className="file-upload">
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                            />

                            <div className="upload-box">
                                <span className="upload-icon">
                                    ↑
                                </span>

                                <strong>
                                    {file
                                        ? file.name
                                        : resumeFileName
                                            ? `✓ ${resumeFileName}`
                                            : "Choose Resume"}
                                </strong>

                                <small>
                                    {resumeFileName && !file
                                        ? "Resume already uploaded • Click to replace"
                                        : "PDF / DOCX • Max 5 MB"}
                                </small>
                            </div>
                        </label>

                        {resumeId && !file && (
                            <div
                                style={{
                                    marginTop: "10px",
                                    fontSize: "13px",
                                    opacity: 0.8
                                }}
                            >
                                ✓ Previously uploaded resume connected
                            </div>
                        )}
                    </div>
                </div>

                <div className="analyzer-divider" />

                <div className="analyzer-step">
                    <div className="step-number">
                        02
                    </div>

                    <div className="step-content">
                        <h3>
                            Target Company
                        </h3>

                        <p>
                            Select the company you are targeting.
                        </p>

                        <select
                            value={company}
                            onChange={handleCompanyChange}
                        >
                            <option value="">
                                Select Company
                            </option>

                            {companies.map(
                                (item) => (
                                    <option
                                        key={item}
                                        value={item}
                                    >
                                        {item}
                                    </option>
                                )
                            )}
                        </select>
                    </div>
                </div>

                <div className="analyzer-divider" />

                <div className="analyzer-step">
                    <div className="step-number">
                        03
                    </div>

                    <div className="step-content">
                        <h3>
                            Job Role
                        </h3>
                        <p>
                            Choose the role you want to analyze.
                        </p>
                        <select
                            value={role}
                            onChange={handleRoleChange}
                        >
                            <option value="">
                                Select Job Role
                            </option>

                            {roles.map(
                                (item) => (
                                    <option
                                        key={item}
                                        value={item}
                                    >
                                        {item}
                                    </option>
                                )
                            )}
                        </select>
                    </div>
                </div>

                <button
                    className="btn btn-primary analyze-btn"
                    onClick={handleUpload}
                    disabled={loading}
                >
                    {loading
                        ? "Analyzing..."
                        : resumeId && !file
                            ? "Refresh Skill Analysis →"
                            : "Analyze My Skill Gap →"}
                </button>
            </div>

            {status && (
                <div className="analysis-status">
                    <span className="status-dot" />
                    {status}
                </div>
            )}

            {error && (
                <div className="analysis-error">
                    ⚠️ {error}
                </div>
            )}

            {skillGap && (
                <div className="skill-results">
                    <div className="target-info">
                        <div>
                            <span>
                                TARGET
                            </span>

                            <h2>
                                {displayCompany}
                            </h2>
                        </div>

                        <div className="target-role">
                            <span>
                                ROLE
                            </span>

                            <h3>
                                {displayRole}
                            </h3>
                        </div>
                    </div>

                    <div className="readiness-card">
                        <div className="readiness-info">
                            <span className="section-label">
                                JOB READINESS
                            </span>

                            <h2>
                                {coverageScore}%
                            </h2>

                            <p>
                                Your resume currently matches{" "}
                                <strong>
                                    {coverageScore}%
                                </strong>{" "}
                                of the required skills for this
                                position.
                            </p>
                        </div>

                        <div
                            className="readiness-ring"
                            style={{
                                "--score":
                                    `${coverageScore * 3.6}deg`
                            }}
                        >
                            <div className="readiness-ring-inner">
                                <strong>
                                    {coverageScore}%
                                </strong>
                            </div>
                        </div>
                    </div>

                    <div className="skill-summary-grid">
                        <div className="skill-summary-card">
                            <span>
                                EXTRACTED
                            </span>

                            <strong>
                                {extractedSkills.length}
                            </strong>

                            <small>
                                Skills found in resume
                            </small>
                        </div>

                        <div className="skill-summary-card matched">
                            <span>
                                MATCHED
                            </span>

                            <strong>
                                {matchedSkills.length}
                            </strong>

                            <small>
                                Required skills you have
                            </small>
                        </div>

                        <div className="skill-summary-card missing">
                            <span>
                                MISSING
                            </span>

                            <strong>
                                {missingSkills.length}
                            </strong>

                            <small>
                                Skills you need to learn
                            </small>
                        </div>
                    </div>

                    <div className="skills-section">
                        <div className="section-heading">
                            <div>
                                <span className="section-label">
                                    RESUME ANALYSIS
                                </span>

                                <h2>
                                    Detected Skills
                                </h2>
                            </div>

                            <span className="skill-count">
                                {extractedSkills.length} skills
                            </span>
                        </div>

                        <div className="skills-list">
                            {extractedSkills.length > 0 ? (
                                extractedSkills.map(
                                    (skill, index) => (
                                        <div
                                            className="skill-chip"
                                            key={
                                                skill?._id ||
                                                skill?.id ||
                                                index
                                            }
                                        >
                                            <span>
                                                ✓
                                            </span>

                                            {getSkillName(
                                                skill
                                            )}
                                        </div>
                                    )
                                )
                            ) : (
                                <p className="empty-message">
                                    No skills detected.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="skills-section">
                        <div className="section-heading">
                            <div>
                                <span className="section-label">
                                    STRENGTHS
                                </span>

                                <h2>
                                    Matched Skills
                                </h2>
                            </div>

                            <span className="badge badge-success">
                                {matchedSkills.length} MATCHED
                            </span>
                        </div>

                        <div className="skill-analysis-list">
                            {matchedSkills.length > 0 ? (
                                matchedSkills.map(
                                    (skill, index) => (
                                        <div
                                            className="skill-analysis-row matched-row"
                                            key={
                                                skill?._id ||
                                                skill?.id ||
                                                index
                                            }
                                        >
                                            <div className="skill-row-name">
                                                <span className="skill-check">
                                                    ✓
                                                </span>

                                                <strong>
                                                    {getSkillName(
                                                        skill
                                                    )}
                                                </strong>
                                            </div>

                                            {getSkillLevel(
                                                skill
                                            ) && (
                                                <span className="skill-level">
                                                    {
                                                        getSkillLevel(
                                                            skill
                                                        )
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    )
                                )
                            ) : (
                                <p className="empty-message">
                                    No matching skills found.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="skills-section">
                        <div className="section-heading">
                            <div>
                                <span className="section-label">
                                    AREAS TO IMPROVE
                                </span>

                                <h2>
                                    Missing Skills
                                </h2>
                            </div>

                            <span className="badge badge-danger">
                                {missingSkills.length} MISSING
                            </span>
                        </div>

                        <div className="skill-analysis-list">
                            {missingSkills.length > 0 ? (
                                missingSkills.map(
                                    (skill, index) => (
                                        <div
                                            className="skill-analysis-row missing-row"
                                            key={
                                                skill?._id ||
                                                skill?.id ||
                                                index
                                            }
                                        >
                                            <div className="skill-row-name">
                                                <span className="skill-cross">
                                                    !
                                                </span>

                                                <strong>
                                                    {getSkillName(
                                                        skill
                                                    )}
                                                </strong>
                                            </div>

                                            {getSkillLevel(
                                                skill
                                            ) && (
                                                <span className="skill-level missing-level">
                                                    {
                                                        getSkillLevel(
                                                            skill
                                                        )
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    )
                                )
                            ) : (
                                <div className="success-message">
                                    🎉 You have all the required
                                    skills for this role!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
export default Resume;