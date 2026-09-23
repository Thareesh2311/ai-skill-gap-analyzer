const mongoose = require("mongoose");

require("dotenv").config();


const SQLQuestion =
    require("./models/SQLQuestion");

const Skill =
    require("./models/Skill");


const sqlQuestions =
    require("../data/sqlQuestions.json");


/*
============================================================
SEED SQL QUESTIONS
============================================================
*/

async function seedSQLQuestions() {

    try {

        /*
        ========================================================
        CONNECT DATABASE
        ========================================================
        */

        await mongoose.connect(
            process.env.MONGODB_URI
        );


        console.log(
            "MongoDB connected"
        );


        /*
        ========================================================
        LOAD CURRENT SKILLS
        ========================================================

        Important:

        SQL questions must reference CURRENT Skill ObjectIds.

        This avoids stale ObjectIds after the main seed script
        recreates the Skill collection.
        ========================================================
        */

        const skills =
            await Skill.find({})
                .lean();


        const skillMap =
            new Map();


        skills.forEach(
            (skill) => {

                if (
                    skill?.name
                ) {

                    skillMap.set(

                        String(
                            skill.name
                        )
                            .trim()
                            .toLowerCase(),

                        skill
                    );
                }
            }
        );


        console.log(
            "Available skills:",
            skills.map(
                (skill) =>
                    skill.name
            )
        );


        /*
        ========================================================
        REMOVE OLD SQL QUESTIONS
        ========================================================
        */

        await SQLQuestion.deleteMany(
            {}
        );


        console.log(
            "Old SQL questions removed"
        );


        /*
        ========================================================
        BUILD QUESTIONS
        ========================================================
        */

        const questions =
            [];


        for (
            const item
            of sqlQuestions
        ) {

            /*
            --------------------------------------------------------
            FIND SKILL
            --------------------------------------------------------
            */

            const skillName =
                String(
                    item?.skill ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            const skill =
                skillMap.get(
                    skillName
                );


            if (!skill) {

                console.log(
                    `Skill not found: ${item.skill}`
                );

                continue;
            }


            /*
            --------------------------------------------------------
            TEST CASES
            --------------------------------------------------------
            */

            const rawTestCases =
                Array.isArray(
                    item?.testCases
                )
                    ? item.testCases
                    : [];


            if (
                rawTestCases.length ===
                0
            ) {

                console.log(
                    `Skipping SQL question "${item.title}" because it has no test cases.`
                );

                continue;
            }


            const testCases =
                rawTestCases.map(
                    (
                        testCase,
                        index
                    ) => {

                        const schema =
                            String(
                                testCase
                                    ?.schema ||
                                ""
                            );


                        if (
                            !schema.trim()
                        ) {

                            throw new Error(
                                `SQL question "${item.title}" test case ${index + 1} has no schema.`
                            );
                        }


                        return {

                            schema,

                            sampleData:
                                String(
                                    testCase
                                        ?.sampleData ||
                                    ""
                                ),

                            expectedResult:
                                testCase
                                    ?.expectedResult ??
                                [],


                            /*
                            All evaluation cases remain protected.

                            The first test database is also copied
                            to the public question.schema/sampleData
                            fields below for Run Query.
                            */

                            isHidden:
                                testCase
                                    ?.isHidden !==
                                undefined

                                    ? Boolean(
                                        testCase
                                            .isHidden
                                    )

                                    : true
                        };
                    }
                );


            /*
            --------------------------------------------------------
            PUBLIC SAMPLE DATABASE
            --------------------------------------------------------

            Run Query needs:

                question.schema
                question.sampleData

            Your JSON currently stores these inside the first
            test case, so use the first test case as the public
            sample database.

            expectedResult remains server-only.
            --------------------------------------------------------
            */

            const publicTestCase =
                testCases[0];


            /*
            --------------------------------------------------------
            CREATE DOCUMENT
            --------------------------------------------------------
            */

            questions.push({

                skill:
                    skill._id,

                type:
                    "sql",

                difficulty:
                    item.difficulty,

                title:
                    item.title,

                description:
                    item.description,


                /*
                Public Run Query database
                */

                schema:
                    item.schema ||
                    publicTestCase.schema ||
                    "",

                sampleData:
                    item.sampleData ||
                    publicTestCase.sampleData ||
                    "",


                /*
                Legacy support

                Hidden by select:false in SQLQuestion model.
                */

                expectedQueryResult:
                    item.expectedQueryResult ??
                    publicTestCase.expectedResult ??
                    [],


                /*
                Final evaluation tests
                */

                testCases,


                points:
                    Number(
                        item.points
                    ) ||
                    10,

                isActive:
                    true
            });
        }


        /*
        ========================================================
        INSERT
        ========================================================
        */

        if (
            questions.length ===
            0
        ) {

            console.log(
                "No SQL questions could be created."
            );

            console.log(
                "Check that the SQL skill exists in the skills collection."
            );


            await mongoose.disconnect();


            process.exit(
                1
            );
        }


        const inserted =
            await SQLQuestion.insertMany(
                questions
            );


        /*
        ========================================================
        SUMMARY
        ========================================================
        */

        console.log(
            "======================================"
        );

        console.log(
            `${inserted.length} SQL questions seeded successfully`
        );


        inserted.forEach(
            (
                question,
                index
            ) => {

                console.log(
                    `${index + 1}. ${question.title}`
                );
            }
        );


        console.log(
            "======================================"
        );


        await mongoose.disconnect();


        process.exit(
            0
        );


    } catch (error) {

        console.error(
            "SQL seed error:",
            error
        );


        try {

            await mongoose.disconnect();

        } catch (
            disconnectError
        ) {

            console.error(
                "MongoDB disconnect error:",
                disconnectError.message
            );
        }


        process.exit(
            1
        );
    }
}


seedSQLQuestions();