import crypto from 'crypto';

export const generateSwiftMXMessage = ({
  sender,

  receiver,

  amount,

  sourceCurrency,

  destinationCurrency,
}) => {
  const messageId = crypto.randomUUID();

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
