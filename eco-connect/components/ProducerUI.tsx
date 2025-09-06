

import React, { useState, useEffect, useMemo } from 'react';
import { getGamificationData } from '../services/mockData';
import { WasteListing, Badge, Challenge, PickupStatus, User, WasteType, Role, Location } from '../types';
import { WASTE_TYPE_DETAILS, WASTE_TYPES } from '../constants';
import { MapPinIcon, PlusCircleIcon, StarIcon, TrophyIcon, CameraIcon, CalendarDaysIcon, TruckIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon, UserCircleIcon, ClipboardDocumentListIcon, ListBulletIcon } from './icons/Icons';
import InteractiveMap from './SimulatedMap';

// Utility to format time ago
const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
}

// Haversine distance calculation (simplified)
const calculateDistance = (loc1: Location, loc2: Location) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const TabButton: React.FC<{title: string, icon: React.FC<any>, active: boolean, onClick: () => void, count: number}> = ({ title, icon: Icon, active, onClick, count }) => (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 p-3 font-bold text-sm transition-colors ${active ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:bg-slate-100'}`}>
        <Icon className="h-5 w-5" />
        {title}
        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}>{count}</span>
    </button>
);


interface ProducerUIProps {
    currentUser: User;
    allListings: WasteListing[];
    collectorLocations: Record<string, Location>;
    onAddNewListing: (newListing: Omit<WasteListing, 'otp'>) => void;
    onVerifyPickup: (listingId: string, otp: string) => boolean;
}

