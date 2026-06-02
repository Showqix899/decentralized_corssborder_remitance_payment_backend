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

    if (user.isVerified === false) {
      return res.status(403).json({
        message: 'user is not verified',
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

//admin auth
export const isAdmin = async (req, res, next) => {
  try {
    let token;

    //check headers for token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    //if jwt token missing
    if (!token) {
      return res.status(401).json({
        message: 'no token',
      });
    }

    //deocode jwt token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //check the user
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status({
        message: 'user not found',
      });
    }

    if (user.isVerified === false) {
      return res.status(403).json({
        message: 'user is not verified',
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        message: 'user do not have permission to do this operation',
      });
    }

    //attach user to request
    req.user = user;

    next();
  } catch (error) {
    console.log(error.message);
    res.status(401).json({
      message: 'Not authorized',
    });
  }
};
