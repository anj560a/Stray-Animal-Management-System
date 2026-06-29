const express = require('express');
const router = express.Router();
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const jwt = require('jsonwebtoken');

// Signup
router.post('/signup', async(req,res)=>{
  try{
    const { name, username, password, email, mobile, role } = req.body;
    if(await User.findOne({ username })) return res.status(400).json({ msg:'Username exists' });

    const otp = Math.floor(100000 + Math.random()*900000).toString();
    const user = new User({ name, username, password, email, mobile, role, otp, otpExpires: Date.now()+5*60*1000 });
    await user.save();

    await sendEmail(email,'OTP Verification',`Your OTP is ${otp}`);
    await sendSMS(mobile, `Your OTP is ${otp}`);

    res.json({ msg:'OTP sent to email & mobile', username:user.username });
  }catch(err){ console.error(err); res.status(500).send('Server error'); }
});

// Verify OTP
router.post('/verify-otp', async(req,res)=>{
  try{
    const { username, otp } = req.body;
    const user = await User.findOne({ username });
    if(!user) return res.status(404).json({ msg:'User not found' });
    if(user.verified) return res.status(400).json({ msg:'Already verified' });
    if(user.otp!==otp || user.otpExpires<Date.now()) return res.status(400).json({ msg:'OTP invalid or expired' });

    user.verified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();
    res.json({ msg:'Account verified' });
  }catch(err){ console.error(err); res.status(500).send('Server error'); }
});

// Login
router.post('/login', async(req,res)=>{
  try{
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if(!user) return res.status(404).json({ msg:'User not found' });
    if(!user.verified) return res.status(401).json({ msg:'Account not verified' });
    if(!(await user.matchPassword(password))) return res.status(401).json({ msg:'Invalid password' });

    const token = jwt.sign({ id:user._id, role:user.role }, process.env.JWT_SECRET, { expiresIn:'1d' });
    res.json({ token, role:user.role, username:user.username });
  }catch(err){ console.error(err); res.status(500).send('Server error'); }
});

// Forget password - send OTP
router.post('/forget-password', async(req,res)=>{
  try{
    const { username } = req.body;
    const user = await User.findOne({ username });
    if(!user) return res.status(404).json({ msg:'User not found' });

    const otp = Math.floor(100000 + Math.random()*900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now()+5*60*1000;
    await user.save();

    await sendEmail(user.email,'Password Reset OTP', `Your OTP is ${otp}`);
    await sendSMS(user.mobile, `Your OTP is ${otp}`);
    res.json({ msg:'OTP sent to email & mobile' });
  }catch(err){ console.error(err); res.status(500).send('Server error'); }
});

// Reset password
router.post('/reset-password', async(req,res)=>{
  try{
    const { username, otp, newPassword } = req.body;
    const user = await User.findOne({ username });
    if(!user) return res.status(404).json({ msg:'User not found' });
    if(user.otp!==otp || user.otpExpires<Date.now()) return res.status(400).json({ msg:'OTP invalid or expired' });

    user.password = newPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();
    res.json({ msg:'Password reset successful' });
  }catch(err){ console.error(err); res.status(500).send('Server error'); }
});

module.exports = router;
