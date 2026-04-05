import { useState, useEffect, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Shield,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'CUSTOMER' | 'STAFF' | 'MANAGER';
}

const roleBadge: Record<string, { label: string; classes: string; icon: typeof Shield }> = {
  MANAGER: { label: 'Quản lý', classes: 'bg-primary-100 text-primary-700', icon: ShieldCheck },
  STAFF: { label: 'Nhân viên', classes: 'bg-info-500/10 text-info-600', icon: Shield },
  CUSTOMER: { label: 'Khách hàng', classes: 'bg-success-500/10 text-success-600', icon: UserCircle },
};

export default function UserList() {
  const { isManager } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'STAFF' });

  const fetchUsers = async () => {
    try {
      const params: Record<string, string> = {};
      if (filterRole) params.role = filterRole;
      const res = await apiClient.get('/users', { params });
      setUsers(res.data.data);
    } catch {
      toast.error('Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', phone: '', role: 'STAFF' });
    setShowModal(true);
  };

  const openEdit = (u: UserItem) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', phone: u.phone || '', role: u.role });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editUser) {
        await apiClient.put(`/users/${editUser.id}`, {
          name: form.name,
          phone: form.phone || null,
          role: form.role,
        });
        toast.success('Cập nhật thành công!');
      } else {
        await apiClient.post('/users', form);
        toast.success('Tạo người dùng thành công!');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Thao tác thất bại.');
    }
  };

  const handleDelete = async (u: UserItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa "${u.name}"?`)) return;
    try {
      await apiClient.delete(`/users/${u.id}`);
      toast.success(`Đã xóa ${u.name}.`);
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Xóa thất bại.');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 flex items-center gap-2">
            <Users size={24} className="text-primary-500" />
            Quản lý Nhân sự
          </h1>
          <p className="text-dark-500 text-sm mt-1">Quản lý tài khoản nhân viên và khách hàng.</p>
        </div>
        {isManager && (
          <button
            id="btn-create-user"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-primary-600/35 transition-all cursor-pointer"
          >
            <Plus size={18} />
            Thêm người dùng
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
        </div>
        {isManager && (
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2.5 bg-white border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
          >
            <option value="">Tất cả vai trò</option>
            <option value="CUSTOMER">Khách hàng</option>
            <option value="STAFF">Nhân viên</option>
            <option value="MANAGER">Quản lý</option>
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-dark-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-dark-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Không tìm thấy người dùng nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-dark-50 border-b border-dark-100">
                  <th className="text-left font-semibold text-dark-600 px-5 py-3">Tên</th>
                  <th className="text-left font-semibold text-dark-600 px-5 py-3">Email</th>
                  <th className="text-left font-semibold text-dark-600 px-5 py-3">SĐT</th>
                  <th className="text-left font-semibold text-dark-600 px-5 py-3">Vai trò</th>
                  {isManager && (
                    <th className="text-right font-semibold text-dark-600 px-5 py-3">Thao tác</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {filteredUsers.map((u, i) => {
                  const badge = roleBadge[u.role];
                  const BadgeIcon = badge.icon;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-primary-50/40 transition-colors"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-dark-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-dark-500">{u.email}</td>
                      <td className="px-5 py-3.5 text-dark-500">{u.phone || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${badge.classes}`}>
                          <BadgeIcon size={13} />
                          {badge.label}
                        </span>
                      </td>
                      {isManager && (
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(u)}
                              className="p-2 rounded-lg text-dark-400 hover:bg-primary-100 hover:text-primary-600 transition-colors cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(u)}
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

      {/* Count */}
      <p className="text-xs text-dark-400 mt-3 px-1">
        Hiển thị {filteredUsers.length} / {users.length} người dùng
      </p>

      {/* Modal - rendered via portal to break out of stacking contexts */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-lg p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 shrink-0">
              <h3 className="text-lg font-bold text-dark-900">
                {editUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
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
                <label className="block text-sm font-medium text-dark-700 mb-2">Tên *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                />
              </div>
              {!editUser && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Mật khẩu *</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Số điện thoại</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Vai trò *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
                >
                  <option value="CUSTOMER">Khách hàng</option>
                  <option value="STAFF">Nhân viên</option>
                  <option value="MANAGER">Quản lý</option>
                </select>
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
                  className="flex-1 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-600/35 transition-all cursor-pointer"
                >
                  {editUser ? 'Lưu thay đổi' : 'Tạo mới'}
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
