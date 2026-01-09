// controllers/teamController.js
import Team from '../models/teamModel.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// @desc    Get all team members
// @route   GET /api/teams
// @access  Public
export const getTeams = async (req, res) => {
  try {
    const { active } = req.query;
    let filter = {};
    
    if (active === 'true') {
      filter.isActive = true;
    }

    const teams = await Team.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single team member
// @route   GET /api/teams/:id
// @access  Public
export const getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new team member
// @route   POST /api/teams
// @access  Private
export const createTeam = async (req, res) => {
  try {
    const { name, role, description, order } = req.body;

    // Check if team member already exists
    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'Team member with this name already exists'
      });
    }

    const teamData = {
      name,
      role,
      description,
      order: order || 0
    };

    // Handle image upload if file exists
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'teams',
          width: 500,
          height: 500,
          crop: 'fill',
          quality: 'auto',
          fetch_format: 'auto'
        });

        teamData.image = {
          url: result.secure_url,
          public_id: result.public_id
        };

        // Delete file from server
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        // Delete file from server if upload fails
        if (req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({
          success: false,
          message: 'Image upload failed',
          error: uploadError.message
        });
      }
    }

    const team = await Team.create(teamData);

    res.status(201).json({
      success: true,
      message: 'Team member created successfully',
      data: team
    });
  } catch (error) {
    // Delete file from server if error occurs
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update team member
// @route   PUT /api/teams/:id
// @access  Private
export const updateTeam = async (req, res) => {
  try {
    let team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    const { name, role, description, order, isActive } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Handle image upload if new file exists
    if (req.file) {
      try {
        // Delete old image from Cloudinary if exists
        if (team.image && team.image.public_id) {
          await cloudinary.uploader.destroy(team.image.public_id);
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'teams',
          width: 500,
          height: 500,
          crop: 'fill',
          quality: 'auto',
          fetch_format: 'auto'
        });

        updateData.image = {
          url: result.secure_url,
          public_id: result.public_id
        };

        // Delete file from server
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        // Delete file from server if upload fails
        if (req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({
          success: false,
          message: 'Image upload failed',
          error: uploadError.message
        });
      }
    }

    team = await Team.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Team member updated successfully',
      data: team
    });
  } catch (error) {
    // Delete file from server if error occurs
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete team member
// @route   DELETE /api/teams/:id
// @access  Private
export const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Delete image from Cloudinary if exists
    if (team.image && team.image.public_id) {
      await cloudinary.uploader.destroy(team.image.public_id);
    }

    await Team.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Team member deleted successfully'
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update team member order
// @route   PATCH /api/teams/order
// @access  Private
export const updateTeamOrder = async (req, res) => {
  try {
    const { orderUpdates } = req.body;

    if (!Array.isArray(orderUpdates)) {
      return res.status(400).json({
        success: false,
        message: 'Order updates must be an array'
      });
    }

    const bulkOps = orderUpdates.map(update => ({
      updateOne: {
        filter: { _id: update.id },
        update: { order: update.order }
      }
    }));

    await Team.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: 'Team order updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};