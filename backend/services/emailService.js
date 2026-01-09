import nodemailer from 'nodemailer';

// Simple transporter using only naturabliss99943@gmail.com
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  
  if (!emailUser || !emailPassword) {
    console.log('❌ Email configuration missing in .env');
    console.log('   Add these lines to your .env file:');
    console.log('   EMAIL_USER=naturabliss99943@gmail.com');
    console.log('   EMAIL_PASSWORD=your_app_password_here');
    return null;
  }

  console.log('✅ Using email:', emailUser);
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
    // Add these settings to improve deliverability
    pool: true,
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 5
  });
};

// Send password reset OTP email
export const sendPasswordResetEmail = async (email, otp, userName = 'there') => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log('❌ Cannot send password reset email - check email configuration');
      return false;
    }

    const mailOptions = {
      from: `"Natura Bliss" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Password Reset OTP - Natura Bliss',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #000; color: #fff; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 8px 8px; }
                .otp-box { background: #fff; padding: 20px; text-align: center; border-radius: 8px; border: 2px dashed #000; margin: 20px 0; }
                .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #000; font-family: monospace; }
                .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 4px; }
                .footer { margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">Password Reset Request</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Natura Bliss</p>
                </div>
                <div class="content">
                    <p>Hi <strong>${userName}</strong>,</p>
                    
                    <p>You requested to reset your password for your Natura Bliss account. Use the OTP below to proceed:</p>
                    
                    <div class="otp-box">
                        <div class="otp-code">${otp}</div>
                        <p style="margin: 10px 0 0; color: #666;">This OTP will expire in 10 minutes</p>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong>
                        <p style="margin: 5px 0 0;">If you didn't request this password reset, please ignore this email. Your account security is important to us.</p>
                    </div>
                    
                    <p>Need help? Contact our support team at <a href="mailto:naturabliss99943@gmail.com">naturabliss99943@gmail.com</a></p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>&copy; ${new Date().getFullYear()} Natura Bliss. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset OTP sent to:', email);
    return true;

  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return false;
  }
};

// Send password reset success email
export const sendPasswordResetSuccessEmail = async (email, userName = 'there') => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log('❌ Cannot send success email - check email configuration');
      return false;
    }

    const mailOptions = {
      from: `"Natura Bliss" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '✅ Password Reset Successful - Natura Bliss',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #000; color: #fff; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 8px 8px; }
                .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; border-radius: 4px; }
                .footer { margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">Password Reset Successful</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Natura Bliss</p>
                </div>
                <div class="content">
                    <p>Hi <strong>${userName}</strong>,</p>
                    
                    <div class="success-box">
                        <strong>✅ Success!</strong>
                        <p style="margin: 5px 0 0;">Your Natura Bliss account password has been reset successfully.</p>
                    </div>
                    
                    <p>You can now login to your account using your new password.</p>
                    
                    <p>If you did not make this change, please contact our support team immediately at <a href="mailto:naturabliss99943@gmail.com">naturabliss99943@gmail.com</a></p>
                    
                    <p>Thank you for choosing Natura Bliss!</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>&copy; ${new Date().getFullYear()} Natura Bliss. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset success email sent to:', email);
    return true;

  } catch (error) {
    console.error('❌ Error sending password reset success email:', error);
    return false;
  }
};

