const { Resend } = require("resend");
const path = require("path");
const fs = require("fs");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendPasswordResetEmail = async ({ email, resetUrl }) => {
  const fromEmail =
    process.env.SMTP_FROM || process.env.SMTP_USER || "onboarding@resend.dev";

  const logoPath =
    "C:/Users/ELCOT/Turf-Booking-App/frontend/src/assets/images/logo.png";
  let attachments = [];
  if (fs.existsSync(logoPath)) {
    attachments = [
      {
        filename: "logo.png",
        content: fs.readFileSync(logoPath),
      },
    ];
  }

  const { data, error } = await resend.emails.send({
    from: `"Namma Ooru Turf" <${fromEmail}>`,
    to: email,
    subject: "Forgot your password?",
    text: `To reset your password, click the link below: ${resetUrl}`,
    html: `
      <div style="background-color: #ffffff; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827;">
        <div style="max-width: 500px; margin: 0 auto; text-align: center;">
          <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 24px; line-height: 1.3;">
            Forgot your password?<br/>It happens to the best of us.
          </h1>
          
          <p style="font-size: 16px; color: #4b5563; line-height: 1.5; margin-bottom: 40px; padding: 0 20px;">
            To reset your password, click the button below. The link will self-destruct after 1 hour.
          </p>
          
          <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #0A9847; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px; margin-bottom: 60px;">
            Reset your password
          </a>
          
          <p style="font-size: 13px; color: #9ca3af; line-height: 1.6; padding: 0 10px;">
            If you do not want to change your password or didn't request a reset, you can ignore and delete this email.
          </p>
        </div>
      </div>
    `,
    attachments: attachments,
  });

  if (error) {
    console.error("Resend API Error:", error);
    throw new Error(error.message);
  }

  console.log("Email sent successfully:", data);
};

module.exports = { sendPasswordResetEmail };
