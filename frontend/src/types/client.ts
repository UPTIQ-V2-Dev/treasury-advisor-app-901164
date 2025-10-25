export interface Client {
    id: string;
    name: string;
    businessType: string;
    industry: string;
    relationshipManagerId: string;
    relationshipManager: RelationshipManager;
    accounts: ClientAccount[];
    businessSegment: 'small' | 'medium' | 'large' | 'enterprise';
    riskProfile: 'low' | 'medium' | 'high';
    preferences: ClientPreferences;
    contact: ClientContact;
    createdAt: string;
    updatedAt: string;
}

export interface RelationshipManager {
    id: string;
    name: string;
    email: string;
    phone?: string;
    department: string;
}

export interface ClientAccount {
    id: string;
    accountNumber: string;
    accountType: string;
    bankName: string;
    routingNumber?: string;
    isActive: boolean;
    openDate: string;
    balance?: number;
    currency: string;
}

export interface ClientPreferences {
    communicationChannel: 'email' | 'phone' | 'portal';
    reportFrequency: 'weekly' | 'monthly' | 'quarterly';
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    liquidityPriority: 'high' | 'medium' | 'low';
    yieldPriority: 'high' | 'medium' | 'low';
}

export interface ClientContact {
    primaryContact: {
        name: string;
        title: string;
        email: string;
        phone: string;
    };
    billingContact?: {
        name: string;
        email: string;
        address: BusinessAddress;
    };
    treasuryContact?: {
        name: string;
        title: string;
        email: string;
        phone: string;
    };
}

export interface BusinessAddress {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export interface CreateClientRequest {
    name: string;
    businessType: string;
    industry: string;
    relationshipManagerId: string;
    businessSegment: 'small' | 'medium' | 'large' | 'enterprise';
    contact: ClientContact;
    preferences?: Partial<ClientPreferences>;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
    id: string;
}
