import { useState, useEffect } from 'react';
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
  Mail,
  CheckCircle2,
  XCircle,
  Filter,
  Hourglass,
} from 'lucide-react';

interface ReservationItem {
  id: string;
  reservationTime: string;
  guestCount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  table: { tableNumber: number; floor: number; capacity: number };
  user: { id: string; name: string; email: string; phone: string | null };
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Hourglass }> = {
  PENDING: { label: 'Chờ duyệt', color: 'text-warning-600', bg: 'bg-warning-500/10', icon: Hourglass },
  CONFIRMED: { label: 'Đã xác nhận', color: 'text-success-600', bg: 'bg-success-500/10', icon: CheckCircle2 },
  CANCELLED: { label: 'Đã hủy', color: 'text-danger-500', bg: 'bg-danger-500/10', icon: XCircle },
};

export default function ReservationTracking() {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('ALL');

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

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-900 flex items-center gap-2">
          <CalendarCheck size={24} className="text-primary-500" />
          Quản lý Đặt bàn
        </h1>
        <p className="text-dark-500 text-sm mt-1">Duyệt và theo dõi các yêu cầu đặt bàn từ khách hàng.</p>
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
                  {/* Customer - fixed width */}
                  <div className="w-[180px] shrink-0">
                    <p className="text-xs text-dark-400 mb-1 font-medium">Khách hàng</p>
                    <p className="font-semibold text-dark-800 text-sm">{r.user.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Mail size={11} className="text-dark-300 shrink-0" />
                      <span className="text-xs text-dark-400 truncate">{r.user.email}</span>
                    </div>
                    {r.user.phone && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Phone size={11} className="text-dark-300 shrink-0" />
                        <span className="text-xs text-dark-400">{r.user.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Time - fixed width */}
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

                  {/* Table - fixed width */}
                  <div className="w-[120px] shrink-0">
                    <p className="text-xs text-dark-400 mb-1 font-medium">Bàn</p>
                    <div className="flex items-center gap-1">
                      <Hash size={13} className="text-dark-400 shrink-0" />
                      <span className="text-sm font-semibold text-dark-800">{r.table.tableNumber}</span>
                      <Layers size={13} className="text-dark-400 ml-2 shrink-0" />
                      <span className="text-xs text-dark-500">Tầng {r.table.floor}</span>
                    </div>
                  </div>

                  {/* Guests - fixed width */}
                  <div className="w-[100px] shrink-0">
                    <p className="text-xs text-dark-400 mb-1 font-medium">Số khách</p>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-primary-500 shrink-0" />
                      <span className="text-sm font-medium text-dark-800">
                        {r.guestCount} / {r.table.capacity} khách
                      </span>
                    </div>
                  </div>

                  {/* Right: status + actions - push to right */}
                  <div className="ml-auto flex flex-col items-end gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${st.bg} ${st.color}`}>
                      <StatusIcon size={13} />
                      {st.label}
                    </span>

                    {r.status === 'PENDING' && (
                      <div className="flex gap-2">
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
                      </div>
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
    </div>
  );
}
