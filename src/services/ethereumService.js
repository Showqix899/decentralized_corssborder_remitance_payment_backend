import { Wallet } from 'ethers';

//create wallet
export const createEthereumWallet = () => {
  //creating ethereum wallet
  const wallet = Wallet.createRandom();

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
};
