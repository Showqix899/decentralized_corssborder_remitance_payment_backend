import xrpl from 'xrpl';
import client from '../config/xrpl.js';

//connect xrpl
export const connectXRPL = async () => {
  if (!client.isConnected()) {
    await client.connect();
    console.log('XRPL CONNECTED');
  }
};

//create wallet
export const createWallet = async () => {
  await connectXRPL();

  const wallet = (await client.fundWallet()).wallet;

  return {
    address: wallet.address,
    seed: wallet.seed,
    publicKey: wallet.publicKey,
    privateKey: wallet.privateKey,
  };
};

//get balance
export const getWalletBalance = async (address) => {
  await connectXRPL();

  const response = await client.request({
    command: 'account_info',
    account: address,
    ledger_index: 'validated',
  });

  const balanceDrops = response.result.account_data.Balance;

  return xrpl.dropsToXrp(balanceDrops);
};

//send xrp
export const sendXRP = async ({ senderSeed, destination, amount }) => {
  await connectXRPL();

  const wallet = xrpl.Wallet.fromSeed(senderSeed);

  const prepared = await client.autofill({
    TransactionType: 'Payment',
    Account: wallet.address,
    Amount: xrpl.xrpToDrops(amount),
    Destination: destination,
  });

  const signed = wallet.sign(prepared);

  const result = await client.submitAndWait(signed.tx_blob);

  return result;
};
