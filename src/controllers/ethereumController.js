import User from '../models/User.js';
import ethereumQueue from '../queues/ethereumQueue.js';

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
