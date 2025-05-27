const express = require('express');
const router = express.Router();
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

// Add a test route to verify this file is loaded
router.get('/test', (req, res) => {
  res.json({ message: 'Agora routes are working!' });
});

// Generate Agora token without checking booking authorization
router.post('/token', async (req, res) => {
  try {
    console.log('Token request received:', req.body);
    const { channelName, uid } = req.body;
    
    if (!channelName || !uid) {
      return res.status(400).json({
        success: false,
        message: 'Channel name and user ID are required'
      });
    }
    
    console.log(`Generating token for channel: ${channelName}, uid: ${uid}`);
    
    // Generate Agora token
    const appID = process.env.AGORA_APP_ID || '1586fac71f52450497da9c0b5e998a15';
    const appCertificate = process.env.AGORA_APP_CERTIFICATE || '23929df2723d4834a5d7390b5ff3ed56';
    
    // Convert string UID to numeric UID (Agora requires numeric UIDs)
    const numericUid = parseInt(uid.toString().replace(/[^0-9]/g, '').substring(0, 8), 10) % 1000000;
    
    const role = RtcRole.PUBLISHER;
    
    // Token expires in 2 hours
    const expirationTimeInSeconds = 7200;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    // Build token with uid
    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      channelName,
      numericUid,
      role,
      privilegeExpiredTs
    );
    
    console.log(`Token generated successfully for channel: ${channelName}`);
    
    res.json({
      success: true,
      token: token,
      uid: numericUid
    });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate token'
    });
  }
});

module.exports = router;






