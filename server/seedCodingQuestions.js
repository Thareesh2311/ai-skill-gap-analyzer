const mongoose = require("mongoose");
require("dotenv").config();

const CodingQuestion = require("./models/CodingQuestion");
const Skill = require("./models/Skill");
const codingQuestions = require("../data/codingQuestions.json");

const normalize = (value) =>
    String(value || "")
        .trim()
        .toLowerCase();

const normalizeLanguage = (value) => {
    const language = normalize(value);

    if (["python", "py", "python3"].includes(language)) {
        return "python";
    }

    if (["javascript", "js", "node", "nodejs"].includes(language)) {
        return "javascript";
    }

    if (language === "java") {
        return "java";
    }

    return language;
};

async function seedCodingQuestions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected successfully");

        const skills = await Skill.find({
            isActive: true
        }).lean();

        console.log(`Found ${skills.length} active skills`);

        await CodingQuestion.deleteMany({});
        console.log("Old coding questions removed");

        const questions = [];

        for (const item of codingQuestions) {
            const requestedSkill = normalize(item.skill);

            const skill = skills.find(
                (databaseSkill) =>
                    normalize(databaseSkill.name) === requestedSkill
            );

            if (!skill) {
                console.warn(
                    `⚠️ Skill not found: ${item.skill}`
                );
                continue;
            }

            const language = normalizeLanguage(
                item.language || item.skill
            );

            if (!["python", "javascript", "java"].includes(language)) {
                console.warn(
                    `⚠️ Unsupported coding language for ${item.title}: ${language}`
                );
                continue;
            }

            questions.push({
                skill: skill._id,
                type: "coding",
                difficulty: item.difficulty,
                title: item.title,
                description: item.description,
                inputFormat: item.inputFormat || "",
                outputFormat: item.outputFormat || "",
                constraints: item.constraints || "",
                sampleInput: item.sampleInput || "",
                sampleOutput: item.sampleOutput || "",
                starterCode: item.starterCode || "",
                language,
                runnerCode: item.runnerCode || "",
                testCases: Array.isArray(item.testCases)
                    ? item.testCases
                    : [],
                points: Number(item.points || 10),
                isActive: true
            });

            console.log(
                `✓ Prepared: ${item.title} → ${skill.name} (${language})`
            );
        }

        if (questions.length === 0) {
            console.error("\n❌ No coding questions were prepared.");
            console.error(
                "Check whether the skills in codingQuestions.json exist in the Skill collection."
            );
            process.exit(1);
        }

        const insertedQuestions =
            await CodingQuestion.insertMany(questions);

        console.log(
            `\n✅ ${insertedQuestions.length} coding questions seeded successfully`
        );

        console.log("\nCoding question summary:");
        insertedQuestions.forEach((question) => {
            console.log(
                `- ${question.title} [${question.language}]`
            );
        });

        console.log("\nQuestion IDs:");
        insertedQuestions.forEach((question) => {
            console.log(question._id.toString());
        });

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Coding seed error:");
        console.error(error);

        try {
            await mongoose.connection.close();
        } catch (closeError) {
            console.error(
                "Database close error:",
                closeError.message
            );
        }

        process.exit(1);
    }
}

seedCodingQuestions();
