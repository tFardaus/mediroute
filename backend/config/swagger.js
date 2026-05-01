const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MediRoute API Documentation',
      version: '3.0.0',
      description: 'Healthcare appointment management system with AI-powered medical triage',
      contact: {
        name: 'MediRoute Team',
        email: 'support@mediroute.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }],
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Symptoms', description: 'AI symptom analysis' },
      { name: 'Appointments', description: 'Appointment management' },
      { name: 'Doctor', description: 'Doctor operations' },
      { name: 'Admin', description: 'Admin operations' },
      { name: 'Search', description: 'Advanced search and filtering' },
      { name: 'Medical Records', description: 'Medical records management' },
      { name: 'Availability', description: 'Doctor scheduling' },
      { name: 'Billing', description: 'Payment management' },
      { name: 'Analytics', description: 'System analytics' },
      { name: 'Reports', description: 'PDF report generation' },
      { name: 'Messaging', description: 'Real-time messaging' },
      { name: 'Notifications', description: 'In-app notifications' },
      { name: 'Two-Factor Auth', description: 'Two-factor authentication' }
    ]
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
