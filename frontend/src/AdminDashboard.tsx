import React, { useEffect, useState } from 'react';

const CATEGORY_API = 'http://127.0.0.1:8000/api/categories/';
const PRODUCT_API = 'http://127.0.0.1:8000/api/products/';

// Define CategoryType if not already defined
type CategoryType = {
  id: number;
  name: string;
  description: string;
};

function AdminDashboard() {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(CATEGORY_API)
      .then(res => res.json())
      .then(data => {
        // If your API returns { results: [...] }, use data.results
        if (Array.isArray(data)) {
          setCategories(data);
        } else if (Array.isArray(data.results)) {
          setCategories(data.results);
        } else {
          setCategories([]);
        }
      })
      .catch(() => setCategories([]));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(PRODUCT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: form.price,
          stock: form.stock,
          category_id: form.category_id
        })
      });
      if (res.ok) {
        setMessage('Product added successfully!');
        setForm({ name: '', description: '', price: '', stock: '', category_id: '' });
      } else {
        const data = await res.json();
        setError(data.detail || 'Failed to add product');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{marginTop: 32}}>
      <h2>Admin Dashboard</h2>
      <p>Here you can manage products and categories.</p>
      <h3>Add Product</h3>
      <form onSubmit={handleSubmit} style={{maxWidth: 400}}>
        <div style={{marginBottom: 12}}>
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} required style={{width: '100%', padding: 8}} />
        </div>
        <div style={{marginBottom: 12}}>
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} style={{width: '100%', padding: 8}} />
        </div>
        <div style={{marginBottom: 12}}>
          <label>Price</label>
          <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required style={{width: '100%', padding: 8}} />
        </div>
        <div style={{marginBottom: 12}}>
          <label>Stock</label>
          <input name="stock" type="number" value={form.stock} onChange={handleChange} required style={{width: '100%', padding: 8}} />
        </div>
        <div style={{marginBottom: 12}}>
          <label>Category</label>
          <select name="category_id" value={form.category_id} onChange={handleChange} required style={{width: '100%', padding: 8}}>
            <option value="">Select a category</option>
            {(categories || []).map((cat: CategoryType) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        {message && <div style={{color: 'green', marginBottom: 12}}>{message}</div>}
        {error && <div style={{color: 'red', marginBottom: 12}}>{error}</div>}
        <button type="submit" disabled={loading} style={{width: '100%', padding: 10}}>
          {loading ? 'Adding...' : 'Add Product'}
        </button>
      </form>
    </div>
  );
}

// ...existing code...
export default AdminDashboard;