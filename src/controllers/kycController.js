import User from '../models/User.js';

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
