

import { Role, User, WasteType, WasteListing, MarketplaceItem, PickupStatus, Quality, Badge, Challenge, Location, MarketplaceItemStatus, Subscription, SubscriptionPlan, SubscriptionStatus } from '../types';

type UserWithAuth = User & { password?: string };

// Helper to generate a random 4-digit OTP
const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

let users: { [key: string]: UserWithAuth } = {
    'user-prod-1': { id: 'user-prod-1', name: 'Charminar Paper Mill', email: 'producer@eco.com', password: 'password', role: Role.PRODUCER, rating: 4.8, photoUrl: 'https://picsum.photos/seed/producer1/100/100', subscriptions: [] },
    'user-prod-2': { id: 'user-prod-2', name: 'Paradise Biryani', email: 'cafe@green.com', password: 'password', role: Role.PRODUCER, rating: 4.5, photoUrl: 'https://picsum.photos/seed/producer2/100/100', subscriptions: [] },
    'user-mid-1': { id: 'user-mid-1', name: 'Hyderabad Haulers', email: 'collector@haul.com', password: 'password', role: Role.MIDDLEMAN, rating: 4.9, photoUrl: 'https://picsum.photos/seed/mid1/100/100', subscriptions: [
        { id: 'sub-1', plan: SubscriptionPlan.YEARLY, startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)), endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), status: SubscriptionStatus.ACTIVE }
    ]},
    'user-mid-2': { id: 'user-mid-2', name: 'Cyberabad Collectors', email: 'swift@collect.com', password: 'password', role: Role.MIDDLEMAN, rating: 4.7, photoUrl: 'https://picsum.photos/seed/mid2/100/100', subscriptions: [
        { id: 'sub-2', plan: SubscriptionPlan.MONTHLY, startDate: new Date(new Date().setMonth(new Date().getMonth() - 2)), endDate: new Date(new Date().setMonth(new Date().getMonth() - 1)), status: SubscriptionStatus.EXPIRED }
    ]},
    'user-buy-1': { id: 'user-buy-1', name: 'Re-Maker Hyderabad', email: 'buyer@remaker.com', password: 'password', role: Role.BUYER, rating: 5.0, photoUrl: 'https://picsum.photos/seed/buyer1/100/100', subscriptions: [] },
};

export const authenticateUser = (email: string, passwordInput: string): User | null => {
    const userRecord = Object.values(users).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (userRecord && userRecord.password === passwordInput) {
        const { password, ...user } = userRecord;
        return user;
    }
    return null;
};

export const registerUser = (details: { name: string, email: string, passwordInput: string, role: Role }): User | string => {
    if (Object.values(users).find(u => u.email.toLowerCase() === details.email.toLowerCase())) {
        return "An account with this email already exists.";
    }

    const newUser: UserWithAuth = {
        id: `user-${Date.now()}`,
        name: details.name,
        email: details.email,
        password: details.passwordInput,
        role: details.role,
        rating: 5, // Default rating
        photoUrl: `https://i.pravatar.cc/100?u=${Date.now()}`,
        subscriptions: [],
    };
    
    users[newUser.id] = newUser;
    
    const { password, ...userToReturn } = newUser;
    return userToReturn;
};

export const updateUserSubscription = (userId: string, plan: SubscriptionPlan): User | null => {
    const userRecord = users[userId];
    if (userRecord) {
        // Expire any currently active subscriptions
        const updatedSubscriptions = userRecord.subscriptions.map(sub => 
            sub.status === SubscriptionStatus.ACTIVE ? { ...sub, status: SubscriptionStatus.EXPIRED } : sub
        );

        const startDate = new Date();
        const endDate = new Date();
        if (plan === SubscriptionPlan.MONTHLY) {
            endDate.setMonth(startDate.getMonth() + 1);
        } else {
            endDate.setFullYear(startDate.getFullYear() + 1);
        }

        const newSubscription: Subscription = {
            id: `sub-${Date.now()}`,
            plan,
            startDate,
            endDate,
            status: SubscriptionStatus.ACTIVE,
        };

        updatedSubscriptions.push(newSubscription);
        
        users[userId] = { ...userRecord, subscriptions: updatedSubscriptions };
        const { password, ...userToReturn } = users[userId];
        return userToReturn;
    }
    return null;
}


const getUserById = (id: string): User => {
    const userRecord = users[id];
    if (!userRecord) {
        // This can happen if a listing references a user that isn't in the initial seed.
        // Provide a sensible default.
        return { id: 'user-unknown', name: 'Unknown User', email: '', role: Role.PRODUCER, rating: 0, photoUrl: 'https://picsum.photos/seed/unknown/100/100', subscriptions: [] };
    }
    const { password, ...user } = userRecord;
    return user;
}


