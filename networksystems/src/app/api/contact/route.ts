import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, company, email, phone, message } = body;

    // Validate required fields
    if (!name || !email || !company) {
      return NextResponse.json(
        { error: 'Name, email, and company are required' },
        { status: 400 }
      );
    }

    // Email content
    const emailData = {
      to: 'somtonwekec@gmail.com',
      subject: `Strategic Briefing Request - ${company}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px;">
            New Strategic Briefing Request
          </h2>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Contact Information</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Company:</strong> ${company}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          </div>

          ${message ? `
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">Mining Challenges & Message</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          ` : ''}

          <div style="background-color: #e5e7eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>Source:</strong> MIAR Platform Landing Page<br>
              <strong>Submitted:</strong> ${new Date().toLocaleString()}<br>
              <strong>Next Steps:</strong> Contact within 24 hours to schedule strategic briefing
            </p>
          </div>
        </div>
      `,
      text: `
Strategic Briefing Request - ${company}

Contact Information:
Name: ${name}
Company: ${company}
Email: ${email}
Phone: ${phone || 'Not provided'}

${message ? `Mining Challenges & Message:\n${message}\n` : ''}

Submitted from MIAR Platform on ${new Date().toLocaleString()}
Contact within 24 hours to schedule strategic briefing.
      `
    };

    // Log the structured data for now
    console.log('=== STRATEGIC BRIEFING REQUEST ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Company:', company);
    console.log('Contact:', name);
    console.log('Email:', email);
    console.log('Phone:', phone || 'Not provided');
    console.log('Message:', message || 'No additional message');
    console.log('===================================');

    // For production, integrate with email service:
    // Example with Resend:
    // const { data, error } = await resend.emails.send(emailData);

    // Example with SendGrid:
    // await sgMail.send(emailData);

    // Example with Nodemailer SMTP:
    // await transporter.sendMail(emailData);

    // Store in database or send webhook notification
    // await saveToDatabase({ name, company, email, phone, message, timestamp: new Date() });

    return NextResponse.json({
      success: true,
      message: 'Strategic briefing request submitted successfully'
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Contact API endpoint is working',
    endpoint: '/api/contact',
    method: 'POST'
  });
}