// Send newsletter to multiple subscribers
export const sendNewsletter = async (subscribers, subject, htmlContent) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log('❌ Cannot send newsletter - check .env configuration');
      return 0;
    }

    console.log(`📨 Sending newsletter to ${subscribers.length} subscribers`);

    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        const mailOptions = {
          from: `"Natura Bliss" <${process.env.EMAIL_USER}>`,
          to: subscriber.email,
          subject: subject,
          html: htmlContent,
          // Add unsubscribe link
          headers: {
            'List-Unsubscribe': `<${process.env.FRONTEND_URL}/unsubscribe?email=${subscriber.email}>`
          }
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to: ${subscriber.email}`);
        return { success: true, email: subscriber.email };
      } catch (error) {
        console.error(`❌ Failed to send to ${subscriber.email}:`, error.message);
        return { success: false, email: subscriber.email, error: error.message };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    );
    const failed = results.filter(result => 
      result.status === 'rejected' || !result.value.success
    );

    console.log(`📊 Email sending results: ${successful.length} successful, ${failed.length} failed`);

    return successful.length;

  } catch (error) {
    console.error('❌ Bulk email sending error:', error);
    return 0;
  }
};

// Send new product notification
export const sendNewProductNotification = async (subscribers, product) => {
  try {
    const subject = `🚀 New Product: ${product.name}`;
    
    // Handle product image (could be array or string)
    let productImage = '';
    if (product.image && product.image.length > 0) {
      const imageUrl = Array.isArray(product.image) ? product.image[0] : product.image;
      productImage = `
        <div style="text-align: center; margin: 20px 0;">
          <img src="${imageUrl}" alt="${product.name}" style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        </div>
      `;
    }

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #000; color: #fff; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 8px 8px; }
              .product-info { background: #fff; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2d5016; }
              .price { font-size: 24px; font-weight: bold; color: #2d5016; margin: 10px 0; }
              .original-price { text-decoration: line-through; color: #666; margin-right: 10px; }
              .btn { display: inline-block; background: #2d5016; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 15px 0; }
              .footer { margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1 style="margin: 0;">New Product Alert! 🎉</h1>
                  <p style="margin: 5px 0 0 0; opacity: 0.9;">Natura Bliss</p>
              </div>
              <div class="content">
                  <p style="font-size: 16px;">We're excited to introduce our latest addition to the Natura Bliss family!</p>
                  
                  ${productImage}
                  
                  <div class="product-info">
                      <h2 style="color: #2d5016; margin-top: 0;">${product.name}</h2>
                      
                      ${product.description ? `<p style="font-size: 16px; line-height: 1.6;">${product.description}</p>` : ''}
                      
                      <div class="price">
                          ${product.discountprice && product.discountprice < product.price ? `
                              <span class="original-price">$${product.price}</span>
                              <span style="color: #e53e3e;">Now: $${product.discountprice}</span>
                          ` : `
                              $${product.price}
                          `}
                      </div>
                  </div>
                  
                  <p style="font-size: 16px;">Be the first to try it and experience the natural goodness!</p>
                  
                  <div style="text-align: center;">
                      <a href="${process.env.FRONTEND_URL}/collection/${product._id || product.id}" class="btn">
                          View Product
                      </a>
                  </div>
              </div>
              <div class="footer">
                  <p><a href="${process.env.FRONTEND_URL}/" style="color: #666; text-decoration: none;">Unsubscribe from our newsletter</a></p>
                  <p>&copy; ${new Date().getFullYear()} Natura Bliss. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    const sentCount = await sendNewsletter(subscribers, subject, content);
    console.log(`✅ New product notification sent for: ${product.name}`);
    return sentCount;

  } catch (error) {
    console.error('❌ Error in sendNewProductNotification:', error);
    return 0;
  }
};

// Send new deal notification
export const sendNewDealNotification = async (subscribers, deal) => {
  try {
    const subject = `🔥 Special Deal: ${deal.dealName || deal.title}`;
    
    // Handle deal images
    let dealImage = '';
    if (deal.dealImages && deal.dealImages.length > 0) {
      dealImage = `
        <div style="text-align: center; margin: 20px 0;">
          <img src="${deal.dealImages[0]}" alt="${deal.dealName}" style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        </div>
      `;
    }

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #000; color: #fff; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 8px 8px; }
              .deal-info { background: #fff; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #b91c1c; }
              .discount { font-size: 24px; font-weight: bold; color: #b91c1c; margin: 10px 0; }
              .price { font-size: 20px; font-weight: bold; color: #2d3748; margin: 10px 0; }
              .btn { display: inline-block; background: #b91c1c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 15px 0; }
              .footer { margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1 style="margin: 0;">Exclusive Deal Just For You! 💫</h1>
                  <p style="margin: 5px 0 0 0; opacity: 0.9;">Natura Bliss</p>
              </div>
              <div class="content">
                  <p style="font-size: 16px;">Don't miss this amazing opportunity to save on your favorite natural skincare!</p>
                  
                  ${dealImage}
                  
                  <div class="deal-info">
                      <h2 style="color: #b91c1c; margin-top: 0;">${deal.dealName || deal.title}</h2>
                      
                      ${deal.dealDescription ? `<p style="font-size: 16px; line-height: 1.6;">${deal.dealDescription}</p>` : ''}
                      
                      ${deal.dealDiscountValue ? `
                          <div class="discount">
                              🎁 ${deal.dealDiscountValue}${deal.dealDiscountType === 'percentage' ? '%' : '$'} OFF
                          </div>
                      ` : ''}
                      
                      ${deal.dealFinalPrice ? `<div class="price">Final Price: $${deal.dealFinalPrice}</div>` : ''}
                      
                      ${deal.dealEndDate ? `
                          <p style="color: #718096; margin: 10px 0;">
                              ⏰ Offer valid until: ${new Date(deal.dealEndDate).toLocaleDateString()}
                          </p>
                      ` : ''}
                  </div>
                  
                  <p style="font-size: 16px;">This offer won't last long - shop now before it's gone!</p>
                  
                  <div style="text-align: center;">
                      <a href="${process.env.FRONTEND_URL}/" class="btn">
                          Shop Now
                      </a>
                  </div>
              </div>
              <div class="footer">
                  <p><a href="${process.env.FRONTEND_URL}/" style="color: #666; text-decoration: none;">Unsubscribe from our newsletter</a></p>
                  <p>&copy; ${new Date().getFullYear()} Natura Bliss. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    const sentCount = await sendNewsletter(subscribers, subject, content);
    console.log(`✅ New deal notification sent for: ${deal.dealName || deal.title}`);
    return sentCount;

  } catch (error) {
    console.error('❌ Error in sendNewDealNotification:', error);
    return 0;
  }
};

// Send new blog notification
export const sendNewBlogNotification = async (subscribers, blog) => {
  try {
    const subject = `📚 New Blog: ${blog.title}`;
    
    let blogImage = '';
    if (blog.imageUrl) {
      blogImage = `
        <div style="text-align: center; margin: 20px 0;">
          <img src="${blog.imageUrl}" alt="${blog.title}" style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        </div>
      `;
    }

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #000; color: #fff; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 8px 8px; }
              .blog-info { background: #fff; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #0f766e; }
              .excerpt { font-style: italic; color: #666; font-size: 16px; line-height: 1.6; }
              .btn { display: inline-block; background: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 15px 0; }
              .footer { margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1 style="margin: 0;">New Skincare Wisdom! 🌿</h1>
                  <p style="margin: 5px 0 0 0; opacity: 0.9;">Natura Bliss</p>
              </div>
              <div class="content">
                  <p style="font-size: 16px;">Expand your knowledge with our latest blog post about natural skincare.</p>
                  
                  ${blogImage}
                  
                  <div class="blog-info">
                      <h2 style="color: #0f766e; margin-top: 0;">${blog.title}</h2>
                      
                      ${blog.excerpt ? `<p class="excerpt">${blog.excerpt}</p>` : ''}
                      
                      ${blog.category && blog.category.length > 0 ? `
                          <p style="margin: 10px 0;">
                              <strong>Category:</strong> ${blog.category.join(', ')}
                          </p>
                      ` : ''}
                  </div>
                  
                  <p style="font-size: 16px;">Learn expert tips and discover new ways to enhance your skincare routine!</p>
                  
                  <div style="text-align: center;">
                      <a href="${process.env.FRONTEND_URL}/blog/${blog._id || blog.id}" class="btn">
                          Read Article
                      </a>
                  </div>
                  
                  ${blog.readTime ? `<p style="color: #718096; margin-top: 10px; text-align: center;">⏱️ ${blog.readTime} min read</p>` : ''}
              </div>
              <div class="footer">
                  <p><a href="${process.env.FRONTEND_URL}/" style="color: #666; text-decoration: none;">Unsubscribe from our newsletter</a></p>
                  <p>&copy; ${new Date().getFullYear()} Natura Bliss. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    const sentCount = await sendNewsletter(subscribers, subject, content);
    console.log(`✅ New blog notification sent for: ${blog.title}`);
    return sentCount;

  } catch (error) {
    console.error('❌ Error in sendNewBlogNotification:', error);
    return 0;
  }
};

// Send contact email to business with your styling
export const sendContactEmailToBusiness = async (contactData) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log('❌ Cannot send email - check .env configuration');
      return false;
    }

    const businessEmail = process.env.EMAIL_USER;

    console.log('📧 Sending contact form to:', businessEmail);

    const mailOptions = {
      from: `"Natura Bliss Website" <${businessEmail}>`,
      to: businessEmail,
      replyTo: contactData.email,
      subject: `New Contact Form: ${contactData.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #000; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 8px 8px; }
                .field { margin-bottom: 15px; padding: 10px; background: #fff; border-radius: 5px; border-left: 4px solid #000; }
                .label { font-weight: bold; color: #000; display: block; margin-bottom: 5px; }
                .value { color: #666; }
                .message-box { background: #fff; padding: 15px; border-radius: 5px; border: 1px solid #ddd; margin-top: 10px; }
                .footer { margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
                .urgent { background: #fff3cd; border-left-color: #ffc107; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">📧 New Contact Form Submission</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Natura Bliss</p>
                </div>
                <div class="content">
                    <div class="field">
                        <span class="label">👤 Name:</span>
                        <span class="value">${contactData.name}</span>
                    </div>
                    <div class="field">
                        <span class="label">📧 Email:</span>
                        <span class="value">
                            <a href="mailto:${contactData.email}" style="color: #007bff; text-decoration: none;">
                                ${contactData.email}
                            </a>
                        </span>
                    </div>
                    <div class="field">
                        <span class="label">📞 Phone:</span>
                        <span class="value">${contactData.phone || 'Not provided'}</span>
                    </div>
                    <div class="field">
                        <span class="label">📋 Subject:</span>
                        <span class="value" style="color: #000; font-weight: 500;">${contactData.subject}</span>
                    </div>
                    <div class="field">
                        <span class="label">💬 Message:</span>
                        <div class="message-box">
                            ${contactData.message.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    <div class="field" style="background: #e7f3ff; border-left-color: #007bff;">
                        <span class="label">🚀 Quick Actions:</span>
                        <div style="margin-top: 10px;">
                            <a href="mailto:${contactData.email}?subject=Re: ${contactData.subject}" 
                               style="background: #007bff; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; margin-right: 10px;">
                               Reply to Customer
                            </a>
                            <a href="tel:${contactData.phone}" 
                               style="background: #28a745; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; ${!contactData.phone ? 'display: none;' : ''}">
                               Call Customer
                            </a>
                        </div>
                    </div>
                </div>
                <div class="footer">
                    <p>This email was automatically sent from your website contact form.</p>
                    <p><strong>Natura Bliss</strong> | +92-317 5546007 | Talagang, Pakistan</p>
                    <p>Received: ${new Date().toLocaleString()}</p>
                </div>
            </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Contact email sent successfully');
    return true;

  } catch (error) {
    console.error('❌ Error sending contact email:', error);
    return false;
  }
};

// Send auto-reply to customer with your styling
export const sendAutoReplyToCustomer = async (contactData) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log('❌ Cannot send auto-reply - check .env configuration');
      return false;
    }

    console.log('📧 Sending auto-reply to:', contactData.email);

    const mailOptions = {
      from: `"Natura Bliss" <${process.env.EMAIL_USER}>`,
      to: contactData.email,
      subject: `Thank you for contacting Natura Bliss`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #000; color: #fff; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 8px 8px; }
                .info-box { background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #000; margin: 15px 0; }
                .footer { margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
                .btn { display: inline-block; background: #000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">Thank You for Contacting Us!</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Natura Bliss</p>
                </div>
                <div class="content">
                    <p>Dear <strong>${contactData.name}</strong>,</p>
                    
                    <p>Thank you for reaching out to us. We have received your message and our team will get back to you within 24 hours.</p>
                    
                    <div class="info-box">
                        <h3 style="margin-top: 0;">📋 Your Inquiry Details:</h3>
                        <p><strong>Subject:</strong> ${contactData.subject}</p>
                        <p><strong>Message:</strong> ${contactData.message.substring(0, 100)}${contactData.message.length > 100 ? '...' : ''}</p>
                        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                    </div>

                    <div class="info-box" style="border-left-color: #28a745;">
                        <h3 style="margin-top: 0;">📞 Need Immediate Assistance?</h3>
                        <p>If you need urgent help, feel free to contact us directly:</p>
                        <p><strong>Email:</strong> naturabliss99943@gmail.com</p>
                        <p><strong>Phone:</strong> +92-324 1572294</p>
                    </div>

                    <p>We appreciate your interest in Natura Bliss and look forward to assisting you!</p>
                    
                    <p>Best regards,<br>
                    <strong>The Natura Bliss Team</strong></p>
                </div>
                <div class="footer">
                    <p>This is an automated response. Please do not reply to this email.</p>
                    <p>&copy; ${new Date().getFullYear()} Natura Bliss. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Auto-reply sent successfully');
    return true;

  } catch (error) {
    console.error('❌ Error sending auto-reply:', error);
    return false;
  }
};

// Welcome email for newsletter subscribers
export const sendWelcomeEmail = async (email, isResubscribe = false) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log('❌ Cannot send welcome email - check .env configuration');
      return false;
    }

    console.log('📧 Sending welcome email to:', email);

    const subject = isResubscribe 
      ? 'Welcome Back to Natura Bliss Newsletter! 🌿' 
      : 'Welcome to Natura Bliss Newsletter! 🌿';

    const mailOptions = {
      from: `"Natura Bliss" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #000; color: #fff; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 8px 8px; }
                .info-box { background: #fff; padding: 15px; border-radius: 5px; border-left: 4px solid #000; margin: 15px 0; }
                .footer { margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
                .feature-item { background: #fff; padding: 12px; margin: 8px 0; border-radius: 5px; border-left: 4px solid #28a745; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">${isResubscribe ? 'Welcome Back!' : 'Welcome to Our Community!'}</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Natura Bliss Newsletter</p>
                </div>
                <div class="content">
                    <p>Dear Subscriber,</p>
                    
                    <p>We're thrilled to have you ${isResubscribe ? 'back ' : ''}as part of our Natura Bliss community!</p>
                    
                    <div class="info-box">
                        <h3 style="margin-top: 0;">🎉 What You'll Receive:</h3>
                        <div class="feature-item">
                            <strong>🌿 New Product Launches</strong>
                            <p style="margin: 5px 0 0; color: #666;">Be the first to know about our latest organic skincare products</p>
                        </div>
                        <div class="feature-item">
                            <strong>🔥 Exclusive Deals & Promotions</strong>
                            <p style="margin: 5px 0 0; color: #666;">Special offers just for our newsletter subscribers</p>
                        </div>
                        <div class="feature-item">
                            <strong>💫 Skincare Tips & Expert Advice</strong>
                            <p style="margin: 5px 0 0; color: #666;">Learn how to get the most from your natural skincare routine</p>
                        </div>
                    </div>

                    <div class="info-box" style="border-left-color: #007bff;">
                        <h3 style="margin-top: 0;">📱 Stay Connected</h3>
                        <p>Follow us for daily inspiration and skincare tips:</p>
                        <p><strong>📍 Location:</strong> Talagang, Punjab, Pakistan</p>
                        <p><strong>📞 Phone:</strong> +92-324 1572294</p>
                        <p><strong>📧 Email:</strong> naturabliss99943@gmail.com</p>
                    </div>

                    <p>Stay tuned for our next update filled with organic skincare wisdom and special offers!</p>
                    
                    <p>With love,<br>
                    <strong>The Natura Bliss Team</strong></p>
                </div>
                <div class="footer">
                    <p><a href="${process.env.FRONTEND_URL}/" style="color: #666; text-decoration: none;">Unsubscribe from our newsletter</a></p>
                    <p>&copy; ${new Date().getFullYear()} Natura Bliss. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully');
    return true;

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return false;
  }
};