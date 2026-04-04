import React, { useState, useEffect } from 'react';
import { ingredientService } from '../services/api';
import { Trash2, Edit2, Plus, AlertTriangle, Package } from 'lucide-react';

const IngredientPage = () => {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    stockQuantity: '',
    reorderLevel: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const res = await ingredientService.getAll();
      setIngredients(res.data);
    } catch (err) {
      alert('Lỗi tải nguyên liệu');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await ingredientService.update(editingId, formData);
        setEditingId(null);
      } else {
        await ingredientService.create(formData);
      }
      setFormData({ name: '', unit: '', stockQuantity: '', reorderLevel: '' });
      fetchIngredients();
    } catch (err) {
      alert('Lỗi khi lưu dữ liệu');
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      unit: item.unit,
      stockQuantity: item.stockQuantity.toString(),
      reorderLevel: item.reorderLevel.toString()
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Xóa nguyên liệu này?')) {
      try {
        await ingredientService.delete(id);
        fetchIngredients();
      } catch (err) {
        alert('Lỗi khi xóa nguyên liệu');
      }
    }
  };
  return (
    <div className="p-6 text-white bg-gray-900/50 min-h-screen">
      <h1 className="text-2xl font-bold mb-8 flex items-center gap-3">
        <Package className="text-orange-500" /> Quản lý kho nguyên liệu
      </h1>

      {/* Form Section */}
      <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl mb-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Plus size={120} />
        </div>
        <h2 className="text-lg font-bold mb-4 text-gray-300">{editingId ? '🔴 Đang chỉnh sửa' : '🟢 Thêm nguyên liệu mới'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Tên nguyên liệu</label>
            <input
              className="bg-gray-900 border border-gray-700 rounded-xl p-2.5 focus:ring-2 focus:ring-orange-500/50 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Hành lá, Thịt bò..."
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Đơn vị</label>
            <input
              className="bg-gray-900 border border-gray-700 rounded-xl p-2.5 focus:ring-2 focus:ring-orange-500/50 outline-none"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="Kg, Bó, Gram..."
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Số lượng hiện tại</label>
            <input
              type="number"
              className="bg-gray-900 border border-gray-700 rounded-xl p-2.5 focus:ring-2 focus:ring-orange-500/50 outline-none"
              value={formData.stockQuantity}
              onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
              placeholder="0.0"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Mức cảnh báo hết</label>
            <input
              type="number"
              className="bg-gray-900 border border-gray-700 rounded-xl p-2.5 focus:ring-2 focus:ring-orange-500/50 outline-none"
              value={formData.reorderLevel}
              onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
              placeholder="Nếu <= mức này sẽ báo đỏ"
              required
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className={`flex-1 ${editingId ? 'bg-orange-600' : 'bg-blue-600'} hover:opacity-90 py-2.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2`}>
              {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
              {editingId ? 'Lưu' : 'Thêm'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setFormData({ name: '', unit: '', stockQuantity: '', reorderLevel: '' }); }}
                className="bg-gray-700 px-4 py-2.5 rounded-xl"
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-700/50 border-b border-gray-700">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Nguyên liệu</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Đơn vị</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Tồn kho</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Trạng thái</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {ingredients.map((item) => (
              <tr key={item.id} className={`hover:bg-gray-700/30 transition-colors ${item.lowStock ? 'bg-red-500/5' : ''}`}>
                <td className="p-4 font-semibold">{item.name}</td>
                <td className="p-4 text-center text-gray-400">{item.unit}</td>
                <td className="p-4 text-center font-mono">
                  <span className={`text-lg ${item.lowStock ? 'text-red-500 font-bold' : 'text-emerald-400 font-bold'}`}>
                    {item.stockQuantity}
                  </span>
                </td>
                <td className="p-4 text-center">
                  {item.lowStock ? (
                    <span className="flex items-center justify-center gap-1.5 text-red-500 bg-red-500/10 px-3 py-1 rounded-full text-xs font-black animate-pulse border border-red-500/20">
                      <AlertTriangle size={12} /> CẦN NHẬP THÊM
                    </span>
                  ) : (
                    <span className="text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20 uppercase tracking-tighter">
                      Đầy đủ
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-all">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {ingredients.length === 0 && (
              <tr>
                <td colSpan={5} className="p-20 text-center opacity-30 italic">Danh sách kho trống...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IngredientPage;
