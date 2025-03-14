import type { Question } from "@/types";

const categories = [
  "Theology (big questions about existence, religious insights, Christianity, Desert Fathers, OT/NT)",
  "Concepts, ideas, and history (surprising facts about history, concepts, and ideas)",
  "Philosophy (phenomenological, existential, the transcendentals, beauty)",
  "Music theory (surprising facts about music, composers, and history)",
  "Photography, film, and television (surprising facts about photography, film, and television)",
  "Internet and social media (surprising facts about the internet, social media, and online culture)",
  "Programming and computer science (surprising facts about programming, computer science, and technology)",
  "Art and literature (surprising facts about masterpieces, writers' lives)",
  "Science (cutting-edge discoveries, counterintuitive findings)",
  "Technology (inventions that changed history, unusual tech facts)",
];

export async function generateQuestions(count = 4): Promise<Question[]> {
  const batchSize = Math.max(6, count); // Generate a few extra for the pool
  
  const prompt = `Create ${batchSize} genuinely interesting and thought-provoking trivia questions that will surprise and engage users.

Make questions fun, unusual, and thought-provoking - AVOID basic facts that everyone knows.
IMPORTANT: ONLY create questions from the ACTIVE categories below (ignore any commented categories):
${categories.filter(cat => !cat.startsWith('//'))
    .map(category => `- ${category.trim()}`)
    .join('\n')}

Each question MUST be:
1. Novel and surprising - something most people wouldn't know
2. Intellectually engaging - makes people think "wow, that's interesting!"
3. Well-structured with 4 plausible options (only ONE correct)
4. AVOID answer giveaways in the question text:
   - Don't use gendered pronouns (he/she) if the answer is about a person
   - Don't include the answer word in the question
   - Don't use obvious hints that eliminate options
   - Make all options equally plausible at first glance

The response will be automatically formatted as JSON with the specified schema.`;

  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key not found in environment variables");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          // temperature: 0.5,
          // topK: 40,
          // topP: 0.95,
          response_mime_type: "application/json",
          response_schema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                text: { type: "STRING" },
                options: {
                  type: "ARRAY",
                  minItems: 4,
                  maxItems: 4,
                  items: {
                    type: "OBJECT",
                    properties: {
                      text: { type: "STRING" },
                      isCorrect: { type: "BOOLEAN" }
                    },
                    required: ["text", "isCorrect"]
                  }
                }
              },
              required: ["text", "options"]
            },
            minItems: 1,
            maxItems: batchSize
          }
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
    throw new Error("Invalid API response format");
  }
  
  const content = result.candidates[0].content;
  if (!content.parts || !content.parts[0]) {
    throw new Error("No content parts in API response");
  }

  const text = content.parts[0].text.trim();
  let parsedData: Array<{text: string, options: Array<{text: string, isCorrect: boolean}>}>;
  
  console.log(text);

  try {
    parsedData = JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse API response:', error);
    throw new Error('Invalid JSON response from API');
  }
  
  // Validate question format
  const validQuestions = parsedData.filter(q => 
    q?.text && 
    Array.isArray(q?.options) && 
    q?.options.length === 4 &&
    q?.options.filter((o: {isCorrect: boolean}) => o?.isCorrect).length === 1
  );
  
  if (validQuestions.length === 0) {
    throw new Error('No valid questions in the response');
  }
  
  // Map the questions to our format with IDs
  const newQuestions: Question[] = validQuestions.map((q, qIndex) => {
    const timestamp = Date.now().toString(36).slice(-4);
    const uniqueId = `gq${timestamp}_${qIndex}`;
    
    return {
      id: uniqueId,
      text: q.text,
      options: q.options.map((o, oIndex) => {
        const optionLetter = String.fromCharCode(65 + oIndex);
        return {
          id: `${uniqueId}_${optionLetter}`,
          text: o.text,
          isCorrect: o.isCorrect,
        };
      }),
      isDemo: false,
    };
  });
  
  return newQuestions;
} 