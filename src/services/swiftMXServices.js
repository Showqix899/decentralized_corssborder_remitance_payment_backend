import crypto from 'crypto';

import SwiftMessage from '../models/SwiftMessage.js';

export const generateSwiftMXMessage = async ({
  sender,
  receiver,
  senderCountry,
  receiverCountry,
  amount,
  sourceCurrency,
  destinationCurrency,
  txHash,
  ledgerIndex,
}) => {
  const messageId = crypto.randomUUID();

  await SwiftMessage.create({
    messageId,
    sender: sender._id,
    receiver: receiver._id,
    senderCountry,
    receiverCountry,
    amount,
    sourceCurrency,
    destinationCurrency,
    txHash,
    ledgerIndex,
  });

  return {
    messageType: 'pacs.008',

    messageId,

    creationDate: new Date(),

    senderBank: sender.country,

    receiverBank: receiver.country,

    instructedAmount: amount,

    sourceCurrency,

    destinationCurrency,
  };
};
