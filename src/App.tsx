import React from 'react';
import { ERPState, Product, Category, Customer, Supplier, Order, Purchase, Expense, InventoryMovement, CompanySettings } from './types';
import { initialERPState } from './data/initialData';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser } from './lib/firebase';
import { uploadAllToFirebase, downloadAllFromFirebase } from './lib/firebaseSync';

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

const STORAGE_KEY = 'SMART_POS_ERP_STATE_V1';

export default function App() {
  const [currentView, setCurrentView] = React.useState<string>('dashboard');
  const [syncing, setSyncing] = React.useState<boolean>(false);
  const [user, setUser] = React.useState<User | null>(null);
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

  // Google Sign-In with automatic sync integration
  const handleLogin = async () => {
    try {
      setSyncing(true);
      const usr = await loginWithGoogle();
      if (usr) {
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
          });
        } else {
          // Upload local data to provision brand-new account storage
          await uploadAllToFirebase(state);
        }
      }
    } catch (e) {
      console.error('Sign-in failed: ', e);
    } finally {
      setSyncing(false);
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
            onRestockProduct={handleAdjustProductStock}
            onUpdateCustomerBalance={handleUpdateCustomerBalance}
            currencySymbol={sym}
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
    </div>
  );
}
