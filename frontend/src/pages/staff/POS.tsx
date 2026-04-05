import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { foodService, type Food } from '../../services/foodService';
import { categoryService, type Category } from '../../services/categoryService';
import { tableService, type Table } from '../../services/tableService';
import { orderService, type Order } from '../../services/orderService';
import { invoiceService } from '../../services/invoiceService';
import { ShoppingCart, LayoutDashboard, Plus, Minus, CreditCard, UtensilsCrossed, X } from 'lucide-react';
import toast from 'react-hot-toast';
export default function POS() {
  const { user } = useAuth();
  
  // Data lists
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  
  // Selections
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  
  // Active Order
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  // Checkout Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [promotionCode, setPromotionCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [tableRes, catRes, foodRes] = await Promise.all([
        tableService.getAll(),
        categoryService.getAll(),
        foodService.getAll()
      ]);
      if (tableRes.success) setTables(tableRes.data);
      if (catRes.success) setCategories(catRes.data);
      if (foodRes.success) setFoods(foodRes.data.filter((f: Food) => f.status)); // Chỉ load món đang bán
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu POS');
    }
  };

  // Lắng nghe đổi bàn
  useEffect(() => {
    if (selectedTableId) {
      fetchActiveOrder(selectedTableId);
    } else {
      setActiveOrder(null);
    }
  }, [selectedTableId]);

  const fetchActiveOrder = async (tableId: string) => {
    try {
      setLoadingOrder(true);
      // Lấy danh sách order của bàn này
      const res = await orderService.getAll({ tableId });
      if (res.success && res.data.length > 0) {
        // Tìm order chưa thanh toán
        const active = res.data.find((o: Order) => ['PENDING', 'PREPARING', 'SERVED'].includes(o.status));
        if (active) {
          // Lấy full detail (kèm item)
          const detailRes = await orderService.getById(active.id);
          setActiveOrder(detailRes.data);
        } else {
          setActiveOrder(null);
        }
      } else {
        setActiveOrder(null);
      }
    } catch (error) {
      console.error(error);
      setActiveOrder(null);
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleOpenTable = async () => {
    if (!selectedTableId || !user?.id) return;
    try {
      const res = await orderService.create({
        tableId: selectedTableId,
        staffId: user.id
      });
      if (res.success) {
        toast.success(`Đã mở bàn thành công`);
        // Refresh tables to see status=OCCUPIED
        const tRes = await tableService.getAll();
        setTables(tRes.data);
        fetchActiveOrder(selectedTableId);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể mở bàn');
    }
  };

  const handleAddFood = async (food: Food) => {
    if (!selectedTableId) {
      toast.error('Vui lòng chọn một bàn trước');
      return;
    }
    if (!activeOrder) {
      toast.error('Cần mở bàn trước khi chọn món');
      return;
    }

    try {
      // Logic gộp chung nếu món đã có sẵn: backend yêu cầu truyền quantity => frontend tự cập nhật Item cũ
      const existingItem = activeOrder.orderItems?.find(item => item.foodId === food.id);
      
      if (existingItem && existingItem.id) {
        await orderService.updateItem(existingItem.id, {
          quantity: existingItem.quantity + 1
        });
      } else {
        await orderService.addItem(activeOrder.id, {
          foodId: food.id,
          quantity: 1
        });
      }
      
      toast.success(`Đã thêm ${food.name}`);
      fetchActiveOrder(selectedTableId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi thêm món');
    }
  };

  const handleUpdateItemQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await handleRemoveItem(itemId);
      return;
    }
    try {
      await orderService.updateItem(itemId, { quantity: newQuantity });
      fetchActiveOrder(selectedTableId);
    } catch (error: any) {
      toast.error('Không thể cập nhật số lượng');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await orderService.removeItem(itemId);
      fetchActiveOrder(selectedTableId);
    } catch (error) {
      toast.error('Không thể xóa món');
    }
  };

  const handleCheckout = async () => {
    if (!activeOrder) return;
    try {
      setIsProcessingPayment(true);
      
      // Lấy orderId hiện tại
      // 1. Sinh Bill nháp (tính cả KM) và tạo Invoice
      const checkoutRes = await invoiceService.checkout({
        orderId: activeOrder.id,
        promotionCode: promotionCode.trim() || undefined,
        paymentMethod: paymentMethod
      });
      
      if (checkoutRes.success && checkoutRes.data.id) {
        // 2. Chốt thanh toán ngay
        const payRes = await invoiceService.pay(checkoutRes.data.id);
        if (payRes.success) {
          toast.success('Thanh toán thành công! Bàn đã được giải phóng.');
          // Đóng modal, reset state
          setIsCheckoutOpen(false);
          setPromotionCode('');
          setPaymentMethod('CASH');
          // Refresh query
          const tRes = await tableService.getAll();
          setTables(tRes.data);
          
          setActiveOrder(null);
          setSelectedTableId('');
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi thanh toán');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const filteredFoods = selectedCategoryId === 'ALL' 
    ? foods 
    : foods.filter(f => f.categoryId === selectedCategoryId);

  const selectedTable = tables.find(t => t.id === selectedTableId);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -m-6 animate-fade-in">
      {/* Top Bar for Table Selection */}
      <div className="h-16 bg-white border-b border-dark-100 flex items-center px-4 gap-4 shrink-0 shadow-sm z-10">
        <LayoutDashboard className="text-dark-400 shrink-0" />
        <select 
          value={selectedTableId}
          onChange={(e) => setSelectedTableId(e.target.value)}
          className="border-none bg-dark-50 focus:ring-0 text-lg font-bold text-dark-900 rounded-xl px-4 py-2 cursor-pointer outline-none w-[200px]"
        >
          <option value="" disabled>-- Chọn Bàn --</option>
          {tables.map(t => (
            <option key={t.id} value={t.id}>
              Bàn {t.tableNumber} {t.status === 'AVAILABLE' ? '' : '(Đang khách)'}
            </option>
          ))}
        </select>

        {selectedTable && !activeOrder && selectedTable.status === 'AVAILABLE' && (
          <button 
            onClick={handleOpenTable}
            className="ml-auto bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl font-bold transition-all shadow-lg shadow-primary-600/30"
          >
            Mở bàn {selectedTable.tableNumber}
          </button>
        )}
      </div>

      {/* Main Layout: 2 Columns */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Col: Menu & Categories (70%) */}
        <div className="flex-1 flex flex-col bg-dark-50 border-r border-dark-100">
          {/* Category Tabs */}
          <div className="flex gap-2 p-4 overflow-x-auto custom-scrollbar shrink-0 border-b border-dark-100/50 bg-white shadow-sm z-10">
            <button
              onClick={() => setSelectedCategoryId('ALL')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedCategoryId === 'ALL' 
                  ? 'bg-dark-900 text-white shadow-md' 
                  : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
              }`}
            >
              <UtensilsCrossed size={16} />
              Tất cả món
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategoryId === cat.id 
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' 
                    : 'bg-white border border-dark-200 text-dark-700 hover:bg-dark-50 hover:border-dark-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Foods Grid */}
          <div className="p-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredFoods.map(food => (
                <div 
                  key={food.id}
                  onClick={() => handleAddFood(food)}
                  className="bg-white rounded-2xl border border-dark-100 overflow-hidden shadow-sm hover:shadow-lg hover:border-primary-400 cursor-pointer transition-all active:scale-95 group flex flex-col h-[220px]"
                >
                  <div className="h-[120px] bg-dark-50 relative shrink-0">
                    {food.imageUrl ? (
                      <img src={food.imageUrl} alt={food.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-dark-300">
                        <UtensilsCrossed size={24} />
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-bold text-sm text-dark-900 leading-tight line-clamp-2 mb-1">{food.name}</h3>
                    <div className="mt-auto flex items-end justify-between">
                      <span className="text-primary-600 font-bold text-sm">
                        {food.price.toLocaleString()} ₫
                      </span>
                      <div className="w-6 h-6 rounded-full bg-dark-50 group-hover:bg-primary-500 group-hover:text-white flex items-center justify-center transition-colors text-dark-400">
                        <Plus size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredFoods.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-dark-400">
                <UtensilsCrossed size={48} className="mb-4 opacity-20" />
                <p>Không có món nào trong phân loại này.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Current Order (30%) */}
        <div className="w-[380px] bg-white flex flex-col shrink-0 flex-shrink-0 shadow-[-10px_0_20px_rgba(0,0,0,0.02)] z-20">
          <div className="p-4 border-b border-dark-100 bg-dark-50 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-dark-900 flex items-center gap-2">
                <ShoppingCart className="text-primary-500" />
                Hóa Đơn Bàn {selectedTable?.tableNumber || '?'}
              </h2>
              {activeOrder && (
                <span className="bg-warning-100 text-warning-700 text-xs font-bold px-2 py-1 rounded-lg border border-warning-200">
                  {activeOrder.status}
                </span>
              )}
            </div>
            <p className="text-xs text-dark-500 mt-1">
              Phục vụ: {activeOrder?.staffId === user?.id ? user?.name : (activeOrder ? 'Khác' : '-')}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-dark-50/30">
            {!selectedTableId ? (
              <div className="h-full flex flex-col justify-center items-center text-dark-400 text-center space-y-3 p-6">
                <div className="w-16 h-16 bg-dark-50 rounded-full flex items-center justify-center">
                  <LayoutDashboard size={24} />
                </div>
                <p>Vui lòng chọn bàn ở góc trên để bắt đầu order.</p>
              </div>
            ) : loadingOrder ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !activeOrder ? (
              <div className="h-full flex flex-col justify-center items-center text-dark-400 text-center space-y-3 p-6">
                <div className="w-16 h-16 bg-dark-50 rounded-full flex items-center justify-center text-primary-500/50">
                  <UtensilsCrossed size={24} />
                </div>
                <p>Bàn này đang trống.<br/>Hãy <strong>Mở bàn</strong> trước khi thêm món.</p>
              </div>
            ) : (!activeOrder.orderItems || activeOrder.orderItems.length === 0) ? (
              <div className="h-full flex flex-col justify-center items-center text-dark-400 text-center space-y-3 p-6">
                <ShoppingCart size={32} className="opacity-20" />
                <p>Chưa có món nào được chọn.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrder.orderItems.map((item) => (
                  <div key={item.id} className="bg-white p-3 rounded-xl border border-dark-100 shadow-sm flex items-start gap-3 animate-fade-in group hover:border-primary-200 transition-colors">
                     <div className="w-12 h-12 bg-dark-50 rounded-lg overflow-hidden shrink-0">
                       {item.food?.imageUrl && (
                         <img src={item.food.imageUrl} alt="" className="w-full h-full object-cover" />
                       )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-dark-900 text-sm truncate">{item.food?.name || 'Món không rõ'}</h4>
                        <p className="text-primary-600 font-bold text-xs mt-0.5">{(item.priceAtTimeOfOrder * item.quantity).toLocaleString()} ₫</p>
                     </div>
                     <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 bg-dark-50 rounded-lg p-0.5">
                          <button 
                            onClick={() => item.id && handleUpdateItemQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-dark-600 hover:text-danger-500 active:scale-95"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-4 text-center font-bold text-sm text-dark-900">{item.quantity}</span>
                          <button 
                            onClick={() => item.id && handleUpdateItemQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-dark-600 hover:text-success-500 active:scale-95"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Footer */}
          {activeOrder && (
            <div className="p-4 bg-white border-t border-dark-100 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] shrink-0 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-dark-500 font-medium">Tổng tạm tính:</span>
                <span className="text-xl font-black text-primary-600">{activeOrder.totalAmount.toLocaleString()} ₫</span>
              </div>
              <button 
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-3.5 bg-dark-900 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
              >
                <CreditCard size={18} />
                Thanh Toán / Tạo Hóa Đơn
              </button>
            </div>
          )}
        </div>
        
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-dark-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-dark-900">Thanh Toán Đơn Hàng</h2>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-dark-400 hover:text-dark-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-dark-50 p-4 rounded-xl border border-dark-100 flex items-center justify-between">
                <span className="text-dark-600 font-medium">Tổng tiền gốc:</span>
                <span className="text-xl font-black text-primary-600">{activeOrder.totalAmount.toLocaleString()} ₫</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Mã Khuyến Mãi (Nếu có)</label>
                <input
                  type="text"
                  value={promotionCode}
                  onChange={(e) => setPromotionCode(e.target.value)}
                  className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none uppercase"
                  placeholder="VD: GIAM10K"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Phương thức thanh toán <span className="text-danger-500">*</span></label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="CASH">Tiền mặt</option>
                  <option value="BANK_TRANSFER">Chuyển khoản</option>
                  <option value="CREDIT_CARD">Thẻ Tín dụng / Ghi nợ</option>
                </select>
              </div>

            </div>
            <div className="p-5 border-t border-dark-100 bg-dark-50 flex gap-3">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-dark-200 text-dark-700 font-medium rounded-xl hover:bg-dark-50 transition-colors"
                disabled={isProcessingPayment}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isProcessingPayment}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30 disabled:opacity-50 flex items-center justify-center"
              >
                {isProcessingPayment ? 'Đang xử lý...' : 'Xác Nhận Thu Tiền'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
