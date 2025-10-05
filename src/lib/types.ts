export type UserRole = 'client' | 'escorte' | 'partenaire' | 'administrateur';

export type User = {
    id: string;
    nom: string;
    email: string;
    pseudo?: string;
    role: UserRole;
    avatar?: string;
};


export type Creator = {
    id: string;
    name: string;
    bio: string;
    imageUrl: string;
    imageHint: string;
}

export type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    imageHint: string;
}

export type Service = {
    id: string;
    title: string;
    description: string;
    price?: number;
    imageUrl: string;
    imageHint: string;
}

export type BlogArticle = {
    id: string;
    title: string;
    content: string;
    imageUrl: string;
    imageHint: string;
    date: string;
}

export type LiveSession = {
    id: string;
    title: string;
    price_per_minute: number;
    status: 'scheduled' | 'live' | 'ended';
    imageUrl: string;
    imageHint: string;
    creatorName: string;
    creatorId: string;
}

export type Message = {
    id: string;
    conversationId: string;
    content: string;
    timestamp: any; // ou FieldValue
    senderId: string; 
    receiverId: string;
    read: boolean;
};

export type Conversation = {
    id: string;
    participantIds: string[];
    lastMessage: string;
    lastMessageTimestamp: string;
};

export type Transaction = {
    id?: string; // id can be optional as it's assigned by Firestore
    type: 'deposit' | 'purchase' | 'credit' | 'debit';
    amount: number;
    date: string;
    description?: string;
};

export type Wallet = {
    id: string;
    balance: number;
};

export type MonthlyRevenue = {
    month: string;
    revenue: number;
};
