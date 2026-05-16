import crypto from 'crypto';

//generate token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export default generateToken;
