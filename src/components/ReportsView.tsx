import React from 'react';
import { Product, Order, Purchase, Expense, Customer, Supplier } from '../types';
import { BarChart3, TrendingUp, AlertTriangle, Users, Truck, Info, Printer } from 'lucide-react';

interface ReportsViewProps {
  products: Product[];
  orders: Order[];
  purchases: Purchase[];
  expenses: Expense[];
  customers: Customer[];
  suppliers: Supplier[];
  currencySymbol: string;
}

export default function ReportsView({
  products,
  orders,
  purchases,
  expenses,
  customers,
  suppliers,
  currencySymbol,
}: ReportsViewProps) {
  // 1. Calculate Core Financial Totals based on June 2026 logs
  const completedOrders = orders.filter((o) => o.status !== 'returned' && o.status !== 'refunded');
  const grossSales = completedOrders.reduce((s, o) => s + o.total, 0);

  // Cost of Sold Goods (COGS)
  let totalCOGS = 0;
  completedOrders.forEach((o) => {
    o.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const costPerUnit = prod ? prod.costPrice : item.price * 0.7; // default 70% fallback
      totalCOGS += costPerUnit * item.quantity;
    });
  });

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = Math.max(0, grossSales - totalCOGS - totalExpenses);

  // 2. Customers Debt Total Sum
  const totalCustomerDebt = customers.reduce((s, c) => s + c.balance, 0);

  // 3. Suppliers Payable Outstanding Total Sum
  const totalSupplierPayables = suppliers.reduce((s, sup) => s + sup.payables, 0);

  // 4. Inventory stats
  const totalStockItems = products.reduce((s, p) => s + p.stockQuantity, 0);
  const lowStockItemsCount = products.filter((p) => p.stockQuantity <= p.minStockAlert).length;
  const totalAssetValue = products.reduce((s, p) => s + p.costPrice * p.stockQuantity, 0);

  return (
    <div className="space-y-6" id="reports-container">
      {/* Financial statement summary grid */}
      <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">التقرير المالي العام والأرباح</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI 1: Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">إجمالي حجم المبيعات (الركام)</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">{grossSales.toFixed(2)}</span>
            <span className="text-xs font-semibold text-slate-500">{currencySymbol}</span>
          </div>
          <p className="text-[9px] text-slate-450 mt-1">المبيعات الإجمالية المحققة والمدفوعة</p>
        </div>

        {/* KPI 2: Total cost of inventories sold */}
        <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">تكلفة البضاعة المباعة (جملة)</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-slate-800 font-mono">{totalCOGS.toFixed(2)}</span>
            <span className="text-xs font-semibold text-slate-500">{currencySymbol}</span>
          </div>
          <p className="text-[9px] text-slate-450 mt-1">التكلفة الأساسية للسلع قبل هامش البيع</p>
        </div>

        {/* KPI 3: Operational overhead */}
        <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">المصاريف التشغيلية المدفوعة</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-rose-600 font-mono">{totalExpenses.toFixed(2)}</span>
            <span className="text-xs font-semibold text-slate-500">{currencySymbol}</span>
          </div>
          <p className="text-[9px] text-slate-450 mt-1">فواتير، رواتب وبنود الصرف اليومية</p>
        </div>

        {/* KPI 4: Absolute Net Profit margin */}
        <div className="bg-gradient-to-tr from-emerald-500/10 to-teal-400/5 p-5 rounded-2xl border border-emerald-500/30 shadow-xs">
          <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">صافي الأرباح النهائية التقديرية</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-emerald-700 font-mono">{netProfit.toFixed(2)}</span>
            <span className="text-xs font-semibold text-slate-500">{currencySymbol}</span>
          </div>
          <p className="text-[9px] text-emerald-600 mt-1 font-bold">تم خفض ثمن تكلفة السلع والمصاريف</p>
        </div>
      </div>

      {/* Row 2: Debt books CRM vs suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Unpaid customer liabilities ledger */}
        <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Users size={16} className="text-emerald-500" />
              أرصدة حسابات ديون العملاء (الأجل)
            </span>
            <span className="font-mono text-11px font-black bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-md">
              الإجمالي المدين: {totalCustomerDebt.toFixed(0)} {currencySymbol}
            </span>
          </div>

          <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
            {customers.filter((c) => c.balance > 0).map((c) => (
              <div key={c.id} className="flex justify-between items-center p-3 bg-rose-50/20 border border-slate-100 rounded-xl">
                <div>
                  <p className="font-bold text-xs text-slate-800">{c.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">الجوال: {c.phone} | حد الدين: {c.debtLimit} ر.س</p>
                </div>
                <span className="font-mono text-xs font-black text-rose-700">
                  {c.balance.toFixed(2)} {currencySymbol}
                </span>
              </div>
            ))}
            {customers.filter((c) => c.balance > 0).length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">لا يوجد أي مديونيات معلقة للعملاء.</p>
            )}
          </div>
        </div>

        {/* Outstanding Suppliers payables ledger */}
        <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Truck size={16} className="text-indigo-500" />
              أرصدة مستحقات الموردين ومذمات الشراء
            </span>
            <span className="font-mono text-11px font-black bg-slate-900 text-amber-400 px-2.5 py-0.5 rounded-md">
              الإجمالي المستحق لهم: {totalSupplierPayables.toFixed(0)} {currencySymbol}
            </span>
          </div>

          <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
            {suppliers.filter((s) => s.payables > 0).map((s) => (
              <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <p className="font-bold text-xs text-slate-800">{s.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">المندوب للتواصل: {s.contactPerson} • هاتف: {s.phone}</p>
                </div>
                <span className="font-mono text-xs font-black text-amber-600">
                  {s.payables.toFixed(2)} {currencySymbol}
                </span>
              </div>
            ))}
            {suppliers.filter((s) => s.payables > 0).length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">لا توجد ديون مستحقة لأي من الموردين.</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Inventory Audit statement */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <BarChart3 size={16} className="text-purple-500" />
            جرد وتقييم قيمة المستودع الحالي
          </span>
          <span className="font-mono text-11px font-bold bg-slate-100 text-slate-650 px-2.5 py-0.5 rounded-md">
            عدد النواقص: {lowStockItemsCount} منتجات مصنفة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-purple-50/50 border border-purple-100/50 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-500 block">إجمالي المنتجات المخزنة</span>
            <span className="text-lg font-black font-mono text-purple-700">{totalStockItems} حبة</span>
          </div>
          <div className="p-4 bg-emerald-50/50 border border-emerald-110 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-500 block">التقييم الجملي للمخزن بفاتورة التكلفة</span>
            <span className="text-lg font-black font-mono text-emerald-700">
              {totalAssetValue.toFixed(2)} {currencySymbol}
            </span>
          </div>
          <div className="p-4 bg-amber-50/50 border border-amber-110 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-505 block">تنبيه المنتجات الشبه نافذة</span>
            <span className="text-lg font-black font-mono text-amber-700">{lowStockItemsCount} أصناف</span>
          </div>
        </div>

        {/* Warning label details */}
        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-[10px] font-bold text-slate-500 flex items-center gap-2">
          <Info size={14} className="text-indigo-505 shrink-0" />
          <span>
            تقترن هذه الحسابات تلقائياً ببيانات حركة المخزن ومبيعات الـ POS اللحظية. يمكنك ضغط الزر التالي لمحاكاة تذليل تقرير PDF للطباعة.
          </span>
        </div>
      </div>
    </div>
  );
}
