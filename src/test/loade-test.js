//load .env data
import dotenv from 'dotenv';
dotenv.config({});

//db
import mongoose from 'mongoose';

//connect mongodb
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MONGODB CONNECTED');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};
connectDB();

//xrpl library
import xrpl from 'xrpl';
const client = new xrpl.Client(process.env.XRPL_SERVER);

//connect xrpl
const connectXRPL = async () => {
  if (!client.isConnected()) {
    await client.connect();
    console.log('XRPL CONNECTED');
  }
};

//connect xrpl network
connectXRPL();

//get ledger info
const getLedgerInfo = async (ledger_index) => {
  try {
    const response = await client.request({
      command: 'ledger',
      ledger_index: ledger_index,
      transactions: true,
      expand: true,
    });

    return response.result;
  } catch (error) {
    console.error('Get ledger info error:', error);

    throw error;
  }
};

//send xrp
const sendXRP = async ({ senderSeed, destination, amount }) => {
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

  //network fees
  const networkFeeDrops = prepared.Fee;

  const networkFeeXRP = xrpl.dropsToXrp(networkFeeDrops);

  return {
    result,
    networkFeeDrops,
    networkFeeXRP,
  };
};

//static variables
//exchange rates
const xrp_to_usd = 1.37;
const xrp_to_bdt = 168.81;
const usd_to_bdt = 123.0;

//paylod
const receiver = 'mshowqi12@gmail.com';
const sender = 'hexdexter47@gmail.com';
const amount = 1;
const sourceCurrency = 'usd';
const destinationCurrency = 'bdt';

//databasse models
import Transection from '../models/Transection.js';
import ComplianceLog from '../models/ComplianceLog.js';
import TestNetLedger from '../models/Ledger.js';
import User from '../models/User.js';

//swift message generation
import { generateSwiftMXMessage } from '../services/swiftMXServices.js';

//get reciever and sender
//FIX: these were async functions being used later as if they were already
//resolved objects (freshSender._id, freshSender.wallets...). Made them
//return the actual user doc, and they get awaited where called below.
const freshSender = async (sender) => {
  return await User.findOne({ email: sender });
};
const freshReciever = async (receiver) => {
  return await User.findOne({ email: receiver });
};