let producerListings: WasteListing[] = [
    {
        id: 'wl-1',
        producer: getUserById('user-prod-1'),
        wasteType: WasteType.PLASTIC,
        quantity: '250 kg',
        photoUrl: 'https://picsum.photos/seed/plasticwaste/400/300',
        location: { lat: 17.53, lng: 78.26, address: '123 Industrial Estate, Patancheru, Hyderabad' },
        status: PickupStatus.ASSIGNED,
        assignedTo: getUserById('user-mid-1'),
        postedAt: new Date(Date.now() - 3600 * 1000 * 2),
        pickupDateTime: new Date(Date.now() + 3600 * 1000 * 24),
        otp: generateOtp(),
    },
    {
        id: 'wl-2',
        producer: getUserById('user-prod-2'),
        wasteType: WasteType.BIO,
        quantity: '50 kg',
        photoUrl: 'https://picsum.photos/seed/biowaste/400/300',
        location: { lat: 17.44, lng: 78.34, address: '456 Cafe Road, Gachibowli, Hyderabad' },
        status: PickupStatus.PENDING,
        postedAt: new Date(Date.now() - 3600 * 1000 * 5),
        pickupDateTime: new Date(Date.now() + 3600 * 1000 * 4),
        otp: generateOtp(),
    },
    {
        id: 'wl-3',
        producer: getUserById('user-prod-1'),
        wasteType: WasteType.PAPER,
        quantity: '500 kg',
        photoUrl: 'https://picsum.photos/seed/paperwaste/400/300',
        location: { lat: 17.45, lng: 78.38, address: '789 Business Park, HITEC City, Hyderabad' },
        status: PickupStatus.LISTED_FOR_SALE, // Changed status
        assignedTo: getUserById('user-mid-2'),
        postedAt: new Date(Date.now() - 3600 * 1000 * 24 * 2),
        pickupDateTime: new Date(Date.now() - 3600 * 1000 * 24 * 2 + 3600 * 1000 * 8),
        otp: generateOtp(),
    },
    {
        id: 'wl-4',
        producer: getUserById('user-prod-2'),
        wasteType: WasteType.EWASTE,
        quantity: '15 units',
        photoUrl: 'https://picsum.photos/seed/ewaste/400/300',
        location: { lat: 17.41, lng: 78.43, address: '101 Banjara Hills, Hyderabad' },
        status: PickupStatus.PENDING,
        postedAt: new Date(Date.now() - 3600 * 1000 * 1),
        pickupDateTime: new Date(Date.now() + 3600 * 1000 * 2),
        otp: generateOtp(),
    },
];

export const getProducerListings = () => producerListings;

export const setProducerListings = (listings: WasteListing[]) => {
    producerListings = listings;
};

export const addProducerListing = (listing: Omit<WasteListing, 'otp'>) => {
    const newListingWithOtp = { ...listing, otp: generateOtp() };
    producerListings.unshift(newListingWithOtp);
};

let marketplaceItems: MarketplaceItem[] = [
    {
        id: 'mi-1',
        seller: getUserById('user-mid-2'),
        wasteType: WasteType.PAPER,
        quantity: '495 kg',
        description: 'Clean, baled cardboard',
        photoUrl: 'https://picsum.photos/seed/paperbale/400/300',
        price: 12500,
        quality: Quality.GOOD,
        location: { lat: 17.44, lng: 78.35, address: '10 Collector Way, Kondapur, Hyderabad' },
        status: MarketplaceItemStatus.LISTED,
    },
    {
        id: 'mi-2',
        seller: getUserById('user-mid-1'),
        wasteType: WasteType.PLASTIC,
        quantity: '1 Tonne',
        description: 'High-grade PET plastic pellets',
        photoUrl: 'https://picsum.photos/seed/plasticpellets/400/300',
        price: 40000,
        quality: Quality.PREMIUM,
        location: { lat: 17.38, lng: 78.48, address: '20 Hauler Hub, Koti, Hyderabad' },
        status: MarketplaceItemStatus.LISTED,
    },
     {
        id: 'mi-3',
        seller: getUserById('user-mid-1'),
        wasteType: WasteType.METAL,
        quantity: '2 Tonnes',
        description: 'Scrap aluminum',
        photoUrl: 'https://picsum.photos/seed/metalscrap/400/300',
        price: 75000,
        quality: Quality.STANDARD,
        location: { lat: 17.38, lng: 78.48, address: '20 Hauler Hub, Koti, Hyderabad' },
        status: MarketplaceItemStatus.LISTED,
    },
];

export const purchaseMarketplaceItem = (itemId: string, buyer: User) => {
    marketplaceItems = marketplaceItems.map(item =>
        item.id === itemId
            ? { ...item, status: MarketplaceItemStatus.SOLD, buyer, purchaseDate: new Date() }
            : item
    );
};

export const updateMarketplaceItemStatus = (itemId: string, status: MarketplaceItemStatus) => {
     marketplaceItems = marketplaceItems.map(item =>
        item.id === itemId
            ? { ...item, status: status }
            : item
    );
};


const badges: Badge[] = [
    { id: 'b-1', name: 'Eco Starter', description: 'First pickup complete!', icon: '🌟' },
    { id: 'b-2', name: 'Plastic Free', description: 'Recycled 100kg of plastic.', icon: '♻️' },
    { id: 'b-3', name: 'Paper Giant', description: 'Recycled 1 ton of paper.', icon: '📜' },
    { id: 'b-4', name: 'Green Thumb', description: '5 bio-waste pickups.', icon: '🌿' },
];

const challenges: Challenge[] = [
    { id: 'c-1', title: 'Weekly Warrior', description: 'Complete 3 pickups this week', points: 100, progress: 2, goal: 3 },
    { id: 'c-2', title: 'Diversity Champion', description: 'Recycle 3 different waste types', points: 150, progress: 1, goal: 3 },
];

export const getGamificationData = () => ({
    points: 1250,
    badges: badges.slice(0, 2),
    challenges,
});

export const getMarketplaceItems = () => marketplaceItems;

export const addMarketplaceItem = (item: MarketplaceItem) => {
    marketplaceItems.unshift(item);
};