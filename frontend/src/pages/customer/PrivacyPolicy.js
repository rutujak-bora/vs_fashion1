import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PrivacyPolicy() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await axios.get(`${API}/content/privacy`);
      setContent(response.data.content || 'Privacy Policy content will be available soon.');
    } catch (error) {
      console.error('Error fetching content:', error);
      setContent('Privacy Policy content will be available soon.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="py-24 px-6 md:px-12 max-w-4xl mx-auto">
      <h1 className="text-5xl mb-12" style={{ fontFamily: 'Playfair Display' }}>
        Privacy Policy
      </h1>
      <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
    </div>
  );
}
