import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import useStore from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

export default function ContentManagement() {
  const { token } = useStore();
  const [termsContent, setTermsContent] = useState('');
  const [faqContent, setFaqContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const [termsRes, faqRes] = await Promise.all([
        axios.get(`${API}/content/terms`),
        axios.get(`${API}/content/faq`)
      ]);
      setTermsContent(termsRes.data.content || '');
      setFaqContent(faqRes.data.content || '');
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTerms = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/content/terms`,
        { content: termsContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Terms & Conditions updated successfully');
    } catch (error) {
      toast.error('Failed to update Terms & Conditions');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFaq = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/content/faq`,
        { content: faqContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('FAQ updated successfully');
    } catch (error) {
      toast.error('Failed to update FAQ');
    } finally {
      setSaving(false);
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

      <Tabs defaultValue="terms" className="w-full">
        <TabsList data-testid="content-tabs">
          <TabsTrigger value="terms" data-testid="terms-tab">Terms & Conditions</TabsTrigger>
          <TabsTrigger value="faq" data-testid="faq-tab">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="terms" className="mt-6">
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">Edit Terms & Conditions</h2>
            <Textarea
              data-testid="terms-content-textarea"
              value={termsContent}
              onChange={(e) => setTermsContent(e.target.value)}
              rows={20}
              className="mb-4 font-mono text-sm"
              placeholder="Enter Terms & Conditions content here..."
            />
            <Button
              data-testid="save-terms-btn"
              onClick={handleSaveTerms}
              disabled={saving}
              className="bg-[#C4969C] hover:bg-[#B4848F]"
            >
              {saving ? 'Saving...' : 'Save Terms & Conditions'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="faq" className="mt-6">
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">Edit FAQ</h2>
            <Textarea
              data-testid="faq-content-textarea"
              value={faqContent}
              onChange={(e) => setFaqContent(e.target.value)}
              rows={20}
              className="mb-4 font-mono text-sm"
              placeholder="Enter FAQ content here..."
            />
            <Button
              data-testid="save-faq-btn"
              onClick={handleSaveFaq}
              disabled={saving}
              className="bg-[#C4969C] hover:bg-[#B4848F]"
            >
              {saving ? 'Saving...' : 'Save FAQ'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
