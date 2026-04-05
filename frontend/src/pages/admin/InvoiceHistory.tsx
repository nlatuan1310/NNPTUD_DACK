import { useState, useEffect } from 'react';
import { FileText, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { invoiceService, type Invoice } from '../../services/invoiceService';

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceService.getAll();
      if (res.success) {
        setInvoices(res.data);
      }
    } catch (error: any) {
      toast.error('Lỗi tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-success-500/10 text-success-600 border-success-500/20';
      case 'REFUNDED': return 'bg-danger-500/10 text-danger-500 border-danger-500/20';
      default: return 'bg-warning-500/10 text-warning-600 border-warning-500/20';
    }
  };

  const handleRefund = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn HOÀN TIỀN cho giao dịch này? Hành động này không thể hoàn tác.')) {
      try {
        const res = await invoiceService.refund(id);
        if (res.success) {
          toast.success('Đã hoàn tiền thành công!');
          fetchInvoices();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Lỗi khi hoàn tiền');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 flex items-center gap-2">
            <FileText className="text-primary-500" />
            Lịch sử Hóa Đơn
          </h1>
          <p className="text-dark-500 text-sm mt-1">Lịch sử thu chi và các hóa đơn đã xuất.</p>
        </div>
      </div>

      <div className="bg-white border border-dark-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-dark-50 text-dark-500 text-sm border-b border-dark-100">
              <th className="font-medium py-4 px-6">Mã HĐ</th>
              <th className="font-medium py-4 px-6">Ngày lập</th>
              <th className="font-medium py-4 px-6">Tổng thanh toán</th>
              <th className="font-medium py-4 px-6">Phương thức</th>
              <th className="font-medium py-4 px-6 text-center">Trạng thái</th>
              <th className="font-medium py-4 px-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-100 text-sm">
            {loading ? (
               <tr>
               <td colSpan={6} className="py-8 text-center text-dark-400">Đang tải...</td>
             </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-dark-400">Chưa có hóa đơn nào được xuất.</td>
              </tr>
            ) : (
              invoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-dark-50/50 transition-colors">
                  <td className="py-4 px-6 font-mono text-dark-900 text-xs">#{invoice.id.substring(0,8)}</td>
                  <td className="py-4 px-6 text-dark-600">
                    {new Date(invoice.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-4 px-6 font-bold text-primary-600">
                    {invoice.finalAmount.toLocaleString()} ₫
                  </td>
                  <td className="py-4 px-6 text-dark-500">
                    {invoice.paymentMethod === 'CASH' ? 'Tiền mặt' : invoice.paymentMethod}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(invoice.paymentStatus)}`}>
                      {invoice.paymentStatus}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                       {invoice.paymentStatus === 'PAID' && (
                         <button
                           onClick={() => handleRefund(invoice.id)}
                           className="p-2 text-dark-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors cursor-pointer"
                           title="Hoàn trả"
                         >
                           <RotateCcw size={18} />
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
