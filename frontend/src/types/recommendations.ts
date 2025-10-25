export interface TreasuryProduct {
    id: string;
    name: string;
    category: 'cash_management' | 'payments' | 'collections' | 'investment' | 'credit';
    description: string;
    features: string[];
    eligibilityCriteria: {
        minimumBalance?: number;
        minimumTransactionVolume?: number;
        accountTypes?: string[];
        businessSegments?: string[];
    };
    pricing: {
        monthlyFee?: number;
        transactionFee?: number;
        yieldRate?: number;
        otherFees?: Record<string, number>;
    };
    benefits: ProductBenefit[];
    riskLevel: 'low' | 'medium' | 'high';
    liquidityFeatures: string[];
}

export interface ProductBenefit {
    type: 'yield_improvement' | 'cost_reduction' | 'efficiency_gain' | 'risk_mitigation';
    description: string;
    estimatedValue?: number;
    unit?: 'dollars' | 'percentage' | 'hours' | 'transactions';
}

export interface Recommendation {
    id: string;
    clientId: string;
    productId: string;
    product: TreasuryProduct;
    priority: 'high' | 'medium' | 'low';
    rationale: RecommendationRationale;
    estimatedBenefit: EstimatedBenefit;
    implementation: ImplementationDetails;
    supportingData: SupportingTransaction[];
    confidence: number;
    status: 'pending' | 'approved' | 'rejected' | 'implemented';
    createdAt: string;
    reviewedBy?: string;
    reviewedAt?: string;
    notes?: string;
}

export interface RecommendationRationale {
    primaryTrigger: string;
    supportingFactors: string[];
    dataInsights: string[];
    businessImpact: string;
    riskConsiderations?: string[];
}

export interface EstimatedBenefit {
    annualSavings?: number;
    yieldIncrease?: number;
    efficiencyGain?: string;
    costReduction?: number;
    timeToBreakeven?: number;
    confidence: 'high' | 'medium' | 'low';
    assumptions: string[];
}

export interface ImplementationDetails {
    complexity: 'low' | 'medium' | 'high';
    timeframe: string;
    prerequisites: string[];
    nextSteps: string[];
    accountSetup?: AccountSetupSuggestion;
}

export interface AccountSetupSuggestion {
    suggestedStructure: string;
    sweepRules?: SweepRule[];
    balanceThresholds?: BalanceThreshold[];
    automationRules?: AutomationRule[];
}

export interface SweepRule {
    sourceAccount: string;
    targetAccount: string;
    threshold: number;
    frequency: 'daily' | 'weekly' | 'monthly';
    sweepAmount: 'all' | 'excess';
}

export interface BalanceThreshold {
    accountType: string;
    minimumBalance: number;
    maximumBalance?: number;
    action: string;
}

export interface AutomationRule {
    trigger: string;
    action: string;
    conditions: string[];
}

export interface SupportingTransaction {
    transactionId: string;
    date: string;
    amount: number;
    description: string;
    relevance: string;
}

export interface RecommendationFeedback {
    recommendationId: string;
    feedback: 'accepted' | 'rejected' | 'needs_modification';
    reason?: string;
    modifications?: string;
    implementationDate?: string;
}

export interface RecommendationSummary {
    totalRecommendations: number;
    highPriorityCount: number;
    totalEstimatedSavings: number;
    categoryCounts: Record<string, number>;
    statusCounts: Record<string, number>;
}
