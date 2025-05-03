// healthRoutes.js
const express = require('express');
const esClient = require('../config/esClient');
const redisClient = require('../config/redisClient');
const { sequelize } = require('../config/mysql');

const router = express.Router();

/**
 * Health check endpoint
 * Checks database connections and service health
 */
router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      elasticsearch: false,
      mysql: false,
      redis: false
    }
  };

  try {
    // Check MySQL
    try {
      await sequelize.authenticate();
      health.services.mysql = true;
    } catch (error) {
      health.services.mysql = false;
    }

    // Check Elasticsearch
    try {
      const esResponse = await esClient.ping();
      health.services.elasticsearch = true;
    } catch (error) {
      health.services.elasticsearch = false;
    }

    // Check Redis
    try {
      const redisResult = await redisClient.ping();
      health.services.redis = redisResult === 'PONG';
    } catch (error) {
      health.services.redis = false;
    }

    // Overall status
    if (Object.values(health.services).some(status => status === false)) {
      health.status = 'degraded';
      res.status(503);
    }

    res.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    health.status = 'error';
    health.error = error.message;
    res.status(500).json(health);
  }
});

/**
 * Detailed health check
 * Includes more service metrics and detailed status
 */
router.get('/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {}
  };

  try {
    // Detailed MySQL check
    try {
      await sequelize.authenticate();
      const dbStatus = await sequelize.query('SELECT COUNT(*) as userCount FROM users;');
      health.services.mysql = {
        status: true,
        connection: 'active',
        stats: {
          userCount: dbStatus[0][0]?.userCount || 0
        }
      };
    } catch (error) {
      health.services.mysql = {
        status: false,
        error: error.message
      };
    }

    // Detailed Elasticsearch check
    try {
      const esResponse = await esClient.cluster.health();
      const indices = await esClient.cat.indices({ format: 'json' });
      
      health.services.elasticsearch = {
        status: true,
        clusterStatus: esResponse.body?.status || esResponse.status,
        indices: indices.body || indices
      };
    } catch (error) {
      health.services.elasticsearch = {
        status: false,
        error: error.message
      };
    }

    // Detailed Redis check
    try {
      const info = await redisClient.info();
      health.services.redis = {
        status: true,
        info: info
      };
    } catch (error) {
      health.services.redis = {
        status: false,
        error: error.message
      };
    }

    // Overall status
    const serviceStatuses = Object.values(health.services).map(s => s.status);
    if (serviceStatuses.some(status => status === false)) {
      health.status = 'degraded';
      res.status(503);
    }

    res.json(health);
  } catch (error) {
    console.error('Detailed health check error:', error);
    health.status = 'error';
    health.error = error.message;
    res.status(500).json(health);
  }
});

module.exports = router;
