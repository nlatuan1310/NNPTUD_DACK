import { useState, useEffect, useRef } from 'react';
import { Utensils, Plus, Pencil, Trash2, Image as ImageIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { foodService, type Food } from '../../services/foodService';
import { categoryService, type Category } from '../../services/categoryService';
import { uploadService } from '../../services/uploadService';

export default function FoodManager() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [currentFood, setCurrentFood] = useState<Partial<Food>>({ name: '', description: '', price: 0, categoryId: '', status: true });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [foodsRes, catsRes] = await Promise.all([
        foodService.getAll(),
        categoryService.getAll()
      ]);
      
      if (foodsRes.success) setFoods(foodsRes.data);
      if (catsRes.success) setCategories(catsRes.data);
    } catch (error: any) {
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode: 'CREATE' | 'EDIT', food?: Food) => {
    setModalMode(mode);
    if (mode === 'EDIT' && food) {
      setCurrentFood({ ...food });
      setImagePreview(food.imageUrl || null);
    } else {
      setCurrentFood({ name: '', description: '', price: 0, categoryId: categories[0]?.id || '', status: true });
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setCurrentFood({ ...currentFood, imageUrl: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFood.categoryId) {
      toast.error('Vui lòng chọn danh mục cho món ăn');
      return;
    }

    try {
      setIsUploading(true);
      let finalImageUrl = currentFood.imageUrl;

      // 1. Upload ảnh nếu có ảnh mới
      if (imageFile) {
        const uploadRes = await uploadService.uploadImage(imageFile);
        if (!uploadRes.success) throw new Error('Upload ảnh thất bại');
        finalImageUrl = uploadRes.imageUrl;
      }

      const payload = {
        ...currentFood,
        price: Number(currentFood.price),
        imageUrl: finalImageUrl
      };

      // 2. Lưu thông tin món ăn
      if (modalMode === 'CREATE') {
        const res = await foodService.create(payload);
        if (res.success) toast.success('Thêm món ăn thành công');
      } else {
        if (!currentFood.id) return;
        const res = await foodService.update(currentFood.id, payload);
        if (res.success) toast.success('Cập nhật món ăn thành công');
      }
      
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Lỗi lưu thông tin');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa món "${name}"?`)) {
      try {
        const res = await foodService.delete(id);
        if (res.success) {
          toast.success('Xóa thành công');
          fetchData();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Không thể xóa món ăn này');
      }
    }
  };

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 flex items-center gap-2">
            <Utensils className="text-primary-500" />
            Quản lý Món ăn
          </h1>
          <p className="text-dark-500 text-sm mt-1">Thêm, sửa, xóa món ăn và cập nhật hình ảnh</p>
        </div>
        <button
          onClick={() => handleOpenModal('CREATE')}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={20} />
          Thêm món mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {foods.map(food => (
          <div key={food.id} className="bg-white rounded-2xl border border-dark-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
            <div className="aspect-video relative bg-dark-50 flex-shrink-0">
              {food.imageUrl ? (
                <img src={food.imageUrl} alt={food.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-dark-300">
                  <ImageIcon size={32} />
                  <span className="text-xs font-medium mt-2">Chưa có ảnh</span>
                </div>
              )}
              {!food.status && (
                <div className="absolute top-2 right-2 bg-dark-900/80 text-white text-xs font-bold px-2 py-1 rounded-lg backdrop-blur-sm">
                  Ngừng bán
                </div>
              )}
              <div className="absolute top-2 left-2 bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
                {food.category?.name || 'Không rõ'}
              </div>
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-bold text-dark-900 text-lg leading-tight line-clamp-1">{food.name}</h3>
              <p className="text-primary-600 font-bold mt-1">
                {food.price.toLocaleString('vi-VN')} ₫
              </p>
              <p className="text-dark-400 text-sm mt-2 line-clamp-2 flex-1">
                {food.description || 'Không có mô tả'}
              </p>
              
              <div className="flex gap-2 mt-4 pt-4 border-t border-dark-50">
                <button
                  onClick={() => handleOpenModal('EDIT', food)}
                  className="flex-1 flex justify-center items-center gap-2 py-2 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 font-medium transition-colors cursor-pointer text-sm"
                >
                  <Pencil size={16} /> Sửa
                </button>
                <button
                  onClick={() => handleDelete(food.id, food.name)}
                  className="w-10 h-10 flex justify-center items-center bg-danger-50 text-danger-500 rounded-xl hover:bg-danger-100 transition-colors cursor-pointer"
                  title="Xóa món"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {foods.length === 0 && (
        <div className="text-center py-12 text-dark-400">
          <Utensils size={48} className="mx-auto mb-4 opacity-20" />
          <p>Chưa có món ăn nào trong thực đơn.</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-auto animate-fade-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-dark-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-dark-900">
                {modalMode === 'CREATE' ? 'Thêm Món ăn mới' : 'Chỉnh sửa Món ăn'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-dark-400 hover:bg-dark-100 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto flex flex-col md:flex-row gap-8">
              {/* Left Column: Image Upload */}
              <div className="w-full md:w-1/3 space-y-4">
                <label className="block text-sm font-medium text-dark-700">Hình ảnh sản phẩm</label>
                <div className="relative aspect-square border-2 border-dashed border-dark-200 rounded-2xl overflow-hidden group hover:border-primary-400 transition-colors bg-dark-50 flex items-center justify-center">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-dark-900/60 p-1.5 rounded-lg text-white hover:bg-danger-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="mx-auto h-8 w-8 text-dark-300" />
                      <div className="mt-2 text-xs text-dark-500">
                        <span className="text-primary-600 font-semibold cursor-pointer" onClick={() => fileInputRef.current?.click()}>Tải ảnh lên</span>
                        <p className="mt-1">PNG, JPG tối đa 5MB</p>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden"
                  />
                </div>
                {/* Status Toggle */}
                <div className="pt-2">
                   <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={currentFood.status}
                        onChange={(e) => setCurrentFood({...currentFood, status: e.target.checked})}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${currentFood.status ? 'bg-primary-500' : 'bg-dark-200'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${currentFood.status ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <span className="text-sm font-medium text-dark-700">{currentFood.status ? 'Đang mở bán' : 'Tạm ngừng bán'}</span>
                  </label>
                </div>
              </div>

              {/* Right Column: Details */}
              <div className="w-full md:w-2/3 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Tên món ăn <span className="text-danger-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={currentFood.name}
                    onChange={(e) => setCurrentFood({ ...currentFood, name: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="VD: Cơm rang dưa bò..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Danh mục <span className="text-danger-500">*</span></label>
                    <select
                      required
                      value={currentFood.categoryId}
                      onChange={(e) => setCurrentFood({ ...currentFood, categoryId: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    >
                      <option value="" disabled>-- Chọn danh mục --</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">Giá bán (VNĐ) <span className="text-danger-500">*</span></label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={currentFood.price || ''}
                      onChange={(e) => setCurrentFood({ ...currentFood, price: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                      placeholder="VD: 50000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Mô tả món ăn</label>
                  <textarea
                    value={currentFood.description || ''}
                    onChange={(e) => setCurrentFood({ ...currentFood, description: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-50 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all min-h-[120px]"
                    placeholder="Giới thiệu về thành phần, hương vị của món ăn..."
                  />
                </div>
              </div>
            </form>
            
            <div className="p-6 border-t border-dark-100 flex gap-3 shrink-0 bg-dark-50/50">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isUploading}
                className="flex-1 px-4 py-2 bg-white border border-dark-200 text-dark-700 font-medium rounded-xl hover:bg-dark-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isUploading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  modalMode === 'CREATE' ? 'Thêm mới' : 'Lưu thay đổi'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
