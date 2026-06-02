//dependencies

//utils function
import generateToken from '../utils/generateToken.js';
import { hashPassword } from '../utils/hashpassword.js';
import emailQueue from '../queues/emailQueue.js';
import comparePassword from '../utils/comparePassword.js';
import generateJwtToken from '../utils/jwtgenerator.js';

//model
import User from '../models/User.js';

//services
import { createWallet } from '../services/xrplService.js';

//Register User
export const registerUser = async (req, res) => {
  try {
    //collect name email password
    const { name, email, password, country, nid_no, passport_no, dateOfBirth } =
      req.body;

    if (!name || !email || !password || !country || !nid_no || !dateOfBirth) {
      return res.status(400).json({
        message: 'please fill out all the field with valid credintials',
      });
    }

    //convert country to lower case
    const lowerCaseCountry = country.trim().toLowerCase();

    //check nid is valid or not (must be 10 or 17 digit)
    const nidRegex = /^\d{10}$|^\d{17}$/;

    if (!nidRegex.test(nid_no)) {
      return res.status(400).json({
        message: 'NID number must be either 10 or 17 digits long',
      });
    }

    //check passport number is valid or not (must be 9 characters long and start with a letter followed by 8 digits)
    const passportRegex = /^[A-Za-z]\d{8}$/;

    if (!passportRegex.test(passport_no)) {
      return res.status(400).json({
        message:
          'Passport number must be 9 characters long, starting with a letter followed by 8 digits',
      });
    }

    //check if age is above 18
    const birthDate = new Date(dateOfBirth);
    const ageDiff = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiff);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);

    if (age < 18) {
      return res.status(400).json({
        message: 'you must be at least 18 years old to register',
      });
    }

    //password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          'password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
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

    //create xrpl wallet
    const xrplWallet = await createWallet();

    //create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      country: lowerCaseCountry,
      nid_no,
      passport_no: passport_no ? passport_no : null,
      dateOfBirth,
      verificationToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
      wallet: {
        address: xrplWallet.address,
        seed: xrplWallet.seed,
        publicKey: xrplWallet.publicKey,
        privateKey: xrplWallet.privateKey,
      },
    });

    //create verification link
    const verificationLink = `${process.env.CLIENT_URL}/api/auth/verify-email/${verificationToken}`;

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

//reset password request
export const resetPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body; //get the email

    //check if the email is realy belong to an account
    const user = await User.findOne({
      email: email,
    });

    if (!user) {
      return res.status(403).json({
        message: 'this is not a valid email',
      });
    }

    //generate token
    const resetPassToken = generateToken();

    //verification token
    const resetPasswordLink = `${process.env.CLIENT_URL}/api/auth/reset-password/${resetPassToken}`;

    //set resetpassword token and expiry time to user db
    user.resetPasswordToken = resetPassToken;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; //set 30 min lifetime
    await user.save(); //save the user

    //send the link via email
    await emailQueue.add('sendResetPasswordLink', {
      to: email,
      subject: 'reset password',
      html: `
        <h2>password reset</h2>
        <p>Click below reset your password</p>
        <a href = "${resetPasswordLink}">
        reset password
        </a>
        `,
    });

    return res.status(200).json({
      message:
        'a password reset link sent to your email address, please check your mail',
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

//password reset
export const resetPassword = async (req, res) => {
  try {
    //get the token from param
    const { token } = req.params;
    //get new password from payload
    const { newPassword } = req.body;

    //check if the token is valid or not
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(403).json({
        message: 'invalid or expired token',
      });
    }

    //hash the new password
    const hashedPassword = await hashPassword(newPassword);

    //user update
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save(); //save the user

    res.status(201).json({
      message:
        'your password has been reset. Now try to login with new password',
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
