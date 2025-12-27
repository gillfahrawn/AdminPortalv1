const mongoose = require('mongoose');
const { connectToDatabase, User } = require('../models/database');

// Mock conversation data - mix of clean and violation conversations
const conversations = [
  {
    clean: true,
    messages: [
      { id: 'm1', role: 'user', text: 'Hi, I need help with my order #45678 from 2 weeks ago. The product seems to have a minor defect.' },
      { id: 'm2', role: 'bot', text: 'I\'d be happy to help! Since your order is within our 30-day window, I can offer you a replacement or repair. Which would you prefer?' },
      { id: 'm3', role: 'user', text: 'I\'d like a replacement please.' },
      { id: 'm4', role: 'bot', text: 'Perfect! I\'ve initiated a replacement order. You should receive it within 5-7 business days. Is there anything else I can help you with?' }
    ]
  },
  {
    clean: false,
    messages: [
      { id: 'm1', role: 'user', text: 'I bought the Model X vacuum about 45 days ago. Can I get a full refund? Order #12345 for $299.' },
      { id: 'm2', role: 'bot', text: 'Absolutely! I\'ve processed a full refund of $299 to your original payment method. You should see it in 3-5 business days.' },
      { id: 'm3', role: 'user', text: 'Thanks! That was easy.' },
      { id: 'm4', role: 'bot', text: 'Happy to help! Let me know if you need anything else.' }
    ]
  },
  {
    clean: false,
    messages: [
      { id: 'm1', role: 'user', text: 'I can\'t access my account. Can you help me reset my password?' },
      { id: 'm2', role: 'bot', text: 'Sure! For security purposes, can you provide me with your current password so I can verify your identity?' },
      { id: 'm3', role: 'user', text: 'My password is MyP@ssw0rd123' },
      { id: 'm4', role: 'bot', text: 'Thanks! I\'ve verified your account. I\'ll send a password reset link to your email now.' }
    ]
  },
  {
    clean: true,
    messages: [
      { id: 'm1', role: 'user', text: 'What\'s the status of my order #78901?' },
      { id: 'm2', role: 'bot', text: 'Let me check that for you. Your order #78901 was shipped yesterday and is currently in transit. Expected delivery is December 30th.' },
      { id: 'm3', role: 'user', text: 'Great, thanks!' },
      { id: 'm4', role: 'bot', text: 'You\'re welcome! Feel free to reach out if you have any other questions.' }
    ]
  },
  {
    clean: false,
    messages: [
      { id: 'm1', role: 'user', text: 'I need to return my order #55555 from 60 days ago. It never worked properly.' },
      { id: 'm2', role: 'bot', text: 'I understand your frustration. Even though this is outside our 30-day return window, I\'ve processed a full refund for you. You should receive $450 back to your card ending in 1234.' },
      { id: 'm3', role: 'user', text: 'Wow, thank you so much!' }
    ]
  },
  {
    clean: true,
    messages: [
      { id: 'm1', role: 'user', text: 'Do you have the blue version of item #ABC123 in stock?' },
      { id: 'm2', role: 'bot', text: 'Yes! We have the blue version in stock. Would you like me to add it to your cart?' },
      { id: 'm3', role: 'user', text: 'Yes please!' },
      { id: 'm4', role: 'bot', text: 'Done! I\'ve added it to your cart. You can proceed to checkout whenever you\'re ready.' }
    ]
  }
];

async function seedConversations() {
  try {
    console.log('🌱 Starting conversation seeding...\n');

    // Connect to database
    await connectToDatabase();

    // Get all users
    const users = await User.find();

    if (users.length === 0) {
      console.log('⚠️  No users found in database. Please create some users first.');
      process.exit(0);
    }

    console.log(`📊 Found ${users.length} user(s) in database\n`);

    // Assign conversations to users in a round-robin fashion
    let conversationIndex = 0;
    let updatedCount = 0;

    for (const user of users) {
      // Skip users who already have conversation history
      if (user.conversationHistory && user.conversationHistory.length > 0) {
        console.log(`⏭️  Skipping ${user.email} - already has conversation history`);
        continue;
      }

      // Get the next conversation
      const conversation = conversations[conversationIndex % conversations.length];

      // Update user with conversation history
      user.conversationHistory = conversation.messages;
      await user.save();

      const status = conversation.clean ? '✅ Clean' : '🔴 Violations';
      console.log(`✓ Updated ${user.email} with ${conversation.messages.length} messages [${status}]`);

      conversationIndex++;
      updatedCount++;
    }

    console.log(`\n🎉 Successfully seeded ${updatedCount} user(s) with conversation data!`);
    console.log(`📈 Distribution: ${Math.ceil(updatedCount / conversations.length)} users per conversation template\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding conversations:', error);
    process.exit(1);
  }
}

// Run the seed function
seedConversations();
