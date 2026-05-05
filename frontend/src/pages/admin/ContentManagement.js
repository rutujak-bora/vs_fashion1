import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import useStore from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const POLICIES = [
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'refund', label: 'Refund Policy' },
  { id: 'shipping', label: 'Shipping Policy' },
  { id: 'contact', label: 'Contact Details' },
  { id: 'terms', label: 'Terms & Conditions' },
  { id: 'faq', label: 'FAQ' }
];

export default function ContentManagement() {
  const { token } = useStore();
  const [contentData, setContentData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const promises = POLICIES.map(policy => axios.get(`${API}/content/${policy.id}`));
      const responses = await Promise.all(promises);
      
      const newContentData = {};
      responses.forEach((res, index) => {
        newContentData[POLICIES[index].id] = res.data.content || '';
      });
      
      setContentData(newContentData);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load some policies.');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (id, value) => {
    setContentData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async (id, label) => {
    setSaving(prev => ({ ...prev, [id]: true }));
    try {
      await axios.put(
        `${API}/content/${id}`,
        { content: contentData[id] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${label} updated successfully`);
    } catch (error) {
      toast.error(`Failed to update ${label}`);
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>
        Content Management
      </h1>

      <Tabs defaultValue="privacy" className="w-full">
        <TabsList className="flex flex-wrap gap-2 mb-6 bg-transparent h-auto" data-testid="content-tabs">
          {POLICIES.map(policy => (
            <TabsTrigger 
              key={policy.id} 
              value={policy.id} 
              data-testid={`${policy.id}-tab`}
              className="data-[state=active]:bg-[#C4969C] data-[state=active]:text-white border border-gray-200 px-4 py-2"
            >
              {policy.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {POLICIES.map(policy => (
          <TabsContent key={policy.id} value={policy.id}>
            <div className="bg-white border border-gray-200 p-6 rounded-md shadow-sm">
              <h2 className="text-xl font-bold mb-4">Edit {policy.label}</h2>
              <Textarea
                data-testid={`${policy.id}-content-textarea`}
                value={contentData[policy.id] || ''}
                onChange={(e) => handleContentChange(policy.id, e.target.value)}
                rows={20}
                className="mb-4 font-mono text-sm border-gray-300 focus:ring-[#C4969C] focus:border-[#C4969C]"
                placeholder={`Enter ${policy.label} content here...`}
              />
              <Button
                data-testid={`save-${policy.id}-btn`}
                onClick={() => handleSave(policy.id, policy.label)}
                disabled={saving[policy.id]}
                className="bg-[#C4969C] hover:bg-[#B4848F] text-white px-6"
              >
                {saving[policy.id] ? 'Saving...' : `Save ${policy.label}`}
              </Button>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
