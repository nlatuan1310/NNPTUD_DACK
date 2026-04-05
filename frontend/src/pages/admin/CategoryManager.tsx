import { useState, useEffect } from 'react';
import { Layers, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoryService, type Category } from '../../services/categoryService';

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({ name: '', description: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getAll();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode: 'CREATE' | 'EDIT', category?: Category) => {
    setModalMode(mode);
    if (mode === 'EDIT' && category) {
      setCurrentCategory({ ...category });
    } else {
      setCurrentCategory({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentCategory({ name: '', description: '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'CREATE') {
        const res = await categoryService.create(currentCategory);
        if (res.success) {
          toast.success('Thêm danh mục thành công');
        }
      } else {
        if (!currentCategory.id) return;
        const res = await categoryService.update(currentCategory.id, currentCategory);
        if (res.success) {
          toast.success('Cập nhật danh mục thành công');
        }
      }
      handleCloseModal();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi lưu thông tin');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"?`)) {
      try {
        const res = await categoryService.delete(id);
        if (res.success) {
          toast.success('Xóa thành công');
          fetchCategories();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Không thể xóa danh mục này');
      }
    }
  };

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 flex items-center gap-2">
            <Layers className="text-primary-500" />
            Quản lý Danh mục
          </h1>
          <p className="text-dark-500 text-sm mt-1">Quản lý các loại món ăn (Main, Drink, Dessert...)</p>
        </div>
        <button
          onClick={() => handleOpenModal('CREATE')}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={20} />
          Thêm danh mục mới
        </button>
      </div>

      <div className="bg-white border border-dark-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-dark-50 text-dark-500 text-sm border-b border-dark-100">
              <th className="font-medium py-4 px-6">Tên danh mục</th>
              <th className="font-medium py-4 px-6 w-1/2">Mô tả</th>
              <th className="font-medium py-4 px-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-100 text-sm">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-dark-400">Chưa có danh mục nào.</td>
              </tr>
            ) : (
              categories.map(cat => (
                <tr key={cat.id} className="hover:bg-dark-50/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-dark-900">{cat.name}</td>
                  <td className="py-4 px-6 text-dark-500">{cat.description || '-'}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal('EDIT', cat)}
                        className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer"
                        title="Sửa"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-dark-100">
              <h2 className="text-xl font-bold text-dark-900">
                {modalMode === 'CREATE' ? 'Thêm Danh mục mới' : 'Chỉnh sửa Danh mục'}
              </h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Tên danh mục <span className="text-danger-500">*</span></label>
                <input
                  type="text"
                  required
                  value={currentCategory.name}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="VD: Món chính, Đồ uống..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Mô tả</label>
                <textarea
                  value={currentCategory.description || ''}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all min-h-[100px]"
                  placeholder="Mô tả danh mục..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-dark-100 text-dark-700 font-medium rounded-xl hover:bg-dark-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30"
                >
                  {modalMode === 'CREATE' ? 'Tạo mới' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
