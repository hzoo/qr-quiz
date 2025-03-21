import type { Question } from "@/types";

const categories = [
  "Systems Thinking & Design (patterns that connect, wholeness, living structures, design principles)",
  "Urban Ecology & Community (concepts related to but not specifically about James Scott, Jane Jacobs, Marshall McLuhan, Ivan Illich, etc.)",
  "Cultural Anthropology (surprising cultural practices, rituals, social phenomena across civilizations)",
  "Theology & Spirituality (existential questions, religious liturgy, contemplative practices)",
  "Religious Texts (history, known stories, characters, ideas)",
  "Philosophy & Ethics (existential insights, moral dilemmas, thought experiments, paradoxes)",
  "History's Turning Points (overlooked moments that changed everything, historical ironies)",
  "Music & Sound Theory (surprising acoustics, composition techniques, musical innovations)",
  "Visual Arts & Design (unexpected influences, techniques that revolutionized perception)",
  "Digital Culture (internet history, meme evolution, virtual communities, digital anthropology)",
  "Programming Languages & Paradigms (language design, compiler theory, type systems, runtime environments)",
  "Computer Science Theory (algorithmic complexity, formal verification, concurrency models)",
  "Literary Secrets (hidden meanings, author lives, unexpected connections between works)",
  "Scientific Paradigm Shifts (discoveries that changed worldviews, counterintuitive findings)",
  "Technology & Society (inventions that transformed human behavior, ethical intersections)",
  "Cognitive Science (how humans think, perceive, decide, and create meaning)",
  "Ancient Knowledge & Modern Discoveries (old wisdom validated by new research)",
  "Information Encoding & Cryptography (encoding schemes, error correction, security principles)",
  "Protocol Design & Technical Standards (TCP/IP, HTTP, WebRTC, technical evolution)",
  "Visual Data & Information Art (data visualization, aesthetic encoding, visual communication)",
  "Open Source Communities (governance models, notable projects, community dynamics)",
  "Classic Papers (essays, papers, books, blogs, tweets that change various fields of study, like Programming as Theory Building)",
  "Hardware Hacking & Physical Computing (Arduino, sensors, IoT, circuit design)",
  "Artificial Intelligence (LLMs, Base Models, AI history, ethical considerations, future scenarios, creative applications)",
  "Cross-Disciplinary Connections (where art meets technology, community meets code, design meets ethics)",
];

export async function generateQuestions(count: number): Promise<Question[]> {
  const batchSize = Math.max(6, count);
  
  const prompt = `Create ${batchSize} intellectually stimulating trivia questions that blend curiosity and insight for an art/tech audience at the Recurse Center in NYC.

ACTIVE CATEGORIES:
${categories.filter(cat => !cat.startsWith('//'))
    .map(category => `- ${category.trim()}`)
    .join('\n')}

QUESTION GUIDELINES:
1. Include a spectrum of questions from accessible to challenging, with tech-focused questions being notably more advanced
2. Include "aha moment" questions where the answer reveals an unexpected connection or insight
3. Bridge 2+ categories in some of the questions (e.g. theology meets music)
4. Include questions with subtle historical ironies, paradoxes, or pattern-breaking examples
5. Include a smidge of questions related to visual encoding, QR codes, and information display as a nod to the exhibition theme
6. Aim for timeless questions rather than trending topics (though recent developments are welcome)
7. Include questions that would resonate with the local NYC tech/art community (Recurse Center, School of Poetic Computation, NYU ITP)
8. For each batch, ensure questions span different categories to maintain diversity

KNOWLEDGE & LEARNING APPROACH:
- Design questions that test genuine understanding rather than definitional knowledge
- Avoid simple definition-based questions (like "What is X?" → "X is a thing that...")
- Create questions where learning the answer teaches something valuable or surprising
- Questions should prompt curiosity or reveal hidden connections between concepts
- Favor questions that illuminate deeper principles over surface-level facts

FOR EACH QUESTION:
- Craft wrong answers that would tempt even knowledgeable participants and require genuine understanding to eliminate
- All answer choices should seem plausible and be in the same conceptual neighborhood as the correct answer
- Wrong answers should often contain a grain of truth but miss a crucial detail or connection
- Don't include obvious hints in the question that give away the answer
- Avoid questions where the answer is essentially restating the question's terms (e.g., "Q: What is functional programming? A: Programming that uses functions")
- Questions should pass both an "that's interesting!" test OR a "I learned something" test
- Include exactly 4 options with only ONE correct answer

WRONG ANSWER QUALITY CRITERIA:
- Each wrong answer should be thoughtfully constructed, not just random alternatives
- Wrong answers should often represent common misconceptions or close-but-not-quite-right understanding
- Avoid obviously incorrect options that anyone with basic knowledge could eliminate
- The difference between right and wrong answers should often hinge on nuance or precise understanding

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
          // temperature: 0.7,
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