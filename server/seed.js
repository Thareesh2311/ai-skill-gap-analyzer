const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const Company = require("./models/company");
const JobRole = require("./models/JobRole");
const Skill = require("./models/Skill");
const JobRequirement = require("./models/JobRequirement");

const connectDB = require("./config/db");

const loadJSON = (fileName) => {
    const filePath = path.join(
        __dirname,
        "..",
        "data",
        fileName
    );

    return JSON.parse(
        fs.readFileSync(filePath, "utf-8")
    );
};

const seedDatabase = async () => {
    try {
        await connectDB();

        console.log("Clearing existing data...");

        await Company.deleteMany({});
        await JobRole.deleteMany({});
        await Skill.deleteMany({});
        await JobRequirement.deleteMany({});

        console.log("Existing data cleared.");

        const companiesData =
            loadJSON("companies.json");

        const rolesData =
            loadJSON("roles.json");

        const skillsData =
            loadJSON("skills.json");

        const requirementsData =
            loadJSON("job_requirements.json");

        const companies =
            await Company.insertMany(companiesData);

        console.log(
            `${companies.length} companies inserted.`
        );

        const roles =
            await JobRole.insertMany(rolesData);

        console.log(
            `${roles.length} job roles inserted.`
        );

        const skills =
            await Skill.insertMany(skillsData);

        console.log(
            `${skills.length} skills inserted.`
        );

        const companyMap = new Map();

        companies.forEach((company) => {
            companyMap.set(
                company.name,
                company._id
            );
        });

        const roleMap = new Map();

        roles.forEach((role) => {
            roleMap.set(
                role.name,
                role._id
            );
        });

        const skillMap = new Map();

        skills.forEach((skill) => {
            skillMap.set(
                skill.name,
                skill._id
            );
        });

        const jobRequirements = [];

        for (const requirement of requirementsData) {
            const companyId =
                companyMap.get(requirement.company);

            const roleId =
                roleMap.get(requirement.role);

            if (!companyId || !roleId) {
                console.log(
                    "Skipping invalid company/role:",
                    requirement
                );

                continue;
            }

            for (const item of requirement.skills) {
                const skillId =
                    skillMap.get(item.name);

                if (!skillId) {
                    console.log(
                        "Skill not found:",
                        item.name
                    );

                    continue;
                }

                jobRequirements.push({
                    company: companyId,
                    role: roleId,
                    skill: skillId,
                    importance: item.importance,
                    requiredLevel:
                        item.requiredLevel ||
                        "Intermediate"
                });
            }
        }

        await JobRequirement.insertMany(
            jobRequirements
        );

        console.log(
            `${jobRequirements.length} job requirements inserted.`
        );

        console.log(
            "Database seeded successfully 🚀"
        );

        process.exit(0);
    } catch (error) {
        console.error(
            "Database seeding failed:",
            error
        );

        process.exit(1);
    }
};

seedDatabase();