//send xrp to reciever
//FIX: now takes senderUser/receiverUser (full docs) instead of sid/rid,
//since generateSwiftMXMessage and the *_address fields at the bottom need
//the full user doc, not just an id.
const sendXRPToReciver = async (
  senderAddress,
  receiverAddress,
  cryptoAmountSent,
  sourceCurrency,
  destinationCurrency,
  amount,
  convertedAmount,
  senderUser,
  receiverUser
) => {
  for (let i = 0; i < 100; i++) {
    try {
      //transection start time
      const initiatedAt = new Date();
      const startTime = Date.now();

      //send xrp
      const transferResult = await sendXRP({
        senderSeed: senderAddress,
        destination: receiverAddress,
        amount: cryptoAmountSent.toFixed(6),
      });

      //transection completion time
      const completedAt = new Date();
      const endTime = Date.now();

      //proceesing time
      const processingTimeMs = endTime - startTime;
      const processingTimeSeconds = processingTimeMs / 1000;

      //swift messge genaration
      //FIX: pass full user docs (senderUser/receiverUser) so
      //generateSwiftMXMessage can read sender.country etc.
      const swiftMessage = generateSwiftMXMessage({
        sender: senderUser,
        receiver: receiverUser,
        amount,
        sourceCurrency,
        destinationCurrency,
      });

      //compliance log
      //FIX: amlResult was never defined — hardcoded riskScore to 0
      //to match the hardcoded amlStatus: "ok" below.
      await ComplianceLog.create({
        sender: senderUser._id,
        receiver: receiverUser._id,
        riskScore: 0,
        amlStatus: 'ok',
        reasons: [''],
      });

      //xrp details
      const txHash = transferResult.result.result.hash;
      const ledgerIndex = transferResult.result.result.ledger_index;
      const networkFeeDrops = transferResult.networkFeeDrops;
      const networkFeeXRP = Number(transferResult.networkFeeXRP);
      //FIX: usd_to_xrp was never defined — this file only defines
      //xrp_to_usd. Using that instead (XRP amount * price per XRP in USD).
      const networkFeeSourceCurrency = networkFeeXRP * xrp_to_usd;
      const networkFeeUSD = networkFeeXRP * xrp_to_usd;

      //total cost in usd
      const totalCostUSD = Number(amount) + networkFeeUSD;

      //aditional info
      const xrpPrice = 1.37;

      //fxfees
      const fxFee = parseFloat(amount) * 0.01;

      //total deducted amount from sender
      //FIX: referenced fxFees (undefined) — variable above is fxFee.
      const totalDeducted = parseFloat(amount) + parseFloat(fxFee);

      //save transection details
      const transection = await Transection.create({
        sender: senderUser._id,
        receiver: receiverUser._id,
        settlementNetwork: 'XRP',
        senderAddress: senderAddress,
        receiverAddress: receiverAddress,
        senderCountry: 'usa',
        receiverCountry: 'bangladesh',
        amount,
        currency: 'XRP',
        txHash,
        initiatedAt,
        completedAt,
        processingTimeMs,
        processingTimeSeconds,
        networkFeeDrops,
        networkFeeXRP,
        ledgerIndex,
        sourceCurrency,
        destinationCurrency,
        exchangeRate: 123.8,
        convertedAmount,
        cryptoAmountSent,
        cryptoPrice: xrpPrice,
        networkFeeSourceCurrency,
        networkFeeUSD,
        fxFee,
        totalDeducted,
        totalCostUSD,
        swiftMessageType: swiftMessage.messageType,
        swiftMessageId: swiftMessage.messageId,
        amlStatus: 'ok',
        riskScore: 0,
        amlReasons: [''],
        status: 'completed',
      });

      //show ith transection completed
      console.log(`XRPL Transaction No : ${i} Completed`);

      //geting ledger info
      const ldg_index = transferResult.result.result.ledger_index;
      const ldgInfo = await getLedgerInfo(ldg_index);
      const ledger = ldgInfo.ledger;

      //create ledger instance
      //FIX: freshSender/freshReceiver were the unresolved async
      //functions (and freshReceiver was also misspelled vs
      //freshReciever). Using senderUser/receiverUser (the resolved
      //docs passed into this function) instead.
      const ledgerInstance = await TestNetLedger.create({
        sender: senderUser._id,
        receiver: receiverUser._id,
        ledger_hash: ledger.ledger_hash,
        parent_ledger_hash: ledger.parent_hash,
        ledger_index: ledger.ledger_index,
        validated: ldgInfo.validated,
        close_time_human: ledger.close_time_human,
        close_time_iso: ledger.close_time_iso,
        transaction_hash: txHash,
        xrp_amount: cryptoAmountSent,
        source_currency: sourceCurrency,
        destination_currency: destinationCurrency,
        source_currency_amount: amount,
        destination_currency_amount: convertedAmount,
        sender_address: senderUser.wallets.xrpl.address,
        receiver_address: receiverUser.wallets.xrpl.address,
      });
    } catch (error) {
      console.log(`XRPL Transection Failed Currently at ${i}th Transaction`);
      console.log('error', error);
      break;
    }
  }
};

const senderAddress = 'sEdVT6wG8bfBNACJd8ZtyWw3S5dpE4H';
const receiverAddress = 'rHnjGSrehNFW5sFXrZUojiTQacmiDo8TTP';
const scurrency = 'usd';
const dcurrency = 'bdt';

//FIX: everything below used to run at module load time, before Mongo
//connected and before freshSender/freshReciever (which were unresolved
//async functions) were awaited. Wrapped in an async main() that runs
//after resolving the real user docs, and validates them the way the
//original file's (always-truthy, since it checked a function reference)
//validation intended to.
const main = async () => {
  const senderUser = await freshSender(sender);
  const receiverUser = await freshReciever(receiver);

  if (!senderUser) throw new Error('sender not found');
  if (!receiverUser) throw new Error('Receiver not found');

  //convert amount to soucrce currency to destination currency
  const convertedAmount = parseFloat(amount) / parseFloat(usd_to_bdt);

  //source currency converted to xrp
  const cryptoAmountSent = parseFloat(amount) / parseFloat(xrp_to_usd);

  await sendXRPToReciver(
    senderAddress,
    receiverAddress,
    cryptoAmountSent,
    scurrency,
    dcurrency,
    amount,
    convertedAmount,
    senderUser,
    receiverUser
  );
};

main();
