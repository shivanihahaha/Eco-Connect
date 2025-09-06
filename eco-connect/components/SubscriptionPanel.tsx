import React, { useMemo } from 'react';
import { User, Subscription, SubscriptionStatus } from '../types';
import { hasActiveSubscription } from '../App';
import { CheckBadgeIcon, CreditCardIcon, CalendarDaysIcon } from './icons/Icons';

interface SubscriptionPanelProps {
    user: User;
    onManageSubscription: () => void;
}

const SubscriptionPanel: React.FC<SubscriptionPanelProps> = ({ user, onManageSubscription }) => {

    const activeSubscription = useMemo(() => {
        if (!hasActiveSubscription(user)) return null;
        return user.subscriptions.find(sub => sub.status === SubscriptionStatus.ACTIVE);
    }, [user]);

    const sortedHistory = useMemo(() => {
        return [...user.subscriptions].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }, [user.subscriptions]);

    const getStatusChip = (status: SubscriptionStatus) => {
        switch (status) {
            case SubscriptionStatus.ACTIVE:
                return <span className="px-2 py-1 text-xs font-bold text-green-800 bg-green-200 rounded-full">Active</span>;
            case SubscriptionStatus.EXPIRED:
                return <span className="px-2 py-1 text-xs font-bold text-slate-700 bg-slate-200 rounded-full">Expired</span>;
            case SubscriptionStatus.CANCELLED:
                 return <span className="px-2 py-1 text-xs font-bold text-red-800 bg-red-200 rounded-full">Cancelled</span>;
            default:
                return null;
        }
    }

    return (
        <div className="p-4 space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Current Subscription</h3>
                {activeSubscription ? (
                    <div>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-2xl font-bold text-primary capitalize">{activeSubscription.plan} Plan</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <CheckBadgeIcon className="h-6 w-6 text-green-500" />
                                    <span className="font-semibold text-green-700">Status: Active</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500">Expires on</p>
                                <p className="font-bold text-lg text-slate-800">{new Date(activeSubscription.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <button onClick={onManageSubscription} className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-4 rounded-lg transition-colors">
                            <CreditCardIcon className="h-5 w-5"/> Manage Subscription
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className="text-center text-slate-600">You do not have an active subscription.</p>
                        <button onClick={onManageSubscription} className="mt-4 w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg">
                            Subscribe Now to Unlock All Features
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CalendarDaysIcon className="h-6 w-6"/>
                    Subscription History
                </h3>
                {sortedHistory.length > 0 ? (
                    <ul className="divide-y divide-slate-200">
                        {sortedHistory.map(sub => (
                            <li key={sub.id} className="py-4 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-slate-700 capitalize">{sub.plan} Plan</p>
                                    <p className="text-sm text-slate-500">
                                        {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                                    </p>
                                </div>
                                {getStatusChip(sub.status)}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-slate-500 py-8">No subscription history found.</p>
                )}
            </div>
        </div>
    );
};

export default SubscriptionPanel;
