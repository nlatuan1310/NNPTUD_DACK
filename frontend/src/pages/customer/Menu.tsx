import { useState, useEffect } from 'react';
import { UtensilsCrossed, Search, ArrowUpDown, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { foodService, type Food } from '../../services/foodService';
import { categoryService, type Category } from '../../services/categoryService';

export default function Menu() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'NONE' | 'ASC' | 'DESC'>('NONE');
  const [loading, setLoading] = useState(true);

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
      if (foodsRes.success) setFoods(foodsRes.data.filter((f: Food) => f.status));
      if (catsRes.success) setCategories(catsRes.data);
    } catch (error) {
      toast.error('Lỗi khi tải thực đơn');
    } finally {
      setLoading(false);
    }
  };

  const filteredFoods = foods
    .filter(f => selectedCategoryId === 'ALL' || f.categoryId === selectedCategoryId)
    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === 'ASC') return a.price - b.price;
      if (sortOrder === 'DESC') return b.price - a.price;
      return 0;
    });

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)] animate-fade-in">
      <div className="text-center py-6 shrink-0">
        <h1 className="text-4xl font-black text-dark-900 mb-2">Thực Đơn Của Chúng Tôi</h1>
        <p className="text-dark-500 max-w-xl mx-auto">
          Khám phá những món ăn trứ danh được chế biến từ những nguyên liệu tươi ngon nhất, mang lại cho bạn trải nghiệm ẩm thực khó quên.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2 shrink-0">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-dark-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm món ăn..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-dark-200 rounded-2xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all text-sm"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <div className="relative w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Layers size={16} className="text-dark-400" />
            </div>
            <select
              value={selectedCategoryId}
              onChange={e => setSelectedCategoryId(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-dark-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả danh mục</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="relative w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ArrowUpDown size={16} className="text-dark-400" />
            </div>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as 'NONE' | 'ASC' | 'DESC')}
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-dark-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 appearance-none cursor-pointer"
            >
              <option value="NONE">Sắp xếp: Mặc định</option>
              <option value="ASC">Giá: Thấp đến Cao</option>
              <option value="DESC">Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="text-center py-24 text-dark-400">
            <UtensilsCrossed size={64} className="mx-auto mb-4 opacity-10" />
            <p className="text-lg">Hiện tại chưa có món ăn nào trong danh mục này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-2">
            {filteredFoods.map(food => (
              <div key={food.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary-500/10 transition-all group flex flex-col h-full border border-dark-100">
                <div className="aspect-[4/3] bg-dark-50 relative overflow-hidden shrink-0">
                  {food.imageUrl ? (
                    <img 
                      src={food.imageUrl} 
                      alt={food.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-dark-300">
                      <UtensilsCrossed size={32} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-primary-600 font-black px-3 py-1.5 rounded-xl shadow-lg border border-white/20">
                    {food.price.toLocaleString()} ₫
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-dark-900 text-lg leading-tight mb-2">{food.name}</h3>
                  <p className="text-dark-500 text-sm line-clamp-3 leading-relaxed">
                    {food.description || 'Chưa có mô tả chi tiết cho món ăn này.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
