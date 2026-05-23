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
      message: 'Transfer successful',
      to: receiver.email,
      address: receiver.wallet.address,
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
