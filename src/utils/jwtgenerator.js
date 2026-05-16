import jwt from 'jsonwebtoken';

//generate JWT
const generateJwtToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

export default generateJwtToken;
