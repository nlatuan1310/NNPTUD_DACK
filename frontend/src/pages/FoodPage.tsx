import React, { useState, useEffect } from 'react';
import { foodService, categoryService } from '../services/api';
import { Trash2, Edit2, Plus, Info } from 'lucide-react';

const FoodPage = () => {
  const [foods, setFoods] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    categoryId: '',
    status: true
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [foodRes, catRes] = await Promise.all([
        foodService.getAll(),
        categoryService.getAll()
      ]);
      setFoods(foodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      alert('Lỗi tải dữ liệu');
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', price: '', imageUrl: '', categoryId: '', status: true });
    setIsModalOpen(true);
  };

  const handleEdit = (food: any) => {
    setEditingId(food.id);
    setFormData({
      name: food.name,
      description: food.description || '',
      price: food.price.toString(),
      imageUrl: food.imageUrl || '',
      categoryId: food.categoryId,
      status: food.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await foodService.update(editingId, formData);
      } else {
        await foodService.create(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Lỗi khi lưu món ăn');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Xóa món ăn này?')) {
      try {
        await foodService.delete(id);
        fetchData();
      } catch (err) {
        alert('Lỗi khi xóa món ăn. Có thể món ăn đang có trong đơn hàng.');
      }
    }
  };

  return (
    <div className="p-6 text-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Thực đơn nhà hàng</h1>
        <button
          onClick={handleOpenAdd}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus size={20} /> Thêm món mới
        </button>
      </div>

      {/* Grid Danh sách Món ăn */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {foods.map((food) => (
          <div key={food.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 flex flex-col shadow-lg transition-transform hover:scale-105 hover:bg-gray-750">
            {/* Ảnh món ăn */}
            <div className="h-48 bg-gray-900 border-b border-gray-700 relative overflow-hidden">
              {food.imageUrl ? (
                <img src={food.imageUrl} alt={food.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">No Image</div>
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => handleEdit(food)}
                  className="bg-white/10 backdrop-blur-md p-2 rounded-full hover:bg-white/20 transition-all text-yellow-400 border border-yellow-800/30"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              <div className="absolute top-2 left-2 pointer-events-none">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase ${food.status ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'} ring-1 ring-white/20`}>
                  {food.status ? 'Đang bán' : 'Ngừng bán'}
                </span>
              </div>
            </div>

            {/* Nội dung Details */}
            <div className="p-5 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold truncate pr-3" title={food.name}>{food.name}</h3>
                <span className="text-emerald-400 font-black text-lg whitespace-nowrap">
                  {Number(food.price).toLocaleString()} ₫
                </span>
              </div>

              <div className="mb-3">
                <span className="bg-gray-700 text-gray-300 text-[11px] px-2.5 py-1 rounded-full border border-gray-600 font-medium tracking-wide">
                  {food.category?.name}
                </span>
              </div>

              <p className="text-gray-400 text-sm mb-5 leading-relaxed line-clamp-2 italic" title={food.description}>
                {food.description || 'Không có mô tả chi tiết...'}
              </p>

              <div className="mt-auto pt-4 border-t border-gray-700/50 flex gap-3">
                <button
                  onClick={() => handleDelete(food.id)}
                  className="flex-1 border border-red-500/30 hover:border-red-500 text-red-400 hover:bg-red-500 hover:text-white py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={16} /> Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {foods.length === 0 && (
        <div className="bg-gray-800/20 border-2 border-dashed border-gray-700/50 rounded-2xl py-20 flex flex-col items-center justify-center opacity-50">
          <div className="bg-gray-800 p-4 rounded-full mb-4">
            <Plus size={48} className="text-gray-600" />
          </div>
          <p className="text-gray-400 text-lg">Chưa có món ăn nào trong thực đơn</p>
          <p className="text-gray-500 text-sm mt-1">Hãy bắt đầu bằng cách nhấn nút 'Thêm món mới' ở góc trên</p>
        </div>
      )}

      {/* Modal Thêm/Sửa Món ăn */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700/50 rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              {editingId ? <Edit2 className="text-yellow-500" /> : <Plus className="text-green-500" />}
              {editingId ? 'Sửa món ăn' : 'Thêm món mới vào thực đơn'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tên món ăn <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phở bò đặc biệt"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Danh mục <span className="text-red-500">*</span></label>
                  <select
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn một --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Giá bán (VNĐ) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Link ảnh (imageUrl)</label>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1 cursor-help group relative">
                    <Info size={10} /> Dùng URL ảnh trên mạng
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-sm placeholder:text-gray-600"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Mô tả món ăn</label>
                <textarea
                  placeholder="Thành phần, hương vị đặc trưng..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all h-24 resize-none placeholder:text-gray-600"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div className="flex items-center gap-4 py-2 ml-1">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                    />
                    <div className={`w-10 h-5 rounded-full shadow-inner transition-colors ${formData.status ? 'bg-green-600' : 'bg-gray-700'}`}></div>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.status ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                  <span className="ml-3 text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Cho phép bán ngay</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-700/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={`flex-1 font-bold py-3 rounded-xl text-white transition-all shadow-lg ${editingId ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                >
                  {editingId ? 'Cập nhật món' : 'Tạo món ăn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodPage;
