// Email templates for Resend
export const emailTemplates = {
  verificationEmail: (code: string, email: string) => ({
    to: email,
    subject: 'Verify Your Bixfind Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1>Welcome to Bixfind</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <p>Thank you for signing up! Please verify your email with this code:</p>
          <div style="background-color: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <p style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 4px;">${code}</p>
          </div>
          <p style="color: #666; font-size: 12px;">This code expires in 24 hours.</p>
        </div>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; 2025 Bixfind. Find Every Service, Every Provider, Everywhere.</p>
        </div>
      </div>
    `,
  }),

  welcomeEmail: (name: string, email: string) => ({
    to: email,
    subject: 'Welcome to Bixfind!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1>Welcome, ${name}!</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <p>Your account has been successfully created. You're now part of Bixfind.</p>
          <p style="margin-top: 20px;">
            <a href="https://bixfind.netlify.app/dashboard" 
               style="background-color: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Go to Dashboard
            </a>
          </p>
        </div>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; 2025 Bixfind. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  contactReplyEmail: (name: string, email: string) => ({
    to: email,
    subject: 'We Received Your Message',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1>Thank You, ${name}</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <p>We've received your message and will get back to you soon.</p>
          <p>Expected response time: 24-48 hours</p>
        </div>
      </div>
    `,
  }),
};

// Mock Resend API - in production, use actual Resend
export async function sendEmail(emailData: any) {
  console.log('Email sent (Resend):', emailData.to, emailData.subject);
  return { success: true, id: `mock_${Date.now()}` };
}
