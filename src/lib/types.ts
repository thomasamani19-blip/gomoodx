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
