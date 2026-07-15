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
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr>
<td align="center">

<table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;padding:40px;">

<tr>
<td align="center">

<h1 style="margin:0;color:#7c3aed;font-size:30px;">
⚡ ViralStudio AI
</h1>

<p style="margin-top:12px;font-size:24px;font-weight:bold;color:#111827;">
Verify Your Email
</p>

<p style="font-size:15px;color:#6b7280;line-height:24px;">
Welcome to ViralStudio AI.<br>
Use the verification code below to activate your account.
</p>

<div style="
margin:35px 0;
padding:22px;
background:#f3f0ff;
border:2px dashed #7c3aed;
border-radius:14px;
font-size:38px;
font-weight:700;
letter-spacing:10px;
color:#7c3aed;
">
${code}
</div>

<p style="font-size:14px;color:#6b7280;">
This verification code will expire in
<strong>10 minutes</strong>.
</p>

<hr style="margin:35px 0;border:none;border-top:1px solid #e5e7eb;">

<p style="font-size:13px;color:#9ca3af;line-height:22px;">
If you didn't create a ViralStudio account, you can safely ignore this email.
</p>

<p style="margin-top:25px;font-size:12px;color:#9ca3af;">
© 2026 ViralStudio AI. All rights reserved.
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`,
  });
}
