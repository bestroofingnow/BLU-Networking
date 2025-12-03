import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.FROM_NAME || 'BLU Networking';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Email not sent.');
      return false;
    }

    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error('Failed to send email:', error);
      return false;
    }

    console.log('Email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send welcome email to new members
 */
export async function sendWelcomeEmail(
  to: string,
  username: string,
  organizationName: string
): Promise<boolean> {
  const subject = `Welcome to ${organizationName}!`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Welcome to ${organizationName}!</h1>

          <p>Hi ${username},</p>

          <p>Welcome to the BLU Networking Platform! We're excited to have you join our community.</p>

          <p>Here's what you can do with your account:</p>
          <ul style="background-color: white; padding: 20px; border-radius: 5px;">
            <li style="margin-bottom: 10px;">Browse and connect with other members</li>
            <li style="margin-bottom: 10px;">Register for networking events</li>
            <li style="margin-bottom: 10px;">Track and manage your business leads</li>
            <li style="margin-bottom: 10px;">Access AI-powered networking tips</li>
            <li style="margin-bottom: 10px;">Participate in board meetings and discussions</li>
          </ul>

          <p>To get started, log in to your account and complete your profile.</p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.APP_URL || 'http://localhost:5000'}/auth"
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Log In Now
            </a>
          </div>

          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            If you have any questions, feel free to reach out to your organization administrator.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `Welcome to ${organizationName}!

Hi ${username},

Welcome to the BLU Networking Platform! We're excited to have you join our community.

Here's what you can do with your account:
- Browse and connect with other members
- Register for networking events
- Track and manage your business leads
- Access AI-powered networking tips
- Participate in board meetings and discussions

To get started, log in to your account and complete your profile.

If you have any questions, feel free to reach out to your organization administrator.`;

  return sendEmail({ to, subject, html, text });
}

/**
 * Send event registration confirmation email
 */
export async function sendEventRegistrationEmail(
  to: string,
  username: string,
  eventTitle: string,
  eventDate: string,
  eventLocation: string
): Promise<boolean> {
  const subject = `Event Registration Confirmed: ${eventTitle}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h1 style="color: #10b981; margin-bottom: 20px;">✓ Registration Confirmed!</h1>

          <p>Hi ${username},</p>

          <p>You're successfully registered for the following event:</p>

          <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #2563eb; margin-top: 0;">${eventTitle}</h2>
            <p style="margin: 10px 0;"><strong>Date:</strong> ${eventDate}</p>
            <p style="margin: 10px 0;"><strong>Location:</strong> ${eventLocation}</p>
          </div>

          <p>We look forward to seeing you there! Don't forget to bring business cards for networking.</p>

          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            Need to cancel? Contact your organization administrator.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `Registration Confirmed!

Hi ${username},

You're successfully registered for the following event:

Event: ${eventTitle}
Date: ${eventDate}
Location: ${eventLocation}

We look forward to seeing you there! Don't forget to bring business cards for networking.

Need to cancel? Contact your organization administrator.`;

  return sendEmail({ to, subject, html, text });
}

/**
 * Send lead follow-up reminder email
 */
export async function sendLeadReminderEmail(
  to: string,
  username: string,
  leadName: string,
  leadCompany: string,
  followUpDate: string
): Promise<boolean> {
  const subject = `Reminder: Follow up with ${leadName}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h1 style="color: #f59e0b; margin-bottom: 20px;">⏰ Follow-up Reminder</h1>

          <p>Hi ${username},</p>

          <p>This is a friendly reminder to follow up with:</p>

          <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #2563eb; margin-top: 0;">${leadName}</h2>
            <p style="margin: 10px 0;"><strong>Company:</strong> ${leadCompany}</p>
            <p style="margin: 10px 0;"><strong>Follow-up Date:</strong> ${followUpDate}</p>
          </div>

          <p>Don't let this opportunity slip away! Reach out today to keep the conversation going.</p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.APP_URL || 'http://localhost:5000'}/leads"
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Lead Details
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Follow-up Reminder

Hi ${username},

This is a friendly reminder to follow up with:

Name: ${leadName}
Company: ${leadCompany}
Follow-up Date: ${followUpDate}

Don't let this opportunity slip away! Reach out today to keep the conversation going.`;

  return sendEmail({ to, subject, html, text });
}

/**
 * Send new member spotlight notification
 */
export async function sendSpotlightNotificationEmail(
  to: string[],
  spotlightMemberName: string,
  achievement: string
): Promise<boolean> {
  const subject = `Member Spotlight: ${spotlightMemberName}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h1 style="color: #8b5cf6; margin-bottom: 20px;">⭐ Member Spotlight</h1>

          <p>We're excited to spotlight one of our outstanding members!</p>

          <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #2563eb; margin-top: 0;">${spotlightMemberName}</h2>
            <p style="margin: 10px 0;"><strong>Achievement:</strong> ${achievement}</p>
          </div>

          <p>Congratulations to ${spotlightMemberName} on this remarkable accomplishment!</p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.APP_URL || 'http://localhost:5000'}/members"
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Member Directory
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Member Spotlight: ${spotlightMemberName}

We're excited to spotlight one of our outstanding members!

Member: ${spotlightMemberName}
Achievement: ${achievement}

Congratulations to ${spotlightMemberName} on this remarkable accomplishment!`;

  return sendEmail({ to, subject, html, text });
}

/**
 * Send board meeting minutes notification
 */
export async function sendBoardMinutesEmail(
  to: string[],
  meetingDate: string,
  meetingSummary: string
): Promise<boolean> {
  const subject = `Board Meeting Minutes - ${meetingDate}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">📋 Board Meeting Minutes</h1>

          <p>The minutes from our board meeting have been published.</p>

          <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Meeting Date:</strong> ${meetingDate}</p>
            <p style="margin: 10px 0;"><strong>Summary:</strong></p>
            <p style="margin: 10px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
              ${meetingSummary}
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.APP_URL || 'http://localhost:5000'}/board-minutes"
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Full Minutes
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Board Meeting Minutes - ${meetingDate}

The minutes from our board meeting have been published.

Meeting Date: ${meetingDate}
Summary: ${meetingSummary}

View the full minutes on the BLU Networking Platform.`;

  return sendEmail({ to, subject, html, text });
}
