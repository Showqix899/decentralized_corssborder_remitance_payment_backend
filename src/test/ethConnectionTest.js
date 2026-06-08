import dotenv from 'dotenv';
dotenv.config();

import { JsonRpcProvider } from 'ethers';

const connectETH = async () => {
  try {
    const provider = new JsonRpcProvider(process.env.ETH_RPC_URL);

    const network = await provider.getNetwork();

    console.log('Chain ID:', network.chainId.toString());
    console.log('Network:', network.name);
  } catch (error) {
    console.log(error.message);
  }
};

connectETH();
