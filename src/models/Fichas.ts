export default class Fichas {
    id?: number = undefined;
    brand_id?: number = undefined;
    image?: string | null = null;
    name?: string = '';
    price?: string = '';
    concept?: string = '';
    ingredients?: string = '';
    keywords?: string = '';
    last_message?: string = '';
    subbrand?: string = '';
    brand?: {
        id?: number;
        name?: string;
        company_id?: number;
        description?: string;
        color?: string;
        company?: {
            id?: number;
            name?: string;
            description?: string;
            image?: string;
        };
    } = {};
}
