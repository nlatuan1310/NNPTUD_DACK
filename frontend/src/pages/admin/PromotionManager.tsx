import { useState, useEffect } from 'react';
import { Tag, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { promotionService, type Promotion } from '../../services/promotionService';

export default function PromotionManager() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [currentPromo, setCurrentPromo] = useState<Partial<Promotion>>({ 
    code: '', discountPercentage: 10, startDate: '', endDate: '', isActive: true 
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const res = await promotionService.getAll();
      if (res.success) {
        setPromotions(res.data);
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode: 'CREATE' | 'EDIT', promo?: Promotion) => {
    setModalMode(mode);
    if (mode === 'EDIT' && promo) {
      setCurrentPromo({ 
        ...promo,
        startDate: promo.startDate ? new Date(promo.startDate).toISOString().slice(0,16) : '',
        endDate: promo.endDate ? new Date(promo.endDate).toISOString().slice(0,16) : ''
      });
    } else {
      setCurrentPromo({ code: '', discountPercentage: 10, startDate: '', endDate: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'CREATE') {
        const res = await promotionService.create({
            ...currentPromo,
            startDate: new Date(currentPromo.startDate as string).toISOString(),
            endDate: new Date(currentPromo.endDate as string).toISOString()
        });
        if (res.success) toast.success('Thêm mã thành công');
      } else {
        if (!currentPromo.id) return;
        const res = await promotionService.update(currentPromo.id, {
            ...currentPromo,
            startDate: new Date(currentPromo.startDate as string).toISOString(),
            endDate: new Date(currentPromo.endDate as string).toISOString()
        });
        if (res.success) toast.success('Cập nhật mã thành công');
      }
      handleCloseModal();
      fetchPromotions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi lưu thông tin');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (window.confirm(`Xóa mã KHUYẾN MÃI "${code}"?`)) {
      try {
        const res = await promotionService.delete(id);
        if (res.success) {
          toast.success('Xóa thành công');
          fetchPromotions();
        }
      } catch (error) {
        toast.error('Lỗi xóa mã khuyến mãi');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 flex items-center gap-2">
            <Tag className="text-primary-500" /> Quản lý Khuyến mãi
          </h1>
        </div>
        <button
          onClick={() => handleOpenModal('CREATE')}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium"
        >
          <Plus size={20} /> Thêm Mã Khuyến Mãi
        </button>
      </div>

      <div className="bg-white border border-dark-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-dark-50 text-dark-500 text-sm border-b border-dark-100">
              <th className="font-medium py-4 px-6">Mã Code</th>
              <th className="font-medium py-4 px-6">Giảm giá</th>
              <th className="font-medium py-4 px-6">Bắt đầu</th>
              <th className="font-medium py-4 px-6">Kết thúc</th>
              <th className="font-medium py-4 px-6 text-center">Tình trạng</th>
              <th className="font-medium py-4 px-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-100 text-sm">
            {loading ? <tr><td colSpan={6} className="text-center py-6">Đang tải...</td></tr> : 
             promotions.map(promo => (
              <tr key={promo.id}>
                <td className="py-4 px-6 font-bold text-dark-900">{promo.code}</td>
                <td className="py-4 px-6 text-primary-600 font-bold">{promo.discountPercentage}%</td>
                <td className="py-4 px-6 text-dark-500">{new Date(promo.startDate).toLocaleString()}</td>
                <td className="py-4 px-6 text-dark-500">{new Date(promo.endDate).toLocaleString()}</td>
                <td className="py-4 px-6 text-center">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${promo.isActive ? 'bg-success-100 text-success-600' : 'bg-dark-100 text-dark-500'}`}>
                     {promo.isActive ? 'Khả Dụng' : 'Đóng'}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <button onClick={() => handleOpenModal('EDIT', promo)} className="p-2 text-dark-400 hover:text-primary-600">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => handleDelete(promo.id, promo.code)} className="p-2 text-dark-400 hover:text-danger-600">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-dark-100">
              <h2 className="text-xl font-bold text-dark-900">{modalMode === 'CREATE' ? 'Thêm Mã Khuyến Mãi' : 'Chỉnh sửa Mã'}</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mã Code *</label>
                <input required value={currentPromo.code} onChange={e => setCurrentPromo({...currentPromo, code: e.target.value})} className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-xl outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Giảm giá (%) *</label>
                <input type="number" required min="1" max="100" value={currentPromo.discountPercentage} onChange={e => setCurrentPromo({...currentPromo, discountPercentage: Number(e.target.value)})} className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-xl outline-none" />
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                   <label className="block text-sm font-medium mb-1">Bắt đầu *</label>
                   <input type="datetime-local" required value={currentPromo.startDate} onChange={e => setCurrentPromo({...currentPromo, startDate: e.target.value})} className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-xl" />
                </div>
                <div className="w-1/2">
                   <label className="block text-sm font-medium mb-1">Kết thúc *</label>
                   <input type="datetime-local" required value={currentPromo.endDate} onChange={e => setCurrentPromo({...currentPromo, endDate: e.target.value})} className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-xl" />
                </div>
              </div>
              <div>
                 <label className="flex items-center gap-2 mt-4 cursor-pointer">
                    <input type="checkbox" checked={currentPromo.isActive} onChange={e => setCurrentPromo({...currentPromo, isActive: e.target.checked})} className="w-4 h-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm font-medium text-dark-800">Đang hoạt động</span>
                  </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2 bg-dark-100 rounded-xl">Hủy</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
