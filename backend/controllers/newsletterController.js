import Newsletter from '../models/NewsletterModel.js';
import { 
  sendWelcomeEmail, 
  sendNewProductNotification, 
  sendNewDealNotification, 
  sendNewBlogNotification 
} from '../services/emailService.js';

// Subscribe to newsletter
export const subscribe = async (req, res) => {
  try {
    const { email, preferences } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if email already exists and is active
    const existingSubscriber = await Newsletter.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    if (existingSubscriber) {
      return res.status(409).json({
        success: false,
        message: 'This email is already subscribed to our newsletter'
      });
    }

    // Check if email exists but is inactive (resubscribe)
    const inactiveSubscriber = await Newsletter.findOne({ 
      email: email.toLowerCase(),
      isActive: false 
    });

    if (inactiveSubscriber) {
      inactiveSubscriber.isActive = true;
      inactiveSubscriber.unsubscribedAt = undefined;
      inactiveSubscriber.preferences = {
        promotions: preferences?.promotions ?? true,
        skincareTips: preferences?.skincareTips ?? true,
        newProducts: preferences?.newProducts ?? true
      };
      await inactiveSubscriber.save();

      await sendWelcomeEmail(email, true);

      return res.status(200).json({
        success: true,
        message: 'Successfully resubscribed to our newsletter!',
        data: inactiveSubscriber
      });
    }

    // Create new subscriber
    const newSubscriber = new Newsletter({
      email: email.toLowerCase(),
      preferences: {
        promotions: preferences?.promotions ?? true,
        skincareTips: preferences?.skincareTips ?? true,
        newProducts: preferences?.newProducts ?? true
      }
    });

    await newSubscriber.save();
    await sendWelcomeEmail(email);

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to our newsletter!',
      data: newSubscriber
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This email is already subscribed to our newsletter'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// Unsubscribe from newsletter
export const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const subscriber = await Newsletter.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in our subscription list'
      });
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from our newsletter'
    });

  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// Get all subscribers (admin only)
