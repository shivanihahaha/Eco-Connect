


import React, { useState, useEffect } from 'react';
import { Role, WasteListing, Location, User, MarketplaceItem, PickupStatus, MarketplaceItemStatus, SubscriptionPlan, Subscription, SubscriptionStatus } from './types';
import ProducerUI from './components/ProducerUI';
import MiddlemanUI from './components/MiddlemanUI';
import BuyerUI from './components/BuyerUI';
import SubscriptionModal from './components/SubscriptionPage';
import { UserGroupIcon, TruckIcon, ShoppingBagIcon, ArrowLeftOnRectangleIcon } from './components/icons/Icons';
import { 
    getProducerListings, 
    addProducerListing, 
    setProducerListings, 
    authenticateUser, 
    registerUser, 
    getMarketplaceItems, 
    addMarketplaceItem,
    purchaseMarketplaceItem,
    updateMarketplaceItemStatus,
    updateUserSubscription
} from './services/mockData';


// Helper function to check for an active subscription
export const hasActiveSubscription = (user: User | null): boolean => {
    if (!user || user.role === Role.PRODUCER) return true;
    if (!user.subscriptions || user.subscriptions.length === 0) return false;
    
    return user.subscriptions.some(sub => 
        sub.status === SubscriptionStatus.ACTIVE && new Date(sub.endDate) > new Date()
    );
};


// --- Auth Page Component ---
const AuthPage: React.FC<{ onAuthSuccess: (user: User) => void }> = ({ onAuthSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>(Role.PRODUCER);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isLoginView) {
      const user = authenticateUser(email, password);
      setTimeout(() => { // Simulate network delay
        if (user) {
          onAuthSuccess(user);
        } else {
          setError('Invalid email or password.');
        }
        setLoading(false);
      }, 500);
    } else {
      const result = registerUser({ name, email, passwordInput: password, role });
      setTimeout(() => { // Simulate network delay
        if (typeof result === 'string') {
          setError(result);
        } else {
          onAuthSuccess(result);
        }
        setLoading(false);
      }, 500);
    }
  };

  const getRoleColor = (r: Role) => {
      if (r === role) {
          switch(r) {
              case Role.PRODUCER: return 'bg-producer text-white';
              case Role.MIDDLEMAN: return 'bg-middleman text-white';
              case Role.BUYER: return 'bg-buyer text-white';
          }
      }
      return 'bg-slate-200 text-slate-700 hover:bg-slate-300';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-slate-50 to-white flex flex-col justify-center items-center p-4 font-sans">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-slate-800">
            Eco <span className="text-primary">Connect</span>
        </h1>
        <p className="mt-3 text-xl text-slate-600">
          {isLoginView ? 'Welcome back!' : 'Join the movement.'}
        </p>
      </header>
      <main className="w-full max-w-md bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-2xl font-bold text-center text-slate-800">{isLoginView ? 'Log In' : 'Sign Up'}</h2>
          
          {!isLoginView && (
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="name">Name</label>
              <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="email">Email Address</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary focus:border-primary" />
          </div>

          {!isLoginView && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">I am a:</label>
              <div className="flex rounded-lg overflow-hidden border border-slate-300">
                  <button type="button" onClick={() => setRole(Role.PRODUCER)} className={`flex-1 p-2 font-semibold transition-colors ${getRoleColor(Role.PRODUCER)}`}>Producer</button>
                  <button type="button" onClick={() => setRole(Role.MIDDLEMAN)} className={`flex-1 p-2 font-semibold transition-colors border-l border-r border-slate-300 ${getRoleColor(Role.MIDDLEMAN)}`}>Collector</button>
                  <button type="button" onClick={() => setRole(Role.BUYER)} className={`flex-1 p-2 font-semibold transition-colors ${getRoleColor(Role.BUYER)}`}>Buyer</button>
              </div>
            </div>
          )}
          
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div>
            <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-primary-foreground bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-primary/70 transition-colors">
              {loading ? 'Processing...' : (isLoginView ? 'Log In' : 'Create Account')}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          {isLoginView ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLoginView(!isLoginView); setError(null); }} className="font-medium text-primary hover:text-primary-dark">
            {isLoginView ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </main>
    </div>
  );
};


