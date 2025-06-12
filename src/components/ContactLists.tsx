import React, { useState, useEffect } from 'react';
import { Users, Plus, Upload, Mail, Edit, Trash2, UserPlus } from 'lucide-react';

interface ContactList {
  id: number;
  name: string;
  description: string;
  contact_count: number;
  created_at: string;
}

interface Contact {
  id: number;
  email: string;
  name: string;
}

interface ContactListsProps {
  onUpdate: () => void;
}

export function ContactLists({ onUpdate }: ContactListsProps) {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [selectedList, setSelectedList] = useState<ContactList | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [showAddContactsForm, setShowAddContactsForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newListForm, setNewListForm] = useState({ name: '', description: '' });
  const [bulkEmails, setBulkEmails] = useState('');

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const response = await fetch('/api/contacts/lists');
      const data = await response.json();
      setLists(data);
    } catch (error) {
      console.error('Error loading contact lists:', error);
    }
  };

  const loadContacts = async (listId: number) => {
    try {
      const response = await fetch(`/api/contacts/lists/${listId}/contacts`);
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/contacts/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newListForm)
      });

      if (!response.ok) throw new Error('Failed to create list');

      await loadLists();
      onUpdate();
      setShowNewListForm(false);
      setNewListForm({ name: '', description: '' });
    } catch (error) {
      console.error('Error creating list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedList) return;

    setLoading(true);

    try {
      const emailLines = bulkEmails.split('\n').filter(line => line.trim());
      const contacts = emailLines.map(line => {
        const email = line.trim();
        return { email, name: '' };
      }).filter(contact => contact.email.includes('@'));

      const response = await fetch(`/api/contacts/lists/${selectedList.id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts })
      });

      if (!response.ok) throw new Error('Failed to add contacts');

      await loadLists();
      await loadContacts(selectedList.id);
      onUpdate();
      setShowAddContactsForm(false);
      setBulkEmails('');
    } catch (error) {
      console.error('Error adding contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedList) return;

    const formData = new FormData();
    formData.append('csv', file);

    try {
      const response = await fetch(`/api/contacts/lists/${selectedList.id}/import`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to import CSV');

      await loadLists();
      await loadContacts(selectedList.id);
      onUpdate();
    } catch (error) {
      console.error('Error importing CSV:', error);
    }
  };

  const selectList = (list: ContactList) => {
    setSelectedList(list);
    loadContacts(list.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contact Lists</h2>
          <p className="text-gray-600 mt-1">Manage your email contact lists</p>
        </div>
        <button
          onClick={() => setShowNewListForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          New List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Lists */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Your Lists</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => selectList(list)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors duration-200 ${
                    selectedList?.id === list.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{list.name}</h4>
                      <p className="text-sm text-gray-600">{list.description}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {list.contact_count} contacts
                    </div>
                  </div>
                </button>
              ))}

              {lists.length === 0 && (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No contact lists yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="lg:col-span-2">
          {selectedList ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedList.name}</h3>
                    <p className="text-gray-600">{selectedList.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <label className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                      <Upload className="w-4 h-4 mr-2" />
                      Import CSV
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => setShowAddContactsForm(true)}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Contacts
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {contacts.length > 0 ? (
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Mail className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{contact.email}</p>
                            {contact.name && <p className="text-sm text-gray-600">{contact.name}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h4>
                    <p className="text-gray-600 mb-4">Add contacts to this list to get started</p>
                    <button
                      onClick={() => setShowAddContactsForm(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add First Contact
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Contact List</h3>
              <p className="text-gray-600">Choose a list from the sidebar to view and manage contacts</p>
            </div>
          )}
        </div>
      </div>

      {/* New List Modal */}
      {showNewListForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Contact List</h3>
              <form onSubmit={handleCreateList} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">List Name</label>
                  <input
                    type="text"
                    value={newListForm.name}
                    onChange={(e) => setNewListForm({ ...newListForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Newsletter Subscribers"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newListForm.description}
                    onChange={(e) => setNewListForm({ ...newListForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Description of this contact list"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewListForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create List'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Contacts Modal */}
      {showAddContactsForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add Contacts to {selectedList?.name}
              </h3>
              <form onSubmit={handleAddContacts} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Addresses (one per line)
                  </label>
                  <textarea
                    value={bulkEmails}
                    onChange={(e) => setBulkEmails(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={8}
                    placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Paste email addresses, one per line. Invalid emails will be ignored.
                  </p>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddContactsForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Contacts'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}