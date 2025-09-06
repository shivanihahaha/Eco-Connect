

export enum Role {
  PRODUCER = 'PRODUCER',
  MIDDLEMAN = 'MIDDLEMAN',
  BUYER = 'BUYER',
}

export enum WasteType {
  PAPER = 'Paper',
  PLASTIC = 'Plastic',
  BIO = 'Bio-Waste',
  EWASTE = 'E-Waste',
  GLASS = 'Glass',
  METAL = 'Metal',
}

export enum Quality {
    PREMIUM = 'Premium',
    GOOD = 'Good',
    STANDARD = 'Standard',
}

export enum SubscriptionPlan {
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
}

export enum SubscriptionStatus {
    ACTIVE = 'active',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled',
}

export interface Subscription {
    id: string;
    plan: SubscriptionPlan;
    startDate: Date;
    endDate: Date;
    status: SubscriptionStatus;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  rating: number;
  photoUrl: string;
  subscriptions: Subscription[];
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export enum PickupStatus {
    PENDING = 'Pending',
    ASSIGNED = 'Assigned',
    PICKING_UP = 'Picking Up',
    COLLECTED = 'Collected',
    LISTED_FOR_SALE = 'Listed for Sale'
}

export interface WasteListing {
  id: string;
  producer: User;
  wasteType: WasteType;
  quantity: string;
  photoUrl: string;
  location: Location;
  status: PickupStatus;
  postedAt: Date;
  pickupDateTime: Date;
  assignedTo?: User;
  otp: string;
}

export enum MarketplaceItemStatus {
    LISTED = 'Listed',
    SOLD = 'Sold',
    IN_TRANSIT = 'In Transit',
    DELIVERED = 'Delivered',
}

export interface MarketplaceItem {
  id: string;
  seller: User;
  wasteType: WasteType;
  quantity: string;
  photoUrl: string;
  price: number;
  quality: Quality;
  location: Location;
  description?: string;
  status: MarketplaceItemStatus;
  buyer?: User;
  purchaseDate?: Date;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface Challenge {
    id:string;
    title: string;
    description: string;
    points: number;
    progress: number;
    goal: number;
}