import React from 'react';
import { ERPState, Product, Category, Customer, Supplier, Order, Purchase, Expense, InventoryMovement, CompanySettings, SystemUser } from './types';
import { initialERPState } from './data/initialData';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, loginWithEmail, registerWithEmail, logoutUser } from './lib/firebase';
import { uploadAllToFirebase, downloadAllFromFirebase } from './lib/firebaseSync';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Cloud, ShieldAlert, Eye, EyeOff, Loader2, Mail, Lock, User as UserIcon, X } from 'lucide-react';

// import view modules
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import POSView from './components/POSView';
import ProductsView from './components/ProductsView';
import CategoriesView from './components/CategoriesView';
import CustomersView from './components/CustomersView';
import SuppliersView from './components/SuppliersView';
import InventoryView from './components/InventoryView';
import PurchasesView from './components/PurchasesView';
import SalesView from './components/SalesView';
import ExpensesView from './components/ExpensesView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import UsersView from './components/UsersView';

const STORAGE_KEY = 'SMART_POS_ERP_STATE_V1';

export default function App() {
  const [currentView, setCurrentView] = React.useState<string>('dashboard');
  const [syncing, setSyncing] = React.useState<boolean>(false);
  const [user, setUser] = React.useState<User | null>(null);

  // Native Cloud Auth Modal states (for phone compatibility where popups fail)
  const [showLoginModal, setShowLoginModal] = React.useState<boolean>(false);
  const [authEmail, setAuthEmail] = React.useState<string>('');
  const [authPass, setAuthPass] = React.useState<string>('');
  const [authName, setAuthName] = React.useState<string>('');
  const [isRegisterMode, setIsRegisterMode] = React.useState<boolean>(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [authWorking, setAuthWorking] = React.useState<boolean>(false);
  const [state, setState] = React.useState<ERPState>(() => {
    // Attempt local storage loading for durable offline preservation
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse offline state, loading defaults.', e);
      }
    }
    return initialERPState;
  });

  // Track user login state changes
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
    });
    return unsubscribe;
  }, []);

  // Keep localStorage updated with every state change automatically
  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const users = state.users || [];
  const activeUserId = state.activeUserId || 'usr_admin';
  const activeUser = users.find(u => u.id === activeUserId) || users[0] || {
    id: 'usr_admin',
    name: 'عبدالرحمن العتيبي (المالك)',
    username: 'admin',
    phone: '0555555555',
    pinCode: '1234',
    role: 'admin',
    permissions: {
      dashboard: true,
      pos: true,
      products: true,
      categories: true,
      customers: true,
      suppliers: true,
      inventory: true,
      purchases: true,
      sales: true,
      expenses: true,
      reports: true,
      settings: true,
      editInvoices: true,
      returnItems: true,
    }
  };

  // Redirect if currentView has no permission
  React.useEffect(() => {
    if (activeUser && activeUser.permissions) {
      const viewKey = currentView as keyof typeof activeUser.permissions;
      if (activeUser.permissions[viewKey] === false) {
        // Find first allowed view, fallback to 'pos'
        const allowedViews = (Object.keys(activeUser.permissions) as (keyof typeof activeUser.permissions)[])
          .filter(k => activeUser.permissions[k] === true);
        if (allowedViews.length > 0) {
          setCurrentView(allowedViews[0]);
        } else {
          setCurrentView('pos');
        }
      }
    }
  }, [state.activeUserId, currentView, activeUser]);

  // Synchronise system data package on login success
  const syncOnLoginSuccess = async (usr: any) => {
    try {
      setSyncing(true);
      const cloudData = await downloadAllFromFirebase();
      if (cloudData.products && cloudData.products.length > 0) {
        setState({
          products: cloudData.products || [],
          categories: cloudData.categories || [],
          customers: cloudData.customers || [],
          suppliers: cloudData.suppliers || [],
          orders: cloudData.orders || [],
          purchases: cloudData.purchases || [],
          expenses: cloudData.expenses || [],
          movements: cloudData.movements || [],
          settings: cloudData.settings || state.settings,
          users: cloudData.users || state.users || [],
          activeUserId: cloudData.activeUserId || state.activeUserId || 'usr_admin',
        });
      } else {
        // Upload local data to provision brand-new account storage
        await uploadAllToFirebase(state);
      }
    } catch (e) {
      console.error('Data Sync failed: ', e);
    } finally {
      setSyncing(false);
    }
  };

  // Google Sign-In with automatic sync integration
  const handleLogin = async () => {
    setAuthError(null);
    setIsRegisterMode(false);
    setAuthEmail('');
    setAuthPass('');
    setAuthName('');
    setShowLoginModal(true);
  };

  const handleGoogleSignInInline = async () => {
    try {
      setAuthWorking(true);
      setAuthError(null);
      const usr = await loginWithGoogle();
      if (usr) {
        await syncOnLoginSuccess(usr);
        setShowLoginModal(false);
      }
    } catch (e: any) {
      setAuthError(e.message || 'فشل تسجيل الدخول عبر حساب جوجل.');
    } finally {
      setAuthWorking(false);
    }
  };

  const handleEmailSignInInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPass) {
      setAuthError('يرجى كتابة البريد الإلكتروني وكلمة المرور.');
      return;
    }
    try {
      setAuthWorking(true);
      setAuthError(null);
      const usr = await loginWithEmail(authEmail, authPass);
      if (usr) {
        await syncOnLoginSuccess(usr);
        setShowLoginModal(false);
      }
    } catch (e: any) {
      let friendlyError = e.message;
      if (e.code === 'auth/wrong-password' || friendlyError.includes('password') || friendlyError.includes('credential')) {
        friendlyError = 'كلمة المرور أو البريد الإلكتروني غير صحيح، يرجى إعادة التحقق.';
      } else if (e.code === 'auth/user-not-found' || friendlyError.includes('user-not-found')) {
        friendlyError = 'هذا البريد الإلكتروني غير مرتبط بأي حساب نشط.';
      }
      setAuthError(friendlyError);
    } finally {
      setAuthWorking(false);
    }
  };

  const handleEmailRegisterInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPass || !authName) {
      setAuthError('يرجى تعبئة كافة الحقول المطلوبة لإنشاء حساب سحابي.');
      return;
    }
    if (authPass.length < 6) {
      setAuthError('يجب أن لا تقل قوة كلمة المرور عن 6 خانات أو حروف.');
      return;
    }
    try {
      setAuthWorking(true);
      setAuthError(null);
      const usr = await registerWithEmail(authEmail, authPass, authName);
      if (usr) {
        await syncOnLoginSuccess(usr);
        setShowLoginModal(false);
      }
    } catch (e: any) {
      let friendlyError = e.message;
      if (e.code === 'auth/email-already-in-use' || friendlyError.includes('email-already-in-use')) {
        friendlyError = 'البريد الإلكتروني مسجل بالفعل لصاحب منشأة أخرى.';
      }
      setAuthError(friendlyError);
    } finally {
      setAuthWorking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (e) {
      console.error('Logout error: ', e);
    }
  };

  // True Multi-directional Sync (Backup / Restore)
  const handleTriggerSync = async () => {
    if (!auth.currentUser) return;
    setSyncing(true);
    try {
      const cloudData = await downloadAllFromFirebase();
      if (cloudData.products && cloudData.products.length > 0) {
        const syncedState: ERPState = {
          products: cloudData.products,
          categories: cloudData.categories || [],
          customers: cloudData.customers || [],
          suppliers: cloudData.suppliers || [],
          orders: cloudData.orders || [],
          purchases: cloudData.purchases || [],
          expenses: cloudData.expenses || [],
          movements: cloudData.movements || [],
          settings: cloudData.settings || state.settings,
          users: cloudData.users || state.users || [],
          activeUserId: cloudData.activeUserId || state.activeUserId || 'usr_admin',
        };
        setState(syncedState);
        await uploadAllToFirebase(syncedState);
      } else {
        // Empty cloud database, backup current local state
        await uploadAllToFirebase(state);
      }
    } catch (e) {
      console.error('Cloud Sync error: ', e);
    } finally {
      setSyncing(false);
    }
  };

  // Factory reset trigger
  const handleResetDatabase = () => {
    setState(initialERPState);
    setCurrentView('dashboard');
  };

  // --- CRUD State Handlers ---

  // Products
  const handleAddProduct = (prod: Product) => {
    setState((prev) => ({
      ...prev,
      products: [prod, ...prev.products],
    }));
  };

  const handleUpdateProduct = (prod: Product) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === prod.id ? prod : p)),
    }));
  };

  const handleDeleteProduct = (id: string) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  };

  // Categories
  const handleAddCategory = (cat: Category) => {
    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, cat],
    }));
  };

  const handleUpdateCategory = (cat: Category) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === cat.id ? cat : c)),
    }));
  };

  const handleDeleteCategory = (id: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  };

  // Customers (CRM)
  const handleAddCustomer = (cust: Customer) => {
    setState((prev) => ({
      ...prev,
      customers: [...prev.customers, cust],
    }));
  };

  const handleUpdateCustomer = (cust: Customer) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) => (c.id === cust.id ? cust : c)),
    }));
  };

  const handleDeleteCustomer = (id: string) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
    }));
  };

  // Update customer balance (Debt modifications)
  const handleUpdateCustomerBalance = (customerId: string, balanceChange: number) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === customerId ? { ...c, balance: c.balance + balanceChange } : c
      ),
    }));
  };

  // Suppliers
  const handleAddSupplier = (sup: Supplier) => {
    setState((prev) => ({
      ...prev,
      suppliers: [...prev.suppliers, sup],
    }));
  };

  const handleUpdateSupplier = (sup: Supplier) => {
    setState((prev) => ({
      ...prev,
      suppliers: prev.suppliers.map((s) => (s.id === sup.id ? sup : s)),
    }));
  };

  const handleDeleteSupplier = (id: string) => {
    setState((prev) => ({
      ...prev,
      suppliers: prev.suppliers.filter((s) => s.id !== id),
    }));
  };

  // Update supplier payable balance value
  const handleUpdateSupplierPayables = (supplierId: string, balanceChange: number) => {
    setState((prev) => ({
      ...prev,
      suppliers: prev.suppliers.map((s) =>
        s.id === supplierId ? { ...s, payables: s.payables + balanceChange } : s
      ),
    }));
  };

  // Invoices (Sales Orders)
  const handleAddOrder = (order: Order) => {
    setState((prev) => ({
      ...prev,
      orders: [order, ...prev.orders],
    }));
  };

  const handleRefundOrder = (orderId: string) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'refunded' as const } : o
      ),
    }));
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
    }));
  };

  // Procurement purchases
  const handleAddPurchase = (purchase: Purchase) => {
    setState((prev) => ({
      ...prev,
      purchases: [purchase, ...prev.purchases],
    }));
  };

  // Expenses logs
  const handleAddExpense = (exp: Expense) => {
    setState((prev) => ({
      ...prev,
      expenses: [exp, ...prev.expenses],
    }));
  };

  const handleDeleteExpense = (id: string) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  // Inventory movements
  const handleAddMovement = (m: InventoryMovement) => {
    setState((prev) => ({
      ...prev,
      movements: [m, ...prev.movements],
    }));
  };

  // Custom bulk stock addition/subtraction
  const handleAdjustProductStock = (productId: string, val: number) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === productId ? { ...p, stockQuantity: Math.max(0, p.stockQuantity + val) } : p
      ),
    }));
  };

  // Settings
  const handleUpdateSettings = (updated: CompanySettings) => {
    setState((prev) => ({
      ...prev,
      settings: updated,
    }));
  };

  // --- Staff & Permissions Handlers ---
  const handleAddUser = (newUser: SystemUser) => {
    setState((prev) => ({
      ...prev,
      users: [...(prev.users || []), newUser],
    }));
  };

  const handleUpdateUser = (updatedUser: SystemUser) => {
    setState((prev) => ({
      ...prev,
      users: (prev.users || []).map((u) => (u.id === updatedUser.id ? updatedUser : u)),
    }));
  };

  const handleDeleteUser = (userId: string) => {
    setState((prev) => ({
      ...prev,
      users: (prev.users || []).filter((u) => u.id !== userId),
    }));
  };

  const handleSwitchUser = (userId: string) => {
    setState((prev) => ({
      ...prev,
      activeUserId: userId,
    }));
  };

  // --- Render Router ---
  const renderViewContent = () => {
    const sym = state.settings.currencySymbol;

    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            products={state.products}
            orders={state.orders}
            expenses={state.expenses}
            onNavigate={setCurrentView}
            currencySymbol={sym}
          />
        );

      case 'pos':
        return (
          <POSView
            products={state.products}
            categories={state.categories}
            customers={state.customers}
            orders={state.orders}
            onAddOrder={handleAddOrder}
            onUpdateInventory={(prodId, qty) => handleAdjustProductStock(prodId, -qty)}
            onUpdateCustomerBalance={handleUpdateCustomerBalance}
            currencySymbol={sym}
            defaultTaxRate={state.settings.taxRate}
            settings={state.settings}
          />
        );

      case 'products':
        return (
          <ProductsView
            products={state.products}
            categories={state.categories}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            currencySymbol={sym}
          />
        );

      case 'categories':
        return (
          <CategoriesView
            categories={state.categories}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        );

      case 'customers':
        return (
          <CustomersView
            customers={state.customers}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        );

      case 'suppliers':
        return (
          <SuppliersView
            suppliers={state.suppliers}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            currencySymbol={sym}
          />
        );

      case 'inventory':
        return (
          <InventoryView
            products={state.products}
            movements={state.movements}
            onAddMovement={handleAddMovement}
            onAdjustProductStock={handleAdjustProductStock}
            currencySymbol={sym}
          />
        );

      case 'purchases':
        return (
          <PurchasesView
            products={state.products}
            suppliers={state.suppliers}
            purchases={state.purchases}
            onAddPurchase={handleAddPurchase}
            onAdjustProductStock={handleAdjustProductStock}
            onUpdateSupplierPayables={handleUpdateSupplierPayables}
            currencySymbol={sym}
          />
        );

      case 'sales':
        return (
          <SalesView
            orders={state.orders}
            products={state.products}
            onRefundOrder={handleRefundOrder}
            onUpdateOrder={handleUpdateOrder}
            onRestockProduct={handleAdjustProductStock}
            onUpdateCustomerBalance={handleUpdateCustomerBalance}
            currencySymbol={sym}
            activeUser={activeUser}
            settings={state.settings}
          />
        );

      case 'expenses':
        return (
          <ExpensesView
            expenses={state.expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            currencySymbol={sym}
          />
        );

      case 'reports':
        return (
          <ReportsView
            products={state.products}
            orders={state.orders}
            purchases={state.purchases}
            expenses={state.expenses}
            customers={state.customers}
            suppliers={state.suppliers}
            currencySymbol={sym}
          />
        );

      case 'settings':
        return (
          <SettingsView
            settings={state.settings}
            onUpdateSettings={handleUpdateSettings}
            onTriggerSync={handleCloudSyncSimulator}
            syncing={syncing}
            onResetDatabase={handleResetDatabase}
          />
        );

      case 'users':
        return (
          <UsersView
            users={state.users || []}
            activeUserId={activeUserId}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onSwitchUser={handleSwitchUser}
          />
        );

      default:
        return (
          <div className="py-20 text-center text-slate-400 font-bold">
            هذا القسم قيد التجهيز الفني...
          </div>
        );
    }
  };

  // Background Cloud synchronization logs generator helper
  const handleCloudSyncSimulator = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
    }, 2000);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 text-slate-800 flex flex-col lg:flex-row font-sans overflow-x-hidden antialiased"
    >
      {/* Sidebar for navigations */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        syncing={syncing}
        onTriggerSync={handleTriggerSync}
        companyName={state.settings.name}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        activeUser={activeUser}
      />

      {/* Main viewport area layout */}
      <main className="flex-1 overflow-y-auto h-screen p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Breadcrumb row header */}
        <div className="flex justify-between items-center bg-white px-5 py-3 rounded-2xl border border-slate-200/60 shadow-sm shrink-0">
          <div className="space-y-0.5">
            {user ? (
              <span className="text-[10px] bg-emerald-100/80 text-emerald-805 px-2.5 py-0.5 rounded-full font-bold">
                نشط اتصال سحابي • Firebase Cloud Active
              </span>
            ) : (
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-bold">
                نشط دون اتصال • SQLite Offline Mode
              </span>
            )}
            <h2 className="font-extrabold text-slate-905 tracking-wide text-sm sm:text-base">
              {currentView === 'dashboard' ? 'اللوحة الإحصائية والربحية' :
               currentView === 'pos' ? 'نقطة البيع والمبيعات المباشرة' :
               currentView === 'products' ? 'كتالوج ومخزون المنتجات' :
               currentView === 'categories' ? 'الأقسام والتصنيفات المخزنية' :
               currentView === 'customers' ? 'قاعدة بيانات حسابات العملاء' :
               currentView === 'suppliers' ? 'دليل شركات الموردين' :
               currentView === 'inventory' ? 'حركات الدخول والخروج للمستودع' :
               currentView === 'purchases' ? 'فواتير مشتريات بضائع الجملة' :
               currentView === 'sales' ? 'شريط مبيعات الموظفين والفواتير' :
               currentView === 'expenses' ? 'سندات صرف النقدية التشغيلية' :
               currentView === 'reports' ? 'التقارير والموازنة الحسابية' :
               'إعدادات قالب هيدر الفواتير'}
            </h2>
          </div>

          <div className="hidden sm:flex items-center gap-3 font-medium text-xs text-slate-500">
            <span>القسم:</span>
            <span className="font-bold text-indigo-650 bg-indigo-50 px-3 py-1 rounded-lg">
              {currentView.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Dynamic component layout container */}
        <div className="animate-fade-in relative">
          {renderViewContent()}
        </div>
      </main>

      {/* --- Responsive Cloud Login Modal overlay --- */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-[340px] sm:max-w-md overflow-hidden shadow-2xl border border-slate-100 text-slate-800 flex flex-col text-right animate-scale-up"
            >
              {/* Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Cloud size={16} className="text-emerald-400 animate-pulse" />
                  <span className="font-bold text-xs sm:text-sm">بوابة المزامنة السحابية • Sync Portal</span>
                </div>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-800 w-6 h-6 flex items-center justify-center text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh]">
                {authError && (
                  <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-xs text-red-700 flex items-start gap-2 leading-relaxed">
                    <ShieldAlert size={16} className="shrink-0 text-red-500 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Login/Register Form */}
                <form onSubmit={isRegisterMode ? handleEmailRegisterInline : handleEmailSignInInline} className="space-y-4">
                  {isRegisterMode && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 block">اسم المتجر أو المالك:</label>
                      <div className="relative">
                        <UserIcon size={14} className="absolute right-3.5 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition leading-relaxed text-right font-bold"
                          placeholder="مثال: سوبرماركت البرق"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">البريد الإلكتروني للقرص السحابي:</label>
                    <div className="relative">
                      <Mail size={14} className="absolute right-3.5 top-3.5 text-slate-400" />
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition leading-relaxed text-left font-mono"
                        placeholder="name@owner.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block">كلمة المرور السحابية:</label>
                    <div className="relative">
                      <Lock size={14} className="absolute right-3.5 top-3.5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={authPass}
                        onChange={(e) => setAuthPass(e.target.value)}
                        className="w-full pr-10 pl-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition leading-relaxed text-left font-mono"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authWorking}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
                  >
                    {authWorking ? (
                      <Loader2 size={14} className="animate-spin text-white" />
                    ) : (
                      <LogIn size={14} />
                    )}
                    <span>
                      {isRegisterMode 
                        ? 'إنشاء حساب جديد وتفعيل المزامنة' 
                        : 'تسجيل الدخول ومزامنة النظام'}
                    </span>
                  </button>
                </form>

                {/* Toggle Login/Register */}
                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      setIsRegisterMode(!isRegisterMode);
                      setAuthError(null);
                    }}
                    className="text-xs text-indigo-650 hover:text-indigo-800 font-bold underline transition"
                  >
                    {isRegisterMode 
                      ? 'لديك حساب بالفعل؟ سجل دخولك من هنا' 
                      : 'ليس لديك حساب سحابي؟ سجل منشأتك مجاناً الآن'}
                  </button>
                </div>

                {/* Or divider */}
                <div className="relative my-3 flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-150"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase font-mono">أو عن طريق جوجل</span>
                  <div className="flex-grow border-t border-slate-150"></div>
                </div>

                {/* Google Google SSO Login */}
                <button
                  onClick={handleGoogleSignInInline}
                  disabled={authWorking}
                  type="button"
                  className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-205 text-xs shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {authWorking ? (
                    <Loader2 size={13} className="animate-spin text-slate-500" />
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6a5.64 5.64 0 0 1-2.44 3.7l3.8 2.93c2.23-2.05 3.78-5.07 3.78-8.46Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.8-2.93c-1.05.7-2.4 1.13-4.13 1.13-3.18 0-5.86-2.15-6.82-5.05L1.31 17.3c2.01 4 6.13 6.7 10.69 6.7Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.18 14.19A7.16 7.16 0 0 1 4.8 12c0-.76.13-1.5.38-2.19L1.31 6.88A11.94 11.94 0 0 0 0 12c0 1.87.43 3.64 1.19 5.23l3.99-3.04Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.44 0 3.32 2.7 1.31 6.88l3.87 3.03c.96-2.9 3.64-5.16 6.82-5.16Z"
                      />
                    </svg>
                  )}
                  <span>الدخول السريع بحساب Google</span>
                </button>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
