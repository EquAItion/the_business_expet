import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { Expert } from '../models/Expert';

const router = express.Router();

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const expertId = req.user.id; // From auth middleware
    const updatedData = req.body;

    // Validate the incoming data
    if (!updatedData) {
      return res.status(400).json({
        success: false,
        message: 'No data provided for update'
      });
    }

    // Update the expert profile
    const updatedExpert = await Expert.findByIdAndUpdate(
      expertId,
      {
        $set: {
          first_name: updatedData.first_name,
          last_name: updatedData.last_name,
          designation: updatedData.designation,
          current_organization: updatedData.current_organization,
          location: updatedData.location,
          work_experience: updatedData.work_experience,
          email: updatedData.email,
          phone_number: updatedData.phone_number,
          video_price: updatedData.video_price,
          audio_price: updatedData.audio_price,
          chat_price: updatedData.chat_price,
          linkedin: updatedData.linkedin,
          twitter: updatedData.twitter,
          instagram: updatedData.instagram
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedExpert) {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedExpert
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});