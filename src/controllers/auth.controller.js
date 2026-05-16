//dependencies

//utils function
import generateToken from '../utils/generateToken.js';
import { hashPassword } from '../utils/hashpassword.js';
import emailQueue from '../queues/emailQueue.js';
import comparePassword from '../utils/comparePassword.js';
import generateJwtToken from '../utils/jwtgenerator.js';

//model
import User from '../models/User.js';

//Register User
export const registerUser = async (req, res) => {
  try {
    //collect name email password
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'please fill out all the field with valid credintials',
      });
    }

    //check if the user exists already
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists',
      });
    }

    //hashpassword
    const hashedPassword = await hashPassword(password);

    //generate verification tokem
    const verificationToken = generateToken();

    //create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
    });

    //create verification link
    const verificationLink = `${process.env.CLIENT_URL}/verify/${verificationToken}`;

    //add this sending email job to queue
    await emailQueue.add('sendVerificationEmail', {
      to: user.email,
      subject: 'verify your account',
      html: `
        <h2>Email Verification</h2>
        <p>Click below to verify your account</p>
        <a href = "${verificationLink}">
        verify account
        </a>
        `,
    });

    res.status(201).json({
      message:
        'user registered successfully, a verification email is sent to this address. Please verify the account',
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//verify email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params; //g token from prameter

    //check the token is valid or not
    const user = await User.findOne({
      verificationToken: token,

      verificationTokenExpires: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired token',
      });
    }

    //set user as  valid
    user.isVerified = true;

    user.verificationToken = undefined; //token not needed anymore

    user.verificationTokenExpires = undefined; //expirey date is not needed anymore

    await user.save(); //save the user state

    res.json({
      message: 'Account verified successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// login users
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body; //get email and password from request

    const user = await User.findOne({ email }); //find the email exist or not

    if (!user) {
      return res.status(400).json({
        message: 'Invalid credentials',
      });
    }

    //check user is verified or not
    if (!user.isVerified) {
      return res.status(401).json({
        message: 'Please verify your email first',
      });
    }

    //verify the password
    const isMatch = comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid credentials',
      });
    }

    res.json({
      _id: user._id,

      name: user.name,

      email: user.email,

      walletAddress: user.walletAddress,

      token: generateJwtToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