// --- Main Application Component ---
const MainApplication: React.FC<{ user: User; onLogout: () => void; onPromptSubscription: () => void; }> = ({ user, onLogout, onPromptSubscription }) => {
  const [listings, setListings] = useState<WasteListing[]>(getProducerListings());
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>(getMarketplaceItems());
  const [collectorLocations, setCollectorLocations] = useState<Record<string, Location>>({
    'user-mid-1': { lat: 17.38, lng: 78.48, address: 'Collector Base, Koti, Hyderabad' },
    'user-mid-2': { lat: 17.44, lng: 78.35, address: 'Collector Hub, Kondapur, Hyderabad' }
  });

  const handleUpdateCollectorLocation = (collectorId: string, location: Location) => {
    setCollectorLocations(prev => ({ ...prev, [collectorId]: location }));
  };
  
  const handleUpdateListings = (updatedListings: WasteListing[]) => {
      setProducerListings(updatedListings);
      setListings([...updatedListings]);
  };
  
  const handleAddNewListing = (newListing: Omit<WasteListing, 'otp'>) => {
      addProducerListing(newListing);
      setListings([...getProducerListings()]);
  };

  const handleAddNewMarketplaceItem = (newItem: MarketplaceItem) => {
      addMarketplaceItem(newItem);
      setMarketplaceItems([...getMarketplaceItems()]);
  }
  
  const handlePurchaseItem = (item: MarketplaceItem) => {
    purchaseMarketplaceItem(item.id, user);
    setMarketplaceItems([...getMarketplaceItems()]);
    alert(`Congratulations! You have purchased ${item.quantity} of ${item.wasteType}. The seller will be notified.`);
  };

  const handleUpdateMarketplaceItemStatus = (itemId: string, status: MarketplaceItemStatus) => {
      updateMarketplaceItemStatus(itemId, status);
      setMarketplaceItems([...getMarketplaceItems()]);
  };

  const handleVerifyAndCollect = (listingId: string, otp: string): boolean => {
      const currentListings = getProducerListings();
      const listingToUpdate = currentListings.find(l => l.id === listingId);
      
      if (listingToUpdate && listingToUpdate.otp === otp) {
          const updatedListings = currentListings.map(l => 
              l.id === listingId ? { ...l, status: PickupStatus.COLLECTED } : l
          );
          handleUpdateListings(updatedListings);
          return true;
      }
      return false;
  };
  

  const renderContent = () => {
    switch (user.role) {
      case Role.PRODUCER:
        return <ProducerUI 
          currentUser={user}
          allListings={listings}
          collectorLocations={collectorLocations}
          onAddNewListing={handleAddNewListing}
          onVerifyPickup={handleVerifyAndCollect}
        />;
      case Role.MIDDLEMAN:
        return <MiddlemanUI 
            currentUser={user}
            allPickups={listings}
            onUpdateListings={handleUpdateListings}
            collectorLocations={collectorLocations}
            onUpdateCollectorLocation={handleUpdateCollectorLocation}
            marketplaceItems={marketplaceItems}
            onAddNewMarketplaceItem={handleAddNewMarketplaceItem}
            onUpdateMarketplaceItemStatus={handleUpdateMarketplaceItemStatus}
            isSubscribed={hasActiveSubscription(user)}
            onPromptSubscription={onPromptSubscription}
        />;
      case Role.BUYER:
        return <BuyerUI 
            marketplaceItems={marketplaceItems}
            onPurchase={handlePurchaseItem}
            currentUser={user}
            onUpdateMarketplaceItemStatus={handleUpdateMarketplaceItemStatus}
            collectorLocations={collectorLocations}
            isSubscribed={hasActiveSubscription(user)}
            onPromptSubscription={onPromptSubscription}
        />;
      default:
        return <div className="p-4">Error: Unknown user role.</div>;
    }
  };

  const getRoleStyling = () => {
      switch(user.role) {
          case Role.PRODUCER: return { banner: 'border-producer', text: 'text-producer', icon: <UserGroupIcon className="h-6 w-6 text-producer"/>, title: 'Producer Dashboard' };
          case Role.MIDDLEMAN: return { banner: 'border-middleman', text: 'text-middleman', icon: <TruckIcon className="h-6 w-6 text-middleman"/>, title: 'Collector Dashboard' };
          case Role.BUYER: return { banner: 'border-buyer', text: 'text-buyer', icon: <ShoppingBagIcon className="h-6 w-6 text-buyer"/>, title: 'Buyer Marketplace' };
      }
  }
  
  const roleStyling = getRoleStyling();

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
             <h1 className="text-2xl font-bold text-slate-900">
                Eco <span className="text-primary">Connect</span>
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold text-slate-700 truncate min-w-0">Welcome, {user.name}</p>
                <span className={`text-sm font-bold uppercase ${roleStyling.text}`}>{user.role}</span>
              </div>
              <img src={user.photoUrl} alt="User" className="w-12 h-12 rounded-full border-2 border-white shadow-md"/>
              <button onClick={onLogout} className="flex items-center gap-2 text-slate-600 hover:text-primary font-semibold py-2 px-3 bg-slate-200 hover:bg-primary-light rounded-lg transition-colors">
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
         <div className={`bg-white p-4 rounded-xl shadow-md border-l-4 ${roleStyling.banner} mb-8 flex items-center gap-4`}>
                {roleStyling.icon}
                <h2 className="text-2xl font-bold text-slate-800">{roleStyling.title}</h2>
        </div>
        {renderContent()}
      </main>
    </div>
  );
};

const App = () => {
    const [user, setUser] = useState<User | null>(null);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

    const handleLogout = () => {
        setUser(null);
        // Clear any other session data here
    };
    
    const handleAuthSuccess = (authedUser: User) => {
        setUser(authedUser);
    }
    
    if (!user) {
        return <AuthPage onAuthSuccess={handleAuthSuccess} />;
    }
    
    const handlePromptSubscription = () => {
        setShowSubscriptionModal(true);
    };

    const handleSubscriptionSuccess = (plan: SubscriptionPlan) => {
        const updatedUser = updateUserSubscription(user.id, plan);
        if(updatedUser) {
            setUser(updatedUser);
        }
        setShowSubscriptionModal(false);
    };

    return (
      <>
        <MainApplication 
            user={user} 
            onLogout={handleLogout} 
            onPromptSubscription={handlePromptSubscription} 
        />
        {showSubscriptionModal && 
            <SubscriptionModal 
                user={user} 
                onSubscriptionSuccess={handleSubscriptionSuccess}
                onClose={() => setShowSubscriptionModal(false)}
            />
        }
      </>
    );
}

export default App;