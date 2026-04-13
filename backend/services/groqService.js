const axios = require('axios');
require('dotenv').config();

const getAIRecommendation = async (symptomsText) => {
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: process.env.GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a medical triage assistant. You MUST respond with valid JSON only. No extra text.',
          },
          {
            role: 'user',
            content: `A patient has these symptoms: "${symptomsText}". 
            Suggest the most appropriate medical specialization. 
            Respond ONLY with this exact JSON format:
            {"suggestedSpecialization": "Cardiology", "reasoning": "explanation here"}`,
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.choices[0].message.content.trim();
    // Clean up in case model wraps in markdown
    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('GROQ API Error:', error.message);
    throw new Error('AI service unavailable');
  }
};

module.exports = { getAIRecommendation };