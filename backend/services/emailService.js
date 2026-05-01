const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    });
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

const sendAppointmentConfirmation = async (patientEmail, patientName, doctorName, date, time) => {
  const subject = 'Appointment Confirmed - MediRoute';
  const html = `
    <h2>Appointment Confirmed</h2>
    <p>Dear ${patientName},</p>
    <p>Your appointment has been confirmed with the following details:</p>
    <ul>
      <li><strong>Doctor:</strong> ${doctorName}</li>
      <li><strong>Date:</strong> ${date}</li>
      <li><strong>Time:</strong> ${time}</li>
    </ul>
    <p>Please arrive 15 minutes early for registration.</p>
    <p>Best regards,<br>MediRoute Team</p>
  `;
  return sendEmail(patientEmail, subject, html);
};

const sendAppointmentRejection = async (patientEmail, patientName, reason) => {
  const subject = 'Appointment Update - MediRoute';
  const html = `
    <h2>Appointment Status Update</h2>
    <p>Dear ${patientName},</p>
    <p>Unfortunately, your appointment request could not be approved at this time.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
    <p>Please contact our reception desk or submit a new appointment request.</p>
    <p>Best regards,<br>MediRoute Team</p>
  `;
  return sendEmail(patientEmail, subject, html);
};

const sendPasswordResetEmail = async (email, name, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const subject = 'Password Reset Request - MediRoute';
  const html = `
    <h2>Password Reset Request</h2>
    <p>Dear ${name},</p>
    <p>You requested to reset your password. Click the link below to proceed:</p>
    <p><a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not request this, please ignore this email.</p>
    <p>Best regards,<br>MediRoute Team</p>
  `;
  return sendEmail(email, subject, html);
};

const sendAppointmentReminder = async (patientEmail, patientName, doctorName, date, time) => {
  const subject = 'Appointment Reminder - MediRoute';
  const html = `
    <h2>Appointment Reminder</h2>
    <p>Dear ${patientName},</p>
    <p>This is a reminder of your upcoming appointment:</p>
    <ul>
      <li><strong>Doctor:</strong> ${doctorName}</li>
      <li><strong>Date:</strong> ${date}</li>
      <li><strong>Time:</strong> ${time}</li>
    </ul>
    <p>Please arrive 15 minutes early.</p>
    <p>Best regards,<br>MediRoute Team</p>
  `;
  return sendEmail(patientEmail, subject, html);
};

module.exports = {
  sendEmail,
  sendAppointmentConfirmation,
  sendAppointmentRejection,
  sendPasswordResetEmail,
  sendAppointmentReminder
};
