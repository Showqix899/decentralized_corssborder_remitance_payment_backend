import xrpl from 'xrpl';

//xrp ledger configuratin
const client = new xrpl.Client(process.env.XRPL_SERVER);

export default client;
