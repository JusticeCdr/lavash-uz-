import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { LogOut, Plus, Edit2, Trash2, Image as ImageIcon, Save, X, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [tvSettings, setTvSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'settings'
  const navigate = useNavigate();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name_uz: '',
    price: '',
    image_url: '',
    tv_number: 1,
    category_title: '',
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('tv_number', { ascending: true })
      .order('sort_order', { ascending: true });
    
    if (!productsError) setProducts(productsData || []);

    // Fetch TV Settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('tv_settings')
      .select('*')
      .order('tv_number', { ascending: true });
    
    if (!settingsError) setTvSettings(settingsData || []);
    
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/admin/login');
  };

  const handleImageUpload = async (e) => {
    try {
      setUploadingImage(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
    } catch (error) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([formData]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      fetchData();
    } catch (error) {
      alert('Error saving product: ' + error.message);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      alert('Error deleting product: ' + error.message);
    }
  };

  const toggleProductStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      alert('Error updating status: ' + error.message);
    }
  };

  const updateTvSetting = async (id, field, value) => {
    try {
      const { error } = await supabase
        .from('tv_settings')
        .update({ [field]: value })
        .eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      alert('Error updating settings: ' + error.message);
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name_uz: '',
        price: '',
        image_url: '',
        tv_number: 1,
        category_title: '',
        is_active: true,
        sort_order: 0,
      });
    }
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><RefreshCw className="animate-spin text-brand-green" size={32} /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-brand-green">L.UZ Admin</h1>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'products' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                TV Settings
              </button>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-500 hover:text-brand-red transition-colors"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'products' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Manage Products</h2>
              <button
                onClick={() => openModal()}
                className="bg-brand-green hover:bg-brand-green/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
              >
                <Plus size={20} /> Add Product
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Image</th>
                      <th className="px-6 py-4">Name (UZ)</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">TV</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name_uz} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{product.name_uz}</td>
                        <td className="px-6 py-4 text-brand-green font-semibold">{product.price.toLocaleString()} UZS</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            TV-{product.tv_number}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleProductStatus(product.id, product.is_active)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${product.is_active ? 'bg-brand-green' : 'bg-gray-300'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => openModal(product)} className="text-gray-400 hover:text-blue-600 transition-colors p-2">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => deleteProduct(product.id)} className="text-gray-400 hover:text-brand-red transition-colors p-2 ml-2">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No products found. Add one to get started.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">TV Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tvSettings.map((tv) => (
                <div key={tv.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">TV-{tv.tv_number}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${tv.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {tv.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={tv.title || ''}
                      onChange={(e) => updateTvSetting(tv.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-green focus:border-brand-green"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={tv.subtitle || ''}
                      onChange={(e) => updateTvSetting(tv.id, 'subtitle', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-green focus:border-brand-green"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-medium text-gray-700">Display Status</span>
                    <button
                      onClick={() => updateTvSetting(tv.id, 'is_active', !tv.is_active)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${tv.is_active ? 'bg-brand-green' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tv.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={saveProduct} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name (UZ) *</label>
                    <input
                      required
                      type="text"
                      value={formData.name_uz}
                      onChange={(e) => setFormData({...formData, name_uz: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (UZS) *</label>
                    <input
                      required
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target TV *</label>
                    <select
                      value={formData.tv_number}
                      onChange={(e) => setFormData({...formData, tv_number: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-green focus:outline-none"
                    >
                      <option value={1}>TV-1</option>
                      <option value={2}>TV-2</option>
                      <option value={3}>TV-3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({...formData, sort_order: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-green focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl relative overflow-hidden group">
                      {formData.image_url ? (
                        <div className="absolute inset-0 w-full h-full">
                          <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-medium">Change Image</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 text-center">
                          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <span className="relative cursor-pointer bg-white rounded-md font-medium text-brand-green hover:text-brand-green/80 focus-within:outline-none">
                              <span>Upload a file</span>
                            </span>
                          </div>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        disabled={uploadingImage}
                      />
                    </div>
                    {uploadingImage && <p className="text-sm text-brand-green mt-2 flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Uploading...</p>}
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="w-5 h-5 text-brand-green focus:ring-brand-green rounded border-gray-300"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-900 cursor-pointer">
                      Product is Active
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-brand-green rounded-xl hover:bg-brand-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
