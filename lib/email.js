import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error("SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env");
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendVerificationEmail(email, code) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const transport = getTransport();
  await transport.sendMail({
    from: `"ViralStudio" <${from}>`,
    to: email,
    subject: "Verify your email address",
    text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#a855f7">Welcome to ViralStudio!</h2>
      <p style="color:#666;font-size:14px">Your verification code is:</p>
      <div style="background:#f5f5f5;border-radius:12px;padding:20px;text-align:center;margin:16px 0;font-size:32px;font-weight:bold;letter-spacing:8px;color:#a855f7">${code}</div>
      <p style="color:#999;font-size:12px">This code expires in 10 minutes.</p>
    </div>`,
  });
}
