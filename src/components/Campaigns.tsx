import React, { useState, useEffect } from 'react';
import { Send, Plus, Play, Pause, Clock, CheckCircle, AlertCircle, Users, Server } from 'lucide-react';
import { EmailEditor } from './EmailEditor';

interface Campaign {
  id: number;
  name: string;
  subject: string;
  content: string;
  status: 'draft' | 'sending' | 'completed' | 'failed';
  sent_count: number;
  total_count: number;
  list_name: string;
  smtp_name: string;
  created_at: string;
  rate_limit: number;
  rate_interval: number;
}

interface ContactList {
  id: number;
  name: string;
  contact_count: number;
}

interface SMTPConfig {
  id: number;
  name: string;
}

interface CampaignsProps {
  onUpdate: () => void;
}

export function Campaigns({ onUpdate }: CampaignsProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [smtpConfigs, setSMTPConfigs] = useState<SMTPConfig[]>([]);
  const [showNewCampaignForm, setShowNewCampaignForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    content: '',
    list_id: '',
    smtp_config_id: '',
    rate_limit: 10,
    rate_interval: 60
  });

  useEffect(() => {
    loadCampaigns();
    loadContactLists();
    loadSMTPConfigs();
  }, []);

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const loadContactLists = async () => {
    try {
      const response = await fetch('/api/contacts/lists');
      const data = await response.json();
      setContactLists(data);
    } catch (error) {
      console.error('Error loading contact lists:', error);
    }
  };

  const loadSMTPConfigs = async () => {
    try {
      const response = await fetch('/api/smtp');
      const data = await response.json();
      setSMTPConfigs(data);
    } catch (error) {
      console.error('Error loading SMTP configs:', error);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignForm)
      });

      if (!response.ok) throw new Error('Failed to create campaign');

      await loadCampaigns();
      onUpdate();
      setShowNewCampaignForm(false);
      setCampaignForm({
        name: '',
        subject: '',
        content: '',
        list_id: '',
        smtp_config_id: '',
        rate_limit: 10,
        rate_interval: 60
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCampaign = async (campaignId: number) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/start`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to start campaign');

      await loadCampaigns();
      onUpdate();
    } catch (error) {
      console.error('Error starting campaign:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="w-5 h-5 text-gray-500" />;
      case 'sending':
        return <Play className="w-5 h-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sending':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Campaigns</h2>
          <p className="text-gray-600 mt-1">Create and manage your email campaigns</p>
        </div>
        <button
          onClick={() => setShowNewCampaignForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </button>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  {getStatusIcon(campaign.status)}
                  <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-2">Subject: {campaign.subject}</p>
                
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>List: {campaign.list_name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Server className="w-4 h-4" />
                    <span>SMTP: {campaign.smtp_name}</span>
                  </div>
                  <div>
                    Rate: {campaign.rate_limit} emails/{campaign.rate_interval}s
                  </div>
                </div>

                {campaign.status !== 'draft' && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{campaign.sent_count} / {campaign.total_count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: campaign.total_count > 0 
                            ? `${(campaign.sent_count / campaign.total_count) * 100}%` 
                            : '0%'
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {campaign.status === 'draft' && (
                  <button
                    onClick={() => handleStartCampaign(campaign.id)}
                    className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Start
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {campaigns.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-600 mb-4">Create your first email campaign to get started</p>
            <button
              onClick={() => setShowNewCampaignForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </button>
          </div>
        )}
      </div>

      {/* New Campaign Modal */}
      {showNewCampaignForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Campaign</h3>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Monthly Newsletter"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your Monthly Update"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact List
                  </label>
                  <select
                    value={campaignForm.list_id}
                    onChange={(e) => setCampaignForm({ ...campaignForm, list_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a contact list</option>
                    {contactLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name} ({list.contact_count} contacts)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Configuration
                  </label>
                  <select
                    value={campaignForm.smtp_config_id}
                    onChange={(e) => setCampaignForm({ ...campaignForm, smtp_config_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select SMTP server</option>
                    {smtpConfigs.map((config) => (
                      <option key={config.id} value={config.id}>
                        {config.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate Limit (emails per interval)
                  </label>
                  <input
                    type="number"
                    value={campaignForm.rate_limit}
                    onChange={(e) => setCampaignForm({ ...campaignForm, rate_limit: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate Interval (seconds)
                  </label>
                  <input
                    type="number"
                    value={campaignForm.rate_interval}
                    onChange={(e) => setCampaignForm({ ...campaignForm, rate_interval: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="10"
                    max="3600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Content
                </label>
                <EmailEditor
                  value={campaignForm.content}
                  onChange={(content) => setCampaignForm({ ...campaignForm, content })}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowNewCampaignForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}