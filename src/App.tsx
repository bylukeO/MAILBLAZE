import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { SMTPConfig } from './components/SMTPConfig';
import { ContactLists } from './components/ContactLists';
import { Campaigns } from './components/Campaigns';
import { Navigation } from './components/Navigation';
import { Mail, Server, Users, Send } from 'lucide-react';

const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: Mail },
  { id: 'smtp', name: 'SMTP Config', icon: Server },
  { id: 'contacts', name: 'Contact Lists', icon: Users },
  { id: 'campaigns', name: 'Campaigns', icon: Send },
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalContacts: 0,
    smtpConfigs: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [campaigns, contactLists, smtpConfigs] = await Promise.all([
        fetch('/api/campaigns').then(r => r.json()),
        fetch('/api/contacts/lists').then(r => r.json()),
        fetch('/api/smtp').then(r => r.json())
      ]);

      const totalContacts = contactLists.reduce((sum, list) => sum + list.contact_count, 0);
      const activeCampaigns = campaigns.filter(c => c.status === 'sending').length;

      setStats({
        totalCampaigns: campaigns.length,
        activeCampaigns,
        totalContacts,
        smtpConfigs: smtpConfigs.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} onRefresh={loadStats} />;
      case 'smtp':
        return <SMTPConfig onUpdate={loadStats} />;
      case 'contacts':
        return <ContactLists onUpdate={loadStats} />;
      case 'campaigns':
        return <Campaigns onUpdate={loadStats} />;
      default:
        return <Dashboard stats={stats} onRefresh={loadStats} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Simple Sender</h1>
                <p className="text-sm text-gray-500">Bulk Email Utility</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              v1.0.0 | Self-Hosted
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navigation 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        
        <div className="mt-8">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
}

export default App;