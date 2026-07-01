import User from '../models/User.js';
import axios from 'axios';

//didt kyc system
export const createKYCSession = async (req, res) => {
  try {
    //get the user
    const user = req.user;

    if (user.kycStatus === 'approved') {
      return res.status(200).json({
        message: 'you are already approved',
      });
    }

    const response = await axios.post(
      `${process.env.DIDIT_BASE_URL}/session/`,
      {
        workflow_id: process.env.DIDIT_WORKFLOW_ID,
        vendor_data: req.user._id.toString(),
        callback: `${process.env.CLIENT_URL}/api/kyc/didit-webhook`,
      },
      {
        headers: {
          'X-Api-Key': process.env.DIDIT_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    user.kyc_session_id = response.data.session_id;
    user.kyc_verification_url = response.data.url;

    await user.save();

    return res.status(200).json({
      success: true,
      url: response.data.url,
    });
  } catch (error) {
    console.log(error.response?.data);
    throw error;
  }
};

//didit webhook controller
export const diditWebhook = async (req, res) => {
  try {
    const { verificationSessionId, status } = req.query;

    const user = await User.findOne({
      kyc_session_id: verificationSessionId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.kycStatus = status.toLowerCase();

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'KYC status updated',
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
