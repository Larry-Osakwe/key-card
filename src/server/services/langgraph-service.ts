/**
 * Service to connect to the LangGraph backend service for customer support
 */

import { SupportResponse, Source, Score } from '@/types/conversation';

// For Phase 1: Use mock data until backend is ready
const DEVICE_RESET_SOURCES = [
  { title: "Device Reset Guide", url: "/docs/device-reset", relevance: 0.95 },
  { title: "Factory Reset Instructions", url: "/docs/factory-reset", relevance: 0.88 },
  { title: "Troubleshooting Common Issues", url: "/docs/troubleshooting", relevance: 0.75 }
];

const ACCOUNT_SOURCES = [
  { title: "Account Management", url: "/docs/account", relevance: 0.92 },
  { title: "Password Recovery", url: "/docs/password-reset", relevance: 0.85 },
  { title: "Security Best Practices", url: "/docs/security", relevance: 0.78 }
];

const BILLING_SOURCES = [
  { title: "Billing FAQ", url: "/docs/billing-faq", relevance: 0.94 },
  { title: "Payment Methods", url: "/docs/payment", relevance: 0.87 },
  { title: "Subscription Management", url: "/docs/subscriptions", relevance: 0.82 }
];

const HIGH_SCORES = {
  overall: 0.92,
  keyword: 0.89,
  llm: 0.95
};

const MEDIUM_SCORES = {
  overall: 0.85,
  keyword: 0.82,
  llm: 0.88
};

const LOW_SCORES = {
  overall: 0.75,
  keyword: 0.72,
  llm: 0.78
};


/**
    * Generate a support response (Phase 1: Mock implementation)
    */
export async function generateResponse(message: string): Promise<SupportResponse> {
  // TODO: In Phase 2, replace with actual API call:
  // try {
  //   const response = await fetchWithRetry(
  //     `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/chat`,
  //     {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ message }),
  //     }
  //   );
  //
  //   if (!response.ok) {
  //     throw new Error(`Failed to generate support response: ${response.statusText}`);
  //   }
  //
  //   const data = await response.json();
  //   return {
  //     content: data.response,
  //     sources: data.sources,
  //     scores: data.scores,
  //     success: true,
  //   };
  // } catch (error) {
  //   console.error('Error generating support response:', error);
  //   return {
  //     content: 'Failed to generate a support response. Please try again later.',
  //     success: false,
  //   };
  // }
  
  // For now, return mock data based on the query content
  const lowerMessage = message.toLowerCase();
  
  // Device reset related queries
  if (lowerMessage.includes('reset') || lowerMessage.includes('restart') || 
      lowerMessage.includes('factory') || lowerMessage.includes('not working')) {
    return {
      content: `To reset your device, please follow these steps:\n\n1. Power off your device completely\n2. Press and hold the power and volume up buttons simultaneously for 10 seconds\n3. Release when you see the logo appear\n4. Select "Factory Reset" from the recovery menu\n5. Confirm and wait for the process to complete\n\nThis will erase all data on your device, so please make sure you have a backup first.`,
      sources: DEVICE_RESET_SOURCES,
      scores: HIGH_SCORES,
      success: true
    };
  }
  
  // Account related queries
  else if (lowerMessage.includes('account') || lowerMessage.includes('login') || 
           lowerMessage.includes('password') || lowerMessage.includes('sign in')) {
    return {
      content: `For account issues, here are some helpful tips:\n\n1. If you've forgotten your password, use the "Forgot Password" link on the login page\n2. Make sure you're using the email address associated with your account\n3. Check if your account is locked due to too many failed login attempts\n4. For persistent issues, contact our support team at support@example.com\n\nWe recommend using two-factor authentication for additional security.`,
      sources: ACCOUNT_SOURCES,
      scores: MEDIUM_SCORES,
      success: true
    };
  }
  
  // Billing related queries
  else if (lowerMessage.includes('bill') || lowerMessage.includes('payment') || 
           lowerMessage.includes('charge') || lowerMessage.includes('subscription')) {
    return {
      content: `Regarding billing inquiries:\n\n1. Monthly subscriptions are billed on the same date of sign-up each month\n2. You can update your payment method in the Account Settings page\n3. Receipts are automatically sent to your registered email\n4. For disputed charges, please contact billing@example.com with your invoice number\n\nWe offer various payment methods including credit cards, PayPal, and bank transfers.`,
      sources: BILLING_SOURCES,
      scores: HIGH_SCORES,
      success: true
    };
  }
  
  // Generic response for other queries
  else {
    return {
      content: `Thank you for your question about "${message}". \n\nOur support team is available 24/7 to assist with any issues you might be experiencing. For faster service, please provide specific details about your device model, software version, and the exact issue you're facing.\n\nYou can also check our comprehensive documentation for self-service options.`,
      sources: [
        { title: "Support Center Home", url: "/docs/support", relevance: 0.85 },
        { title: "Contact Information", url: "/docs/contact", relevance: 0.80 },
        { title: "FAQ", url: "/docs/faq", relevance: 0.75 }
      ],
      scores: MEDIUM_SCORES,
      success: true
    };
  }
}