import Newsletter from '../models/Newsletter.js';
import { 
  sendNewProductNotification, 
  sendNewDealNotification, 
  sendNewBlogNotification 
} from './emailService.js';

// Send notification when new product is added
export const notifyNewProduct = async (product) => {
  try {
    const subscribers = await Newsletter.find({
      isActive: true,
      'preferences.newProducts': true
    });

    if (subscribers.length === 0) {
      console.log('📭 No subscribers for new product notifications');
      return;
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
      return;
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
      return;
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

// Manual notification sender for admin
export const sendManualNotification = async (notificationData) => {
  try {
    const { type, title, message, link } = notificationData;
    
    const subscribers = await Newsletter.find({
      isActive: true
    });

    if (subscribers.length === 0) {
      console.log('📭 No active subscribers found');
      return;
    }

    console.log(`📢 Sending manual notification to ${subscribers.length} subscribers`);

    // You can extend this to use the email service for manual notifications
    // For now, just log the action
    console.log(`Manual notification prepared: ${title}`);
    console.log(`Would send to ${subscribers.length} subscribers`);
    
    return subscribers.length;

  } catch (error) {
    console.error('❌ Error sending manual notification:', error);
    throw error;
  }
};