//db models
import User from '../models/User.js';
import Transection from '../models/Transection.js';

//queue
import xrpleQueue from '../queues/sendXrplQueue.js';

//constants
import supportedCurrencies from '../constants/supportedCurrencies.js';

//send money
export const sendMoney = async (req, res) => {
  try {
    const { receiverEmail, amount, sourceCurrency, destinationCurrency } =
      req.body; //get the info of receiver

    //check if info provided
    if (!receiverEmail) {
      return res.status(404).json({
        message: 'receiver email address is required',
      });
    }

    if (!amount) {
      return res.status(404).json({
        message: 'please provide an amount',
      });
    }

    //sender
    const sender = await User.findById(req.user.id);
    if (!sender) {
      return res.status(404).json({
        message: 'sender  does not exist',
      });
    }
    //receiver
    const receiver = await User.findOne({
      email: receiverEmail,
    });
    if (!receiver) {
      return res.status(404).json({
        message: 'receiver email does not exist',
      });
    }

    //basic validations
    if (sender.email === receiver.email) {
      return res.status(400).json({
        message: 'Cannot send to yourself',
      });
    }

    //source currency
    if (!sourceCurrency) {
      return res.status(400).json({
        message: 'source currency required',
      });
    }

    //destination currency
    if (!destinationCurrency) {
      return res.status(400).json({
        message: 'destination currency required',
      });
    }

    if (!supportedCurrencies.includes(sourceCurrency)) {
      return res.status(400).json({
        message: 'Unsupported source currency',
      });
    }

    if (!supportedCurrencies.includes(destinationCurrency)) {
      return res.status(400).json({
        message: 'Unsupported destination currency',
      });
    }

    //add job to queue
    await xrpleQueue.add('sendXRP', {
      receiver,
      sender,
      amount,
      sourceCurrency,
      destinationCurrency,
    });

    res.status(201).json({
      message: 'Transfer queued',
      to: receiver.email,
      address: receiver.wallets.xrpl.address,
      amount: amount,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

//get transections
export const getTransections = async (req, res) => {
  try {
    //get user transection history
    const transections = await Transection.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .sort({
        createdAt: -1,
      });

    //if no transection available
    if (!transections) {
      return res.status(404).json({
        message: 'no transection found',
      });
    }

    res.status(200).json({
      transections: transections,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

//analytical controller
export const getTransactionAnalytics = async (req, res) => {
  try {
    const analytics = await Transection.aggregate([
      {
        $facet: {
          // =========================
          // Processing Time Stats
          // =========================
          processingTimeStats: [
            {
              $group: {
                _id: null,
                avgProcessingTimeMs: { $avg: '$processingTimeMs' },
                minProcessingTimeMs: { $min: '$processingTimeMs' },
                maxProcessingTimeMs: { $max: '$processingTimeMs' },

                avgProcessingTimeSeconds: { $avg: '$processingTimeSeconds' },
                minProcessingTimeSeconds: { $min: '$processingTimeSeconds' },
                maxProcessingTimeSeconds: { $max: '$processingTimeSeconds' },

                totalTransactions: { $sum: 1 },
              },
            },
          ],

          // =========================
          // Network Fee Stats
          // =========================
          networkFeeStats: [
            {
              $group: {
                _id: null,
                totalNetworkFeeXRP: { $sum: '$networkFeeXRP' },
                avgNetworkFeeXRP: { $avg: '$networkFeeXRP' },

                // drops are stored as string → convert safely
                totalNetworkFeeDrops: {
                  $sum: { $toDouble: '$networkFeeDrops' },
                },
              },
            },
          ],

          // =========================
          // FX Fee Stats
          // =========================
          fxFeeStats: [
            {
              $group: {
                _id: null,
                totalFxFee: { $sum: '$fxFee' },
                avgFxFee: { $avg: '$fxFee' },
              },
            },
          ],

          // =========================
          // Status Breakdown
          // =========================
          statusStats: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: analytics[0],
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
    });
  }
};

import { getWalletBalance } from '../services/xrplService.js';

//get balance
export const getbalance = async (req, res) => {
  try {
    //find user
    const user = await User.findById(req.user._id);

    const balance = await getWalletBalance(user.wallets.xrpl.address);

    return res.json({
      balance: balance,
    });
  } catch (error) {
    console.log(error.message);
  }
};
