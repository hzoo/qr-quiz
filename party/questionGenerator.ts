import type { Question } from "@/types";

const categories = [
  "Systems Thinking & Design (patterns that connect, wholeness, living structures, design principles)",
  "Urban Ecology & Community (convivial tools, human scale, vernacular knowledge, neighborhood wisdom)",
  "Theology & Spirituality (existential questions, religious insights, contemplative traditions, mysticism)",
  "Cultural Anthropology (surprising cultural practices, rituals, social phenomena across civilizations)",
  "Philosophy & Ethics (existential insights, moral dilemmas, thought experiments, paradoxes)",
  "History's Turning Points (overlooked moments that changed everything, historical ironies)",
  "Music & Sound Theory (surprising acoustics, composition techniques, musical innovations)",
  "Visual Arts & Design (unexpected influences, techniques that revolutionized perception)",
  "Digital Culture (internet history, meme evolution, virtual communities, digital anthropology)",
  "Programming Philosophy (conceptual breakthroughs, elegant solutions, computational thinking)",
  "Literary Secrets (hidden meanings, author lives, unexpected connections between works)",
  "Scientific Paradigm Shifts (discoveries that changed worldviews, counterintuitive findings)",
  "Technology & Society (inventions that transformed human behavior, ethical intersections)",
  "Cognitive Science (how humans think, perceive, decide, and create meaning)",
  "Cross-Disciplinary Connections (where art meets science, theology meets technology, etc)",
  "Ancient Knowledge & Modern Discoveries (old wisdom validated by new research)",
  "Information Encoding & Semiotics (symbols, signs, language, visual communication)",
  // "QR History & Evolution (predecessors, competitors, technical origins, cultural adoption)",
  "Protocol Design & Technical Elegance (simple solutions to complex problems, elegant encoding)",
  "Visual Data & Information Art (data visualization, aesthetic encoding, visual communication)",
  "Cross-Disciplinary Connections (where art meets technology, community meets code, design meets ethics)",
];

export async function generateQuestions(count = 4): Promise<Question[]> {
  const batchSize = Math.max(6, count);
  
  const prompt = `Create ${batchSize} intellectually stimulating trivia questions that blend curiosity and insight.

ACTIVE CATEGORIES:
${categories.filter(cat => !cat.startsWith('//'))
    .map(category => `- ${category.trim()}`)
    .join('\n')}

QUESTION GUIDELINES:
1. Include questions across the spectrum from accessible to challenging, with most questions being moderately challenging
2. Create "aha moment" questions where the answer reveals an unexpected connection or insight
3. Bridge 2+ categories in at least half of the questions (e.g., theology meets art)
4. Include questions with subtle historical ironies, paradoxes, or pattern-breaking examples
5. Include some questions related to visual encoding, information display, and the interaction between technology and society (just a few because the trivia is being done at a QR show but just as a nod, not a lot)
6. Aim for timeless questions rather than trending topics (though very recent stuff is fine)

BALANCE:
- Include a mix of questions: 20% accessible, 60% moderately challenging, 20% specialist-level
- Some questions can be playful or surprising while others more intellectually rigorous
- Balance historical knowledge with conceptual understanding questions
- Include both technological details and human/societal impact questions

FOR EACH QUESTION:
- Make sure it passes the "that's interesting!" test - would someone want to share this fact?
- Include exactly 4 options with only ONE correct answer
- Craft wrong answers that are plausible but clearly incorrect to someone who knows the topic
- Don't include obvious hints or gendered pronouns that give away the answer
- For questions about QR codes/encoding, consider how they might relate to broader ideas about communication, design, and community (just as a nod to the theme, not a lot of questions)

The response must be valid JSON with the specified schema.`;

  const apiKey = process.env.GEMINI_API_KEY;
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
                  items: {
                    type: "OBJECT",
                    properties: {
                      text: { type: "STRING" },
                      isCorrect: { type: "BOOLEAN" }
                    },
                    required: ["text"]
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
    };
  });
  
  return newQuestions;
} 