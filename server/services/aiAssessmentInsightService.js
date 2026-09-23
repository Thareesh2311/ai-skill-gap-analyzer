/*
============================================================
AI ASSESSMENT INSIGHT SERVICE
============================================================

Node.js → FastAPI → Ollama

This service does NOT score answers.

It only generates explanations using already verified
assessment metrics.
============================================================
*/


const AI_SERVICE_URL =
    process.env.AI_SERVICE_URL ||
    "http://127.0.0.1:8000";


/*
============================================================
GENERATE AI INSIGHT
============================================================
*/

const generateAssessmentAIInsight =
    async (payload = {}) => {

        const controller =
            new AbortController();


        /*
        --------------------------------------------------------
        AI timeout

        Result page should not hang forever if
        FastAPI / Ollama is unavailable.
        --------------------------------------------------------
        */

        const timeout =
            setTimeout(
                () => {
                    controller.abort();
                },
                20000
            );


        try {

            const response =
                await fetch(
                    `${AI_SERVICE_URL}/assessment-insights`,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            ),

                        signal:
                            controller.signal
                    }
                );


            if (!response.ok) {

                const errorText =
                    await response.text();


                throw new Error(
                    `AI service returned ${response.status}: ${errorText}`
                );
            }


            const result =
                await response.json();


            if (
                !result?.success ||
                !result?.data
            ) {

                throw new Error(
                    "Invalid AI insight response."
                );
            }


            return {
                ...result.data,

                source:
                    result.source ||
                    "ollama",

                model:
                    result.model ||
                    ""
            };


        } catch (error) {

            /*
            --------------------------------------------------------
            AI failure must NOT break assessment results.
            --------------------------------------------------------
            */

            console.error(
                "AI assessment insight unavailable:",
                error.message
            );


            return null;


        } finally {

            clearTimeout(
                timeout
            );
        }
    };


module.exports = {
    generateAssessmentAIInsight
};