import React from 'react';
import { Mail, Users, Server, Activity, TrendingUp, Clock } from 'lucide-react';

interface DashboardProps {
  stats: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalContacts: number;
    smtpConfigs: number;
  };
  onRefresh: () => void;
}

export function Dashboard({ stats, onRefresh }: DashboardProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Monitor your email campaigns and system status</p>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
        >
          <Activity className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
              <p className="text-sm text-gray-600">Total Campaigns</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.activeCampaigns}</p>
              <p className="text-sm text-gray-600">Active Campaigns</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.totalContacts}</p>
              <p className="text-sm text-gray-600">Total Contacts</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Server className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.smtpConfigs}</p>
              <p className="text-sm text-gray-600">SMTP Configs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="p-3 bg-blue-100 rounded-full w-12 h-12 mx-auto mb-3">
              <Server className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">1. Configure SMTP</h4>
            <p className="text-sm text-gray-600">Set up your SMTP server credentials to send emails</p>
          </div>
          
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="p-3 bg-purple-100 rounded-full w-12 h-12 mx-auto mb-3">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">2. Import Contacts</h4>
            <p className="text-sm text-gray-600">Create contact lists by importing emails or adding manually</p>
          </div>
          
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="p-3 bg-green-100 rounded-full w-12 h-12 mx-auto mb-3">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">3. Create Campaign</h4>
            <p className="text-sm text-gray-600">Design your email and send it to your contact lists</p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          <div className="flex items-center text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            All Systems Operational
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Database Connection</span>
            <span className="text-sm text-green-600">✓ Connected</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Email Service</span>
            <span className="text-sm text-green-600">✓ Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}