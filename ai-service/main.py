from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, List
import httpx
import json
import os
app = FastAPI(
    title="AI Skill Gap Analyzer",
    description="NLP and AI service for skill gap analysis",
    version="2.0.0"
)
OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://127.0.0.1:11434"
)
OLLAMA_MODEL = os.getenv(
    "OLLAMA_MODEL",
    "gemma:2b"
)
class AssessmentInsightRequest(BaseModel):
    assessmentType: str = "coding"
    percentage: float = 0
    jobReadiness: Dict[str, Any] = Field(
        default_factory=dict
    )
    codingPerformance: Dict[str, Any] = Field(
        default_factory=dict
    )
    skillPerformance: List[Dict[str, Any]] = Field(
        default_factory=list
    )
    weakSkillAnalysis: Dict[str, Any] = Field(
        default_factory=dict
    )
@app.get("/")
def home():

    return {
        "message": "AI Skill Gap Analyzer service is running 🚀"
    }
@app.get("/health")
def health():

    return {
        "status": "success",
        "service": "AI NLP Service",
        "ollamaModel": OLLAMA_MODEL
    }
def extract_json(text: str):
    if not text:
        raise ValueError(
            "AI returned an empty response."
        )
    cleaned = text.strip()
    cleaned = cleaned.replace(
        "```json",
        ""
    )
    cleaned = cleaned.replace(
        "```",
        ""
    )
    cleaned = cleaned.strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1:
            raise ValueError(
                "AI response did not contain valid JSON."
            )
        json_part = cleaned[
            start:end + 1
        ]
        return json.loads(
            json_part
        )
async def call_ollama(prompt: str):
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.2
        }
    }
    async with httpx.AsyncClient(
        timeout=60.0
    ) as client:
        response = await client.post(
            f"{OLLAMA_URL}/api/generate",
            json=payload
        )
        response.raise_for_status()
        result = response.json()
        ai_text = result.get(
            "response",
            ""
        )
        return extract_json(
            ai_text
        )
@app.post("/assessment-insights")
async def assessment_insights(
    request: AssessmentInsightRequest
):
    data = request.model_dump()
    prompt = f"""
You are an AI technical assessment coach.

Analyze ONLY the verified assessment metrics provided below.

Do not invent:
- test results
- skills
- scores
- percentages
- programming ability
- job-readiness values

The assessment execution engine has already evaluated the
candidate's code. Your job is only to explain the verified
results clearly.

ASSESSMENT DATA:

{json.dumps(data, indent=2)}

Return ONLY valid JSON using this exact structure:

{{
    "summary": "2-4 sentence professional explanation",

    "strengths": [
        {{
            "skill": "skill name",
            "score": 0,
            "message": "short explanation"
        }}
    ],

    "improvements": [
        {{
            "skill": "skill name",
            "score": 0,
            "message": "short improvement explanation"
        }}
    ],

    "codingAnalysis": {{
        "testCaseInsight": "short explanation",
        "problemSolvingInsight": "short explanation",
        "executionInsight": "short explanation"
    }},

    "recommendations": [
        "specific recommendation",
        "specific recommendation",
        "specific recommendation"
    ],

    "nextAction": "one clear next action"
}}

Rules:

1. Do not claim a skill exists unless it is included
   in skillPerformance.

2. Use percentages exactly as supplied.

3. Do not say code is efficient only from execution time.

4. If data is insufficient, explicitly say so.

5. Keep explanations concise and useful.

6. Maximum 5 strengths.

7. Maximum 5 improvements.

8. Maximum 5 recommendations.
"""
    try:
        result = await call_ollama(
            prompt
        )
        return {
            "success": True,
            "source": "ollama",
            "model": OLLAMA_MODEL,
            "data": {
                "summary":
                    result.get(
                        "summary",
                        ""
                    ),
                "strengths":
                    result.get(
                        "strengths",
                        []
                    ),
                "improvements":
                    result.get(
                        "improvements",
                        []
                    ),
                "codingAnalysis":
                    result.get(
                        "codingAnalysis",
                        {}
                    ),
                "recommendations":
                    result.get(
                        "recommendations",
                        []
                    ),
                "nextAction":
                    result.get(
                        "nextAction",
                        ""
                    )
            }
        }
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail=(
                "Unable to connect to Ollama. "
                "Make sure Ollama is running."
            )
        )
    except httpx.HTTPStatusError as error:
        raise HTTPException(
            status_code=502,
            detail=(
                f"Ollama request failed: "
                f"{error.response.text}"
            )
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )