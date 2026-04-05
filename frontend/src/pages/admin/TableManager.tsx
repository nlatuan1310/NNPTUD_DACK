import { useState, useEffect, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  Plus,
  Pencil,
  Trash2,
  X,
  Filter,
  Hash,
  Users as UsersIcon,
  Layers,
} from 'lucide-react';

interface TableItem {
  id: string;
  tableNumber: number;
  floor: number;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  AVAILABLE: { label: 'Trống', color: 'text-success-600', bg: 'bg-success-500/10 border-success-500/20' },
  OCCUPIED: { label: 'Đang sử dụng', color: 'text-danger-500', bg: 'bg-danger-500/10 border-danger-500/20' },
  RESERVED: { label: 'Đã đặt', color: 'text-warning-600', bg: 'bg-warning-500/10 border-warning-500/20' },
};

export default function TableManager() {
  const { isManager } = useAuth();
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFloor, setFilterFloor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editTable, setEditTable] = useState<TableItem | null>(null);
  const [form, setForm] = useState({ tableNumber: '', floor: '', capacity: '', status: 'AVAILABLE' });

  const fetchTables = async () => {
    try {
      const params: Record<string, string> = {};
      if (filterFloor) params.floor = filterFloor;
      if (filterStatus) params.status = filterStatus;
      const res = await apiClient.get('/tables', { params });
      setTables(res.data.data);
    } catch {
      toast.error('Không thể tải danh sách bàn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [filterFloor, filterStatus]);

  // Lấy danh sách tầng unique
  const floors = [...new Set(tables.map((t) => t.floor))].sort();

  const openCreate = () => {
    setEditTable(null);
    setForm({ tableNumber: '', floor: '', capacity: '', status: 'AVAILABLE' });
    setShowModal(true);
  };

  const openEdit = (t: TableItem) => {
    setEditTable(t);
    setForm({
      tableNumber: String(t.tableNumber),
      floor: String(t.floor),
      capacity: String(t.capacity),
      status: t.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editTable) {
        await apiClient.put(`/tables/${editTable.id}`, {
          tableNumber: parseInt(form.tableNumber),
          floor: parseInt(form.floor),
          capacity: parseInt(form.capacity),
          status: form.status,
        });
        toast.success('Cập nhật bàn thành công!');
      } else {
        await apiClient.post('/tables', {
          tableNumber: parseInt(form.tableNumber),
          floor: parseInt(form.floor),
          capacity: parseInt(form.capacity),
        });
        toast.success('Tạo bàn mới thành công!');
      }
      setShowModal(false);
      fetchTables();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Thao tác thất bại.');
    }
  };

  const handleDelete = async (t: TableItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bàn số ${t.tableNumber}?`)) return;
    try {
      await apiClient.delete(`/tables/${t.id}`);
      toast.success(`Đã xóa bàn số ${t.tableNumber}.`);
      fetchTables();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Không thể xóa bàn.');
    }
  };

  // Thống kê
  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === 'AVAILABLE').length,
    occupied: tables.filter((t) => t.status === 'OCCUPIED').length,
    reserved: tables.filter((t) => t.status === 'RESERVED').length,
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 flex items-center gap-2">
            <LayoutDashboard size={24} className="text-primary-500" />
            Quản lý Bàn ăn
          </h1>
          <p className="text-dark-500 text-sm mt-1">Theo dõi và quản lý trạng thái các bàn.</p>
        </div>
        {isManager && (
          <button
            id="btn-create-table"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-primary-600/35 transition-all cursor-pointer"
          >
            <Plus size={18} />
            Thêm bàn
          </button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng bàn', value: stats.total, color: 'from-dark-700 to-dark-900', textColor: 'text-white' },
          { label: 'Trống', value: stats.available, color: 'from-success-500 to-success-600', textColor: 'text-white' },
          { label: 'Đang dùng', value: stats.occupied, color: 'from-danger-500 to-danger-600', textColor: 'text-white' },
          { label: 'Đã đặt', value: stats.reserved, color: 'from-warning-500 to-warning-600', textColor: 'text-white' },
        ].map((s) => (
          <div
            key={s.label}
            className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 shadow-lg`}
          >
            <p className={`text-sm font-medium ${s.textColor} opacity-80`}>{s.label}</p>
            <p className={`text-3xl font-bold ${s.textColor} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2 text-dark-500 text-sm">
          <Filter size={15} />
          <span>Lọc:</span>
        </div>
        <select
          value={filterFloor}
          onChange={(e) => setFilterFloor(e.target.value)}
          className="px-3 py-2 bg-white border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
        >
          <option value="">Tất cả tầng</option>
          {floors.map((f) => (
            <option key={f} value={f}>Tầng {f}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-white border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="AVAILABLE">Trống</option>
          <option value="OCCUPIED">Đang sử dụng</option>
          <option value="RESERVED">Đã đặt</option>
        </select>
      </div>

      {/* Grid cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-20 text-dark-400 bg-white rounded-2xl border border-dark-100">
          <LayoutDashboard size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Chưa có bàn nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((t, i) => {
            const st = statusConfig[t.status];
            return (
              <div
                key={t.id}
                className={`bg-white rounded-2xl border ${st.bg} p-5 shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${st.bg} flex items-center justify-center`}>
                      <Hash size={22} className={st.color} />
                    </div>
                    <div>
                      <h3 className="font-bold text-dark-900 text-lg">Bàn {t.tableNumber}</h3>
                      <span className={`text-xs font-semibold ${st.color}`}>{st.label}</span>
                    </div>
                  </div>
                  {isManager && (
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded-lg text-dark-300 hover:bg-primary-100 hover:text-primary-600 transition-colors cursor-pointer"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="p-1.5 rounded-lg text-dark-300 hover:bg-danger-500/10 hover:text-danger-500 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-dark-500">
                    <Layers size={14} />
                    <span>Tầng {t.floor}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-dark-500">
                    <UsersIcon size={14} />
                    <span>Sức chứa: {t.capacity} khách</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal rendered via portal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-lg p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 shrink-0">
              <h3 className="text-lg font-bold text-dark-900">
                {editTable ? 'Chỉnh sửa bàn' : 'Thêm bàn mới'}
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
                <label className="block text-sm font-medium text-dark-700 mb-2">Số bàn *</label>
                <input
                  type="number"
                  value={form.tableNumber}
                  onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
                  required
                  min={1}
                  className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  placeholder="VD: 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Tầng *</label>
                <input
                  type="number"
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                  required
                  min={1}
                  className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  placeholder="VD: 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Sức chứa (khách) *</label>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  required
                  min={1}
                  className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  placeholder="VD: 4"
                />
              </div>
              {editTable && (
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
                  >
                    <option value="AVAILABLE">Trống</option>
                    <option value="OCCUPIED">Đang sử dụng</option>
                    <option value="RESERVED">Đã đặt</option>
                  </select>
                </div>
              )}
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
                  className="flex-1 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-600/35 transition-all cursor-pointer"
                >
                  {editTable ? 'Lưu thay đổi' : 'Tạo bàn'}
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
