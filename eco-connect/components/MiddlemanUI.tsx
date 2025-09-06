




import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WasteListing, WasteType, PickupStatus, Location, Role, User, MarketplaceItem, Quality, MarketplaceItemStatus } from '../types';
import { WASTE_TYPE_DETAILS, WASTE_TYPES } from '../constants';
import { MapPinIcon, CalendarDaysIcon, TruckIcon, XCircleIcon, GpsFixedIcon, PencilSquareIcon, ClipboardDocumentListIcon, InboxStackIcon, CameraIcon, TagIcon, StarIcon, ChatBubbleLeftRightIcon, PlayCircleIcon, PlusCircleIcon, CheckCircleIcon, ArrowTrendingUpIcon, UserIcon, LockClosedIcon, Cog6ToothIcon } from './icons/Icons';
import InteractiveMap from './SimulatedMap';
import SubscriptionPanel from './SubscriptionPanel';

const QUALITIES = Object.values(Quality);

interface MiddlemanUIProps {
    currentUser: User;
    allPickups: WasteListing[];
    marketplaceItems: MarketplaceItem[];
    onUpdateListings: (listings: WasteListing[]) => void;
    collectorLocations: Record<string, Location>;
    onUpdateCollectorLocation: (collectorId: string, location: Location) => void;
    onAddNewMarketplaceItem: (item: MarketplaceItem) => void;
    onUpdateMarketplaceItemStatus: (itemId: string, status: MarketplaceItemStatus) => void;
    isSubscribed: boolean;
    onPromptSubscription: () => void;
}

