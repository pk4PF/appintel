'use client';

interface SubscriptionInfoProps {
  description: string | null;
  pricingModel: string;
  price: number;
}

interface DetectedPlan {
  tier: string;
  price: string;
  period: string;
}

// Regex patterns to detect subscription pricing
const PRICE_PATTERNS = [
  // Monthly patterns
  /\$(\d+(?:\.\d{2})?)\s*\/\s*month/gi,
  /\$(\d+(?:\.\d{2})?)\s*per\s*month/gi,
  /\$(\d+(?:\.\d{2})?)\s*monthly/gi,
  /(\d+(?:\.\d{2})?)\s*USD\s*\/\s*month/gi,
  
  // Weekly patterns
  /\$(\d+(?:\.\d{2})?)\s*\/\s*week/gi,
  /\$(\d+(?:\.\d{2})?)\s*per\s*week/gi,
  /\$(\d+(?:\.\d{2})?)\s*weekly/gi,
  
  // Yearly patterns
  /\$(\d+(?:\.\d{2})?)\s*\/\s*year/gi,
  /\$(\d+(?:\.\d{2})?)\s*per\s*year/gi,
  /\$(\d+(?:\.\d{2})?)\s*yearly/gi,
  /\$(\d+(?:\.\d{2})?)\s*annually/gi,
];

// Tier name patterns
const TIER_PATTERNS = [
  /(?:^|\s)(pro|premium|plus|gold|platinum|business|enterprise|unlimited|lifetime)\s/gi,
  /(basic|starter|standard|free)\s*(?:plan|tier|subscription)?/gi,
];

function extractSubscriptionInfo(description: string): {
  hasSubscription: boolean;
  hasInAppPurchases: boolean;
  detectedPlans: DetectedPlan[];
  features: string[];
} {
  const text = description.toLowerCase();
  
  // Detect subscription presence
  const subscriptionKeywords = [
    'subscription',
    'subscribe',
    'auto-renew',
    'auto renew',
    'recurring',
    'monthly subscription',
    'annual subscription',
    'cancel anytime',
    'trial period',
    'free trial',
  ];
  
  const hasSubscription = subscriptionKeywords.some(kw => text.includes(kw));
  
  // Detect IAP presence
  const iapKeywords = [
    'in-app purchase',
    'in app purchase',
    'in-app',
    'iap',
    'unlock',
    'premium features',
    'purchase',
    'upgrade to',
  ];
  
  const hasInAppPurchases = iapKeywords.some(kw => text.includes(kw));
  
  // Extract specific prices
  const detectedPlans: DetectedPlan[] = [];
  
  // Look for monthly prices
  const monthlyMatches = description.match(/\$(\d+(?:\.\d{2})?)\s*(?:\/|per)\s*month/gi);
  if (monthlyMatches) {
    monthlyMatches.forEach(match => {
      const priceMatch = match.match(/\$(\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        detectedPlans.push({
          tier: 'Monthly',
          price: `$${priceMatch[1]}`,
          period: 'month',
        });
      }
    });
  }
  
  // Look for yearly prices
  const yearlyMatches = description.match(/\$(\d+(?:\.\d{2})?)\s*(?:\/|per)\s*year/gi);
  if (yearlyMatches) {
    yearlyMatches.forEach(match => {
      const priceMatch = match.match(/\$(\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        detectedPlans.push({
          tier: 'Yearly',
          price: `$${priceMatch[1]}`,
          period: 'year',
        });
      }
    });
  }
  
  // Look for weekly prices
  const weeklyMatches = description.match(/\$(\d+(?:\.\d{2})?)\s*(?:\/|per)\s*week/gi);
  if (weeklyMatches) {
    weeklyMatches.forEach(match => {
      const priceMatch = match.match(/\$(\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        detectedPlans.push({
          tier: 'Weekly',
          price: `$${priceMatch[1]}`,
          period: 'week',
        });
      }
    });
  }
  
  // Extract mentioned features
  const features: string[] = [];
  const featurePatterns = [
    /(?:includes?|get|unlock)\s*[:•-]?\s*([^.!?\n]+)/gi,
    /premium\s+(?:includes?|features?)[:•-]?\s*([^.!?\n]+)/gi,
  ];
  
  // Look for free trial mentions
  const trialMatch = description.match(/(\d+)[\s-]*(?:day|week)\s*(?:free)?\s*trial/i);
  if (trialMatch) {
    features.push(`${trialMatch[1]}-day free trial`);
  }
  
  return {
    hasSubscription,
    hasInAppPurchases,
    detectedPlans,
    features,
  };
}

export default function SubscriptionInfo({ 
  description, 
  pricingModel,
  price,
}: SubscriptionInfoProps) {
  const info = description ? extractSubscriptionInfo(description) : null;
  
  // Determine what to show based on pricing model
  const isPaid = pricingModel === 'paid' && price > 0;
  const isSubscription = pricingModel === 'subscription' || info?.hasSubscription;
  const isFreemium = pricingModel === 'freemium' || info?.hasInAppPurchases;
  
  if (!isPaid && !isSubscription && !isFreemium) {
    return null;
  }
  
  return (
    <div className="bg-[#1d1d1f] rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Pricing & Subscriptions</h2>
      
      <div className="space-y-4">
        {/* Pricing Model Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#86868b]">Model</span>
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
            isSubscription 
              ? 'bg-purple-500/20 text-purple-400' 
              : isPaid 
                ? 'bg-[#007AFF]/20 text-[#007AFF]'
                : 'bg-[#ff9f0a]/20 text-[#ff9f0a]'
          }`}>
            {isSubscription ? 'Subscription' : isPaid ? 'Paid' : 'Freemium'}
          </span>
        </div>
        
        {/* Base Price (if paid) */}
        {isPaid && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#86868b]">App Price</span>
            <span className="text-sm font-medium text-white">${price.toFixed(2)}</span>
          </div>
        )}
        
        {/* Detected Plans */}
        {info?.detectedPlans && info.detectedPlans.length > 0 && (
          <div className="pt-3 border-t border-white/10">
            <p className="text-xs text-[#6e6e73] mb-3 uppercase tracking-wider">Detected Plans</p>
            <div className="grid gap-2">
              {info.detectedPlans.map((plan, index) => (
                <div 
                  key={index}
                  className="flex justify-between items-center bg-[#2d2d2d] rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-white">{plan.tier}</span>
                  <span className="text-sm font-semibold text-[#007AFF]">
                    {plan.price}/{plan.period}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* In-App Purchases indicator */}
        {isFreemium && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#ff9f0a]">●</span>
            <span className="text-[#86868b]">Offers In-App Purchases</span>
          </div>
        )}
        
        {/* Free Trial */}
        {info?.features && info.features.length > 0 && (
          <div className="pt-3 border-t border-white/10">
            {info.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="text-[#34c759]">✓</span>
                <span className="text-[#86868b]">{feature}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}






