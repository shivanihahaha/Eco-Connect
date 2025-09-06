


import React, { useState, useMemo } from 'react';
import { User, Role, SubscriptionPlan } from '../types';
import { XCircleIcon, CheckBadgeIcon, CreditCardIcon, ArrowTrendingUpIcon } from './icons/Icons';

interface SubscriptionModalProps {
    user: User;
    onSubscriptionSuccess: (plan: SubscriptionPlan) => void;
    onClose: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ user, onSubscriptionSuccess, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState<SubscriptionPlan>(SubscriptionPlan.MONTHLY);

    const roleInfo = useMemo(() => {
        if (user.role === Role.BUYER) {
            return {
                title: 'Buyer Pro',
                textColor: 'text-buyer-text',
                features: [
                    'Access to the full marketplace of materials.',
                    'Directly purchase from collectors.',
                    'Track your deliveries in real-time.',
                    'View seller ratings and history.'
                ]
            };
        }
        // Default to Collector/Middleman
        return {
            title: 'Collector Pro',
            textColor: 'text-middleman-text',
            features: [
                'Access to all available waste pickup jobs.',
                'Real-time map view of opportunities.',
                'Directly chat with waste producers.',
                'Manage your stock and list items for sale.'
            ]
        };
    }, [user.role]);
    
    const plans = {
        [SubscriptionPlan.MONTHLY]: { price: 499, per: 'month' },
        [SubscriptionPlan.YEARLY]: { price: 4999, per: 'year' },
    };

    const handleSubscribe = async () => {
        setLoading(true);
        // Simulate network delay for payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        onSubscriptionSuccess(plan);
        // The component will unmount on success, so no need to setLoading(false)
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 font-sans animate-fade-in">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
                <button 
                      onClick={onClose}
                      className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors z-10"
                      aria-label="Close"
                >
                    <XCircleIcon className="h-8 w-8"/>
                </button>

                <div className="p-8 text-center bg-slate-50">
                    <ArrowTrendingUpIcon className={`h-16 w-16 mx-auto text-primary`} />
                    <h2 className={`text-3xl font-extrabold text-primary mt-4`}>Unlock {roleInfo.title}</h2>
                    <p className="text-slate-600 mt-2">
                        Subscribe to get full access to all features.
                    </p>
                </div>

                <div className="px-8 py-6">
                    <h3 className="font-bold text-slate-800 mb-3">Your Pro membership includes:</h3>
                    <ul className="space-y-3">
                        {roleInfo.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <CheckBadgeIcon className={`h-6 w-6 flex-shrink-0 text-primary`} />
                                <span className="text-slate-700">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="p-6 bg-slate-100 border-t">
                    <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-slate-200 rounded-lg">
                        <button
                            onClick={() => setPlan(SubscriptionPlan.MONTHLY)}
                            className={`py-2 rounded-md font-semibold transition-all ${plan === SubscriptionPlan.MONTHLY ? 'bg-white shadow text-primary' : 'text-slate-600'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setPlan(SubscriptionPlan.YEARLY)}
                            className={`py-2 rounded-md font-semibold transition-all relative ${plan === SubscriptionPlan.YEARLY ? 'bg-white shadow text-primary' : 'text-slate-600'}`}
                        >
                            Yearly
                            <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">SAVE 16%</span>
                        </button>
                    </div>

                     <div className="text-center mb-4">
                        <p className="text-lg font-semibold text-slate-800 capitalize">{plan} Plan</p>
                        <p className="text-4xl font-bold text-slate-900">
                            ₹{plans[plan].price.toLocaleString('en-IN')} <span className="text-base font-normal text-slate-500">/ {plans[plan].per}</span>
                        </p>
                    </div>
                    <button
                        onClick={handleSubscribe}
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-3 text-white font-bold py-4 px-4 rounded-xl text-lg shadow-lg transition-all transform hover:scale-105 disabled:bg-slate-400 disabled:scale-100 bg-primary hover:bg-primary-dark`}
                    >
                        <CreditCardIcon className="h-6 w-6" />
                        {loading ? 'Processing Payment...' : 'Subscribe Now'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionModal;