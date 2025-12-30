import { AppInsert, AppMetricsInsert, OpportunityScoreInsert } from '@/types/database';

/**
 * Calculate the Opportunity Score components based on app data and metrics.
 * 
 * Logic based on PRD:
 * - Focus on **emergence** and **momentum**.
 * - Identify early demand and unmet expectations.
 */
export function calculateOpportunityScore(
    app: AppInsert,
    metrics: Omit<AppMetricsInsert, 'app_id'>
): Omit<OpportunityScoreInsert, 'app_id' | 'id' | 'calculated_at'> {
    const now = new Date();
    const releaseDate = app.release_date ? new Date(app.release_date) : new Date();
    const daysSinceLaunch = Math.max(1, Math.floor((now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Use rating_count as primary signal if review_count is missing (common in App Store data)
    const validationCount = Math.max(metrics.review_count || 0, metrics.rating_count || 0);
    const rating = metrics.rating || 0;

    // 1. Validation Floor (The "Lug List" Defense)
    // We need enough data to trust the signal.
    // For VERY new apps (< 14 days), 3 reviews is a signal.
    // For older apps, we want 20-50.
    let validationMultiplier = 0.05;
    const isVeryNew = daysSinceLaunch <= 14;
    const isNew = daysSinceLaunch <= 45;

    if (validationCount >= 50) {
        validationMultiplier = 1.0;
    } else if (validationCount >= 20) {
        validationMultiplier = 0.8 + (validationCount - 20) * 0.006;
    } else if (isVeryNew && validationCount >= 3) {
        // Very hot early signal
        validationMultiplier = 0.7 + (validationCount - 3) * 0.05;
    } else if (isNew && validationCount >= 5) {
        // Good early signal
        validationMultiplier = 0.5 + (validationCount - 5) * 0.02;
    } else if (validationCount >= 5) {
        validationMultiplier = 0.2 + (validationCount - 5) * 0.04;
    } else {
        validationMultiplier = 0.05;
    }

    // 2. Indie Sweet Spot (The "Elevate" Defense)
    // Opportunity is high when an app is successful but not yet a giant.
    let sizeMultiplier = 1.0;
    if (validationCount > 50000) sizeMultiplier = 0.1; // Huge incumbent
    else if (validationCount > 10000) sizeMultiplier = 0.3;
    else if (validationCount > 2000) sizeMultiplier = 0.6;
    else if (validationCount > 500) sizeMultiplier = 0.85;
    else sizeMultiplier = 1.0;

    // 3. Momentum (Velocity)
    // How fast are they growing?
    const growthPerDay = validationCount / daysSinceLaunch;
    // 1-2 reviews per day is a very hot indie app.
    // We lower the denominator slightly for newer apps to reward early traction.
    const momentumTarget = isNew ? 1.0 : 1.5;
    let momentum = Math.min(100, Math.round((growthPerDay / momentumTarget) * 100));

    // Boost momentum significantly for new apps that pass the floor
    if (isNew && validationCount >= 5) {
        momentum = Math.min(100, momentum * 1.5);
    }

    // 4. Demand Signal
    const demandSignal = Math.min(100, Math.round(Math.log10(validationCount + 10) * 20));

    // 5. User Satisfaction (The "Gap")
    let satisfactionScore = 50;
    if (rating >= 3.8 && rating <= 4.5) satisfactionScore = 100; // Perfect target: people like it but room for improvement
    else if (rating > 4.5) satisfactionScore = 80; // High bar to beat
    else if (rating < 3.5 && validationCount > 10) satisfactionScore = 90; // High demand but broken = HUGE opportunity
    else if (rating < 3.5) satisfactionScore = 60;

    // 6. Monetization Potential
    let monetizationPotential = 40;
    if (app.pricing_model === 'subscription') monetizationPotential = 100;
    else if (app.pricing_model === 'freemium') monetizationPotential = 80;
    else if (app.pricing_model === 'paid') monetizationPotential = 60;

    // --- COMPOSITE ---
    let rawScore = (
        (momentum * 0.45) + // Increased weight on momentum
        (demandSignal * 0.25) +
        (monetizationPotential * 0.20) +
        (satisfactionScore * 0.10)
    );

    // Apply Multipliers
    let finalScore = rawScore * validationMultiplier * sizeMultiplier;

    // Final Polish: Freshness Bonus
    // If app is < 30 days old and has > 10 reviews, it's a "Breakout"
    if (daysSinceLaunch < 30 && validationCount > 10) {
        finalScore += 20;
    }

    return {
        score: Math.max(0, Math.min(100, Math.round(finalScore))),
        momentum: Math.round(momentum),
        demand_signal: Math.round(demandSignal),
        user_satisfaction: Math.round(rating * 20),
        monetization_potential: Math.round(monetizationPotential),
        competitive_density: Math.round(sizeMultiplier * 100),
        time_window: 'all_time'
    };
}
