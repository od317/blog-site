const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
  // Use Gmail configuration from env
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const transporter = createTransporter();

// Verify transporter configuration
const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log("✅ Email transporter configured successfully");
  } catch (error) {
    console.error("❌ Email transporter error:", error.message);
  }
};

verifyTransporter();

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Blog App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email - Blog App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Welcome to Blog App! 🎉</h2>
        <p style="color: #555; font-size: 16px;">Thank you for signing up! Please verify your email address to start using your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">Verify Email Address</a>
        </div>
        <p style="color: #555; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
        <p style="color: #999; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="color: #999; font-size: 11px; text-align: center;">© Blog App. All rights reserved.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Verification email sent to:", email);
    console.log("Message ID:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Blog App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your Password - Blog App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>Or copy and paste this link: ${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Password reset email sent to:", email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  verifyTransporter,
};