const ProducerUI: React.FC<ProducerUIProps> = ({ currentUser, allListings, collectorLocations, onAddNewListing, onVerifyPickup }) => {
    const [gamificationData, setGamificationData] = useState<{ points: number, badges: Badge[], challenges: Challenge[] } | null>(null);
    const [showPostModal, setShowPostModal] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState<WasteListing | null>(null);
    const [showChatModal, setShowChatModal] = useState<WasteListing | null>(null);
    const [view, setView] = useState<'active' | 'history'>('active');

    const { activeListings, historicalListings } = useMemo(() => {
        const myListings = allListings.filter(l => l.producer.id === currentUser.id);
        const active = myListings.filter(l => [PickupStatus.PENDING, PickupStatus.ASSIGNED, PickupStatus.PICKING_UP].includes(l.status));
        const historical = myListings.filter(l => ![PickupStatus.PENDING, PickupStatus.ASSIGNED, PickupStatus.PICKING_UP].includes(l.status));
        return { activeListings: active, historicalListings: historical };
    }, [allListings, currentUser.id]);

    useEffect(() => {
        setGamificationData(getGamificationData());
    }, []);

    const handleTrackPickup = (listing: WasteListing) => {
        if (listing.status === PickupStatus.ASSIGNED || listing.status === PickupStatus.PICKING_UP) {
            setShowTrackingModal(listing);
        }
    };
    
    const handleAddListing = (newListingData: { wasteType: WasteType, quantity: string, photoUrl: string, address: string, pickupDateTime: Date }) => {
        const newListing: Omit<WasteListing, 'otp'> = {
            id: `wl-${Date.now()}`,
            producer: currentUser,
            wasteType: newListingData.wasteType,
            quantity: newListingData.quantity,
            photoUrl: newListingData.photoUrl,
            location: { lat: 17.45, lng: 78.38, address: newListingData.address }, // Mock location for HITEC City, Hyderabad
            status: PickupStatus.PENDING,
            postedAt: new Date(),
            pickupDateTime: newListingData.pickupDateTime,
        };
        onAddNewListing(newListing);
        setShowPostModal(false);
    };

    if (!gamificationData) {
        return <div className="text-center p-10">Loading producer data...</div>;
    }

    const displayedListings = view === 'active' ? activeListings : historicalListings;

    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Feed */}
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-slate-800">My Waste Listings</h2>
                        <button onClick={() => setShowPostModal(true)} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-full shadow-lg transition-transform transform hover:scale-105">
                            <PlusCircleIcon className="h-6 w-6" /> New Post
                        </button>
                    </div>
                     <div className="bg-white rounded-lg shadow-sm mb-4">
                        <div className="flex border-b border-slate-200">
                            <TabButton title="Active" icon={ClipboardDocumentListIcon} active={view === 'active'} onClick={() => setView('active')} count={activeListings.length} />
                            <TabButton title="History" icon={ListBulletIcon} active={view === 'history'} onClick={() => setView('history')} count={historicalListings.length} />
                        </div>
                    </div>
                    <div className="space-y-6">
                        {displayedListings.length > 0 ? (
                            displayedListings.map(listing => (
                                <WasteListingCard 
                                    key={listing.id} 
                                    listing={listing} 
                                    onTrack={handleTrackPickup} 
                                    onVerify={onVerifyPickup}
                                />
                            ))
                        ) : (
                            <div className="text-center p-16 bg-white rounded-xl shadow-sm text-slate-500">
                                <h3 className="text-xl font-semibold">
                                    {view === 'active' ? 'No active listings!' : 'No listing history yet.'}
                                </h3>
                                <p className="mt-2">
                                     {view === 'active' ? 'Click "New Post" to create a waste listing.' : 'Completed listings will appear here.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <ProfilePanel user={currentUser} />
                    <GamificationPanel points={gamificationData.points} badges={gamificationData.badges} challenges={gamificationData.challenges} />
                </div>

                {showPostModal && <NewPostModal onClose={() => setShowPostModal(false)} onAddListing={handleAddListing} />}
                {showTrackingModal && <TrackingModal listing={showTrackingModal} collectorLocations={collectorLocations} onClose={() => setShowTrackingModal(null)} onOpenChat={() => setShowChatModal(showTrackingModal)} />}
                {showChatModal && <ChatModal listing={showChatModal} currentUser={currentUser} onClose={() => setShowChatModal(null)} />}

            </div>
        </div>
    );
};

const ProfilePanel: React.FC<{ user: User }> = ({ user }) => (
    <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
            <UserCircleIcon className="h-6 w-6 text-producer"/> My Profile
        </h3>
        <div className="flex items-center gap-4 min-w-0">
            <img src={user.photoUrl} alt={user.name} className="w-16 h-16 rounded-full flex-shrink-0"/>
            <div className="min-w-0">
                <p className="font-bold text-lg text-slate-900 truncate">{user.name}</p>
                <p className="text-sm text-slate-500 truncate">{user.email}</p>
            </div>
        </div>
        <div className="mt-4 flex items-center justify-center bg-producer-light p-2 rounded-lg">
            <span className="font-semibold text-producer-text">Rating:</span>
            <div className="flex items-center gap-1 ml-2">
                 <StarIcon className="h-5 w-5 text-yellow-400" />
                 <span className="font-bold text-lg text-producer">{user.rating.toFixed(1)}</span>
            </div>
        </div>
    </div>
);


const OtpVerificationForm: React.FC<{ listingId: string; onVerify: (listingId: string, otp: string) => boolean; }> = ({ listingId, onVerify }) => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        setTimeout(() => { // Simulate network delay
            const success = onVerify(listingId, otp);
            if (!success) {
                setError('Invalid OTP. Please try again.');
                setOtp('');
            }
            // On success, the card will re-render to "Collected".
            setLoading(false);
        }, 500);
    };

    return (
        <div className="mt-4 p-4 bg-producer-light rounded-lg">
            <p className="text-sm font-semibold text-producer-text">Confirm Pickup</p>
            <p className="text-xs text-slate-600 mb-2">Enter the 4-digit code from the collector to verify.</p>
            <form onSubmit={handleSubmit} className="flex items-start gap-2">
                <div className="flex-grow">
                    <input
                        type="tel"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        maxLength={4}
                        className="w-full text-center text-xl font-mono tracking-widest bg-white p-2 rounded-md border-2 border-slate-300 text-slate-900 focus:border-primary focus:ring-primary"
                        placeholder="----"
                        aria-label="One-Time Password"
                    />
                     {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                </div>
                <button
                    type="submit"
                    disabled={loading || otp.length !== 4}
                    className="h-[44px] flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors shadow disabled:bg-slate-400"
                >
                    <ShieldCheckIcon className="h-5 w-5"/>
                    {loading ? 'Verifying...' : 'Confirm'}
                </button>
            </form>
        </div>
    );
}


