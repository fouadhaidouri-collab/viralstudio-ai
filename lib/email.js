import nodemailer from "nodemailer";

const BRAND_NAME = "ViralStudio AI";

function getTransport() {
  // Vercel-pasted secrets sometimes carry a trailing newline/space (see lib/db.js).
  // Trim everything so SMTP auth/connect props work reliably.
  const host = (process.env.SMTP_HOST || "").trim();
  const port = parseInt(String(process.env.SMTP_PORT || "587").trim(), 10);
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim();
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

function verificationHtml(from, code) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background:#f3f0ff;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f0ff;padding:40px 16px;">
<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border-radius:20px;border:1px solid #ede9fe;">

<!-- Brand header -->
<tr>
<td style="background:#7c3aed;padding:36px 40px 30px 40px;">
<div style="text-align:center;font-size:26px;font-weight:bold;color:#ffffff;letter-spacing:.5px;">⚡ ${BRAND_NAME}</div>
<div style="text-align:center;color:#ddd6fe;font-size:13px;margin-top:6px;">Create · Edit · Go Viral</div>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:40px 44px 34px 44px;">
<h1 style="margin:0 0 12px 0;font-size:23px;color:#111827;text-align:center;">Verify your email address</h1>
<p style="margin:0 0 8px 0;font-size:15px;color:#6b7280;line-height:24px;text-align:center;">
Welcome to <strong>ViralStudio AI</strong>!<br>
Use the 8-digit code below to activate your account.
</p>

<div style="margin:34px auto;width:auto;max-width:330px;background:#f6f3ff;border:2px dashed #7c3aed;border-radius:16px;padding:26px 20px;text-align:center;">
<div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#7c3aed;line-height:1.2;">${code}</div>
</div>

<p style="margin:0 0 4px 0;font-size:14px;color:#6b7280;text-align:center;">
This code is valid for <strong>10 minutes</strong>.
</p>

<hr style="margin:36px 0 26px 0;border:none;border-top:1px solid #e5e7eb;">

<p style="margin:0;font-size:13px;color:#9ca3af;line-height:22px;text-align:center;">
If you didn't create a ViralStudio account, you can safely ignore this email.
</p>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background:#faf9ff;border-top:1px solid #ede9fe;padding:22px 44px;text-align:center;">
<p style="margin:0 0 6px 0;font-size:13px;color:#7c3aed;font-weight:bold;">${from}</p>
<p style="margin:0;font-size:12px;color:#9ca3af;line-height:20px;">
© 2026 ${BRAND_NAME} · All rights reserved.
</p>
</td>
</tr>

</table>

</td>
</tr>
</table>
</body>
</html>`;
}

export async function sendVerificationEmail(email, code) {
  const from = (process.env.SMTP_FROM || process.env.SMTP_USER || "").trim();
  const transport = getTransport();
  return transport.sendMail({
    // Name that shows up in the recipient's inbox as the sender.
    from: `"${BRAND_NAME}" <${from}>`,
    to: email,
    subject: `Verify your email address — ${BRAND_NAME}`,
    text: `Welcome to ${BRAND_NAME}!\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't create an account, you can ignore this email.`,
    html: verificationHtml(from, code),
  });
}

function resetHtml(from, resetUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background:#f3f0ff;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f0ff;padding:40px 16px;">
<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border-radius:20px;border:1px solid #ede9fe;">

<!-- Brand header -->
<tr>
<td style="background:#7c3aed;padding:36px 40px 30px 40px;">
<div style="text-align:center;font-size:26px;font-weight:bold;color:#ffffff;letter-spacing:.5px;">⚡ ${BRAND_NAME}</div>
<div style="text-align:center;color:#ddd6fe;font-size:13px;margin-top:6px;">Create · Edit · Go Viral</div>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:40px 44px 34px 44px;">
<h1 style="margin:0 0 12px 0;font-size:23px;color:#111827;text-align:center;">Reset your password</h1>
<p style="margin:0 0 8px 0;font-size:15px;color:#6b7280;line-height:24px;text-align:center;">
We received a request to reset the password for your <strong>${BRAND_NAME}</strong> account.
Click the button below to choose a new password.
</p>

<div style="text-align:center;margin:34px 0;">
<a href="${resetUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:15px 38px;border-radius:12px;">Set new password</a>
</div>

<p style="margin:0 0 22px 0;font-size:14px;color:#6b7280;text-align:center;">
This link is valid for <strong>1 hour</strong>.
</p>

<p style="margin:0 0 6px 0;font-size:12px;color:#9ca3af;line-height:20px;text-align:center;">
If the button doesn't work, copy and paste this link into your browser:
</p>
<p style="margin:0;font-size:12px;color:#7c3aed;line-height:20px;text-align:center;word-break:break-all;">
${resetUrl}
</p>

<hr style="margin:34px 0 26px 0;border:none;border-top:1px solid #e5e7eb;">

<p style="margin:0;font-size:13px;color:#9ca3af;line-height:22px;text-align:center;">
If you didn't request a password reset, you can safely ignore this email — your password won't change.
</p>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background:#faf9ff;border-top:1px solid #ede9fe;padding:22px 44px;text-align:center;">
<p style="margin:0 0 6px 0;font-size:13px;color:#7c3aed;font-weight:bold;">${from}</p>
<p style="margin:0;font-size:12px;color:#9ca3af;line-height:20px;">
© 2026 ${BRAND_NAME} · All rights reserved.
</p>
</td>
</tr>

</table>

</td>
</tr>
</table>
</body>
</html>`;
}

export async function sendPasswordResetEmail(email, resetUrl) {
  const from = (process.env.SMTP_FROM || process.env.SMTP_USER || "").trim();
  const transport = getTransport();
  return transport.sendMail({
    from: `"${BRAND_NAME}" <${from}>`,
    to: email,
    subject: `Reset your password — ${BRAND_NAME}`,
    text: `We received a request to reset your ${BRAND_NAME} password.\n\nOpen this link to set a new password (valid for 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
    html: resetHtml(from, resetUrl),
  });
}