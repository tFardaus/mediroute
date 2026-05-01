const express = require('express');
const router = express.Router();
const { protect, roleGuard } = require('../middleware/auth');
const { generatePrescriptionPDF, generateMedicalReportPDF, generateInvoicePDF } = require('../services/pdfService');

router.get('/prescription/:prescriptionId', protect, async (req, res) => {
  try {
    const filepath = await generatePrescriptionPDF(req.params.prescriptionId);
    res.download(filepath, `prescription_${req.params.prescriptionId}.pdf`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/medical-report/:patientId', protect, roleGuard(['doctor', 'patient']), async (req, res) => {
  try {
    const filepath = await generateMedicalReportPDF(req.params.patientId);
    res.download(filepath, `medical_report_${req.params.patientId}.pdf`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/invoice/:billingId', protect, async (req, res) => {
  try {
    const filepath = await generateInvoicePDF(req.params.billingId);
    res.download(filepath, `invoice_${req.params.billingId}.pdf`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
