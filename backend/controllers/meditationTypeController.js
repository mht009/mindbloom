// controllers/esmeditationTypeController.js
const {
  saveMeditationType,
  getAllMeditationTypes,
  getMeditationTypeById,
  searchMeditationTypes,
  deleteMeditationType,
} = require("../utils/esMeditationTypeUtils");
const { validationResult } = require("express-validator");

/**
 * Get all meditation types with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getAllTypes(req, res, next) {
  try {
    // Extract pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 100.",
      });
    }

    // Get meditation types with pagination
    const { meditationTypes, total } = await getAllMeditationTypes(page, limit);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        meditationTypes,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching meditation types:", error);
    next(error);
  }
}

/**
 * Get meditation type by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getTypeById(req, res, next) {
  try {
    const { id } = req.params;
    const meditationType = await getMeditationTypeById(id);

    if (!meditationType) {
      return res.status(404).json({
        success: false,
        message: "Meditation type not found",
      });
    }

    res.status(200).json({
      success: true,
      data: meditationType,
    });
  } catch (error) {
    console.error(
      `Error fetching meditation type with ID ${req.params.id}:`,
      error
    );
    next(error);
  }
}

/**
 * Search meditation types
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function searchTypes(req, res, next) {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 100.",
      });
    }

    // Get search results with pagination
    const { results, total } = await searchMeditationTypes(q, page, limit);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        meditationTypes: results,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error searching meditation types:", error);
    next(error);
  }
}

/**
 * Create new meditation type (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function createType(req, res, next) {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Admin check is now handled by middleware

    const {
      name,
      description,
      howToPractice,
      benefits,
      recommendedFor,
      recommendedDuration,
      imageUrl,
      videoUrl,
      additionalInfo,
      order,
    } = req.body;

    // Create new meditation type
    const meditationType = await saveMeditationType({
      name,
      description,
      howToPractice,
      benefits,
      recommendedFor,
      recommendedDuration,
      imageUrl,
      videoUrl,
      additionalInfo: additionalInfo || {}, // Ensure additionalInfo is an object
      order: order || 0,
    });

    res.status(201).json({
      success: true,
      message: "Meditation type created successfully",
      data: meditationType,
    });
  } catch (error) {
    console.error("Error creating meditation type:", error);
    next(error);
  }
}

/**
 * Update meditation type (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function updateType(req, res, next) {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Admin check is now handled by middleware

    const { id } = req.params;
    const existingType = await getMeditationTypeById(id);

    if (!existingType) {
      return res.status(404).json({
        success: false,
        message: "Meditation type not found",
      });
    }

    const {
      name,
      description,
      howToPractice,
      benefits,
      recommendedFor,
      recommendedDuration,
      imageUrl,
      videoUrl,
      additionalInfo,
      order,
    } = req.body;

    // Update meditation type
    const updatedType = await saveMeditationType({
      id,
      name: name || existingType.name,
      description: description || existingType.description,
      howToPractice: howToPractice || existingType.howToPractice,
      benefits: benefits || existingType.benefits,
      recommendedFor: recommendedFor || existingType.recommendedFor,
      recommendedDuration:
        recommendedDuration || existingType.recommendedDuration,
      imageUrl: imageUrl || existingType.imageUrl,
      videoUrl: videoUrl || existingType.videoUrl,
      additionalInfo: additionalInfo || existingType.additionalInfo || {},
      order: order !== undefined ? order : existingType.order,
      createdAt: existingType.createdAt,
    });

    res.status(200).json({
      success: true,
      message: "Meditation type updated successfully",
      data: updatedType,
    });
  } catch (error) {
    console.error(
      `Error updating meditation type with ID ${req.params.id}:`,
      error
    );
    next(error);
  }
}

/**
 * Delete meditation type (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function deleteType(req, res, next) {
  try {
    // Admin check is now handled by middleware

    const { id } = req.params;
    const success = await deleteMeditationType(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Meditation type not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Meditation type deleted successfully",
    });
  } catch (error) {
    console.error(
      `Error deleting meditation type with ID ${req.params.id}:`,
      error
    );
    next(error);
  }
}

module.exports = {
  getAllTypes,
  getTypeById,
  searchTypes,
  createType,
  updateType,
  deleteType,
};
