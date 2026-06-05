import React from 'react';
import { User } from 'firebase/auth';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Users,
  Truck,
  ClipboardList,
  FileSpreadsheet,
  Receipt,
  Coins,
  BarChart3,
  Settings,
  RefreshCcw,
  Menu,
  X,
  LogOut,
  LogIn
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  syncing: boolean;
  onTriggerSync: () => void;
  companyName: string;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  currentView,
  onViewChange,
  syncing,
  onTriggerSync,
  companyName,
  user,
  onLogin,
  onLogout,
}: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, color: 'text-emerald-500 bg-emerald-500/10' },
    { id: 'pos', label: 'شاشة نقطة البيع (POS)', icon: ShoppingCart, color: 'text-rose-500 bg-rose-500/10' },
    { id: 'products', label: 'إدارة المنتجات', icon: Package, color: 'text-indigo-500 bg-indigo-500/10' },
    { id: 'categories', label: 'تصنيفات المنتجات', icon: Layers, color: 'text-blue-500 bg-blue-500/10' },
    { id: 'customers', label: 'العملاء والديون', icon: Users, color: 'text-cyan-500 bg-cyan-500/10' },
    { id: 'suppliers', label: 'إدارة الموردين', icon: Truck, color: 'text-amber-500 bg-amber-500/10' },
    { id: 'inventory', label: 'المخزون والتحركات', icon: ClipboardList, color: 'text-purple-500 bg-purple-500/10' },
    { id: 'purchases', label: 'المشتريات وفواتير الموردين', icon: FileSpreadsheet, color: 'text-teal-500 bg-teal-500/10' },
    { id: 'sales', label: 'سجل المبيعات والفواتير', icon: Receipt, color: 'text-sky-500 bg-sky-500/10' },
    { id: 'expenses', label: 'المصاريف النقدية', icon: Coins, color: 'text-orange-500 bg-orange-500/10' },
    { id: 'reports', label: 'التقارير والتحليلات', icon: BarChart3, color: 'text-violet-500 bg-violet-500/10' },
    { id: 'settings', label: 'إعدادات النظام', icon: Settings, color: 'text-slate-500 bg-slate-500/10' },
  ];

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-3 lg:hidden shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <h1 className="font-bold text-sm tracking-tight">{companyName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onTriggerSync}
            disabled={syncing}
            className={`p-1.5 rounded-full hover:bg-slate-800 text-slate-300 transition-all ${
              syncing ? 'animate-spin text-emerald-400' : ''
            }`}
            title="مزامنة السحاب"
          >
            <RefreshCcw size={18} />
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-40 bg-slate-900 border-l border-slate-800 text-slate-300 w-72 flex flex-col transition-transform duration-300 transform lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } lg:static lg:h-screen`}
      >
        {/* Header Branding */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-500/20">
              ⚡
            </div>
            <div>
              <h1 className="font-black text-white text-lg tracking-wide shrink-0">
                المدير الذكي ERP
              </h1>
              <p className="text-xs text-emerald-400 font-mono">نظام POS المطور 2026</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-medium truncate mt-2 border-t border-slate-800/60 pt-2 shrink-0">
            {companyName}
          </p>
        </div>

        {/* Sync Info Bar */}
        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className={`w-2.5 h-2.5 rounded-full ${syncing ? 'bg-amber-500 animate-pulse' : user ? 'bg-emerald-500' : 'bg-slate-500'}`} />
            {user ? 'مزامنة السحاب نشطة' : 'نمط العمل المحلي'}
          </span>
          <button
            onClick={() => {
              onTriggerSync();
              setIsOpen(false);
            }}
            disabled={syncing}
            className={`flex items-center gap-1 font-medium text-11px transition ${
              !user ? 'text-slate-650 cursor-not-allowed hover:text-slate-650' : 'hover:text-white text-emerald-400'
            }`}
            title={user ? 'رفع ونسخ احتياطي سحابي' : 'يرجى تسجيل الدخول أولاً لتفعيل حفظ السحاب'}
          >
            <RefreshCcw size={11} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'جاري المزامنة...' : 'مزامنة الآن'}
          </button>
        </div>

        {/* Scrollable Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => {
                  onViewChange(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-right text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-500/10'
                    : 'hover:bg-slate-800/70 text-slate-400 hover:text-slate-100'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                    isActive ? 'bg-white/15 text-white' : item.color
                  }`}
                >
                  <IconComponent size={18} />
                </div>
                <span className="flex-1 truncate">{item.label}</span>
                {item.id === 'pos' && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-500 text-white shadow-xs shrink-0 font-mono">
                    جديد
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
          {user ? (
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  referrerPolicy="no-referrer"
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-slate-700 object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {user.displayName ? user.displayName.slice(0, 2) : 'أد'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate text-xs">{user.displayName || 'مستخدم السحاب'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg hover:bg-slate-850 text-slate-405 hover:text-rose-400 transition"
                title="تسجيل الخروج"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              <LogIn size={14} />
              <span>تسجيل الدخول سحابياً</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
