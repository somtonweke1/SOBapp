import { NextRequest, NextResponse } from 'next/server';

/**
 * Email Notification API
 * Send email alerts to users
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, message, timestamp, metadata, recipients } = body;

    // In production, integrate with SendGrid, AWS SES, or similar
    // For now, log the email that would be sent
    console.log('📧 Email Alert:', {
      subject,
      message,
      timestamp,
      metadata,
      recipients: recipients || ['default@user.com']
    });

    // Simulate email sending
    // await sendGridClient.send({
    //   to: recipients,
    //   from: 'alerts@miar.ai',
    //   subject: subject,
    //   html: generateEmailHTML(message, metadata)
    // });

    return NextResponse.json({
      success: true,
      message: 'Email notification sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Email notification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send email notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Generate HTML email template
 */
function generateEmailHTML(message: string, metadata: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SOBapp Alert</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .message {
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 4px solid #059669;
    }
    .metadata {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 6px;
      margin-top: 20px;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #059669;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="margin: 0;">SOBapp Platform Alert</h2>
  </div>
  <div class="content">
    <div class="message">
      <p>${message}</p>
    </div>

    ${metadata ? `
    <div class="metadata">
      <strong>Additional Details:</strong><br>
      ${Object.entries(metadata).map(([key, value]) =>
        `<div style="margin-top: 8px;"><strong>${key}:</strong> ${value}</div>`
      ).join('')}
    </div>
    ` : ''}

    <a href="https://miar.ai" class="button">View Dashboard</a>
  </div>
  <div class="footer">
    <p>SOBapp - Mining Intelligence & Analytics Platform</p>
    <p>You're receiving this email because you've enabled alerts for your account.</p>
    <p><a href="https://miar.ai/settings" style="color: #059669;">Manage notification preferences</a></p>
  </div>
</body>
</html>
  `;
}
