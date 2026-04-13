const pool = require('../config/db');
const { getAIRecommendation } = require('../services/groqService');

// Patient submits symptoms → AI generates specialization recommendation
const submitSymptoms = async (req, res) => {
  const { symptomsText } = req.body;
  const patientId = req.user.id;

  if (!symptomsText || symptomsText.trim().length < 10) {
    return res.status(400).json({ error: 'Please describe your symptoms in more detail.' });
  }

  try {
    // 1. Save the symptom submission
    const submissionResult = await pool.query(
      `INSERT INTO symptom_submissions (symptoms_text, patient_id)
       VALUES ($1, $2) RETURNING *`,
      [symptomsText.trim(), patientId]
    );
    const submission = submissionResult.rows[0];

    // 2. Call GROQ AI
    let aiData;
    try {
      aiData = await getAIRecommendation(symptomsText);
    } catch (aiError) {
      // AI failed — return submission without recommendation
      return res.status(503).json({ 
        error: 'AI service temporarily unavailable. Please select a doctor manually.',
        submission 
      });
    }

    // 3. Save AI recommendation
    const recResult = await pool.query(
      `INSERT INTO ai_recommendations (suggested_specialization, reasoning, submission_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [aiData.suggestedSpecialization, aiData.reasoning, submission.submission_id]
    );

    res.status(201).json({
      message: 'Symptoms submitted and analyzed successfully.',
      submission,
      recommendation: recResult.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Get a submission and its AI recommendation
const getSubmission = async (req, res) => {
  const { id } = req.params;
  const patientId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT ss.*, ar.suggested_specialization, ar.reasoning, ar.generated_at
       FROM symptom_submissions ss
       LEFT JOIN ai_recommendations ar ON ss.submission_id = ar.submission_id
       WHERE ss.submission_id = $1 AND ss.patient_id = $2`,
      [id, patientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { submitSymptoms, getSubmission };