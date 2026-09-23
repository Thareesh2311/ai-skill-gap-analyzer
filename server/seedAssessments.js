require("dotenv").config();

const mongoose = require("mongoose");

const Skill = require("./models/Skill");
const Question = require("./models/Question");

const questions = require("../data/assessmentQuestions.json");


/* =====================================================
   SEED MCQ QUESTIONS
===================================================== */

const seedQuestions = async () => {

    try {

        /* =================================================
           CONNECT DATABASE
        ================================================= */

        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log("====================================");
        console.log("MongoDB connected");
        console.log("====================================");


        /* =================================================
           REMOVE OLD QUESTIONS
        ================================================= */

        await Question.deleteMany({});

        console.log(
            "Old assessment questions removed"
        );


        /* =================================================
           VALIDATE JSON
        ================================================= */

        if (!Array.isArray(questions)) {

            throw new Error(
                "assessmentQuestions.json must contain an array"
            );

        }


        console.log(
            `Found ${questions.length} MCQ questions in JSON`
        );


        /* =================================================
           SEED QUESTIONS
        ================================================= */

        let insertedCount = 0;
        let skippedCount = 0;


        for (const item of questions) {

            /* =============================================
               VALIDATE QUESTION
            ============================================= */

            if (
                !item.skill ||
                !item.question ||
                !Array.isArray(item.options)
            ) {

                console.log(
                    "Skipping invalid question:",
                    item
                );

                skippedCount++;

                continue;
            }


            /* =============================================
               FIND SKILL
            ============================================= */

            const skill =
                await Skill.findOne({
                    name: {
                        $regex:
                            `^${escapeRegex(item.skill.trim())}$`,
                        $options: "i"
                    }
                });


            /* =============================================
               SKILL NOT FOUND
            ============================================= */

            if (!skill) {

                console.log(
                    `❌ Skill not found: "${item.skill}"`
                );

                skippedCount++;

                continue;
            }


            /* =============================================
               CREATE QUESTION
            ============================================= */

            await Question.create({

                skill: skill._id,

                type: "mcq",

                difficulty:
                    item.difficulty || "beginner",

                question:
                    item.question,

                options:
                    item.options,

                correctAnswer:
                    Number(item.correctAnswer),

                explanation:
                    item.explanation || "",

                points:
                    Number(item.points) || 1,

                /*
                 * IMPORTANT
                 *
                 * Your assessmentController searches:
                 *
                 * isActive: true
                 *
                 * Therefore this MUST be true.
                 */

                isActive: true

            });


            insertedCount++;


            console.log(
                `✅ MCQ added: ${item.skill} - ${item.question}`
            );

        }


        /* =================================================
           FINAL RESULT
        ================================================= */

        console.log("");
        console.log("====================================");
        console.log("MCQ SEEDING COMPLETE");
        console.log("====================================");

        console.log(
            `Inserted: ${insertedCount}`
        );

        console.log(
            `Skipped: ${skippedCount}`
        );

        console.log(
            `Total JSON questions: ${questions.length}`
        );

        console.log("====================================");


        process.exit(0);


    } catch (error) {

        console.error("");
        console.error(
            "❌ MCQ SEED ERROR:"
        );

        console.error(
            error
        );

        console.error(
            error.message
        );

        process.exit(1);

    }

};


/* =====================================================
   REGEX ESCAPE HELPER
===================================================== */

function escapeRegex(value) {

    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

}


/* =====================================================
   START
===================================================== */

seedQuestions();