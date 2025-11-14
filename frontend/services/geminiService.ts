import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { StudyMode } from '../types';

const getStudyGuideStream = async (topic: string, mode: StudyMode): Promise<AsyncGenerator<GenerateContentResponse>> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let prompt: string;
  let responseSchema: object;

  if (mode === 'math') {
    prompt = `You are a quantitative reasoning assistant. Generate one challenging quantitative or logic question related to the topic: "${topic}". Provide a clear question, the final answer, and a step-by-step explanation for how to solve it. Ensure the output is a valid, parseable JSON object matching the provided schema.`;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING, description: 'The quantitative/logic question.' },
        answer: { type: Type.STRING, description: 'The final correct answer.' },
        explanation: { type: Type.STRING, description: 'A detailed, step-by-step explanation of the solution.' },
      },
      required: ['question', 'answer', 'explanation'],
    };
  } else {
    prompt = `You are an intelligent study assistant. For the topic "${topic}", perform these tasks:
1. **Summarize** in exactly 3 short bullet points (under 20 words each).
2. **Generate 3 multiple-choice quiz questions**, each with 4 options (A, B, C, D), a correct answer letter, and a 1-line explanation.
3. **Provide one personalized study tip** (1-2 sentences).
4. **Create 3 flashcards**, each with a "front" (a term or question) and a "back" (the definition or answer).
Output your response strictly in the valid JSON format defined by the schema. Do not include any markdown, backticks, or other text outside the JSON object.`;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.ARRAY,
          description: '3 short bullet points summarizing the topic.',
          items: { type: Type.STRING },
        },
        quiz: {
          type: Type.ARRAY,
          description: '3 multiple-choice quiz questions.',
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              answer: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ['question', 'options', 'answer', 'explanation'],
          },
        },
        studyTip: {
          type: Type.STRING,
          description: 'A personalized study tip.',
        },
        flashcards: {
          type: Type.ARRAY,
          description: '3 flashcards with a front and a back.',
          items: {
              type: Type.OBJECT,
              properties: {
                  front: { type: Type.STRING, description: "The front side of the flashcard (term/question)." },
                  back: { type: Type.STRING, description: "The back side of the flashcard (definition/answer)." },
              },
              required: ['front', 'back'],
          }
        }
      },
      required: ['summary', 'quiz', 'studyTip', 'flashcards'],
    };
  }
  
  try {
    const stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });
    return stream;
  } catch (error) {
    console.error("Error fetching study guide stream from Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate study guide: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching the study guide.");
  }
};

export default getStudyGuideStream;