// Haversine distance calculation
const calculateDistance = (loc1: Location, loc2: Location): number => {
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

const MiddlemanUI: React.FC<MiddlemanUIProps> = (props) => {
    const { currentUser, allPickups, marketplaceItems, onUpdateListings, onAddNewMarketplaceItem, onUpdateMarketplaceItemStatus, isSubscribed, onPromptSubscription } = props;
    const [view, setView] = useState<'pickups' | 'stockroom' | 'sales' | 'account'>('pickups');
    
    // State for Pickups View
    const [pickupView, setPickupView] = useState<'available' | 'accepted'>('available');
    const [selectedPickup, setSelectedPickup] = useState<WasteListing | null>(null);
    const [declinedIds, setDeclinedIds] = useState<string[]>([]);
    const [pickupFilters, setPickupFilters] = useState<{ wasteTypes: WasteType[], distance: number }>({ wasteTypes: [], distance: 20 });
    
    const [showSellModal, setShowSellModal] = useState<WasteListing | null>(null);
    const [showManualAddModal, setShowManualAddModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState<WasteListing | null>(null);

    const currentCollectorId = currentUser.id;
    const collectorLocation = props.collectorLocations[currentCollectorId] ?? null;

    // Memoize and sort data for each view
    const myPickups = useMemo(() => {
        return allPickups
            .filter(p => p.assignedTo?.id === currentCollectorId && [PickupStatus.ASSIGNED, PickupStatus.PICKING_UP].includes(p.status))
            .sort((a, b) => a.pickupDateTime.getTime() - b.pickupDateTime.getTime());
    }, [allPickups, currentCollectorId]);

    const filteredAvailablePickups = useMemo(() => {
        const available = allPickups.filter(p => p.status === PickupStatus.PENDING && !declinedIds.includes(p.id));
        return available.filter(p => {
            const wasteTypeMatch = pickupFilters.wasteTypes.length === 0 || pickupFilters.wasteTypes.includes(p.wasteType);
            if (!collectorLocation) return wasteTypeMatch;
            const distance = calculateDistance(collectorLocation, p.location);
            return wasteTypeMatch && distance <= pickupFilters.distance;
        }).sort((a,b) => {
            if (!collectorLocation) return 0;
            const distA = calculateDistance(collectorLocation, a.location);
            const distB = calculateDistance(collectorLocation, b.location);
            return distA - distB;
        });
    }, [allPickups, declinedIds, pickupFilters, collectorLocation]);

    const collectedItems = useMemo(() => {
        return allPickups
            .filter(p => p.assignedTo?.id === currentCollectorId && p.status === PickupStatus.COLLECTED)
            .sort((a, b) => b.pickupDateTime.getTime() - a.pickupDateTime.getTime());
    }, [allPickups, currentCollectorId]);

    const myMarketplaceItems = useMemo(() => {
        return marketplaceItems
            .filter(item => item.seller.id === currentUser.id)
            .sort((a, b) => (a.purchaseDate && b.purchaseDate) ? b.purchaseDate.getTime() - a.purchaseDate.getTime() : 0);
    }, [marketplaceItems, currentUser.id]);


    useEffect(() => {
        if (view === 'pickups' && pickupView === 'available') {
            if (selectedPickup && !filteredAvailablePickups.find(p => p.id === selectedPickup.id)) {
                setSelectedPickup(filteredAvailablePickups.length > 0 ? filteredAvailablePickups[0] : null);
            } else if (!selectedPickup && filteredAvailablePickups.length > 0) {
                setSelectedPickup(filteredAvailablePickups[0]);
            }
        } else if (view === 'pickups' && pickupView === 'accepted') {
             if (selectedPickup && !myPickups.find(p => p.id === selectedPickup.id)) {
                setSelectedPickup(myPickups.length > 0 ? myPickups[0] : null);
            } else if (!selectedPickup && myPickups.length > 0) {
                setSelectedPickup(myPickups[0]);
            }
        } else {
             setSelectedPickup(null);
        }
    }, [view, pickupView, selectedPickup, filteredAvailablePickups, myPickups]);

    const handleManualLocationUpdate = useCallback((address: string) => {
        let lat = 17.45, lng = 78.38; // Default to Hyderabad (HITEC City)
        const lowerCaseAddress = address.toLowerCase();
    
        // More comprehensive location matching for real-time distance updates
        if (lowerCaseAddress.includes('gachibowli')) { lat = 17.44; lng = 78.34; }
        else if (lowerCaseAddress.includes('banjara hills')) { lat = 17.41; lng = 78.43; }
        else if (lowerCaseAddress.includes('kondapur')) { lat = 17.44; lng = 78.35; }
        else if (lowerCaseAddress.includes('saroornagar') || lowerCaseAddress.includes('sarrornagar')) { lat = 17.37; lng = 78.52; }
        else if (lowerCaseAddress.includes('ameerpet')) { lat = 17.43; lng = 78.44; }
        else if (lowerCaseAddress.includes('secunderabad')) { lat = 17.45; lng = 78.50; }
        else if (lowerCaseAddress.includes('koti')) { lat = 17.38; lng = 78.48; }

        props.onUpdateCollectorLocation(currentCollectorId, { lat, lng, address });
    }, [currentCollectorId, props.onUpdateCollectorLocation]);

    const updatePickupListingStatus = (pickupId: string, status: PickupStatus) => {
        if (!isSubscribed) {
            onPromptSubscription();
            return;
        }
        const updatedListings = allPickups.map(p => p.id === pickupId ? { ...p, status } : p);
        onUpdateListings(updatedListings);
    };

    const handleAcceptPickup = (pickupId: string) => {
        if (!isSubscribed) {
            onPromptSubscription();
            return;
        }
        alert(`Pickup accepted! It's now in your "My Pickups" list.`);
        const updatedListings = allPickups.map(p => p.id === pickupId ? { ...p, status: PickupStatus.ASSIGNED, assignedTo: currentUser } : p);
        onUpdateListings(updatedListings);
    };

    const handleDeclinePickup = (pickupId: string) => {
        setDeclinedIds(prev => [...prev, pickupId]);
        if (selectedPickup?.id === pickupId) setSelectedPickup(null);
    };

    const handleListItemForSale = (listing: WasteListing, saleDetails: { quantity: string; quality: Quality; price: number; photoUrl: string }) => {
        const newItem: MarketplaceItem = {
            id: `mi-${Date.now()}`,
            seller: currentUser,
            wasteType: listing.wasteType,
            description: `Processed ${listing.wasteType} from ${listing.producer.name}`,
            quantity: saleDetails.quantity,
            quality: saleDetails.quality,
            price: saleDetails.price,
            photoUrl: saleDetails.photoUrl,
            location: collectorLocation || { lat: 17.45, lng: 78.38, address: 'Collector Base, Hyderabad' },
            status: MarketplaceItemStatus.LISTED,
        };
        onAddNewMarketplaceItem(newItem);
        const updatedListings = allPickups.map(p => p.id === listing.id ? { ...p, status: PickupStatus.LISTED_FOR_SALE } : p);
        onUpdateListings(updatedListings);
        setShowSellModal(null);
        alert('Item successfully listed for sale!');
    };

    const handleManualAddProduct = (saleDetails: { wasteType: WasteType; description: string; quantity: string; quality: Quality; price: number; photoUrl: string }) => {
        const newItem: MarketplaceItem = {
            id: `mi-${Date.now()}`,
            seller: currentUser,
            wasteType: saleDetails.wasteType,
            description: saleDetails.description,
            quantity: saleDetails.quantity,
            quality: saleDetails.quality,
            price: saleDetails.price,
            photoUrl: saleDetails.photoUrl,
            location: collectorLocation || { lat: 17.45, lng: 78.38, address: 'Collector Base, Hyderabad' },
            status: MarketplaceItemStatus.LISTED,
        };
        onAddNewMarketplaceItem(newItem);
        setShowManualAddModal(false);
        setView('sales');
        alert('New product successfully listed for sale!');
    };
    
    const handleOpenSellModal = (listing: WasteListing) => {
        if (!isSubscribed) {
            onPromptSubscription();
            return;
        }
        setShowSellModal(listing);
    }
    
    const handleOpenManualAddModal = () => {
        if (!isSubscribed) {
            onPromptSubscription();
            return;
        }
        setShowManualAddModal(true);
    }
    
    const renderContent = () => {
        switch (view) {
            case 'pickups':
                return (
                    <div className="flex flex-col bg-slate-50">
                        <div className="flex border-b border-slate-200 flex-shrink-0 bg-white">
                            <TabButton title="Available" icon={TruckIcon} active={pickupView === 'available'} onClick={() => setPickupView('available')} count={filteredAvailablePickups.length} />
                            <TabButton title="My Pickups" icon={ClipboardDocumentListIcon} active={pickupView === 'accepted'} onClick={() => setPickupView('accepted')} count={myPickups.length} />
                        </div>
                        {pickupView === 'available' ? (
                            <AvailablePickupsView 
                                pickups={filteredAvailablePickups}
                                selectedPickup={selectedPickup}
                                onSelect={setSelectedPickup}
                                onAccept={handleAcceptPickup}
                                onDecline={handleDeclinePickup}
                                onToggleWasteTypeFilter={(type) => setPickupFilters(f => ({ ...f, wasteTypes: f.wasteTypes.includes(type) ? f.wasteTypes.filter(t => t !== type) : [...f.wasteTypes, type] }))}
                                filters={pickupFilters}
                                collectorLocation={collectorLocation}
                                onUpdateManualLocation={handleManualLocationUpdate}
                                isSubscribed={isSubscribed}
                                onPromptSubscription={onPromptSubscription}
                            />
                        ) : (
                            <AcceptedPickupsView 
                                pickups={myPickups}
                                selectedPickup={selectedPickup}
                                onSelect={setSelectedPickup}
                                onUpdateStatus={updatePickupListingStatus}
                                onOpenChat={setShowChatModal}
                                isSubscribed={isSubscribed}
                                onPromptSubscription={onPromptSubscription}
                            />
                        )}
                    </div>
                );
            case 'stockroom':
                return <StockroomView collectedItems={collectedItems} onSellClick={handleOpenSellModal} onManualAddClick={handleOpenManualAddModal} />;
            case 'sales':
                return <SalesView myItems={myMarketplaceItems} onUpdateStatus={onUpdateMarketplaceItemStatus} />;
            case 'account':
                return <SubscriptionPanel user={currentUser} onManageSubscription={onPromptSubscription} />;
            default:
                return null;
        }
    };


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-0 bg-white rounded-xl shadow-xl overflow-hidden h-[calc(100vh-200px)]">
            <div className="lg:col-span-2 xl:col-span-3 h-64 lg:h-full relative">
                <InteractiveMap 
                    listings={view === 'pickups' ? (pickupView === 'available' ? filteredAvailablePickups : myPickups) : []}
                    selectedId={selectedPickup?.id}
                    collectorLocation={collectorLocation}
                />
                 {view === 'pickups' && pickupView === 'available' && (
                     <div className="absolute top-4 right-4 bg-white/90 p-3 rounded-lg shadow-xl w-60 backdrop-blur-sm z-10">
                        <label htmlFor="distance" className="block text-sm font-medium text-slate-700">Show pickups within</label>
                        <p className="font-bold text-xl text-primary -mt-1">{pickupFilters.distance} km</p>
                        <input
                            id="distance" type="range" min="1" max="50" value={pickupFilters.distance}
                            onChange={(e) => setPickupFilters(prev => ({ ...prev, distance: parseInt(e.target.value) }))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary mt-1"
                        />
                    </div>
                 )}
            </div>
            
            <div className="lg:col-span-1 xl:col-span-1 border-l border-slate-200 flex flex-col">
                <div className="flex border-b border-slate-200 flex-shrink-0 sticky top-0 bg-white z-10">
                     <TopLevelTabButton title="Pickups" icon={TruckIcon} active={view === 'pickups'} onClick={() => setView('pickups')} count={filteredAvailablePickups.length + myPickups.length} />
                     <TopLevelTabButton title="Stockroom" icon={InboxStackIcon} active={view === 'stockroom'} onClick={() => setView('stockroom')} count={collectedItems.length} />
                     <TopLevelTabButton title="Sales" icon={ArrowTrendingUpIcon} active={view === 'sales'} onClick={() => setView('sales')} count={myMarketplaceItems.filter(i => i.status !== MarketplaceItemStatus.DELIVERED).length} />
                     <TopLevelTabButton title="Account" icon={Cog6ToothIcon} active={view === 'account'} onClick={() => setView('account')} />
                </div>
                 <div className="overflow-y-auto flex-grow bg-slate-100">
                    {renderContent()}
                </div>
            </div>

            {showSellModal && <SellItemModal listing={showSellModal} onClose={() => setShowSellModal(null)} onListItemForSale={handleListItemForSale}/>}
            {showManualAddModal && <ManualAddModal onClose={() => setShowManualAddModal(null)} onAddProduct={handleManualAddProduct}/>}
            {showChatModal && <ChatModal listing={showChatModal} currentUser={currentUser} onClose={() => setShowChatModal(null)} />}
        </div>
    );
};

const TopLevelTabButton: React.FC<{title: string, icon: React.FC<any>, active: boolean, onClick: () => void, count?: number}> = ({ title, icon: Icon, active, onClick, count }) => (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 p-3 font-bold text-sm transition-colors ${active ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:bg-slate-100'}`}>
        <Icon className="h-5 w-5" />
        {title}
        {typeof count !== 'undefined' && <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}>{count}</span>}
    </button>
);

const TabButton: React.FC<{title: string, icon: React.FC<any>, active: boolean, onClick: () => void, count: number}> = ({ title, icon: Icon, active, onClick, count }) => (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 font-semibold text-xs transition-colors rounded-t-md ${active ? 'bg-primary-light text-primary-dark' : 'text-slate-500 hover:bg-slate-100'}`}>
        <Icon className="h-4 w-4" />
        {title}
        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}>{count}</span>
    </button>
);

const SalesView: React.FC<{myItems: MarketplaceItem[], onUpdateStatus: (itemId: string, status: MarketplaceItemStatus) => void}> = ({ myItems, onUpdateStatus }) => {
    const listed = myItems.filter(i => i.status === MarketplaceItemStatus.LISTED);
    const sold = myItems.filter(i => i.status === MarketplaceItemStatus.SOLD);
    const inTransit = myItems.filter(i => i.status === MarketplaceItemStatus.IN_TRANSIT);
    const delivered = myItems.filter(i => i.status === MarketplaceItemStatus.DELIVERED);

    return (
        <div className="p-4 space-y-6">
            <SalesSection title="Listed for Sale" count={listed.length} items={listed} onUpdateStatus={onUpdateStatus} />
            <SalesSection title="Sold - Awaiting Delivery" count={sold.length} items={sold} onUpdateStatus={onUpdateStatus} />
            <SalesSection title="In Transit to Buyer" count={inTransit.length} items={inTransit} onUpdateStatus={onUpdateStatus} />
            <SalesSection title="Delivered" count={delivered.length} items={delivered} onUpdateStatus={onUpdateStatus} />
        </div>
    );
};

const SalesSection: React.FC<{title: string, count: number, items: MarketplaceItem[], onUpdateStatus: (itemId: string, status: MarketplaceItemStatus) => void}> = ({ title, count, items, onUpdateStatus }) => (
    <div>
        <h3 className="font-bold text-slate-800">{title} ({count})</h3>
        {items.length > 0 ? (
            <div className="mt-2 space-y-3">
                {items.map(item => <SalesItemCard key={item.id} item={item} onUpdateStatus={onUpdateStatus} />)}
            </div>
        ) : (
            <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg mt-2">No items in this category.</p>
        )}
    </div>
);

const SalesItemCard: React.FC<{item: MarketplaceItem, onUpdateStatus: (itemId: string, status: MarketplaceItemStatus) => void}> = ({ item, onUpdateStatus }) => {
    const { status } = item;
    
    return (
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex gap-3 items-center">
                <img src={item.photoUrl} alt={item.wasteType} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                <div className="flex-grow min-w-0">
                    <p className="font-bold text-slate-800 truncate">{item.quantity} of {item.wasteType}</p>
                    <p className="text-sm text-slate-600 truncate">₹{item.price.toLocaleString('en-IN')} - {item.quality} Quality</p>
                    {item.description && <p className="text-xs text-slate-500 mt-1 truncate">{item.description}</p>}
                    {item.buyer && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                           <UserIcon className="h-4 w-4" /> Sold to: <span className="font-semibold truncate">{item.buyer.name}</span>
                        </div>
                    )}
                </div>
            </div>
            {status === MarketplaceItemStatus.SOLD && (
                <div className="mt-2">
                    <button
                        onClick={() => onUpdateStatus(item.id, MarketplaceItemStatus.IN_TRANSIT)}
                        className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors shadow"
                    >
                        <TruckIcon className="h-5 w-5"/> Start Delivery
                    </button>
               </div>
            )}
             {status === MarketplaceItemStatus.IN_TRANSIT && (
                 <div className="mt-2 p-2 text-center bg-blue-100 rounded-lg text-blue-700 font-semibold text-sm flex items-center justify-center gap-2">
                    <TruckIcon className="h-5 w-5 animate-pulse"/> On its way to the buyer.
                </div>
             )}
             {status === MarketplaceItemStatus.DELIVERED && (
                 <div className="mt-2 p-2 flex items-center justify-center gap-2 bg-green-100 rounded-lg text-green-700 font-semibold text-sm">
                    <CheckCircleIcon className="h-5 w-5" /> Delivery Confirmed
                </div>
             )}
        </div>
    );
};

const CollectorLocationManager: React.FC<{
    currentLocation: Location | null;
    onUpdateManualLocation: (address: string) => void;
}> = ({ currentLocation, onUpdateManualLocation }) => {
    const [showManualInput, setShowManualInput] = useState(false);

    return (
        <div className="p-4 border-b border-slate-200 bg-middleman-light">
            <h3 className="font-semibold text-middleman-text flex items-center gap-2"><TruckIcon className="h-5 w-5"/> My Status</h3>
            <div className="text-sm text-slate-700 my-2 truncate">
                Current Location: {currentLocation ? `${currentLocation.address}` : 'Location not set'}
            </div>
            <div className="flex gap-2">
                <button onClick={() => setShowManualInput(true)} className="w-full flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-3 rounded-md text-sm transition-colors">
                    <PencilSquareIcon className="h-5 w-5" />Set Location Manually
                </button>
            </div>
             {showManualInput && <ManualLocationModal onUpdateLocation={onUpdateManualLocation} onClose={() => setShowManualInput(false)} />}
        </div>
    );
};

const AvailablePickupsView: React.FC<{ 
    pickups: WasteListing[], 
    selectedPickup: WasteListing | null, 
    onSelect: (p: WasteListing) => void, 
    onAccept: (id: string) => void, 
    onDecline: (id: string) => void, 
    onToggleWasteTypeFilter: (type: WasteType) => void, 
    filters: { wasteTypes: WasteType[], distance: number }, 
    collectorLocation: Location | null, 
    onUpdateManualLocation: (address: string) => void,
    isSubscribed: boolean;
    onPromptSubscription: () => void;
}> = (props) => (
    <div className="flex flex-col h-full">
        <div className="flex-shrink-0">
            <div className="p-4 border-b border-slate-200 bg-white">
                <p className="text-sm font-semibold mb-2 text-slate-600">Filter by Waste Type:</p>
                <div className="flex flex-wrap gap-2">
                   {WASTE_TYPES.map(type => ( <button key={type} onClick={() => props.onToggleWasteTypeFilter(type)} className={`px-3 py-1 text-sm rounded-full flex items-center gap-1.5 transition-colors ${ props.filters.wasteTypes.includes(type) ? `${WASTE_TYPE_DETAILS[type].color} text-white shadow-md` : 'bg-slate-200 text-slate-700 hover:bg-slate-300' }`}> {React.createElement(WASTE_TYPE_DETAILS[type].icon, { className: 'h-4 w-4' })} {type} </button> ))}
                </div>
            </div>
            <CollectorLocationManager 
                currentLocation={props.collectorLocation}
                onUpdateManualLocation={props.onUpdateManualLocation} 
            />
        </div>
        
        <div className="p-2 space-y-2 overflow-y-auto flex-grow">
            {props.pickups.length > 0 ? (
                props.pickups.map(pickup => (
                    <PickupCard 
                        key={pickup.id} 
                        pickup={pickup} 
                        distance={props.collectorLocation ? calculateDistance(props.collectorLocation, pickup.location) : null} 
                        isSelected={props.selectedPickup?.id === pickup.id} 
                        onSelect={() => props.onSelect(pickup)} 
                        onAccept={props.onAccept} 
                        onDecline={props.onDecline} 
                        isSubscribed={props.isSubscribed} 
                        onPromptSubscription={props.onPromptSubscription} 
                    />
                ))
            ) : (
                <div className="text-center p-10 text-slate-500">
                    <p className="font-semibold">No available pickups matching your filters.</p>
                    <p className="text-sm">Try expanding your distance or changing waste types.</p>
                </div>
            )}
        </div>

        {props.selectedPickup && (
            <div className="flex-shrink-0">
                <SelectedPickupDetails pickup={props.selectedPickup} />
            </div>
        )}
    </div>
);

const AcceptedPickupsView: React.FC<{ 
    pickups: WasteListing[], 
    selectedPickup: WasteListing | null, 
    onSelect: (p: WasteListing) => void, 
    onUpdateStatus: (pickupId: string, status: PickupStatus) => void, 
    onOpenChat: (pickup: WasteListing) => void,
    isSubscribed: boolean,
    onPromptSubscription: () => void
}> = ({ pickups, selectedPickup, onSelect, onUpdateStatus, onOpenChat, isSubscribed, onPromptSubscription }) => (
    <div className="flex flex-col h-full">
        <div className="p-2 space-y-2 overflow-y-auto flex-grow">
            {pickups.length > 0 ? (
                pickups.map(pickup => (
                    <AcceptedPickupCard 
                        key={pickup.id} 
                        pickup={pickup} 
                        isSelected={selectedPickup?.id === pickup.id} 
                        onSelect={() => onSelect(pickup)} 
                    />
                ))
            ) : (
                <div className="text-center p-10 text-slate-500">
                    <p className="font-semibold">You have no accepted pickups.</p>
                    <p className="text-sm">Go to the "Available Pickups" tab to find jobs.</p>
                </div>
            )}
        </div>

        {selectedPickup && (
            <div className="flex-shrink-0">
                <AcceptedPickupDetails 
                    pickup={selectedPickup} 
                    onUpdateStatus={onUpdateStatus} 
                    onOpenChat={onOpenChat} 
                    isSubscribed={isSubscribed} 
                    onPromptSubscription={onPromptSubscription} 
                />
            </div>
        )}
    </div>
);


const StockroomView: React.FC<{ collectedItems: WasteListing[]; onSellClick: (item: WasteListing) => void; onManualAddClick: () => void; }> = ({ collectedItems, onSellClick, onManualAddClick }) => (
    <div className="bg-slate-50 h-full">
        <div className="p-4 border-b border-slate-200">
            <button onClick={onManualAddClick} className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors shadow">
                <PlusCircleIcon className="h-5 w-5"/> Manually Add Product
            </button>
        </div>
        <div className="p-4">
            <h4 className="font-semibold text-slate-700">Collected - Ready to List ({collectedItems.length})</h4>
            <div className="space-y-3 mt-2">
                {collectedItems.length > 0 ? (collectedItems.map(item => (<CollectedItemCard key={item.id} item={item} onSell={() => onSellClick(item)} />))) : (<p className="text-sm text-slate-500 text-center py-4">No collected items waiting to be listed.</p>)}
            </div>
        </div>
    </div>
);

const CollectedItemCard: React.FC<{ item: WasteListing, onSell: () => void }> = ({ item, onSell }) => {
    const { icon: Icon, color } = WASTE_TYPE_DETAILS[item.wasteType];
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 flex gap-4">
                <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}><Icon className="h-8 w-8 text-white" /></div>
                <div className="flex-grow min-w-0">
                    <p className="font-bold text-slate-800 truncate">{item.quantity} of {item.wasteType}</p>
                    <p className="text-sm text-slate-500 truncate">From: {item.producer.name}</p>
                     <p className="text-xs text-slate-400 mt-1">On {item.pickupDateTime.toLocaleDateString()}</p>
                </div>
            </div>
            <div className="bg-slate-50 px-4 py-3">
                 <button onClick={onSell} className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors shadow">
                    <TagIcon className="h-5 w-5"/> List for Sale
                </button>
            </div>
        </div>
    );
};

const AcceptedPickupCard: React.FC<{ pickup: WasteListing, isSelected: boolean, onSelect: () => void, }> = ({ pickup, isSelected, onSelect }) => {
    const { icon: Icon, color } = WASTE_TYPE_DETAILS[pickup.wasteType];
    const statusStyle = pickup.status === PickupStatus.PICKING_UP ? "bg-blue-100 text-blue-800 animate-pulse-fast" : "bg-green-100 text-green-800";
    return (<div onClick={onSelect} className={`p-3 m-2 rounded-lg border-2 cursor-pointer transition-all ${isSelected ? 'bg-primary-light border-primary' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
            <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-full ${color}`}><Icon className="h-5 w-5 text-white" /></div>
                <div className="flex-grow min-w-0">
                    <p className="font-bold text-slate-800 truncate">{pickup.quantity} of {pickup.wasteType}</p>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5 truncate"><MapPinIcon className="h-4 w-4 flex-shrink-0"/>{pickup.location.address}</div>
                </div>
                 <div className="text-right flex-shrink-0"><div className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusStyle}`}>{pickup.status}</div></div>
            </div>
        </div>
    )
}

const AcceptedPickupDetails: React.FC<{ pickup: WasteListing, onUpdateStatus: (pickupId: string, status: PickupStatus) => void, onOpenChat: (pickup: WasteListing) => void, isSubscribed: boolean, onPromptSubscription: () => void }> = ({ pickup, onUpdateStatus, onOpenChat, isSubscribed, onPromptSubscription }) => {
    const handleStartPickup = () => { onUpdateStatus(pickup.id, PickupStatus.PICKING_UP); };
    return (<div className="p-4 border-t-2 border-slate-200 bg-white animate-fade-in">
            <h3 className="font-bold text-lg mb-2 text-slate-800">Pickup Task</h3>
            <div className="flex gap-4 items-center">
                <img src={pickup.producer.photoUrl} alt={pickup.producer.name} className="w-12 h-12 rounded-full"/>
                <div><p className="font-semibold">{pickup.producer.name}</p><p className="text-sm text-slate-500">({pickup.producer.rating} ★)</p></div>
                <button onClick={() => onOpenChat(pickup)} className="ml-auto flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-3 rounded-full text-sm"><ChatBubbleLeftRightIcon className="h-4 w-4"/>Chat</button>
            </div>
             <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200"><p className="text-sm font-semibold text-slate-700">Requested Pickup Time</p><p className="text-slate-600">{pickup.pickupDateTime.toLocaleString([], { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p></div>
            <div className="mt-4 flex gap-3">
                {pickup.status === PickupStatus.ASSIGNED && (
                    <button 
                        onClick={isSubscribed ? handleStartPickup : onPromptSubscription} 
                        className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-lg transition-colors shadow-md ${
                            isSubscribed ? 'bg-primary hover:bg-primary-dark text-white' : 'bg-slate-400 hover:bg-slate-500 text-white'
                        }`}
                    >
                        {!isSubscribed && <LockClosedIcon className="h-6 w-6"/>}
                        <PlayCircleIcon className="h-6 w-6"/>
                        Start Pickup
                    </button>
                )}
                {pickup.status === PickupStatus.PICKING_UP && (<div className="w-full text-center bg-slate-200 p-4 rounded-lg"><p className="text-sm font-bold text-slate-600">SHARE THIS OTP WITH PRODUCER</p><p className="text-4xl font-mono font-extrabold tracking-widest text-primary mt-1">{pickup.otp}</p></div>)}
            </div>
        </div>);
};

const PickupCard: React.FC<{ 
    pickup: WasteListing, 
    isSelected: boolean, 
    onSelect: () => void, 
    distance: number | null,
    onAccept: (id: string) => void,
    onDecline: (id: string) => void,
    isSubscribed: boolean,
    onPromptSubscription: () => void
}> = ({ pickup, isSelected, onSelect, distance, onAccept, onDecline, isSubscribed, onPromptSubscription }) => {
    const { icon: Icon, color } = WASTE_TYPE_DETAILS[pickup.wasteType];
    
    const handleButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };
    
    return (
        <div className={`rounded-lg border-2 shadow-sm overflow-hidden transition-all bg-white ${isSelected ? 'border-primary' : 'border-slate-200'}`}>
            <div onClick={onSelect} className="p-4 cursor-pointer hover:bg-slate-50">
                <div className="flex items-start gap-4">
                     <div className={`p-2 rounded-full ${color}`}><Icon className="h-6 w-6 text-white" /></div>
                    <div className="flex-grow min-w-0">
                        <p className="font-bold text-slate-800 truncate">{pickup.quantity} of {pickup.wasteType}</p>
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1 truncate"><MapPinIcon className="h-4 w-4 flex-shrink-0"/>{pickup.location.address}</div>
                         <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1 truncate"><CalendarDaysIcon className="h-4 w-4 flex-shrink-0"/>{pickup.pickupDateTime.toLocaleDateString([], { month: 'short', day: 'numeric' })} at {pickup.pickupDateTime.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</div>
                         <p className="text-xs text-slate-400 mt-2 truncate">By: {pickup.producer.name} ({pickup.producer.rating} ★)</p>
                    </div>
                    <div className="text-right flex-shrink-0"><p className="font-bold text-lg text-primary">{distance !== null ? `${distance.toFixed(1)} km` : '- km'}</p><p className="text-xs text-slate-500">away</p></div>
                </div>
            </div>
            <div className="bg-slate-50 px-4 py-2 border-t border-slate-200">
                <div className="flex gap-2">
                    <button 
                        onClick={(e) => { handleButtonClick(e); onDecline(pickup.id); }} 
                        className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                        <XCircleIcon className="h-5 w-5" />
                        Decline
                    </button>
                    <button 
                        onClick={(e) => {
                            handleButtonClick(e);
                            isSubscribed ? onAccept(pickup.id) : onPromptSubscription();
                        }}
                        className={`flex-1 font-bold py-2 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 text-sm ${
                            isSubscribed 
                                ? 'bg-primary hover:bg-primary-dark text-white' 
                                : 'bg-slate-400 hover:bg-slate-500 text-white'
                        }`}
                    >
                        {!isSubscribed && <LockClosedIcon className="h-5 w-5"/>}
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
};

const SelectedPickupDetails: React.FC<{ pickup: WasteListing }> = ({ pickup }) => {
    return (
        <div className="p-4 border-t-2 border-slate-200 bg-white animate-fade-in">
            <h3 className="font-bold text-lg mb-4 text-slate-800">Pickup Details</h3>
            <div className="flex gap-4"><img src={pickup.photoUrl} alt="waste" className="w-24 h-24 rounded-lg object-cover" />
                <div className="min-w-0"><p className="font-bold text-xl truncate">{pickup.quantity} <span className="text-base font-normal text-slate-600"> of {pickup.wasteType}</span></p>
                     <div className="flex items-center gap-2 mt-1"><img src={pickup.producer.photoUrl} alt={pickup.producer.name} className="w-6 h-6 rounded-full"/><p className="text-sm font-semibold truncate">{pickup.producer.name}</p><p className="text-sm text-slate-500">({pickup.producer.rating} ★)</p></div>
                </div>
            </div>
            <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200"><p className="text-sm font-semibold text-slate-700">Requested Pickup Time</p><p className="text-slate-600">{pickup.pickupDateTime.toLocaleString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
        </div>
    );
};

const ManualLocationModal: React.FC<{ onUpdateLocation: (address: string) => void; onClose: () => void; }> = ({ onUpdateLocation, onClose }) => {
    const [address, setAddress] = useState(''); const [error, setError] = useState('');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setError(''); if (!address.trim()) { setError('Please enter an address.'); return; } onUpdateLocation(address); onClose(); };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4"><div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-fade-in"><h3 className="text-lg font-bold mb-4 text-slate-800">Set Manual Location</h3><form onSubmit={handleSubmit} className="space-y-4"><div><label htmlFor="address-input" className="block text-sm font-medium text-slate-700">Address or Area</label><input id="address-input" type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-slate-300 rounded-md bg-white text-slate-900" placeholder="e.g. Gachibowli, Hyderabad" /></div>{error && <p className="text-sm text-red-600">{error}</p>}<div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300">Cancel</button><button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">Update</button></div></form></div></div>);
};

const SellItemModal: React.FC<{ listing: WasteListing; onClose: () => void; onListItemForSale: (listing: WasteListing, saleDetails: { quantity: string; quality: Quality; price: number; photoUrl: string }) => void; }> = ({ listing, onClose, onListItemForSale }) => {
    const [quality, setQuality] = useState<Quality>(Quality.STANDARD); const [quantity, setQuantity] = useState(listing.quantity); const [price, setPrice] = useState(100); const [photoFile, setPhotoFile] = useState<File | null>(null); const [photoPreview, setPhotoPreview] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { setPhotoFile(file); const reader = new FileReader(); reader.onloadend = () => setPhotoPreview(reader.result as string); reader.readAsDataURL(file); } };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setError(null); if (!quantity.trim() || !price || !photoPreview) { setError('Please fill out all fields and upload a photo.'); return; } onListItemForSale(listing, { quantity, quality, price, photoUrl: photoPreview }); };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex justify-center items-center p-4"><div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"><h3 className="text-xl font-bold mb-4 text-slate-800">List Item for Sale</h3><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium text-slate-700">Waste Type</label><p className="mt-1 block w-full px-3 py-2 bg-slate-100 border rounded-md">{listing.wasteType}</p></div><div><label className="block text-sm font-medium text-slate-700">Final Quantity</label><input type="text" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-slate-300 rounded-md bg-white text-slate-900"/></div><div><label className="block text-sm font-medium text-slate-700">Quality</label><select value={quality} onChange={(e) => setQuality(e.target.value as Quality)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white text-slate-900">{QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}</select></div><div><label className="block text-sm font-medium text-slate-700">Price (₹)</label><input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-slate-300 rounded-md bg-white text-slate-900"/></div><div><label className="block text-sm font-medium text-slate-700">Photo</label><div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">{photoPreview ? (<div className="relative group"><img src={photoPreview} alt="Preview" className="h-32 w-auto rounded-md" /><label htmlFor="file-upload" className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 cursor-pointer">Change</label><input id="file-upload" type="file" onChange={handleFileChange} accept="image/*" className="sr-only" /></div>) : (<div className="space-y-1 text-center"><CameraIcon className="mx-auto h-12 w-12 text-slate-400" /><div className="flex text-sm text-slate-600"><label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark"><span>Upload a file</span><input id="file-upload" type="file" onChange={handleFileChange} accept="image/*" className="sr-only" /></label><p className="pl-1">or drag and drop</p></div></div>)}</div></div>{error && <p className="text-sm text-red-600">{error}</p>}<div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300">Cancel</button><button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">List Item</button></div></form></div></div>);
};

const ManualAddModal: React.FC<{ onClose: () => void; onAddProduct: (details: { wasteType: WasteType, description: string, quantity: string; quality: Quality; price: number; photoUrl: string }) => void; }> = ({ onClose, onAddProduct }) => {
    const [wasteType, setWasteType] = useState<WasteType>(WasteType.PLASTIC); const [description, setDescription] = useState(''); const [quality, setQuality] = useState<Quality>(Quality.STANDARD); const [quantity, setQuantity] = useState(''); const [price, setPrice] = useState(100); const [photoFile, setPhotoFile] = useState<File | null>(null); const [photoPreview, setPhotoPreview] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { setPhotoFile(file); const reader = new FileReader(); reader.onloadend = () => setPhotoPreview(reader.result as string); reader.readAsDataURL(file); } };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setError(null); if (!quantity.trim() || !price || !photoPreview || !description.trim()) { setError('Please fill all fields and upload a photo.'); return; } onAddProduct({ wasteType, description, quantity, quality, price, photoUrl: photoPreview }); };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex justify-center items-center p-4"><div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"><h3 className="text-xl font-bold mb-4 text-slate-800">Add New Product</h3><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium text-slate-700">Product Type</label><select value={wasteType} onChange={(e) => setWasteType(e.target.value as WasteType)} className="mt-1 block w-full py-2 bg-white border-slate-300 text-slate-900 rounded-md">{WASTE_TYPES.map(q => <option key={q} value={q}>{q}</option>)}</select></div><div><label className="block text-sm font-medium text-slate-700">Description</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Cleaned PET Flakes" className="mt-1 block w-full bg-white border-slate-300 text-slate-900 rounded-md"/></div><div><label className="block text-sm font-medium text-slate-700">Quantity</label><input type="text" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 block w-full bg-white border-slate-300 text-slate-900 rounded-md"/></div><div><label className="block text-sm font-medium text-slate-700">Quality</label><select value={quality} onChange={(e) => setQuality(e.target.value as Quality)} className="mt-1 block w-full py-2 bg-white border-slate-300 text-slate-900 rounded-md">{QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}</select></div><div><label className="block text-sm font-medium text-slate-700">Price (₹)</label><input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="mt-1 block w-full bg-white border-slate-300 text-slate-900 rounded-md"/></div><div><label className="block text-sm font-medium text-slate-700">Photo</label><div className="mt-1 flex justify-center p-6 border-2 border-dashed rounded-md">{photoPreview ? (<div className="relative group"><img src={photoPreview} alt="Preview" className="h-32 w-auto rounded-md" /><label htmlFor="file-upload-manual" className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 cursor-pointer">Change</label><input id="file-upload-manual" type="file" onChange={handleFileChange} accept="image/*" className="sr-only" /></div>) : (<div className="space-y-1 text-center"><CameraIcon className="mx-auto h-12 w-12 text-slate-400" /><div className="flex text-sm text-slate-600"><label htmlFor="file-upload-manual" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark"><span>Upload file</span><input id="file-upload-manual" type="file" onChange={handleFileChange} accept="image/*" className="sr-only" /></label></div></div>)}</div></div>{error && <p className="text-sm text-red-600">{error}</p>}<div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg">Cancel</button><button type="submit" className="bg-primary text-white font-bold py-2 px-4 rounded-lg">Add Product</button></div></form></div></div>);
};

const ChatModal: React.FC<{ listing: WasteListing; currentUser: User; onClose: () => void; }> = ({ listing, currentUser, onClose }) => {
    const otherUser = currentUser.role === Role.PRODUCER ? listing.assignedTo : listing.producer;
    const messages = [{ id: 1, sender: otherUser, text: 'Hello! I\'ve accepted your pickup.' }, { id: 2, sender: currentUser, text: 'Great, thanks!' }, { id: 3, sender: otherUser, text: 'I am on my way now.' },];
    return (<div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4"><div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col" style={{ height: '70vh' }}><header className="p-4 border-b flex justify-between items-center"><div><h3 className="text-lg font-bold text-slate-800">Chat with {otherUser?.name}</h3><p className="text-sm text-slate-500">{listing.quantity} of {listing.wasteType}</p></div><button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl">&times;</button></header><main className="flex-grow p-4 space-y-4 overflow-y-auto bg-slate-50">{messages.map(msg => (<div key={msg.id} className={`flex items-end gap-2 ${msg.sender?.id === currentUser.id ? 'justify-end' : ''}`}>{msg.sender?.id !== currentUser.id && <img src={msg.sender?.photoUrl} alt="" className="h-8 w-8 rounded-full"/>}<div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.sender?.id === currentUser.id ? 'bg-primary text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}><p className="text-sm">{msg.text}</p></div>{msg.sender?.id === currentUser.id && <img src={msg.sender?.photoUrl} alt="" className="h-8 w-8 rounded-full"/>}</div>))}</main><footer className="p-4 border-t bg-white"><div className="flex items-center gap-2"><input type="text" placeholder="Type..." className="flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary bg-white text-slate-900" /><button className="bg-primary text-white font-bold py-2 px-4 rounded-full">Send</button></div></footer></div></div>);
};

export default MiddlemanUI;