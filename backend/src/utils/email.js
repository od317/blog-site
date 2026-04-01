const nodemailer = require("nodemailer");

// Create transporter (using ethereal for testing)
const createTransporter = () => {
  // For development, we'll use ethereal.email (fake email service)
  if (process.env.NODE_ENV === "development" && !process.env.EMAIL_USER) {
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "test@ethereal.email", // This will be overridden
        pass: "test",
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const transporter = createTransporter();

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@blogapp.com",
    to: email,
    subject: "Verify Your Email - Blog App",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Blog App!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Or copy and paste this link: ${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can ignore this email.</p>
      </div>
    `,
  };

  // For development, log the verification URL
  if (process.env.NODE_ENV === "development") {
    console.log("\n📧 Email verification link:");
    console.log(verificationUrl);
    console.log("(In production, this would be sent via email)\n");
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    if (info.messageId.includes("ethereal")) {
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw error in development
    if (process.env.NODE_ENV !== "development") {
      throw error;
    }
  }
};

module.exports = { sendVerificationEmail };
