// errorHandler.js
/**
 * Global error handling middleware
 * Processes errors and returns appropriate responses
 */
const errorHandler = (err, req, res, next) => {
  // Default error status and message
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';
  
  // Enhanced logging with context
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId,
  });
  
  // Handling specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = err.message;
  }
  
  if (err.name === 'UnauthorizedError' || err.message === 'Invalid token') {
    status = 401;
    message = 'Authentication required';
  }
  
  if (err.message === 'Not Found' || err.name === 'NotFoundError') {
    status = 404;
    message = `Resource not found: ${req.originalUrl}`;
  }
  
  // Handle Elasticsearch errors
  if (err.meta?.body?.error) {
    status = err.meta.statusCode || 500;
    message = `Database error: ${err.meta.body.error.reason || err.meta.body.error.type}`;
  }
  
  // Format the error response
  const errorResponse = {
    error: {
      message,
      status,
      path: req.originalUrl,
    }
  };
  
  // Include stack trace in development environment
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    
    if (err.meta?.body?.error) {
      errorResponse.error.details = err.meta.body.error;
    }
  }
  
  res.status(status).json(errorResponse);
};

module.exports = errorHandler;
