import mongoose from 'mongoose';

//transection schema
const transectionSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    settlementNetwork: {
      type: String,
      enum: ['XRP', 'ETH', 'BTC'],
    },
    senderAddress: String,
    senderCountry: String,
    receiverCountry: String,
    amount: Number,
    currency: {
      type: String,
      default: 'XRP',
    },
    txHash: String,
    initiatedAt: Date,
    completedAt: Date,
    processingTimeMs: Number,
    processingTimeSeconds: Number,
    networkFeeDrops: String,
    networkFeeXRP: Number,
    ledgerIndex: String,
    sourceCurrency: String,
    destinationCurrency: String,
    exchangeRate: Number,
    convertedAmount: Number,
    fxFee: Number,
    totalDeducted: Number,
    swiftMessageType: String,
    swiftMessageId: String,
    amlStatus: {
      type: String,
    },
    riskScore: {
      type: String,
    },
    amlReasons: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

const Transection = mongoose.model('Transection', transectionSchema);

export default Transection;
