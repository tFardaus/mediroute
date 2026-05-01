const PDFDocument = require('pdfkit');
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const generatePrescriptionPDF = async (prescriptionId) => {
  const result = await pool.query(`
    SELECT p.*, 
      pat.name as patient_name, pat.date_of_birth, pat.address,
      d.name as doctor_name, d.specialization, d.phone as doctor_phone,
      a.scheduled_date, a.scheduled_time
    FROM prescriptions p
    JOIN appointments a ON p.appointment_id = a.appointment_id
    JOIN patients pat ON a.patient_id = pat.patient_id
    JOIN doctors d ON p.doctor_id = d.doctor_id
    WHERE p.prescription_id = $1
  `, [prescriptionId]);

  if (result.rows.length === 0) {
    throw new Error('Prescription not found');
  }

  const data = result.rows[0];
  const doc = new PDFDocument({ margin: 50 });
  const uploadsDir = path.join(__dirname, '../uploads/prescriptions');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = `prescription_${prescriptionId}_${Date.now()}.pdf`;
  const filepath = path.join(uploadsDir, filename);
  const stream = fs.createWriteStream(filepath);

  doc.pipe(stream);

  doc.fontSize(20).text('Medical Prescription', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Date: ${new Date(data.issued_at).toLocaleDateString()}`, { align: 'right' });
  doc.moveDown();

  doc.fontSize(14).text('Doctor Information:', { underline: true });
  doc.fontSize(11).text(`Name: Dr. ${data.doctor_name}`);
  doc.text(`Specialization: ${data.specialization}`);
  doc.text(`Phone: ${data.doctor_phone}`);
  doc.moveDown();

  doc.fontSize(14).text('Patient Information:', { underline: true });
  doc.fontSize(11).text(`Name: ${data.patient_name}`);
  doc.text(`Date of Birth: ${data.date_of_birth ? new Date(data.date_of_birth).toLocaleDateString() : 'N/A'}`);
  doc.text(`Address: ${data.address || 'N/A'}`);
  doc.moveDown();

  doc.fontSize(14).text('Prescription Details:', { underline: true });
  doc.fontSize(11).text(`Medication: ${data.medication}`);
  doc.text(`Dosage: ${data.dosage}`);
  doc.text(`Instructions: ${data.instructions || 'N/A'}`);
  doc.moveDown();

  doc.fontSize(10).text('This is a computer-generated prescription.', { align: 'center', italics: true });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
};

const generateMedicalReportPDF = async (patientId) => {
  const patient = await pool.query(`
    SELECT * FROM patients WHERE patient_id = $1
  `, [patientId]);

  if (patient.rows.length === 0) {
    throw new Error('Patient not found');
  }

  const history = await pool.query(`
    SELECT h.*, d.name as doctor_name
    FROM patient_medical_history h
    LEFT JOIN doctors d ON h.added_by_doctor_id = d.doctor_id
    WHERE h.patient_id = $1
    ORDER BY h.created_at DESC
  `, [patientId]);

  const allergies = await pool.query(`
    SELECT a.*, d.name as doctor_name
    FROM allergies a
    LEFT JOIN doctors d ON a.added_by_doctor_id = d.doctor_id
    WHERE a.patient_id = $1
  `, [patientId]);

  const prescriptions = await pool.query(`
    SELECT p.*, d.name as doctor_name, a.scheduled_date
    FROM prescriptions p
    JOIN appointments a ON p.appointment_id = a.appointment_id
    JOIN doctors d ON p.doctor_id = d.doctor_id
    WHERE a.patient_id = $1
    ORDER BY p.issued_at DESC
    LIMIT 10
  `, [patientId]);

  const patientData = patient.rows[0];
  const doc = new PDFDocument({ margin: 50 });
  const uploadsDir = path.join(__dirname, '../uploads/reports');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = `medical_report_${patientId}_${Date.now()}.pdf`;
  const filepath = path.join(uploadsDir, filename);
  const stream = fs.createWriteStream(filepath);

  doc.pipe(stream);

  doc.fontSize(20).text('Medical Report', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'right' });
  doc.moveDown();

  doc.fontSize(14).text('Patient Information:', { underline: true });
  doc.fontSize(11).text(`Name: ${patientData.name}`);
  doc.text(`Email: ${patientData.email}`);
  doc.text(`Phone: ${patientData.phone || 'N/A'}`);
  doc.text(`Date of Birth: ${patientData.date_of_birth ? new Date(patientData.date_of_birth).toLocaleDateString() : 'N/A'}`);
  doc.text(`Address: ${patientData.address || 'N/A'}`);
  doc.moveDown();

  doc.fontSize(14).text('Medical History:', { underline: true });
  if (history.rows.length > 0) {
    history.rows.forEach(h => {
      doc.fontSize(11).text(`- ${h.condition_name} (${h.status})`);
      doc.fontSize(9).text(`  Diagnosed: ${h.diagnosed_date ? new Date(h.diagnosed_date).toLocaleDateString() : 'N/A'}`);
      if (h.notes) doc.text(`  Notes: ${h.notes}`);
      doc.moveDown(0.5);
    });
  } else {
    doc.fontSize(11).text('No medical history recorded.');
  }
  doc.moveDown();

  doc.fontSize(14).text('Allergies:', { underline: true });
  if (allergies.rows.length > 0) {
    allergies.rows.forEach(a => {
      doc.fontSize(11).text(`- ${a.allergen} (${a.severity})`);
      if (a.reaction) doc.fontSize(9).text(`  Reaction: ${a.reaction}`);
      doc.moveDown(0.5);
    });
  } else {
    doc.fontSize(11).text('No allergies recorded.');
  }
  doc.moveDown();

  doc.fontSize(14).text('Recent Prescriptions:', { underline: true });
  if (prescriptions.rows.length > 0) {
    prescriptions.rows.forEach(p => {
      doc.fontSize(11).text(`- ${p.medication} (${p.dosage})`);
      doc.fontSize(9).text(`  Prescribed by: Dr. ${p.doctor_name}`);
      doc.text(`  Date: ${new Date(p.issued_at).toLocaleDateString()}`);
      doc.moveDown(0.5);
    });
  } else {
    doc.fontSize(11).text('No prescriptions recorded.');
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
};

const generateInvoicePDF = async (billingId) => {
  const billing = await pool.query(`
    SELECT b.*, 
      p.name as patient_name, p.email as patient_email, p.address,
      a.scheduled_date, a.scheduled_time,
      d.name as doctor_name, d.specialization
    FROM billing b
    JOIN patients p ON b.patient_id = p.patient_id
    JOIN appointments a ON b.appointment_id = a.appointment_id
    JOIN doctors d ON a.doctor_id = d.doctor_id
    WHERE b.billing_id = $1
  `, [billingId]);

  if (billing.rows.length === 0) {
    throw new Error('Billing not found');
  }

  const items = await pool.query(`
    SELECT * FROM billing_items WHERE billing_id = $1
  `, [billingId]);

  const data = billing.rows[0];
  const doc = new PDFDocument({ margin: 50 });
  const uploadsDir = path.join(__dirname, '../uploads/invoices');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = `invoice_${billingId}_${Date.now()}.pdf`;
  const filepath = path.join(uploadsDir, filename);
  const stream = fs.createWriteStream(filepath);

  doc.pipe(stream);

  doc.fontSize(20).text('Invoice', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Invoice #: ${billingId}`, { align: 'right' });
  doc.text(`Date: ${new Date(data.created_at).toLocaleDateString()}`, { align: 'right' });
  doc.text(`Status: ${data.status.toUpperCase()}`, { align: 'right' });
  doc.moveDown();

  doc.fontSize(14).text('Patient Information:', { underline: true });
  doc.fontSize(11).text(`Name: ${data.patient_name}`);
  doc.text(`Email: ${data.patient_email}`);
  doc.text(`Address: ${data.address || 'N/A'}`);
  doc.moveDown();

  doc.fontSize(14).text('Appointment Details:', { underline: true });
  doc.fontSize(11).text(`Doctor: Dr. ${data.doctor_name} (${data.specialization})`);
  doc.text(`Date: ${new Date(data.scheduled_date).toLocaleDateString()}`);
  doc.text(`Time: ${data.scheduled_time}`);
  doc.moveDown();

  doc.fontSize(14).text('Billing Items:', { underline: true });
  doc.moveDown(0.5);

  if (items.rows.length > 0) {
    items.rows.forEach(item => {
      doc.fontSize(11).text(`${item.description}`, { continued: true });
      doc.text(`$${parseFloat(item.total_price).toFixed(2)}`, { align: 'right' });
      doc.fontSize(9).text(`  Quantity: ${item.quantity} x $${parseFloat(item.unit_price).toFixed(2)}`);
      doc.moveDown(0.5);
    });
  }

  doc.moveDown();
  doc.fontSize(14).text(`Total Amount: $${parseFloat(data.amount).toFixed(2)}`, { align: 'right' });

  if (data.status === 'paid') {
    doc.moveDown();
    doc.fontSize(11).text(`Payment Method: ${data.payment_method || 'N/A'}`);
    doc.text(`Transaction ID: ${data.transaction_id || 'N/A'}`);
    doc.text(`Paid On: ${data.paid_at ? new Date(data.paid_at).toLocaleDateString() : 'N/A'}`);
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
};

module.exports = {
  generatePrescriptionPDF,
  generateMedicalReportPDF,
  generateInvoicePDF
};
