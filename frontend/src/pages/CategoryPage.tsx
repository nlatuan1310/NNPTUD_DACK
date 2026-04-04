import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import { Trash2, Edit2, Plus } from 'lucide-react';

const CategoryPage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await categoryService.getAll();
      setCategories(res.data);
    } catch (err) {
      alert('Lỗi tải danh mục');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await categoryService.update(editingId, { name, description });
        setEditingId(null);
      } else {
        await categoryService.create({ name, description });
      }
      setName('');
      setDescription('');
      fetchCategories();
    } catch (err) {
      alert('Lỗi khi lưu danh mục');
    }
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa danh mục này?')) {
      try {
        await categoryService.delete(id);
        fetchCategories();
      } catch (err) {
        alert('Lỗi khi xóa. Gợi ý: Danh mục này có thể đang chứa món ăn.');
      }
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Quản lý Danh mục</h1>

      {/* Form Thêm/Sửa */}
      <form onSubmit={handleSubmit} className="bg-gray-800 p-4 rounded-lg mb-8 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{editingId ? 'Sửa' : 'Thêm'} Danh mục</h2>
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Tên danh mục (ví dụ: Món chính)"
            className="bg-gray-700 p-2 rounded flex-1 min-w-[200px] border border-gray-600"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Mô tả"
            className="bg-gray-700 p-2 rounded flex-1 min-w-[200px] border border-gray-600"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2">
            {editingId ? <Edit2 size={18}/> : <Plus size={18}/>}
            {editingId ? 'Cập nhật' : 'Thêm mới'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setName(''); setDescription(''); }}
              className="bg-gray-600 px-4 py-2 rounded"
            >
              Hủy
            </button>
          )}
        </div>
      </form>

      {/* Danh sách Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left bg-gray-800 rounded-lg overflow-hidden">
          <thead className="bg-gray-700 text-gray-300">
            <tr>
              <th className="p-3">Tên</th>
              <th className="p-3">Mô tả</th>
              <th className="p-3">Số món món</th>
              <th className="p-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-t border-gray-700 hover:bg-gray-750">
                <td className="p-3 font-medium">{cat.name}</td>
                <td className="p-3 text-gray-400">{cat.description || 'Không có mô tả'}</td>
                <td className="p-3">
                  <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded text-xs">
                    {cat.foods?.length || 0} món
                  </span>
                </td>
                <td className="p-3 text-right flex justify-end gap-2">
                  <button onClick={() => handleEdit(cat)} className="text-yellow-500 hover:bg-yellow-500/10 p-2 rounded transition">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded transition">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="p-10 text-center text-gray-500 italic">Chưa có danh mục nào. Hãy thêm ở trên!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryPage;
