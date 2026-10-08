import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'anshuar9065@gmail.com',
    pass: 'bkqwcyhszrytbrcx'
  }
});

async function main() {
  console.log('Verifying SMTP connection...');
  await transporter.verify();
  console.log('SMTP connection verified!');

  const info = await transporter.sendMail({
    from: '"REXION Career OS" <anshuar9065@gmail.com>',
    to: 'anshuar9065@gmail.com, pookii2316@gmail.com',
    subject: '🎉 [CONFIRMATION] REXION 1-Click Job Application Delivered!',
    html: `
      <div style="background-color:#030705;color:#f4f7f4;padding:32px 20px;font-family:sans-serif;">
        <div style="max-width:560px;margin:0 auto;background:#0b130e;border:1px solid #10b981;border-radius:16px;padding:24px;">
          <h2 style="color:#10b981;margin-top:0;">REXION 1-Click Autopilot Confirmation</h2>
          <p>Your 1-Click job application autopilot has successfully executed.</p>
          <div style="background:#13231a;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:4px 0;"><strong>Role:</strong> Software & ML Engineer</p>
            <p style="margin:4px 0;"><strong>Company:</strong> GitLab / Stripe (Greenhouse ATS)</p>
            <p style="margin:4px 0;"><strong>Status:</strong> <span style="color:#10b981;">✓ Submitted & Confirmed</span></p>
            <p style="margin:4px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="font-size:13px;color:#8aa392;">This confirmation was delivered directly from your configured REXION Career OS backend.</p>
        </div>
      </div>
    `
  });
  console.log('Email sent successfully! MessageId:', info.messageId);
}

main().catch(err => {
  console.error('SMTP Error:', err.message);
});
