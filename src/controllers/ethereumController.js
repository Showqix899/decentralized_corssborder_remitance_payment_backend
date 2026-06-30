//models
import User from '../models/User.js';
import ethereumQueue from '../queues/ethereumQueue.js';
import EthereumTransaction from '../models/EthereumTransection.js';

export const sendETHMoney = async (req, res) => {
  try {
    const { receiverEmail, amount, sourceCurrency, destinationCurrency } =
      req.body;

    if (!receiverEmail) {
      return res.status(400).json({
        message: 'Receiver email required',
      });
    }

    if (!amount) {
      return res.status(400).json({
        message: 'Amount required',
      });
    }

    const sender = await User.findById(req.user.id);

    const receiver = await User.findOne({
      email: receiverEmail,
    });

    if (!receiver) {
      return res.status(404).json({
        message: 'Receiver not found',
      });
    }

    if (sender.email === receiver.email) {
      return res.status(400).json({
        message: 'Cannot send to yourself',
      });
    }

    await ethereumQueue.add('sendETH', {
      sender,
      receiver,
      amount,
      sourceCurrency,
      destinationCurrency,
    });

    return res.status(201).json({
      message: 'Ethereum transfer queued',
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

//transection history eth
export const getTransectionsHistory = async (req, res) => {
  try {
    //get user eth transection history
    const transections = await EthereumTransaction.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .sort({
        createdAt: -1,
      });

    //if no trnasection available
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
