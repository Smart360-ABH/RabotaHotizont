
export type Category = 
  | 'Women' 
  | 'Men' 
  | 'Kids' 
  | 'Shoes' 
  | 'Home' 
  | 'Beauty' 
  | 'Accessories' 
  | 'Electronics' 
  | 'Toys' 
  | 'Furniture' 
  | 'Adults' 
  | 'Food' 
  | 'Flowers' 
  | 'Appliances' 
  | 'Pets' 
  | 'Sports' 
  | 'Auto' 
  | 'Transport' 
  | 'Books' 
  | 'Repair' 
  | 'Garden' 
  | 'Health' 
  | 'Stationery'
  | 'Sets'
  | 'Art';

export type VendorProductStatus = 'draft' | 'moderation' | 'active' | 'rejected' | 'blocked';

export interface Product {
  id: string;
  title: string;
  author?: string; // Brand or Author Name (Display)
  price: number;
  oldPrice?: number;
  category: Category;
  image: string;
  rating: number;
  reviewsCount: number;
  description: string;
  tags: string[];
  isNew?: boolean;
  inStock: boolean;
  vendorId?: string; // Link product to a specific vendor ID
  status?: VendorProductStatus; 
  specs?: Record<string, string>; 
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'vendor';
  vendorId?: string; 
  vendorProfile?: VendorProfile; 
  isBlocked?: boolean;
}

export type LogisticsModel = 'FBO' | 'FBS' | 'CNC' | 'DBS';

export interface VendorProfile {
    companyName: string;
    inn: string;
    taxType: 'IP' | 'OOO' | 'SelfEmployed';
    address: string;
    logisticsModel: LogisticsModel;
    balance: number;
    rating: number;
    status: 'pending' | 'active' | 'blocked';
}

// Public facing vendor profile for catalog
export interface VendorPublicProfile {
    id: string;
    name: string;
    description: string;
    image: string;
    rating: number;
    joinedDate: string;
    coverImage?: string;
    status: 'pending' | 'active' | 'blocked';
    vendorId: string; // Internal User ID link
    revenue: number;
}

export interface Review {
    id: string;
    productId: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
}

export interface Shipment {
    id: string;
    date: string;
    warehouse: string;
    itemsCount: number;
    status: 'planned' | 'accepted' | 'processed';
    skuList: string[];
}

export interface Transaction {
    id: string;
    date: string;
    amount: number;
    type: 'payout' | 'fine' | 'sale' | 'logistics';
    description: string;
    status: 'completed' | 'pending';
}

export interface FilterState {
  category: string;
  minPrice: number;
  maxPrice: number;
  search: string;
}

export enum SortOption {
  POPULAR = 'popular',
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
}

export type OrderStatus = 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderDetails {
  id: string;
  items: CartItem[];
  total: number;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
  status: OrderStatus;
  date: string;
  userId?: string;
}