const WasteListingCard: React.FC<{ listing: WasteListing, onTrack: (listing: WasteListing) => void, onVerify: (listingId: string, otp: string) => boolean }> = ({ listing, onTrack, onVerify }) => {
    const { color } = WASTE_TYPE_DETAILS[listing.wasteType];

    const getStatusInfo = (status: PickupStatus): { style: string; text: string; subtext: string | null } => {
        switch (status) {
            case PickupStatus.PENDING: return { style: 'bg-yellow-100 text-yellow-800', text: 'Pending', subtext: 'Awaiting collector assignment' };
            case PickupStatus.ASSIGNED: return { style: 'bg-blue-100 text-blue-800 cursor-pointer', text: 'Assigned', subtext: 'Collector has accepted' };
            case PickupStatus.PICKING_UP: return { style: 'bg-blue-100 text-blue-800 animate-pulse-fast cursor-pointer', text: 'Picking Up', subtext: 'Awaiting your confirmation' };
            case PickupStatus.COLLECTED: return { style: 'bg-green-100 text-green-800', text: 'Picked Up', subtext: 'Pickup has been verified' };
            case PickupStatus.LISTED_FOR_SALE: return { style: 'bg-purple-100 text-purple-800', text: 'Marketplace', subtext: 'Item is listed for sale' };
            default: return { style: 'bg-slate-100 text-slate-800', text: status, subtext: null };
        }
    };
    
    const isTrackable = listing.status === PickupStatus.ASSIGNED || listing.status === PickupStatus.PICKING_UP;
    const statusInfo = getStatusInfo(listing.status);

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden transition-shadow hover:shadow-xl">
            <div className="md:flex">
                <div className="md:flex-shrink-0">
                    <img className="h-48 w-full object-cover md:w-48" src={listing.photoUrl} alt={`Waste type: ${listing.wasteType}`} />
                </div>
                <div className="p-6 flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                        <div className={`uppercase tracking-wide text-sm ${color.replace('bg-', 'text-')} font-semibold`}>
                            {listing.wasteType}
                        </div>
                         <div className="text-right">
                            <div
                                onClick={() => isTrackable && onTrack(listing)}
                                className={`px-3 py-1 text-xs font-bold rounded-full inline-block ${statusInfo.style} ${isTrackable ? 'cursor-pointer hover:ring-2 ring-offset-1 ring-primary' : ''}`}
                            >
                                {statusInfo.text}
                                {isTrackable && ' (Track)'}
                            </div>
                             {statusInfo.subtext && <p className="text-xs text-slate-500 mt-1">{statusInfo.subtext}</p>}
                        </div>
                    </div>
                    <p className="block mt-1 text-lg leading-tight font-medium text-black truncate">{listing.quantity}</p>
                    <div className="mt-2 text-slate-500 text-sm flex items-center gap-2 truncate">
                        <MapPinIcon className="h-4 w-4 flex-shrink-0" /> {listing.location.address}
                    </div>
                     <div className="mt-2 text-slate-500 text-sm flex items-center gap-2">
                        <CalendarDaysIcon className="h-4 w-4" />
                        Pickup: {listing.pickupDateTime.toLocaleDateString([], { month: 'short', day: 'numeric' })} at {listing.pickupDateTime.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Posted: {formatTimeAgo(listing.postedAt)}</p>
                    
                    {listing.assignedTo && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                           <div className="flex items-center gap-3">
                             <img className="h-10 w-10 rounded-full" src={listing.assignedTo.photoUrl} alt={listing.assignedTo.name} />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-700 truncate">{listing.assignedTo.name}</p>
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                        <StarIcon className="h-4 w-4 text-yellow-400" /> {listing.assignedTo.rating}
                                    </div>
                                </div>
                           </div>
                           {listing.status === PickupStatus.PICKING_UP && (
                               <OtpVerificationForm listingId={listing.id} onVerify={onVerify} />
                           )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const GamificationPanel: React.FC<{ points: number; badges: Badge[]; challenges: Challenge[] }> = ({ points, badges, challenges }) => (
    <div className="bg-white p-6 rounded-xl shadow-md space-y-6 sticky top-24">
        <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><TrophyIcon className="h-6 w-6 text-producer"/> Gamification</h3>
        </div>
        <div className="text-center bg-producer-light p-4 rounded-lg">
            <p className="text-lg font-semibold text-producer-text">Eco-Points</p>
            <p className="text-4xl font-bold text-producer">{points.toLocaleString()}</p>
        </div>
        <div>
            <h4 className="font-semibold text-slate-700 mb-2">My Badges</h4>
            <div className="flex flex-wrap gap-4">
                {badges.map(badge => (
                    <div key={badge.id} className="text-center group" title={`${badge.name}: ${badge.description}`}>
                        <div className="text-4xl group-hover:scale-125 transition-transform">{badge.icon}</div>
                    </div>
                ))}
            </div>
        </div>
        <div>
            <h4 className="font-semibold text-slate-700 mb-3">Active Challenges</h4>
            <div className="space-y-4">
                {challenges.map(challenge => (
                    <div key={challenge.id}>
                        <p className="text-sm font-medium text-slate-600">{challenge.title}</p>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 mt-1">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(challenge.progress / challenge.goal) * 100}%` }}></div>
                        </div>
                        <p className="text-xs text-right text-slate-500 mt-1">{challenge.progress}/{challenge.goal}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const NewPostModal: React.FC<{ onClose: () => void; onAddListing: (data: { wasteType: WasteType, quantity: string, photoUrl: string, address: string, pickupDateTime: Date }) => void; }> = ({ onClose, onAddListing }) => {
    const [wasteType, setWasteType] = useState<WasteType>(WasteType.PLASTIC);
    const [quantity, setQuantity] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [address, setAddress] = useState('101, HITEC City, Hyderabad');
    const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
    const [pickupTime, setPickupTime] = useState('14:00');
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!quantity.trim() || !photoFile || !photoPreview || !address.trim() || !pickupDate || !pickupTime) {
            setError('Please fill out all fields and upload a photo.');
            return;
        }
        const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);
        if (isNaN(pickupDateTime.getTime())) {
            setError('The pickup date and time are invalid.');
            return;
        }
        onAddListing({ wasteType, quantity, photoUrl: photoPreview, address, pickupDateTime });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto animate-fade-in">
                <h3 className="text-xl font-bold mb-4 text-slate-800">Create New Waste Listing</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Waste Type</label>
                        <select
                            value={wasteType}
                            onChange={(e) => setWasteType(e.target.value as WasteType)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 bg-white text-slate-900 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                        >
                            {WASTE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Quantity (e.g., 50 kg, 10 bags)</label>
                        <input
                            type="text"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-slate-300 rounded-md bg-white text-slate-900"
                            placeholder="e.g. 250 kg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Pickup Address</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-slate-300 rounded-md bg-white text-slate-900"
                            placeholder="Enter pickup address"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Pickup Date</label>
                            <input
                                type="date"
                                value={pickupDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setPickupDate(e.target.value)}
                                className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-slate-300 rounded-md bg-white text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Pickup Time</label>
                            <input
                                type="time"
                                value={pickupTime}
                                onChange={(e) => setPickupTime(e.target.value)}
                                className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-slate-300 rounded-md bg-white text-slate-900"
                            />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Photo</label>
                         <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                            {photoPreview ? (
                                <div className="relative group">
                                    <img src={photoPreview} alt="Preview" className="h-32 w-auto rounded-md object-cover" />
                                    <label htmlFor="file-upload" className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        Change Photo
                                    </label>
                                    <input id="file-upload" name="file-upload" type="file" onChange={handleFileChange} accept="image/*" className="sr-only" />
                                </div>
                            ) : (
                                <div className="space-y-1 text-center">
                                    <CameraIcon className="mx-auto h-12 w-12 text-slate-400" />
                                    <div className="flex text-sm text-slate-600">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none">
                                            <span>Upload a file</span>
                                            <input id="file-upload" name="file-upload" type="file" onChange={handleFileChange} accept="image/*" className="sr-only" />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors">Cancel</button>
                        <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors">Post Listing</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TrackingModal: React.FC<{ listing: WasteListing; collectorLocations: Record<string, Location>; onClose: () => void; onOpenChat: () => void; }> = ({ listing, collectorLocations, onClose, onOpenChat }) => {
    const collector = listing.assignedTo as User;
    const collectorLocation = collector ? collectorLocations[collector.id] : null;
    const [etaSeconds, setEtaSeconds] = useState<number | null>(null);

    const distance = useMemo(() => {
        return collectorLocation ? calculateDistance(listing.location, collectorLocation) : null;
    }, [listing.location, collectorLocation]);

    useEffect(() => {
        if (distance !== null && etaSeconds === null) {
            // Assuming 40 km/h average speed, calculate ETA in seconds
            const calculatedEta = Math.round((distance / 40) * 3600);
            setEtaSeconds(calculatedEta > 60 ? calculatedEta : 60); // Set minimum 60 seconds
        }
    }, [distance, etaSeconds]);

    useEffect(() => {
        if(etaSeconds === null || etaSeconds <= 0) return;
        const timer = setInterval(() => {
            setEtaSeconds(prev => (prev ? prev - 1 : 0));
        }, 1000); // Decrement every second
        return () => clearInterval(timer);
    }, [etaSeconds]);


    const timelineSteps = [PickupStatus.ASSIGNED, PickupStatus.PICKING_UP, PickupStatus.COLLECTED];
    const currentStepIndex = timelineSteps.indexOf(listing.status as PickupStatus);

    const formatEta = (totalSeconds: number | null) => {
        if (totalSeconds === null) return '...';
        if (totalSeconds <= 0) return 'Arriving now';
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-30 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl animate-fade-in">
                <div className="p-6">
                    <h3 className="text-2xl font-bold mb-1 text-slate-800">Tracking Pickup</h3>
                    <p className="text-slate-500">Collector status is live!</p>
                </div>
                
                <div className="h-64 md:h-80 w-full">
                    <InteractiveMap collectorLocation={collectorLocation} destinationLocation={listing.location} />
                </div>

                <div className="p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <img src={collector.photoUrl} alt={collector.name} className="h-16 w-16 rounded-full shadow-lg"/>
                        <div>
                            <p className="text-xl font-bold text-slate-800">{collector.name}</p>
                             <div className="flex items-center gap-1.5 text-sm">
                                <span className="text-middleman-text font-semibold">Collector</span>
                                <div className="flex items-center gap-1 text-yellow-500 ml-2">
                                    <StarIcon className="h-5 w-5"/> {collector.rating}
                                </div>
                            </div>
                            <button onClick={onOpenChat} className="mt-2 flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1 px-3 rounded-full text-sm">
                                <ChatBubbleLeftRightIcon className="h-4 w-4"/>
                                Chat with Collector
                            </button>
                        </div>
                         <div className="ml-auto text-right">
                            <p className="text-slate-500 text-sm">EST. ARRIVAL</p>
                            <p className="text-2xl font-bold text-primary tabular-nums">
                               {listing.status === PickupStatus.PICKING_UP ? formatEta(etaSeconds) : '...'}
                            </p>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-3 text-slate-700">Status Timeline</h4>
                        <div className="flex justify-between">
                            {timelineSteps.map((step, index) => (
                                <div key={step} className="flex-1 text-center relative">
                                    <div className={`mx-auto h-4 w-4 rounded-full ${index <= currentStepIndex ? 'bg-primary' : 'bg-slate-300'}`}></div>
                                    <p className={`mt-1 text-xs font-bold ${index <= currentStepIndex ? 'text-primary' : 'text-slate-400'}`}>{step}</p>
                                    {index < timelineSteps.length - 1 && (
                                        <div className={`absolute top-2 left-1/2 w-full h-0.5 ${index < currentStepIndex ? 'bg-primary' : 'bg-slate-300'}`}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <button onClick={onClose} className="mt-8 w-full bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-lg hover:bg-slate-300 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// A mock chat modal. In a real app, this would be a full feature.
const ChatModal: React.FC<{ listing: WasteListing; currentUser: User; onClose: () => void; }> = ({ listing, currentUser, onClose }) => {
    const otherUser = currentUser.role === Role.PRODUCER ? listing.assignedTo : listing.producer;
    const messages = [
        { id: 1, sender: otherUser, text: 'Hello! I\'ve accepted your pickup request for the plastic waste.' },
        { id: 2, sender: currentUser, text: 'Great, thank you! Let me know if you have any trouble finding the location.' },
        { id: 3, sender: otherUser, text: 'Will do. I\'m starting my route now. My ETA is about 25 minutes.' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col animate-fade-in" style={{ height: '70vh' }}>
                <header className="p-4 border-b flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Chat with {otherUser?.name}</h3>
                        <p className="text-sm text-slate-500">Regarding: {listing.quantity} of {listing.wasteType}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl">&times;</button>
                </header>
                <main className="flex-grow p-4 space-y-4 overflow-y-auto bg-slate-50">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.sender?.id === currentUser.id ? 'justify-end' : ''}`}>
                            {msg.sender?.id !== currentUser.id && <img src={msg.sender?.photoUrl} alt="" className="h-8 w-8 rounded-full"/>}
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.sender?.id === currentUser.id ? 'bg-primary text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                            {msg.sender?.id === currentUser.id && <img src={msg.sender?.photoUrl} alt="" className="h-8 w-8 rounded-full"/>}
                        </div>
                    ))}
                </main>
                <footer className="p-4 border-t bg-white">
                    <div className="flex items-center gap-2">
                        <input type="text" placeholder="Type your message..." className="flex-grow px-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary" />
                        <button className="bg-primary text-white font-bold py-2 px-4 rounded-full hover:bg-primary-dark transition-colors">Send</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};


export default ProducerUI;