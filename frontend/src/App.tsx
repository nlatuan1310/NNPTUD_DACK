import { useState } from 'react';
import CategoryPage from './pages/CategoryPage';
import FoodPage from './pages/FoodPage';
import IngredientPage from './pages/IngredientPage';
import { LayoutGrid, Utensils, Box, ChefHat, Menu, X } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('food');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'category', label: 'Danh mục', icon: <LayoutGrid size={20} /> },
    { id: 'food', label: 'Món ăn', icon: <Utensils size={20} /> },
    { id: 'ingredient', label: 'Nguyên liệu', icon: <Box size={20} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'category': return <CategoryPage />;
      case 'food': return <FoodPage />;
      case 'ingredient': return <IngredientPage />;
      default: return <FoodPage />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#0f172a] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`bg-[#1e293b] border-r border-slate-800 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 h-20">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
            <ChefHat className="text-white" size={24} />
          </div>
          {isSidebarOpen && <span className="font-black text-xl tracking-tighter text-white">RESTAURANT</span>}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className={activeTab === item.id ? 'text-white' : 'text-slate-500'}>
                {item.icon}
              </div>
              {isSidebarOpen && <span className="font-semibold text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="w-full flex items-center justify-center p-2 hover:bg-slate-800 rounded-lg text-slate-500"
           >
             {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-[#1e293b]/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em]">Dashboard</h2>
            <p className="text-lg font-bold text-white capitalize">{activeTab} Management</p>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
           {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
