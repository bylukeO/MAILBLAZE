import React, { useState, useEffect } from 'react';
import { Server, Plus, Check, X, Edit, TestTube, Shield } from 'lucide-react';

interface SMTPConfig {
  id?: number;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: 'tls' | 'ssl' | 'none';
  is_default: boolean;
}

interface SMTPConfigProps {
  onUpdate: () => void;
}

export function SMTPConfig({ onUpdate }: SMTPConfigProps) {
  const [configs, setConfigs] = useState<SMTPConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SMTPConfig | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SMTPConfig>({
    name: '',
    host: '',
    port: 587,
    username: '',
    password: '',
    encryption: 'tls',
    is_default: false
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/smtp');
      const data = await response.json();
      setConfigs(data);
    } catch (error) {
      console.error('Error loading SMTP configs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save configuration');

      await loadConfigs();
      onUpdate();
      resetForm();
    } catch (error) {
      console.error('Error saving SMTP config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: 'Connection test failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (config: SMTPConfig) => {
    if (config.id) {
      try {
        const response = await fetch(`/api/smtp/${config.id}`);
        const fullConfig = await response.json();
        setFormData(fullConfig);
        setEditingConfig(fullConfig);
        setShowForm(true);
      } catch (error) {
        console.error('Error loading config for editing:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: 587,
      username: '',
      password: '',
      encryption: 'tls',
      is_default: false
    });
    setShowForm(false);
    setEditingConfig(null);
    setTestResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SMTP Configuration</h2>
          <p className="text-gray-600 mt-1">Manage your email server settings</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add SMTP Server
        </button>
      </div>

      {/* SMTP Configs List */}
      <div className="grid gap-6">
        {configs.map((config) => (
          <div key={config.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Server className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
                    {config.is_default && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{config.host}:{config.port}</p>
                  <p className="text-sm text-gray-500">{config.username}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  <Shield className="w-4 h-4 mr-1" />
                  {config.encryption.toUpperCase()}
                </div>
                <button
                  onClick={() => handleEdit(config)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {configs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No SMTP Servers Configured</h3>
            <p className="text-gray-600 mb-4">Add your first SMTP server to start sending emails</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add SMTP Server
            </button>
          </div>
        )}
      </div>

      {/* SMTP Configuration Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingConfig ? 'Edit SMTP Configuration' : 'Add SMTP Configuration'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Configuration Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="My Email Server"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="smtp.gmail.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Encryption
                  </label>
                  <select
                    value={formData.encryption}
                    onChange={(e) => setFormData({ ...formData, encryption: e.target.value as 'tls' | 'ssl' | 'none' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username/Email
                  </label>
                  <input
                    type="email"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your-email@domain.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your password or app password"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700">
                  Set as default SMTP configuration
                </label>
              </div>

              {testResult && (
                <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center">
                    {testResult.success ? (
                      <Check className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <X className="w-5 h-5 text-red-600 mr-2" />
                    )}
                    <span className={`text-sm font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {testResult.message}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Connection
                </button>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}