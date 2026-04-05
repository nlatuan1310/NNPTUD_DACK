import { useState, useEffect, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  CalendarCheck,
  Clock,
  Users,
  Hash,
  Layers,
  Phone,
  CheckCircle2,
  XCircle,
  Filter,
  Hourglass,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

interface ReservationItem {
  id: string;
  reservationTime: string;
  guestCount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  table: { tableNumber: number; floor: number; capacity: number };
  customerName: string;
  customerPhone: string;
}

interface TableItem {
  id: string;
  tableNumber: number;
  floor: number;
  capacity: number;
  status: string;
}


const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Hourglass }> = {
  PENDING: { label: 'Chờ duyệt', color: 'text-warning-600', bg: 'bg-warning-500/10', icon: Hourglass },
  CONFIRMED: { label: 'Đã xác nhận', color: 'text-success-600', bg: 'bg-success-500/10', icon: CheckCircle2 },
  CANCELLED: { label: 'Đã hủy', color: 'text-danger-500', bg: 'bg-danger-500/10', icon: XCircle },
};

export default function ReservationTracking() {
  const { isManager } = useAuth();
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('ALL');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editReservation, setEditReservation] = useState<ReservationItem | null>(null);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [form, setForm] = useState({
    tableId: '',
    reservationDate: '',
    reservationTime: '',
    guestCount: '',
    customerName: '',
    customerPhone: '',
  });

  const fetchReservations = async () => {
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      if (filterDate) params.date = filterDate;
      const res = await apiClient.get('/reservations', { params });
      setReservations(res.data.data);
    } catch {
      toast.error('Không thể tải danh sách đặt bàn.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await apiClient.get('/tables');
      setTables(res.data.data);
    } catch {
      // silent
    }
  };



  useEffect(() => {
    fetchReservations();
  }, [filterStatus, filterDate]);

  const handleUpdateStatus = async (id: string, newStatus: 'CONFIRMED' | 'CANCELLED') => {
    try {
      await apiClient.put(`/reservations/${id}/status`, { status: newStatus });
      toast.success(
        newStatus === 'CONFIRMED' ? 'Đã xác nhận đặt bàn!' : 'Đã hủy đặt bàn.'
      );
      fetchReservations();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Cập nhật thất bại.');
    }
  };

  const handleDelete = async (r: ReservationItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa đơn đặt bàn ${r.table.tableNumber} của khách ${r.customerName}?`)) return;
    try {
      await apiClient.delete(`/reservations/${r.id}`);
      toast.success('Đã xóa đơn đặt bàn.');
      fetchReservations();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Không thể xóa.');
    }
  };

  // Modal handlers
  const openCreate = () => {
    setEditReservation(null);
    setForm({ tableId: '', reservationDate: '', reservationTime: '', guestCount: '', customerName: '', customerPhone: '' });
    fetchTables();
    setShowModal(true);
  };

  const openEdit = (r: ReservationItem) => {
    setEditReservation(r);
    const dt = new Date(r.reservationTime);
    setForm({
      tableId: '',
      reservationDate: format(dt, 'yyyy-MM-dd'),
      reservationTime: format(dt, 'HH:mm'),
      guestCount: String(r.guestCount),
      customerName: r.customerName,
      customerPhone: r.customerPhone,
    });
    fetchTables();
    setShowModal(true);
  };

  // Resolve tableId for edit after tables load
  useEffect(() => {
    if (editReservation && tables.length > 0) {
      const matched = tables.find(
        (t) => t.tableNumber === editReservation.table.tableNumber && t.floor === editReservation.table.floor
      );
      if (matched) {
        setForm((prev) => ({ ...prev, tableId: matched.id }));
      }
    }
  }, [editReservation, tables]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const reservationDateTime = new Date(`${form.reservationDate}T${form.reservationTime}:00`);

      if (editReservation) {
        // UPDATE
        await apiClient.put(`/reservations/${editReservation.id}`, {
          tableId: form.tableId,
          reservationTime: reservationDateTime.toISOString(),
          guestCount: parseInt(form.guestCount),
        });
        toast.success('Cập nhật đặt bàn thành công!');
      } else {
        // CREATE
        const payload: Record<string, unknown> = {
          tableId: form.tableId,
          reservationTime: reservationDateTime.toISOString(),
          guestCount: parseInt(form.guestCount),
          customerName: form.customerName,
          customerPhone: form.customerPhone,
        };

        await apiClient.post('/reservations', payload);
        toast.success('Tạo đặt bàn thành công!');
      }
      setShowModal(false);
      fetchReservations();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Thao tác thất bại.');
    }
  };

  // Tab filtering
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setFilterStatus(tab === 'ALL' ? '' : tab);
  };

  const displayedReservations = reservations;

  const tabs = [
    { key: 'ALL' as const, label: 'Tất cả', count: reservations.length },
    { key: 'PENDING' as const, label: 'Chờ duyệt', count: reservations.filter((r) => r.status === 'PENDING').length },
    { key: 'CONFIRMED' as const, label: 'Đã duyệt', count: reservations.filter((r) => r.status === 'CONFIRMED').length },
    { key: 'CANCELLED' as const, label: 'Đã hủy', count: reservations.filter((r) => r.status === 'CANCELLED').length },
  ];

  // Selected table info for capacity hint
  const selectedTable = tables.find((t) => t.id === form.tableId);



  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 flex items-center gap-2">
            <CalendarCheck size={24} className="text-primary-500" />
            Quản lý Đặt bàn
          </h1>
          <p className="text-dark-500 text-sm mt-1">
            {isManager ? 'Quản lý, duyệt và theo dõi các yêu cầu đặt bàn.' : 'Xem danh sách các yêu cầu đặt bàn từ khách hàng.'}
          </p>
        </div>
        {isManager && (
          <button
            id="btn-create-reservation"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary-500/25 hover:shadow-primary-600/35 transition-all cursor-pointer"
          >
            <Plus size={18} />
            Tạo đặt bàn
          </button>
        )}
      </div>

      {/* Tabs + Date filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-dark-100 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-dark-500 hover:bg-dark-50'
              }`}
            >
              {tab.label}
              {activeTab !== tab.key && tab.key !== 'ALL' && (
                <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-dark-400" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 bg-white border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="text-xs text-dark-400 hover:text-dark-600 cursor-pointer"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayedReservations.length === 0 ? (
        <div className="text-center py-20 text-dark-400 bg-white rounded-2xl border border-dark-100">
          <CalendarCheck size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Không có đơn đặt bàn nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedReservations.map((r, i) => {
            const st = statusConfig[r.status];
            const StatusIcon = st.icon;
            const reservationDate = new Date(r.reservationTime);
            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-dark-100 p-5 shadow-sm hover:shadow-md transition-all animate-fade-in overflow-x-auto"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start gap-6 min-w-[700px]">
                  {/* Customer */}
                  <div className="w-[180px] shrink-0">
                    <p className="text-xs text-dark-400 mb-1 font-medium">Khách hàng</p>
                    <p className="font-semibold text-dark-800 text-sm">{r.customerName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone size={11} className="text-dark-300 shrink-0" />
                      <span className="text-xs text-dark-400">{r.customerPhone}</span>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="w-[160px] shrink-0">
                    <p className="text-xs text-dark-400 mb-1 font-medium">Thời gian</p>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-primary-500 shrink-0" />
                      <span className="text-sm font-medium text-dark-800">
                        {format(reservationDate, 'HH:mm', { locale: vi })}
                      </span>
                    </div>
                    <p className="text-xs text-dark-400 mt-0.5">
                      {format(reservationDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
                    </p>
                  </div>

                  {/* Table */}
                  <div className="w-[120px] shrink-0">
                    <p className="text-xs text-dark-400 mb-1 font-medium">Bàn</p>
                    <div className="flex items-center gap-1">
                      <Hash size={13} className="text-dark-400 shrink-0" />
                      <span className="text-sm font-semibold text-dark-800">{r.table.tableNumber}</span>
                      <Layers size={13} className="text-dark-400 ml-2 shrink-0" />
                      <span className="text-xs text-dark-500">Tầng {r.table.floor}</span>
                    </div>
                  </div>

                  {/* Guests */}
                  <div className="w-[100px] shrink-0">
                    <p className="text-xs text-dark-400 mb-1 font-medium">Số khách</p>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-primary-500 shrink-0" />
                      <span className="text-sm font-medium text-dark-800">
                        {r.guestCount} / {r.table.capacity} khách
                      </span>
                    </div>
                  </div>

                  {/* Status + Actions */}
                  <div className="ml-auto flex flex-col items-end gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${st.bg} ${st.color}`}>
                      <StatusIcon size={13} />
                      {st.label}
                    </span>

                    {isManager && (
                      <div className="flex gap-2 flex-wrap justify-end">
                        {r.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'CONFIRMED')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-success-500 hover:bg-success-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <CheckCircle2 size={13} />
                              Duyệt
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'CANCELLED')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-danger-500 hover:bg-danger-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <XCircle size={13} />
                              Hủy
                            </button>
                          </>
                        )}
                        {r.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'CANCELLED')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-danger-500/30 text-danger-500 hover:bg-danger-500 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                          >
                            <XCircle size={13} />
                            Hủy
                          </button>
                        )}
                        {r.status !== 'CANCELLED' && (
                          <button
                            onClick={() => openEdit(r)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-primary-500/30 text-primary-500 hover:bg-primary-500 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                          >
                            <Pencil size={13} />
                            Sửa
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(r)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-dark-200 text-dark-400 hover:bg-danger-500 hover:text-white hover:border-danger-500 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                        >
                          <Trash2 size={13} />
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-dark-400 mt-4 px-1">
        Hiển thị {displayedReservations.length} đơn đặt bàn
      </p>

      {/* Create/Edit Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-lg p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 shrink-0">
              <h3 className="text-lg font-bold text-dark-900">
                {editReservation ? 'Chỉnh sửa đặt bàn' : 'Tạo đặt bàn mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">

              {!editReservation && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Tên khách hàng *</label>
                    <input
                      type="text"
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      required
                      placeholder="VD: Nguyễn Văn A"
                      className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Số điện thoại *</label>
                    <input
                      type="tel"
                      value={form.customerPhone}
                      onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                      required
                      placeholder="VD: 0912345678"
                      className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Divider between customer and booking section */}
              {!editReservation && (
                <div className="border-t border-dark-100" />
              )}

              {/* ===== BOOKING DETAILS ===== */}

              {/* Table selection */}
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Chọn bàn *</label>
                <select
                  value={form.tableId}
                  onChange={(e) => setForm({ ...form, tableId: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all cursor-pointer"
                >
                  <option value="">-- Chọn bàn --</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Bàn {t.tableNumber} — Tầng {t.floor} — {t.capacity} chỗ
                    </option>
                  ))}
                </select>
                {selectedTable && (
                  <p className="text-xs text-dark-400 mt-1">
                    Sức chứa tối đa: {selectedTable.capacity} khách
                  </p>
                )}
              </div>

              {/* Date + Time row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">Ngày đặt *</label>
                  <input
                    type="date"
                    value={form.reservationDate}
                    onChange={(e) => setForm({ ...form, reservationDate: e.target.value })}
                    required
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">Giờ đặt *</label>
                  <input
                    type="time"
                    value={form.reservationTime}
                    onChange={(e) => setForm({ ...form, reservationTime: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>

              {/* Guest Count */}
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Số khách *</label>
                <input
                  type="number"
                  value={form.guestCount}
                  onChange={(e) => setForm({ ...form, guestCount: e.target.value })}
                  required
                  min={1}
                  max={selectedTable?.capacity || 100}
                  className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                  placeholder="VD: 4"
                />
              </div>

              {/* Actions */}
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
                  {editReservation ? 'Lưu thay đổi' : 'Tạo đặt bàn'}
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
