

import React, { useState, useEffect, useMemo } from 'react';
import { MarketplaceItem, WasteType, Quality, User, MarketplaceItemStatus, Location } from '../types';
import { WASTE_TYPE_DETAILS, WASTE_TYPES } from '../constants';
import { MapPinIcon, StarIcon, BanknotesIcon, ShoppingBagIcon, ListBulletIcon, CheckCircleIcon, TruckIcon, XCircleIcon, LockClosedIcon, Cog6ToothIcon } from './icons/Icons';
import InteractiveMap from './SimulatedMap';
import SubscriptionPanel from './SubscriptionPanel';

const QUALITIES = Object.values(Quality);

// Haversine distance calculation (simplified)
const calculateDistance = (loc1: Location, loc2: Location) => {
    if (!loc1 || !loc2) return Infinity;
    const R = 6371; // Radius of the Earth in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};


const TabButton: React.FC<{title: string, icon: React.FC<any>, active: boolean, onClick: () => void, count?: number}> = ({ title, icon: Icon, active, onClick, count }) => (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 p-3 font-bold text-sm transition-colors ${active ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:bg-slate-100'}`}>
        <Icon className="h-5 w-5" />
        {title}
        {typeof count !== 'undefined' && <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}>{count}</span>}
    </button>
);


interface BuyerUIProps {
    marketplaceItems: MarketplaceItem[];
    onPurchase: (item: MarketplaceItem) => void;
    currentUser: User;
    onUpdateMarketplaceItemStatus: (itemId: string, status: MarketplaceItemStatus) => void;
    collectorLocations: Record<string, Location>;
    isSubscribed: boolean;
    onPromptSubscription: () => void;
}

const BuyerUI: React.FC<BuyerUIProps> = ({ marketplaceItems, onPurchase, currentUser, onUpdateMarketplaceItemStatus, collectorLocations, isSubscribed, onPromptSubscription }) => {
    const [view, setView] = useState<'marketplace' | 'history' | 'account'>('marketplace');
    const [showBuyModal, setShowBuyModal] = useState<MarketplaceItem | null>(null);
    const [showTrackingModal, setShowTrackingModal] = useState<MarketplaceItem | null>(null);
    const [filters, setFilters] = useState<{ wasteTypes: WasteType[], qualities: Quality[] }>({
        wasteTypes: [],
        qualities: [],
    });

    const { availableItems, myPurchases } = useMemo(() => {
        const available = marketplaceItems.filter(item => 
            item.status === MarketplaceItemStatus.LISTED &&
            (filters.wasteTypes.length === 0 || filters.wasteTypes.includes(item.wasteType)) &&
            (filters.qualities.length === 0 || filters.qualities.includes(item.quality))
        );
        const purchases = marketplaceItems
            .filter(item => item.buyer?.id === currentUser.id)
            .sort((a,b) => (b.purchaseDate?.getTime() ?? 0) - (a.purchaseDate?.getTime() ?? 0));
        
        return { availableItems: available, myPurchases: purchases };
    }, [marketplaceItems, filters, currentUser.id]);

    const handleToggleFilter = <T,>(filterType: 'wasteTypes' | 'qualities', value: T) => {
        setFilters(prev => {
            const currentFilter = prev[filterType] as T[];
            const newFilter = currentFilter.includes(value) ? currentFilter.filter(v => v !== value) : [...currentFilter, value];
            return { ...prev, [filterType]: newFilter };
        });
    };
    
    const handleConfirmDelivery = (itemId: string) => {
        if (confirm("Have you received this item? This will mark the order as complete.")) {
            onUpdateMarketplaceItemStatus(itemId, MarketplaceItemStatus.DELIVERED);
        }
    }

    const renderMainContent = () => {
        switch(view) {
            case 'marketplace':
                return availableItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {availableItems.map(item => <MarketplaceCard key={item.id} item={item} onBuy={() => setShowBuyModal(item)} isSubscribed={isSubscribed} onPromptSubscription={onPromptSubscription} />)}
                    </div>
                ) : (
                    <div className="text-center p-16 text-slate-500 bg-white rounded-xl shadow-sm"><h2 className="text-2xl font-bold">No Items Found</h2><p className="mt-2">Try adjusting your filters.</p></div>
                );
            case 'history':
                return myPurchases.length > 0 ? (
                    <div className="space-y-4">
                        {myPurchases.map(item => <PurchaseHistoryCard key={item.id} item={item} onTrack={() => setShowTrackingModal(item)} onConfirmDelivery={() => handleConfirmDelivery(item.id)} />)}
                    </div>
                ) : (
                    <div className="text-center p-16 text-slate-500 bg-white rounded-xl shadow-sm"><h2 className="text-2xl font-bold">No Purchase History</h2><p className="mt-2">Items you purchase will appear here.</p></div>
                );
            case 'account':
                return (
                    <div className="max-w-2xl mx-auto">
                        <SubscriptionPanel user={currentUser} onManageSubscription={onPromptSubscription} />
                    </div>
                );
        }
    }

    return (
        <div>
            <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="flex border-b border-slate-200">
                    <TabButton title="Marketplace" icon={ShoppingBagIcon} active={view === 'marketplace'} onClick={() => setView('marketplace')} count={availableItems.length} />
                    <TabButton title="My Purchases" icon={ListBulletIcon} active={view === 'history'} onClick={() => setView('history')} count={myPurchases.length} />
                    <TabButton title="Account" icon={Cog6ToothIcon} active={view === 'account'} onClick={() => setView('account')} />
                </div>

                {view === 'marketplace' && (
                    <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-semibold mb-2 text-slate-600">Filter by Waste Type:</h3>
                                <div className="flex flex-wrap gap-2">
                                {WASTE_TYPES.map(type => (
                                    <button key={type} onClick={() => handleToggleFilter('wasteTypes', type)} className={`px-3 py-1 text-sm rounded-full flex items-center gap-1.5 transition-colors ${filters.wasteTypes.includes(type) ? `${WASTE_TYPE_DETAILS[type].color} text-white shadow-md` : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                                        {React.createElement(WASTE_TYPE_DETAILS[type].icon, { className: 'h-4 w-4' })} {type}
                                    </button>
                                ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold mb-2 text-slate-600">Filter by Quality:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {QUALITIES.map(quality => (
                                        <button key={quality} onClick={() => handleToggleFilter('qualities', quality)} className={`px-3 py-1 text-sm rounded-full transition-colors ${filters.qualities.includes(quality) ? 'bg-primary text-white shadow-md' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>{quality}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {renderMainContent()}

            {showBuyModal && <BuyNowModal item={showBuyModal} onClose={() => setShowBuyModal(null)} onConfirmPurchase={onPurchase} />}
            {showTrackingModal && <TrackingModal item={showTrackingModal} collectorLocation={collectorLocations[showTrackingModal.seller.id] ?? null} onClose={() => setShowTrackingModal(null)} />}
        </div>
    );
};

const PurchaseHistoryCard: React.FC<{item: MarketplaceItem; onTrack: () => void; onConfirmDelivery: () => void}> = ({ item, onTrack, onConfirmDelivery }) => {
    
    const getStatusInfo = () => {
        switch (item.status) {
            case MarketplaceItemStatus.SOLD:
                return { text: 'Awaiting Delivery', color: 'bg-yellow-100 text-yellow-800' };
            case MarketplaceItemStatus.IN_TRANSIT:
                return { text: 'In Transit', color: 'bg-blue-100 text-blue-800 animate-pulse' };
            case MarketplaceItemStatus.DELIVERED:
                return { text: 'Delivered', color: 'bg-green-100 text-green-800' };
            default:
                return { text: 'Status Unknown', color: 'bg-slate-100 text-slate-800' };
        }
    };
    const statusInfo = getStatusInfo();

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center">
                <img className="h-32 w-full sm:h-40 sm:w-40 object-cover flex-shrink-0" src={item.photoUrl} alt={item.wasteType} />
                <div className="p-4 flex-grow w-full min-w-0">
                    <div className="flex justify-between items-start">
                        <p className="font-bold text-lg text-slate-800 truncate">{item.description || `${item.quantity} of ${item.wasteType}`}</p>
                        <div className={`px-3 py-1 text-xs font-bold rounded-full ${statusInfo.color}`}>{statusInfo.text}</div>
                    </div>
                    <p className="text-sm text-slate-500 truncate">{item.quality} Quality</p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                        <img src={item.seller.photoUrl} alt={item.seller.name} className="h-6 w-6 rounded-full" />
                        <span className="font-semibold truncate">Sold by {item.seller.name}</span>
                    </div>
                    <div className="mt-2 border-t pt-2 flex justify-between items-center">
                        <div>
                            <p className="text-xl font-bold text-primary">₹{item.price.toLocaleString('en-IN')}</p>
                            <p className="text-xs text-slate-500">Purchased on {item.purchaseDate?.toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                             {item.status === MarketplaceItemStatus.IN_TRANSIT && (
                                <>
                                    <button onClick={onTrack} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2">
                                        <TruckIcon className="h-5 w-5"/> Track
                                    </button>
                                    <button onClick={onConfirmDelivery} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2">
                                        <CheckCircleIcon className="h-5 w-5"/> Confirm
                                    </button>
                                </>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MarketplaceCard: React.FC<{ item: MarketplaceItem, onBuy: () => void, isSubscribed: boolean, onPromptSubscription: () => void }> = ({ item, onBuy, isSubscribed, onPromptSubscription }) => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:scale-105">
        <div className="relative">
            <img className="h-48 w-full object-cover" src={item.photoUrl} alt={item.wasteType} />
            <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold text-white rounded-full ${WASTE_TYPE_DETAILS[item.wasteType].color}`}>{item.wasteType}</div>
        </div>
        <div className="p-4">
            <p className="text-sm font-semibold text-primary">{item.quality} Quality</p>
            <p className="text-lg font-bold text-slate-900 mt-1 truncate">{item.description || item.quantity}</p>
            <div className="mt-2 space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2"><img src={item.seller.photoUrl} alt={item.seller.name} className="h-6 w-6 rounded-full" /><span className="font-semibold truncate">{item.seller.name}</span><span className="flex items-center gap-1 ml-auto flex-shrink-0"><StarIcon className="h-4 w-4 text-yellow-400" /> {item.seller.rating}</span></div>
                <div className="flex items-center gap-2"><MapPinIcon className="h-4 w-4 flex-shrink-0" /><span className="truncate">{item.location.address}</span></div>
            </div>
        </div>
        <div className="p-4 bg-slate-50 flex items-center justify-between">
            <div><p className="text-xs text-slate-500">Price</p><p className="text-xl font-bold text-primary">₹{item.price.toLocaleString('en-IN')}</p></div>
            <button
                onClick={isSubscribed ? onBuy : onPromptSubscription}
                className={`flex items-center justify-center font-bold py-2 px-4 rounded-lg transition-colors ${
                    isSubscribed 
                        ? 'bg-primary hover:bg-primary-dark text-white' 
                        : 'bg-slate-400 hover:bg-slate-500 text-white cursor-pointer'
                }`}
                aria-label={isSubscribed ? 'Buy Now' : 'Subscribe to Buy'}
            >
                {!isSubscribed && <LockClosedIcon className="h-5 w-5 mr-2" />}
                {isSubscribed ? 'Buy Now' : 'Unlock'}
            </button>
        </div>
    </div>
);

const BuyNowModal: React.FC<{ item: MarketplaceItem; onClose: () => void; onConfirmPurchase: (item: MarketplaceItem) => void; }> = ({ item, onClose, onConfirmPurchase }) => {
    return (<div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in">
          <div className="p-6 text-center"><BanknotesIcon className="h-12 w-12 mx-auto text-primary" /><h3 className="text-2xl font-bold mt-4">Confirm Purchase</h3><p className="text-slate-600 mt-2">Purchase <span className="font-bold">{item.quantity}</span> of <span className="font-bold">{item.quality} {item.wasteType}</span> from <span className="font-bold">{item.seller.name}</span>.</p></div>
          <div className="p-6 border-y bg-slate-50"><div className="flex justify-between items-center text-lg"><span className="font-semibold text-slate-700">Total:</span><span className="font-bold text-3xl text-primary">₹{item.price.toLocaleString('en-IN')}</span></div></div>
          <div className="p-4 bg-slate-100 flex justify-end gap-4"><button type="button" onClick={onClose} className="bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-400">Cancel</button><button type="button" onClick={() => { onConfirmPurchase(item); onClose(); }} className="bg-primary text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-primary-dark">Confirm & Buy</button></div>
        </div>
      </div>);
};

const TrackingModal: React.FC<{ item: MarketplaceItem; collectorLocation: Location | null; onClose: () => void; }> = ({ item, collectorLocation, onClose }) => {
    // Mock buyer's location since it's not in the data model.
    const buyerDestinationLocation = useMemo(() => ({ lat: 17.49, lng: 78.39, address: 'Buyer Warehouse, Kukatpally, Hyderabad' }), []);
    
    const [etaSeconds, setEtaSeconds] = useState<number | null>(null);

    const distance = useMemo(() => {
        return collectorLocation ? calculateDistance(collectorLocation, buyerDestinationLocation) : null;
    }, [collectorLocation, buyerDestinationLocation]);

    useEffect(() => {
        if (distance !== null && etaSeconds === null) {
            // Assuming 40 km/h average speed, calculate ETA in seconds
            const calculatedEta = Math.round((distance / 40) * 3600);
            setEtaSeconds(calculatedEta > 60 ? calculatedEta : 60); // Set min 60 seconds
        }
    }, [distance, etaSeconds]);

    useEffect(() => {
        if (etaSeconds === null || etaSeconds <= 0) return;
        const timer = setInterval(() => {
            setEtaSeconds(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [etaSeconds]);


    const formatEta = (totalSeconds: number | null) => {
        if (totalSeconds === null) return '...';
        if (totalSeconds <= 0) return 'Arriving now';
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-30 flex justify-center items-center p-0 md:p-4">
            <div className="bg-slate-200 w-full h-full md:rounded-lg md:shadow-xl md:max-w-4xl md:h-[90vh] relative flex overflow-hidden">
                {/* Map takes up the entire space */}
                <div className="absolute inset-0">
                    <InteractiveMap collectorLocation={collectorLocation} destinationLocation={buyerDestinationLocation}/>
                </div>
                
                {/* Header as overlay */}
                <header className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10">
                    <h3 className="text-2xl font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">Track Your Delivery</h3>
                    <p className="text-slate-200 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">Seller is on the way!</p>
                </header>

                {/* Close button top right */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 bg-white/80 hover:bg-white text-slate-700 rounded-full p-1 z-10 shadow-lg transition-colors"
                    aria-label="Close tracking view"
                >
                    <XCircleIcon className="h-8 w-8" />
                </button>

                {/* Footer info panel as overlay */}
                <footer className="absolute bottom-0 left-0 right-0 m-0 md:m-4 p-4 bg-white/90 backdrop-blur-sm rounded-t-lg md:rounded-lg shadow-2xl z-10 animate-fade-in">
                    <div className="flex items-start gap-4">
                        <img src={item.seller.photoUrl} alt={item.seller.name} className="h-16 w-16 rounded-full shadow-lg"/>
                        <div>
                            <p className="text-xl font-bold text-slate-800">{item.seller.name}</p>
                            <div className="flex items-center gap-1.5 text-sm">
                                <span className="text-middleman-text font-semibold">Seller</span>
                                <div className="flex items-center gap-1 text-yellow-500 ml-2">
                                    <StarIcon className="h-5 w-5"/> {item.seller.rating}
                                </div>
                            </div>
                        </div>
                        <div className="ml-auto text-right flex-shrink-0">
                            <p className="text-slate-500 text-sm">EST. ARRIVAL</p>
                            <p className="text-3xl font-bold text-primary tabular-nums">{formatEta(etaSeconds)}</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};


export default BuyerUI;