import { Resend } from 'resend';

/**
 * Sends a summary report of the automated application batch run.
 * @param {string} email - Recipient email address
 * @param {Object} profile - Candidate profile details
 * @param {Array} results - Array of application outcomes [{ title, company, url, status, reason }]
 * @returns {Promise<Object>} - Resend API response
 */
export async function sendEmail(email, profile, results) {
  if (!email || typeof email !== 'string') {
    throw new Error('Recipient email is required');
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not defined in environment variables');
  }

  const resend = new Resend(apiKey);

  const appliedCount = results.filter(r => r.status === 'applied').length;
  const readySubmitCount = results.filter(r => r.status === 'ready_to_submit').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;

  const summaryPillHtml = `
    <div style="display: flex; gap: 10px; margin-bottom: 20px; justify-content: space-around; background-color: #f3f4f6; padding: 15px; border-radius: 8px;">
      <div style="text-align: center;">
        <span style="display: block; font-size: 20px; font-weight: bold; color: #10b981;">${appliedCount}</span>
        <span style="font-size: 11px; color: #6b7280;">Applied</span>
      </div>
      <div style="text-align: center;">
        <span style="display: block; font-size: 20px; font-weight: bold; color: #f59e0b;">${readySubmitCount}</span>
        <span style="font-size: 11px; color: #6b7280;">Ready to Submit</span>
      </div>
      <div style="text-align: center;">
        <span style="display: block; font-size: 20px; font-weight: bold; color: #ef4444;">${failedCount}</span>
        <span style="font-size: 11px; color: #6b7280;">Failed</span>
      </div>
      <div style="text-align: center;">
        <span style="display: block; font-size: 20px; font-weight: bold; color: #6b7280;">${skippedCount}</span>
        <span style="font-size: 11px; color: #6b7280;">Skipped</span>
      </div>
    </div>
  `;

  let resultsHtml = '';
  if (results && results.length > 0) {
    resultsHtml = results.map((res, index) => {
      let statusColor = '#6b7280'; // Grey for skipped
      let statusLabel = 'Skipped';

      if (res.status === 'applied') {
        statusColor = '#10b981'; // Green
        statusLabel = 'Applied';
      } else if (res.status === 'ready_to_submit') {
        statusColor = '#f59e0b'; // Amber
        statusLabel = 'Ready to Submit';
      } else if (res.status === 'failed') {
        statusColor = '#ef4444'; // Red
        statusLabel = 'Failed';
      }

      return `
        <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-bottom: 12px; background-color: #ffffff;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="vertical-align: top;">
                <h4 style="margin: 0 0 5px 0; color: #111827; font-size: 16px;">${index + 1}. ${res.title}</h4>
                <p style="margin: 3px 0; color: #4b5563; font-size: 13px;"><strong>Company:</strong> ${res.company}</p>
                <p style="margin: 3px 0; color: #6b7280; font-size: 12px; word-break: break-all;"><strong>URL:</strong> <a href="${res.url}" target="_blank" style="color: #2563eb; text-decoration: none;">${res.url}</a></p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #9ca3af; font-style: italic;"><strong>Details:</strong> ${res.reason || 'N/A'}</p>
              </td>
              <td style="width: 120px; text-align: right; vertical-align: middle;">
                <span style="display: inline-block; background-color: ${statusColor}; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
                  ${statusLabel}
                </span>
              </td>
            </tr>
          </table>
        </div>
      `;
    }).join('');
  } else {
    resultsHtml = '<p style="color: #6b7280;">No jobs processed in this run.</p>';
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>REXION AI - Auto-Apply Summary Report</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
            <h1 style="margin: 0; color: #2563eb;">REXION AI</h1>
            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 16px;">1-Click Auto-Apply Batch Summary</p>
          </div>
          
          <p>Hello,</p>
          <p>Your automated job application batch run has finished executing. Below is the summary of outcomes for this run:</p>
          
          ${summaryPillHtml}
          
          <h3 style="color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px;">Application Results</h3>
          ${resultsHtml}
          
          ${failedCount > 0 || skippedCount > 0 ? `
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-top: 20px; border-radius: 4px;">
              <p style="margin: 0; font-size: 13px; color: #991b1b; font-weight: bold;">⚠️ Manual Review Advised</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #7f1d1d;">Some applications were skipped or failed. We recommend clicking the URLs above to complete those applications manually.</p>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; font-size: 12px; color: #9ca3af;">
            <p>This is an automated batch run summary from your Rexion Dashboard.</p>
            <p>&copy; ${new Date().getFullYear()} Rexion AI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: 'Rexion AI <onboarding@resend.dev>',
      to: [email],
      subject: `REXION AI - Auto-Apply Run Summary (${appliedCount + readySubmitCount}/${results.length} Success)`,
      html: emailHtml
    });

    if (data.error) {
      throw new Error(`Resend API Error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to send summary email via Resend: ${error.message}`);
  }
}
