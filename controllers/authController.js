import crypto from 'crypto';
import User from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';
import { buildEmailParams } from '../utils/emailTemplates.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        companyName: user.companyName,
        currency: user.currency,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        upiId: user.upiId || ''
      }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = String(req.body.email || '').trim().toLowerCase();

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const password = req.body.password;
    const email = String(req.body.email || '').trim().toLowerCase();

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Request password reset email
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your account email' });
    }

    const user = await User.findOne({ email });
    const safeReply = {
      success: true,
      message: 'If that email is registered, a reset link has been sent.',
    };

    if (!user) {
      return res.status(200).json(safeReply);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const appUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetLink = `${appUrl}/reset-password/${rawToken}`;

    const mail = buildEmailParams({
      name: user.name,
      email: user.email,
      resetLink,
      type: 'reset',
      appUrl,
    });

    return res.status(200).json({
      ...safeReply,
      mail,
      devResetLink: process.env.NODE_ENV !== 'production' ? resetLink : undefined,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Reset password with emailed token
// @route   PUT /api/auth/resetpassword/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated. You can now log in with your new password.',
      mail: buildEmailParams({
        name: user.name,
        email: user.email,
        type: 'changed',
        appUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
      }),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.companyName = req.body.companyName !== undefined ? req.body.companyName : user.companyName;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    user.address = req.body.address !== undefined ? req.body.address : user.address;
    user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;
    user.currency = req.body.currency !== undefined ? req.body.currency : user.currency;
    user.upiId = req.body.upiId !== undefined ? req.body.upiId : user.upiId;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        companyName: updatedUser.companyName,
        currency: updatedUser.currency,
        phone: updatedUser.phone,
        address: updatedUser.address,
        avatar: updatedUser.avatar,
        upiId: updatedUser.upiId || ''
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Google OAuth Sign-In / Sign-Up
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res) => {
  try {
    const { accessToken, userInfo } = req.body;

    if (!accessToken || !userInfo) {
      return res.status(400).json({ success: false, message: 'Google token and user info are required' });
    }

    // Verify the access token with Google
    const tokenVerify = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
    );
    const tokenData = await tokenVerify.json();

    if (tokenData.error || !tokenData.email) {
      return res.status(401).json({ success: false, message: 'Invalid Google access token' });
    }

    // Ensure the token email matches the userInfo email
    if (tokenData.email !== userInfo.email) {
      return res.status(401).json({ success: false, message: 'Token email mismatch' });
    }

    const { sub: googleId, email, name, picture } = userInfo;

    // Find user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Link googleId if user previously registered with email/password
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.avatar && picture) user.avatar = picture;
        await user.save();
      }
    } else {
      // Create new Google user (no password required)
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture || '',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Google auth error:', error.message);
    res.status(401).json({ success: false, message: 'Google sign-in failed. Please try again.' });
  }
};
