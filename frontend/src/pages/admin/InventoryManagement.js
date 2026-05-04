import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useStore from '@/store/useStore';
import { AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

export default function InventoryManagement() {
  const { token } = useStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`${API}/admin/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLowStockProducts = () => {
    return products.filter(p => p.quantity < 10);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const lowStockProducts = getLowStockProducts();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Playfair Display' }}>
        Inventory Management
      </h1>

      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 mb-6 rounded flex items-start gap-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-bold text-yellow-800 mb-1">Low Stock Alert</h3>
            <p className="text-sm text-yellow-700">
              {lowStockProducts.length} product(s) have low stock (less than 10 units)
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} data-testid={`inventory-row-${product.id}`} className={product.quantity < 10 ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.collection_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-bold ${
                        product.quantity === 0 ? 'text-red-600' :
                        product.quantity < 10 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {product.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${
                        product.quantity === 0 ? 'bg-red-100 text-red-800' :
                        product.quantity < 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {product.quantity === 0 ? 'Out of Stock' :
                         product.quantity < 10 ? 'Low Stock' :
                         'In Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(product.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No products in inventory
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
