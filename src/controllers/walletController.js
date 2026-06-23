//models
import User from '../models/User.js';

//services
import { getWalletBalance } from '../services/xrplService.js';
import { getETHBalance } from '../services/ethereumService.js';

//controllers

//get balance controller(xrpl)
export const getXRPBalance = async (req, res) => {
  try {
    //get user
    const user = await User.findById(req.user._id);

    //balance
    const balance = await getWalletBalance(user.wallets.xrpl.address);

    res.json({
      wallet: user.wallets.xrpl.address,
      balance,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// get my eth balance (ethereium)
export const getMyETHBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const balance = await getETHBalance(user.wallets.ethereum.address);

    res.status(200).json({
      wallet: user.wallets.ethereum.address,

      balance: balance,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};
