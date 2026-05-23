//dependencies
import jwt from 'jsonwebtoken';

//models
import User from '../models/User.js';

//authentication middleware
export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      //get the token from meta data
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        message: 'no token',
      });
    }

    //decode the jwt
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //try to find user with the id
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status({
        message: 'user not found',
      });
    }

    //atach user to request
    req.user = user;

    next();
  } catch (error) {
    console.log(error.message);
    res.status(401).json({
      message: 'Not authorized',
    });
  }
};
