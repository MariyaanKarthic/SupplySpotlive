const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Supplier Spot API',
      version: '1.0.0',
      description: 'Comprehensive API for Supplier Spot - Supplier Management System',
      contact: {
        name: 'API Support',
        email: 'support@supplierspot.com',
        url: 'https://supplierspot.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.supplierspot.com/v1' 
          : 'http://localhost:3000/api/v1',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'email', 'name', 'role'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            name: {
              type: 'string',
              description: 'User full name'
            },
            role: {
              type: 'string',
              enum: ['admin', 'procurement_manager', 'finance_manager', 'ap_clerk', 'supplier', 'viewer'],
              description: 'User role in the system'
            },
            department: {
              type: 'string',
              description: 'User department'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the user is active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Vendor: {
          type: 'object',
          required: ['id', 'name', 'category', 'contact', 'status'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique vendor identifier'
            },
            name: {
              type: 'string',
              description: 'Vendor company name'
            },
            category: {
              type: 'string',
              enum: ['technology', 'manufacturing', 'services', 'materials', 'logistics', 'consulting', 'other'],
              description: 'Vendor business category'
            },
            contact: {
              $ref: '#/components/schemas/ContactInfo'
            },
            status: {
              type: 'string',
              enum: ['active', 'under_review', 'rejected', 'inactive', 'suspended'],
              description: 'Vendor status'
            },
            location: {
              type: 'string',
              description: 'Vendor location'
            },
            contracts: {
              type: 'integer',
              description: 'Number of active contracts'
            },
            totalSpend: {
              type: 'number',
              format: 'decimal',
              description: 'Total amount spent with this vendor'
            },
            rating: {
              type: 'number',
              format: 'float',
              minimum: 0,
              maximum: 5,
              description: 'Vendor rating (0-5)'
            },
            onboardDate: {
              type: 'string',
              format: 'date',
              description: 'Vendor onboarding date'
            }
          }
        },
        ContactInfo: {
          type: 'object',
          required: ['email', 'phone'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            phone: {
              type: 'string',
              description: 'Phone number'
            },
            address: {
              type: 'string',
              description: 'Physical address'
            },
            website: {
              type: 'string',
              format: 'uri',
              description: 'Website URL'
            }
          }
        },
        Invoice: {
          type: 'object',
          required: ['id', 'invoiceNumber', 'vendorId', 'amount', 'dueDate', 'status'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique invoice identifier'
            },
            invoiceNumber: {
              type: 'string',
              description: 'Invoice number'
            },
            vendorId: {
              type: 'string',
              format: 'uuid',
              description: 'Vendor identifier'
            },
            amount: {
              type: 'number',
              format: 'decimal',
              description: 'Invoice amount'
            },
            taxAmount: {
              type: 'number',
              format: 'decimal',
              description: 'Tax amount'
            },
            netAmount: {
              type: 'number',
              format: 'decimal',
              description: 'Net amount after tax'
            },
            dueDate: {
              type: 'string',
              format: 'date',
              description: 'Payment due date'
            },
            issueDate: {
              type: 'string',
              format: 'date',
              description: 'Invoice issue date'
            },
            status: {
              type: 'string',
              enum: ['draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'paid', 'overdue'],
              description: 'Invoice status'
            },
            description: {
              type: 'string',
              description: 'Invoice description'
            },
            poNumber: {
              type: 'string',
              description: 'Related purchase order number'
            },
            grnNumber: {
              type: 'string',
              description: 'Goods receipt note number'
            }
          }
        },
        Dispute: {
          type: 'object',
          required: ['id', 'title', 'description', 'category', 'priority', 'status', 'submittedBy'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique dispute identifier'
            },
            disputeNumber: {
              type: 'string',
              description: 'Dispute number'
            },
            title: {
              type: 'string',
              description: 'Dispute title'
            },
            description: {
              type: 'string',
              description: 'Dispute description'
            },
            category: {
              type: 'string',
              enum: ['invoice_discrepancy', 'payment_delay', 'delivery_issue', 'quality_issue', 'po_issue', 'contract_dispute', 'other'],
              description: 'Dispute category'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Dispute priority'
            },
            status: {
              type: 'string',
              enum: ['submitted', 'assigned', 'investigating', 'pending_supplier', 'pending_internal', 'resolved', 'closed', 'escalated'],
              description: 'Dispute status'
            },
            submittedBy: {
              $ref: '#/components/schemas/DisputeParticipant'
            },
            assignedTo: {
              $ref: '#/components/schemas/DisputeParticipant'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Dispute tags'
            }
          }
        },
        DisputeParticipant: {
          type: 'object',
          required: ['id', 'name', 'email', 'type'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Participant identifier'
            },
            name: {
              type: 'string',
              description: 'Participant name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Participant email'
            },
            type: {
              type: 'string',
              enum: ['supplier', 'internal'],
              description: 'Participant type'
            },
            department: {
              type: 'string',
              description: 'Department (for internal participants)'
            },
            company: {
              type: 'string',
              description: 'Company name (for supplier participants)'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the operation was successful'
            },
            data: {
              description: 'Response data'
            },
            message: {
              type: 'string',
              description: 'Response message'
            },
            error: {
              type: 'string',
              description: 'Error message (if any)'
            },
            pagination: {
              $ref: '#/components/schemas/PaginationInfo'
            }
          }
        },
        PaginationInfo: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              description: 'Items per page'
            },
            total: {
              type: 'integer',
              description: 'Total number of items'
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs;
