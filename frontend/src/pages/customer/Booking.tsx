import { useState, type FormEvent } from 'react';
import apiClient from '../../services/apiClient';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  CalendarPlus,
  CalendarDays,
  Clock,
  Users,
  Hash,
  Layers,
  ArrowRight,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

interface TableItem {
  id: string;
  tableNumber: number;
  floor: number;
  capacity: number;
  status: string;
}

export default function Booking() {
  // Step: 1 = chọn ngày giờ & số khách, 2 = chọn bàn, 3 = xác nhận
  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guestCount, setGuestCount] = useState('2');

  const [tables, setTables] = useState<TableItem[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Lấy min date (hôm nay)
  const today = format(new Date(), 'yyyy-MM-dd');

  const handleStep1 = (e: FormEvent) => {
    e.preventDefault();
    if (!date || !time || !guestCount) {
      toast.error('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    const guestNum = parseInt(guestCount);
    if (guestNum < 1) {
      toast.error('Số khách phải lớn hơn 0.');
      return;
    }
    // Kiểm tra thời gian phải ở tương lai
    const dateTime = new Date(`${date}T${time}`);
    if (dateTime <= new Date()) {
      toast.error('Thời gian đặt bàn phải ở tương lai.');
      return;
    }
    setStep(2);
    fetchTables();
  };

  const fetchTables = async () => {
    setLoadingTables(true);
    try {
      const res = await apiClient.get('/tables', { params: { status: 'AVAILABLE' } });
      // Lọc bàn có sức chứa phù hợp
      const guestNum = parseInt(guestCount);
      const suitable = res.data.data.filter((t: TableItem) => t.capacity >= guestNum);
      setTables(suitable);
    } catch {
      toast.error('Không thể tải danh sách bàn.');
    } finally {
      setLoadingTables(false);
    }
  };

  const handleSelectTable = (t: TableItem) => {
    setSelectedTable(t);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedTable) return;
    setSubmitting(true);
    try {
      const reservationTime = new Date(`${date}T${time}`).toISOString();
      await apiClient.post('/reservations', {
        tableId: selectedTable.id,
        reservationTime,
        guestCount: parseInt(guestCount),
      });
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Đặt bàn thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(1);
    setDate('');
    setTime('');
    setGuestCount('2');
    setSelectedTable(null);
    setSuccess(false);
  };

  // Success screen
  if (success) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center animate-scale-in">
        <div className="w-20 h-20 rounded-full bg-success-500/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-success-500" />
        </div>
        <h2 className="text-2xl font-bold text-dark-900 mb-2">Đặt bàn thành công!</h2>
        <p className="text-dark-500 mb-2">
          Bàn <strong>{selectedTable?.tableNumber}</strong> – Tầng {selectedTable?.floor}
        </p>
        <p className="text-dark-500 mb-1">
          {format(new Date(`${date}T${time}`), 'HH:mm – EEEE, dd/MM/yyyy')}
        </p>
        <p className="text-dark-500 mb-8">{guestCount} khách</p>
        <p className="text-sm text-dark-400 mb-6">
          Đơn đặt bàn của bạn đang ở trạng thái <strong className="text-warning-600">Chờ duyệt</strong>.
          Nhà hàng sẽ xác nhận trong thời gian sớm nhất.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-600/35 transition-all cursor-pointer"
        >
          Đặt bàn mới
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-900 flex items-center gap-2">
          <CalendarPlus size={24} className="text-primary-500" />
          Đặt bàn
        </h1>
        <p className="text-dark-500 text-sm mt-1">Chọn thời gian và bàn phù hợp cho bữa ăn của bạn.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { num: 1, label: 'Thông tin' },
          { num: 2, label: 'Chọn bàn' },
          { num: 3, label: 'Xác nhận' },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-3 flex-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all shrink-0 ${
                step >= s.num
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-dark-100 text-dark-400'
              }`}
            >
              {s.num}
            </div>
            <span
              className={`text-sm font-medium hidden sm:inline ${
                step >= s.num ? 'text-dark-800' : 'text-dark-400'
              }`}
            >
              {s.label}
            </span>
            {i < 2 && (
              <div
                className={`flex-1 h-px ${
                  step > s.num ? 'bg-primary-500' : 'bg-dark-200'
                } transition-colors`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Chọn ngày giờ */}
      {step === 1 && (
        <form
          onSubmit={handleStep1}
          className="bg-white rounded-2xl border border-dark-100 p-6 shadow-sm space-y-5 animate-fade-in"
        >
          <h2 className="text-lg font-bold text-dark-800 mb-1">Chọn thời gian</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">
                <CalendarDays size={14} className="inline mr-1" />
                Ngày
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={today}
                required
                className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">
                <Clock size={14} className="inline mr-1" />
                Giờ
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all cursor-pointer"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">
              <Users size={14} className="inline mr-1" />
              Số khách
            </label>
            <input
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              min={1}
              max={50}
              required
              className="w-full px-4 py-2.5 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-600/35 transition-all text-sm cursor-pointer"
          >
            Xem bàn trống
            <ArrowRight size={16} />
          </button>
        </form>
      )}

      {/* Step 2: Chọn bàn */}
      {step === 2 && (
        <div className="animate-fade-in">
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1 text-sm text-dark-500 hover:text-dark-700 mb-4 transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} />
            Quay lại
          </button>

          <div className="bg-white rounded-2xl border border-dark-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-dark-800 mb-1">Chọn bàn phù hợp</h2>
            <p className="text-sm text-dark-400 mb-5">
              {format(new Date(`${date}T${time}`), 'HH:mm – dd/MM/yyyy')} · {guestCount} khách
            </p>

            {loadingTables ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tables.length === 0 ? (
              <div className="text-center py-12 text-dark-400">
                <Hash size={36} className="mx-auto mb-2 opacity-30" />
                <p className="font-medium">Không tìm thấy bàn phù hợp.</p>
                <p className="text-xs mt-1">Thử giảm số khách hoặc chọn thời gian khác.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tables.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTable(t)}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-dark-100 hover:border-primary-500 hover:bg-primary-50/50 transition-all text-left cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-success-500/10 flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
                      <Hash size={20} className="text-success-600 group-hover:text-primary-500 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-dark-800">Bàn {t.tableNumber}</p>
                      <div className="flex items-center gap-3 text-xs text-dark-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Layers size={11} /> Tầng {t.floor}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {t.capacity} khách
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-dark-300 group-hover:text-primary-500 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Xác nhận */}
      {step === 3 && selectedTable && (
        <div className="animate-fade-in">
          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-1 text-sm text-dark-500 hover:text-dark-700 mb-4 transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} />
            Chọn bàn khác
          </button>

          <div className="bg-white rounded-2xl border border-dark-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-dark-800 mb-5">Xác nhận đặt bàn</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b border-dark-50">
                <span className="text-sm text-dark-500">Bàn</span>
                <span className="text-sm font-semibold text-dark-800">
                  Bàn {selectedTable.tableNumber} – Tầng {selectedTable.floor}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-dark-50">
                <span className="text-sm text-dark-500">Sức chứa</span>
                <span className="text-sm font-semibold text-dark-800">{selectedTable.capacity} khách</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dark-50">
                <span className="text-sm text-dark-500">Ngày</span>
                <span className="text-sm font-semibold text-dark-800">
                  {format(new Date(`${date}T${time}`), 'EEEE, dd/MM/yyyy')}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-dark-50">
                <span className="text-sm text-dark-500">Giờ</span>
                <span className="text-sm font-semibold text-dark-800">{time}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-dark-500">Số khách</span>
                <span className="text-sm font-semibold text-dark-800">{guestCount} khách</span>
              </div>
            </div>

            <div className="bg-primary-50 rounded-xl p-4 mb-6 text-sm text-primary-800">
              <strong>Lưu ý:</strong> Mỗi lượt đặt bàn giữ chỗ trong vòng 2 tiếng. Đơn đặt sẽ cần
              được nhà hàng xác nhận trước khi có hiệu lực.
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-600/35 transition-all disabled:opacity-50 text-sm cursor-pointer"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Xác nhận đặt bàn
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
