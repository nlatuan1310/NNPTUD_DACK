import { useState, useEffect, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAllIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from '../../services/ingredientService';
import type { Ingredient } from '../../services/ingredientService';

export default function IngredientManager() {
  const { isManager } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Ingredient | null>(null);
  const [form, setForm] = useState({
    name: '',
    unit: '',
    stockQuantity: 0,
    reorderLevel: 0,
  });

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const res = await getAllIngredients();
      setIngredients(res.data);
    } catch {
      toast.error('Không thể tải danh sách nguyên liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', unit: '', stockQuantity: 0, reorderLevel: 0 });
    setShowModal(true);
  };

  const openEdit = (item: Ingredient) => {
    setEditItem(item);
    setForm({
      name: item.name,
      unit: item.unit,
      stockQuantity: item.stockQuantity,
      reorderLevel: item.reorderLevel,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editItem) {
        await updateIngredient(editItem.id, form);
        toast.success('Cập nhật nguyên liệu thành công!');
      } else {
        await createIngredient(form);
        toast.success('Thêm nguyên liệu mới thành công!');
      }
      setShowModal(false);
      fetchIngredients();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Thao tác thất bại.');
    }
  };

  const handleDelete = async (item: Ingredient) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa "${item.name}"?`)) return;
    try {
      await deleteIngredient(item.id);
      toast.success(`Đã xóa "${item.name}".`);
      fetchIngredients();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Xóa thất bại.');
    }
  };

  const filteredIngredients = ingredients.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 flex items-center gap-2">
            <Package size={24} className="text-warning-500" />
            Kho Nguyên Liệu
          </h1>
          <p className="text-dark-500 text-sm mt-1">Quản lý tồn kho vật lý và cảnh báo số lượng.</p>
        </div>
        {isManager && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-warning-500 to-warning-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-warning-500/25 hover:shadow-warning-600/35 transition-all cursor-pointer"
          >
            <Plus size={18} />
            Thêm nguyên liệu
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Tìm theo tên nguyên liệu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-dark-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredIngredients.length === 0 ? (
          <div className="text-center py-20 text-dark-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Không tìm thấy nguyên liệu nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-dark-50 border-b border-dark-100">
                  <th className="text-left font-semibold text-dark-600 px-5 py-3">Tên Nguyên Liệu</th>
                  <th className="text-left font-semibold text-dark-600 px-5 py-3">Đơn Vị</th>
                  <th className="text-left font-semibold text-dark-600 px-5 py-3">Hiện Có</th>
                  <th className="text-left font-semibold text-dark-600 px-5 py-3">Cảnh Báo Dưới</th>
                  <th className="text-left font-semibold text-dark-600 px-5 py-3">Trạng Thái</th>
                  {isManager && (
                    <th className="text-right font-semibold text-dark-600 px-5 py-3">Thao tác</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {filteredIngredients.map((item, i) => {
                  const isLowStock = item.stockQuantity <= item.reorderLevel;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-primary-50/40 transition-colors"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <td className="px-5 py-3.5 font-medium text-dark-800">{item.name}</td>
                      <td className="px-5 py-3.5 text-dark-500">{item.unit}</td>
                      <td className="px-5 py-3.5 text-dark-800 font-semibold">{item.stockQuantity}</td>
                      <td className="px-5 py-3.5 text-dark-400">{item.reorderLevel}</td>
                      <td className="px-5 py-3.5">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-danger-50 text-danger-600">
                            <AlertTriangle size={13} />
                            Sắp hết
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-success-50 text-success-600">
                            <CheckCircle2 size={13} />
                            Bình thường
                          </span>
                        )}
                      </td>
                      {isManager && (
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(item)}
                              className="p-2 rounded-lg text-dark-400 hover:bg-warning-100 hover:text-warning-600 transition-colors cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-2 rounded-lg text-dark-400 hover:bg-danger-500/10 hover:text-danger-500 transition-colors cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-dark-400 mt-3 px-1">
        Hiển thị {filteredIngredients.length} / {ingredients.length} nguyên liệu
      </p>

      {/* Modal Form */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-lg p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 shrink-0">
              <h3 className="text-lg font-bold text-dark-900">
                {editItem ? 'Cập nhật Nguyên Liệu' : 'Thêm Nguyên Liệu Mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Tên Nguyên Liệu *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="VD: Cà chua, Thịt bò..."
                  className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Đơn Vị Tính *</label>
                <input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  required
                  placeholder="VD: kg, lít, hộp, con..."
                  className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-dark-700 mb-2">Số lượng hiện có</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
                    required
                    className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-dark-700 mb-2">Mức báo sắp hết</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.reorderLevel}
                    onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })}
                    required
                    className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warning-500/30 focus:border-warning-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-dark-200 rounded-xl text-sm font-medium text-dark-600 hover:bg-dark-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-warning-500 to-warning-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-warning-500/25 hover:shadow-warning-600/35 transition-all cursor-pointer"
                >
                  {editItem ? 'Lưu thay đổi' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
