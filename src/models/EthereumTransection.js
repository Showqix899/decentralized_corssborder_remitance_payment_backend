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

    settlementNetwork: {
      type: String,
      default: 'ETHEREUM',
    },

    senderAddress: String,

    receiverAddress: String,

    senderCountry: String,

    receiverCountry: String,

    amount: Number,

    sourceCurrency: String,

    destinationCurrency: String,

    exchangeRate: Number,

    convertedAmount: Number,

    cryptoAmountSent: Number,

    cryptoPrice: Number,

    fxFee: Number,

    totalDeducted: Number,

    txHash: String,

    blockNumber: Number,

    gasUsed: String,

    gasPrice: String,

    networkFeeETH: Number,

    networkFeeSourceCurrency: Number,

    networkFeeUSD: Number,

    totalCostUSD: Number,

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
