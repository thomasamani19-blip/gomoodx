export type UserRole = 'client' | 'escorte' | 'partenaire' | 'administrateur';


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
    content: string;
    timestamp: string;
    sender: string; // 'me' or participant's name/ID
};

export type Conversation = {
    id: string;
    participantName: string;
    participantAvatar: string;
    lastMessage: string;
    lastMessageTimestamp: string;
};