export const getSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'active' } = req.query;
    
    const query = {};
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const subscribers = await Newsletter.find(query)
      .sort({ subscribedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Newsletter.countDocuments(query);

    res.status(200).json({
      success: true,
      data: subscribers,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalSubscribers: total
      }
    });

  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get subscriber count with preference stats
export const getStats = async (req, res) => {
  try {
    const totalSubscribers = await Newsletter.countDocuments({ isActive: true });
    const todaySubscribers = await Newsletter.countDocuments({
      isActive: true,
      subscribedAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });
    const thisMonthSubscribers = await Newsletter.countDocuments({
      isActive: true,
      subscribedAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    // Get preference statistics
    const preferenceStats = await getPreferenceStats();

    res.status(200).json({
      success: true,
      data: {
        total: totalSubscribers,
        today: todaySubscribers,
        thisMonth: thisMonthSubscribers,
        preferences: preferenceStats
      }
    });

  } catch (error) {
    console.error('Get newsletter stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Send notification for new products, deals, and blogs
export const sendNotification = async (req, res) => {
  try {
    const { type, title, content, productId, blogId, dealId, imageUrl } = req.body;

    console.log('🚀 ========== NEWSLETTER NOTIFICATION TRIGGERED ==========');
    console.log('📢 Notification Details:', { 
      type, 
      title, 
      contentLength: content?.length,
      productId, 
      blogId, 
      dealId,
      imageUrl 
    });

    if (!type || !title || !content) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Type, title, and content are required'
      });
    }

    let sentCount = 0;

    // Use the specific notification functions
    switch (type) {
      case 'new_product':
        sentCount = await notifyNewProduct({
          _id: productId,
          name: title,
          description: content,
          image: imageUrl
        });
        break;

      case 'new_deal':
        sentCount = await notifyNewDeal({
          _id: dealId,
          dealName: title,
          dealDescription: content,
          dealImages: imageUrl ? [imageUrl] : []
        });
        break;

      case 'new_blog':
        sentCount = await notifyNewBlog({
          _id: blogId,
          title: title,
          excerpt: content,
          imageUrl: imageUrl
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid notification type'
        });
    }

    res.status(200).json({
      success: true,
      message: `Notification sent successfully to ${sentCount} subscribers`,
      data: {
        sent: sentCount,
        type: type,
        title: title
      }
    });

  } catch (error) {
    console.error('❌ Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification. Please try again later.',
      error: error.message
    });
  }
};

// Send notification when new product is added
export const notifyNewProduct = async (product) => {
  try {
    const subscribers = await Newsletter.find({
      isActive: true,
      'preferences.newProducts': true
    });

    if (subscribers.length === 0) {
      console.log('📭 No subscribers for new product notifications');
      return 0;
    }

    console.log(`📢 Sending new product notification to ${subscribers.length} subscribers`);

    const sentCount = await sendNewProductNotification(subscribers, product);
    
    console.log(`✅ New product notification sent to ${sentCount} subscribers`);
    return sentCount;

  } catch (error) {
    console.error('❌ Error sending new product notification:', error);
    throw error;
  }
};

// Send notification when new deal is added
export const notifyNewDeal = async (deal) => {
  try {
    const subscribers = await Newsletter.find({
      isActive: true,
      'preferences.promotions': true
    });

    if (subscribers.length === 0) {
      console.log('📭 No subscribers for deal notifications');
      return 0;
    }

    console.log(`📢 Sending new deal notification to ${subscribers.length} subscribers`);

    const sentCount = await sendNewDealNotification(subscribers, deal);
    
    console.log(`✅ New deal notification sent to ${sentCount} subscribers`);
    return sentCount;

  } catch (error) {
    console.error('❌ Error sending new deal notification:', error);
    throw error;
  }
};

// Send notification when new blog is published
export const notifyNewBlog = async (blog) => {
  try {
    const subscribers = await Newsletter.find({
      isActive: true,
      'preferences.skincareTips': true
    });

    if (subscribers.length === 0) {
      console.log('📭 No subscribers for blog notifications');
      return 0;
    }

    console.log(`📢 Sending new blog notification to ${subscribers.length} subscribers`);

    const sentCount = await sendNewBlogNotification(subscribers, blog);
    
    console.log(`✅ New blog notification sent to ${sentCount} subscribers`);
    return sentCount;

  } catch (error) {
    console.error('❌ Error sending new blog notification:', error);
    throw error;
  }
};

// Check subscriber preferences
export const checkSubscriberPreferences = async (req, res) => {
  try {
    const subscribers = await Newsletter.find({ isActive: true });
    
    const stats = {
      totalActive: subscribers.length,
      newProducts: subscribers.filter(s => s.preferences.newProducts).length,
      promotions: subscribers.filter(s => s.preferences.promotions).length,
      skincareTips: subscribers.filter(s => s.preferences.skincareTips).length
    };

    console.log('📊 ========== SUBSCRIBER PREFERENCES SUMMARY ==========');
    console.log(`Total active subscribers: ${stats.totalActive}`);
    console.log(`New Products preference: ${stats.newProducts}`);
    console.log(`Promotions preference: ${stats.promotions}`);
    console.log(`Skincare Tips preference: ${stats.skincareTips}`);
    
    // Calculate percentages
    console.log('\n📈 Percentage Breakdown:');
    console.log(`New Products: ${((stats.newProducts / stats.totalActive) * 100).toFixed(1)}%`);
    console.log(`Promotions: ${((stats.promotions / stats.totalActive) * 100).toFixed(1)}%`);
    console.log(`Skincare Tips: ${((stats.skincareTips / stats.totalActive) * 100).toFixed(1)}%`);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error checking subscriber preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get preference statistics'
    });
  }
};

// Helper function for preference stats
const getPreferenceStats = async () => {
  const subscribers = await Newsletter.find({ isActive: true });
  
  return {
    newProducts: subscribers.filter(s => s.preferences.newProducts).length,
    promotions: subscribers.filter(s => s.preferences.promotions).length,
    skincareTips: subscribers.filter(s => s.preferences.skincareTips).length,
    total: subscribers.length
  };
};

