import moongose from 'mongoose';

const swiftMessageSchema = new moongose.Schema(
  {
    id: {
      type: moongose.Schema.Types.ObjectId,
    },

    messageId: {
      type: String,
    },
    sender: {
      type: String,
    },

    receiver: {
      type: String,
    },

    settlementNetwork: {
      type: String,
      default: 'XRP',
    },

    senderCountry: String,

    receiverCountry: String,

    amount: Number,

    from: {
      type: String,
    },

    to: {
      type: String,
    },

    txHash: String,

    ledgerIndex: String,

    initiatedAt: Date,
  },
  {
    timestamps: true,
  }
);

export default moongose.model('SwiftMessage', swiftMessageSchema);
