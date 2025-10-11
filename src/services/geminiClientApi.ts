// Client-side Gemini API integration (no server needed)
import axios from 'axios';

interface SmartFeedbackRequest {
  goalText: string;
  apiKey: string;
  context?: any;
}

interface SmartFeedbackResponse {
  feedback: string;
  provider: string;
  error?: string;
}

// Fallback feedback when API fails
function generateFallbackFeedback(goalText: string): string {
  const feedback = [];
  const goal = goalText.toLowerCase();

  // Check for SMART criteria basics
  if (!goal.includes('complete') && !goal.includes('finish') && !goal.includes('build') && !goal.includes('create')) {
    feedback.push("Consider making your goal more action-oriented with specific outcomes.");
  }

  if (!goal.includes('hour') && !goal.includes('minute') && !goal.includes('page') && !/\d+/.test(goal)) {
    feedback.push("Add measurable criteria to track your progress.");
  }

  // Add some helpful questions
  feedback.push("• What specific steps will you take to achieve this?");
  feedback.push("• How will you know when you've completed it?");
  feedback.push("• What resources or help do you need?");

  return feedback.join('\n\n');
}

export async function getSmartFeedback({
  goalText,
  apiKey,
  context
}: SmartFeedbackRequest): Promise<SmartFeedbackResponse> {

  if (!goalText) {
    throw new Error('Goal text is required');
  }

  // If no API key, use fallback immediately
  if (!apiKey) {
    return {
      feedback: generateFallbackFeedback(goalText),
      provider: 'fallback',
      error: 'No API key provided'
    };
  }

  // Basic validation of API key format
  if (!apiKey.startsWith('AIza') || apiKey.length < 20) {
    console.warn('API key format appears invalid');
    return {
      feedback: generateFallbackFeedback(goalText),
      provider: 'fallback',
      error: 'Invalid API key format'
    };
  }

  // Check if it looks like a Firebase API key (but allow Gemini keys which also start with AIzaSy)
  // We'll validate by actually trying the API call instead of prefix checking

  try {
    // Format context similar to server version
    let formattedContext = context || 'No additional context provided.';
    try {
      const ctx = typeof context === 'string' ? JSON.parse(context) : context;
      if (ctx && typeof ctx === 'object') {
        const parts = [];
        if (ctx.phase) parts.push(`- Phase: ${ctx.phase}`);
        if (ctx.topic) parts.push(`- Topic: ${ctx.topic}`);
        if (ctx.description) parts.push(`- Topic Description: ${ctx.description}`);
        if (ctx.keyTags) parts.push(`- Key Tags: ${Array.isArray(ctx.keyTags) ? ctx.keyTags.join(', ') : ctx.keyTags}`);
        if (ctx.deliverable) parts.push(`- Deliverable: ${ctx.deliverable}`);
        formattedContext = parts.join('\n') || formattedContext;
      }
    } catch (e) {
      // leave formattedContext as-is
    }

    const prompt = `You are a supportive senior mentor guiding a first-time learner. Your role is to help the student think, reflect, and improve their goal, not rewrite it or lecture. Responses should be human, critical but gentle, reflective, and slightly playful, with contextual examples if applicable.

Student goal: "${goalText}"
Context:
${formattedContext}

Instructions (Markdown only, ~250 words soft limit):

**INTERNAL RATING: [0-100]** - Start your response with this exact format for parsing, then provide the feedback below. DO NOT include any rating text, numbers, or brackets in the visible feedback content.

Acknowledgment of Positives:

Start with 1–2 sentences highlighting any strengths, creativity, relevance, or SMART elements in the goal. Skip if none.

SMART Analysis:

Evaluate each SMART factor with a brief assessment. Use line breaks for readability.

**Specific:** [1-2 sentences assessing how clear and specific the goal is]

**Measurable:** [1-2 sentences assessing how the goal can be measured/tracked]

**Achievable:** [1-2 sentences assessing if the goal is realistic given resources/time]

**Relevant:** [1-2 sentences assessing if the goal aligns with learning objectives]

**Time-bound:** [1-2 sentences assessing if there's a clear timeframe/deadline]

Critical Feedback & Socratic Questions (no headers):

Integrate 2–3 lines of critical but approachable feedback naturally in flowing sentences.

Ask 3–5 reflective, context-aware, example-driven Socratic questions that make the student pause and think.

Avoid sounding like a lecture; make it human and relatable.

Slight playfulness or references relevant to the goal are welcome.

End with 1 short Hinglish sentence motivating the student to refine and try again. Format this as an emphasized quote.

Constraints:

Do not rewrite the goal.

Keep total feedback under ~250 words, but prioritize clarity and depth over strict brevity.

Make the student clearly understand where they need to reflect and improve.`;

    // Try Gemini API with correct model names
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-pro-latest', 'gemini-flash-latest'];
    let lastError: any = null;

    for (const model of models) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        console.log(`Trying Gemini model: ${model} with endpoint: ${endpoint}`);

        const response = await axios.post(endpoint, {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 600,
            topP: 0.8,
            topK: 10
          }
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000 // 15 second timeout
        });

        console.log(`Gemini model ${model} response:`, response.data);

        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          const feedback = response.data.candidates[0].content.parts[0].text.trim();
          return {
            feedback: feedback,
            provider: 'gemini'
          };
        }
      } catch (error: any) {
        console.warn(`Gemini model ${model} failed:`, error?.response?.status, error?.response?.data);
        lastError = error;
        // Continue to next model
      }
    }

    // If all models failed, throw the last error
    throw lastError || new Error('All Gemini models failed');

  } catch (error) {
    console.warn('Gemini API failed, using fallback:', error);

    // Log more details for debugging
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.warn('API Error Details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        url: axiosError.config?.url
      });
    }

    // Use fallback feedback
    return {
      feedback: generateFallbackFeedback(goalText),
      provider: 'fallback',
      error: error instanceof Error ? error.message : 'API request failed'
    };
  }
}

// Helper function to validate API key
export async function validateGeminiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;

  try {
    // Try multiple models for validation
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-pro-latest', 'gemini-flash-latest'];

    for (const model of models) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await axios.post(endpoint, {
          contents: [{
            parts: [{
              text: 'Say "OK" if you can read this.'
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10
          }
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return true;
        }
      } catch (error) {
        // Continue to next model
        continue;
      }
    }

    return false;
  } catch (error) {
    console.warn('API key validation failed:', error);
    return false;
  }
}