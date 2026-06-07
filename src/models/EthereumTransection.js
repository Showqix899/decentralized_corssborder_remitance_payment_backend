import mongoose from 'mongoose';

const ethereumTransactionSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    senderAddress: String,

    receiverAddress: String,

    amount: Number,

    sourceCurrency: String,

    destinationCurrency: String,

    exchangeRate: Number,

    convertedAmount: Number,

    fxFee: Number,

    txHash: String,

    blockNumber: Number,

    gasUsed: String,

    gasPrice: String,

    networkFeeETH: Number,

    networkFeeUSD: Number,

    settlementNetwork: {
      type: String,
      default: 'ETHEREUM',
    },

    initiatedAt: Date,

    completedAt: Date,

    processingTimeMs: Number,

    processingTimeSeconds: Number,

    amlStatus: String,

    riskScore: Number,

    amlReasons: [String],

    swiftMessageType: String,

    swiftMessageId: String,

    status: {
      type: String,
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('EthereumTransaction', ethereumTransactionSchema);
