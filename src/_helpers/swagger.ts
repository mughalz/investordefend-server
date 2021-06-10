/**
 * This module represents the configuration settings for the automated
 * API documentation (using SwaggerUI).
 *
 * @category Configuration
 *
 * @module SwaggerConfig
 *
 * @hidden
 */

import swaggerJSDoc from 'swagger-jsdoc';
import config from '../config';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Express API for Invest or Defend',
    version: '0.0.0 (pre-release)',
    description: 'This is a REST API application made with Express.',
    license: {
      name: 'CRAPL',
      url: 'http://matt.might.net/articles/crapl/',
    },
    contact: {
      name: 'Zaffar Mughal',
      email: 'z.mughal1@lancaster.ac.uk',
    },
  },
  basePath: '/',
  servers: [
    {
      url: `${config.server.host}:${config.server.port}`,
      description: 'Development server',
    },
  ],
};

const options = {
  swaggerDefinition,
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  apis: ['./**/*.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
