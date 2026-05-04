import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import useStore from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

export default function ProductManagement() {
  const { token } = useStore();
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    collection_id: '',
    description: '',
    sizes: '',
    color: '',
    size_guide: '',
    quantity: 0,
    price: 0,
    discount_price: '',
    is_trending: false,
    is_new_arrival: false,
    is_best_seller: false,
    images: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, collectionsRes] = await Promise.all([
        axios.get(`${API}/admin/inventory`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/collections`)
      ]);
      setProducts(productsRes.data);
      setCollections(collectionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post(`${API}/products/upload`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        return response.data.url;
      });

      const urls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...urls].slice(0, 4)
      }));
      toast.success('Images uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('collection_id', formData.collection_id);
      form.append('description', formData.description);
      form.append('sizes', JSON.stringify(formData.sizes.split(',').map(s => s.trim())));
      form.append('color', formData.color);
      form.append('size_guide', formData.size_guide);
      form.append('quantity', formData.quantity);
      form.append('price', formData.price);
      form.append('discount_price', formData.discount_price || '');
      form.append('is_trending', formData.is_trending);
      form.append('is_new_arrival', formData.is_new_arrival);
      form.append('is_best_seller', formData.is_best_seller);
      form.append('images', JSON.stringify(formData.images));

      if (editingId) {
        form.append('is_active', true);
        await axios.put(`${API}/products/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product updated successfully');
      } else {
        await axios.post(`${API}/products`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      collection_id: product.collection_id,
      description: product.description,
      sizes: product.sizes.join(', '),
      color: product.color,
      size_guide: product.size_guide || '',
      quantity: product.quantity,
      price: product.price,
      discount_price: product.discount_price || '',
      is_trending: product.is_trending,
      is_new_arrival: product.is_new_arrival,
      is_best_seller: product.is_best_seller,
      images: product.images || []
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await axios.delete(`${API}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Product deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      collection_id: '',
      description: '',
      sizes: '',
      color: '',
      size_guide: '',
      quantity: 0,
      price: 0,
      discount_price: '',
      is_trending: false,
      is_new_arrival: false,
      is_best_seller: false,
      images: []
    });
    setEditingId(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display' }}>
          Product Management
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              data-testid="add-product-btn"
              onClick={resetForm}
              className="bg-[#4A2836] hover:bg-[#5A3846] flex items-center gap-2"
            >
              <Plus size={16} /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  data-testid="product-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="collection_id">Collection *</Label>
                <Select
                  value={formData.collection_id}
                  onValueChange={(value) => setFormData({ ...formData, collection_id: value })}
                >
                  <SelectTrigger data-testid="product-collection-select" className="mt-1">
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {collections.map((coll) => (
                      <SelectItem key={coll.id} value={coll.id}>
                        {coll.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  data-testid="product-description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sizes">Sizes (comma-separated) *</Label>
                  <Input
                    id="sizes"
                    data-testid="product-sizes-input"
                    placeholder="S, M, L, XL"
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color *</Label>
                  <Input
                    id="color"
                    data-testid="product-color-input"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="size_guide">Size Guide</Label>
                <Input
                  id="size_guide"
                  data-testid="product-size-guide-input"
                  value={formData.size_guide}
                  onChange={(e) => setFormData({ ...formData, size_guide: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    data-testid="product-quantity-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    data-testid="product-price-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="discount_price">Discount Price</Label>
                  <Input
                    id="discount_price"
                    type="number"
                    step="0.01"
                    data-testid="product-discount-input"
                    value={formData.discount_price}
                    onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Product Images (Max 4)</Label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative aspect-square bg-gray-100 border border-gray-200">
                      <img src={img.startsWith('http') ? img : `${BACKEND_URL}${img}`} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {formData.images.length < 4 && (
                    <label className="aspect-square bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        data-testid="product-image-upload"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                      <Upload size={24} className="text-gray-400" />
                    </label>
                  )}
                </div>
                {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_trending"
                    data-testid="product-trending-checkbox"
                    checked={formData.is_trending}
                    onChange={(e) => setFormData({ ...formData, is_trending: e.target.checked })}
                  />
                  <Label htmlFor="is_trending">Trending</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_new_arrival"
                    data-testid="product-new-arrival-checkbox"
                    checked={formData.is_new_arrival}
                    onChange={(e) => setFormData({ ...formData, is_new_arrival: e.target.checked })}
                  />
                  <Label htmlFor="is_new_arrival">New Arrival</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_best_seller"
                    data-testid="product-best-seller-checkbox"
                    checked={formData.is_best_seller}
                    onChange={(e) => setFormData({ ...formData, is_best_seller: e.target.checked })}
                  />
                  <Label htmlFor="is_best_seller">Best Seller</Label>
                </div>
              </div>

              <Button
                type="submit"
                data-testid="save-product-btn"
                className="w-full bg-[#C4969C] hover:bg-[#B4848F]"
              >
                {editingId ? 'Update' : 'Create'} Product
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} data-testid={`product-row-${product.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] && (
                          <img
                            src={product.images[0].startsWith('http') ? product.images[0] : `${BACKEND_URL}${product.images[0]}`}
                            alt={product.name}
                            className="w-12 h-12 object-cover bg-gray-100"
                          />
                        )}
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.collection_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ₹{product.discount_price || product.price}
                      {product.discount_price && (
                        <span className="text-gray-400 line-through ml-2">₹{product.price}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        {product.is_trending && <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Trending</span>}
                        {product.is_new_arrival && <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">New</span>}
                        {product.is_best_seller && <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Best</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        data-testid={`edit-product-${product.id}`}
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        data-testid={`delete-product-${product.id}`}
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No products yet. Create your first product!
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
