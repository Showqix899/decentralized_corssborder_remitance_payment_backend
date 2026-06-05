import User from '../models/User.js';
import axios from 'axios';

//get ll pending KYC requests
export const getPendingsKYC = async (req, res) => {
  try {
    //kyc pending kyc user
    const users = await User.find({
      kycStatus: 'pending',
      isVerified: true,
    }).select('-password');

    if (!users) {
      return res.status(404).json({
        message: 'no pending users found',
      });
    }

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//approve kyc
export const approveKYC = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    user.kycStatus = 'approved';

    await user.save();

    res.status(200).json({
      message: 'KYC approved successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Reject KYC
export const rejectKYC = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    user.kycStatus = 'rejected';

    await user.save();

    res.status(200).json({
      message: 'KYC rejected',
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// View single KYC request
export const getKYCDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//kyc approval
export const approveKYCWithNID = async (req, res) => {
  try {
    if (
      !req.files['nid_front'] ||
      !req.files['nid_back'] ||
      !req.files['selfie']
    ) {
      return res.status(400).json({
        message: 'All three images (NID front, NID back, selfie) are required',
      });
    }

    const nid_front_base64 = req.files.nid_front[0].buffer.toString('base64');

    const nid_back_base64 = req.files.nid_back[0].buffer.toString('base64');

    const selfie_base64 = req.files.selfie[0].buffer.toString('base64');

    console.log('Received images, starting NIDLive verification...');

    const response = await axios.post(
      `${process.env.NIDLIVE_BASE_URL}/api-verify`,
      {
        client_id: process.env.NIDLIVE_CLIENT_ID,
        client_secret: process.env.NIDLIVE_CLIENT_SECRET,
        nid_front_base64,
        nid_back_base64,
        selfie_base64,
        consent_given: true,
      }
    );

    console.log('NIDLive response:', response.data);

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    if (response.data.status === 'success') {
      //update user kyc status to approved
      user.kycStatus = 'approved';
      await user.save();

      return res.status(200).json({
        message: 'KYC approved successfully',
        data: response.data,
      });
    } else {
      user.kycStatus = 'rejected';
      await user.save();
      return res.status(400).json({
        message: 'KYC verification failed',
        data: response.data,
      });
    }
  } catch (error) {
    console.error('Error in NIDLive KYC verification:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};
