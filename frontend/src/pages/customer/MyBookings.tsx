import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  History,
  Clock,
  Hash,
  Layers,
  Users,
  Hourglass,
  CheckCircle2,
  XCircle,
  CalendarDays,
} from 'lucide-react';

interface ReservationItem {
  id: string;
  reservationTime: string;
  guestCount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  table: { tableNumber: number; floor: number; capacity: number };
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Hourglass }> = {
  PENDING: { label: 'Chờ xác nhận', color: 'text-warning-600', bg: 'bg-warning-500/10', icon: Hourglass },
  CONFIRMED: { label: 'Đã xác nhận', color: 'text-success-600', bg: 'bg-success-500/10', icon: CheckCircle2 },
  CANCELLED: { label: 'Đã hủy', color: 'text-danger-500', bg: 'bg-danger-500/10', icon: XCircle },
};

export default function MyBookings() {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get('/reservations/my');
        setReservations(res.data.data);
      } catch {
        toast.error('Không thể tải lịch sử đặt bàn.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-900 flex items-center gap-2">
          <History size={24} className="text-primary-500" />
          Lịch sử đặt bàn
        </h1>
        <p className="text-dark-500 text-sm mt-1">Xem lại các đơn đặt bàn trước đây của bạn.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dark-100">
          <CalendarDays size={40} className="mx-auto mb-3 opacity-30 text-dark-300" />
          <p className="font-medium text-dark-400">Bạn chưa có đơn đặt bàn nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r, i) => {
            const st = statusConfig[r.status];
            const StatusIcon = st.icon;
            const reservationDate = new Date(r.reservationTime);
            const isPast = reservationDate < new Date();

            return (
              <div
                key={r.id}
                className={`bg-white rounded-2xl border border-dark-100 p-5 shadow-sm transition-all animate-fade-in ${
                  isPast && r.status !== 'CANCELLED' ? 'opacity-60' : ''
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Left: Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                        <Hash size={18} className="text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-dark-800">Bàn {r.table.tableNumber}</h3>
                        <div className="flex items-center gap-2 text-xs text-dark-400">
                          <span className="flex items-center gap-0.5">
                            <Layers size={11} /> Tầng {r.table.floor}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <Users size={11} /> {r.guestCount}/{r.table.capacity} khách
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-dark-500 mt-2">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-primary-400" />
                        <span>{format(reservationDate, 'dd/MM/yyyy', { locale: vi })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-primary-400" />
                        <span>{format(reservationDate, 'HH:mm')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold self-start sm:self-center ${st.bg} ${st.color}`}
                  >
                    <StatusIcon size={14} />
                    {st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Count */}
      {!loading && reservations.length > 0 && (
        <p className="text-xs text-dark-400 mt-4 px-1">
          Tổng cộng {reservations.length} đơn đặt bàn
        </p>
      )}
    </div>
  );
}
