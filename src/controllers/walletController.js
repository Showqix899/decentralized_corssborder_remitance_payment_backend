//models
import User from '../models/User.js';

//utility
import { getWalletBalance } from '../services/xrplService.js';

//controllers

//get balance controller
export const getBalance = async (req, res) => {
  try {
    //get user
    const user = await User.findById(req.user._id);

    //balance
    const balance = await getWalletBalance(user.wallet.address);

    res.json({
      wallet: user.wallet.address,
      balance,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
