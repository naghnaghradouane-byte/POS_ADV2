import React from 'react';
import { Product, Order, Expense } from '../types';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Receipt,
  ArrowUpRight,
  PackageCheck,
  ShoppingCart,
  Users
} from 'lucide-react';

interface DashboardViewProps {
  products: Product[];
  orders: Order[];
  expenses: Expense[];
  onNavigate: (view: string) => void;
  currencySymbol: string;
}

export default function DashboardView({
  products,
  orders,
  expenses,
  onNavigate,
  currencySymbol,
}: DashboardViewProps) {
  // Compute analytics based on simulated dates (June 2026 matches local current time 2026-06-04)
  const todayStr = '2026-06-04'; // Match local time from instructions

  // Filter today's sales
  const todayOrders = orders.filter(
    (o) => o.date.startsWith(todayStr) && o.status !== 'returned'
  );
  const dailySalesTotal = todayOrders.reduce((sum, o) => sum + o.total, 0);

  // Month-to-date sales (June 2026)
  const monthlyOrders = orders.filter(
    (o) => o.date.startsWith('2026-06') && o.status !== 'returned'
  );
  const monthlySalesTotal = monthlyOrders.reduce((sum, o) => sum + o.total, 0);

  // Cost of goods sold (COGS) to calculate real net profit
  // (We match order items back to product costPrice where possible)
  const calculateCOGS = (ordersList: Order[]) => {
    let totalCOGS = 0;
    ordersList.forEach((order) => {
      order.items.forEach((item) => {
        // Find product to determine cost
        const prod = products.find((p) => p.id === item.productId);
        const cost = prod ? prod.costPrice : item.price * 0.7; // default fallback 70%
        totalCOGS += cost * item.quantity;
      });
    });
    return totalCOGS;
  };

  const monthlyCOGS = calculateCOGS(monthlyOrders);
  const monthlyExpenses = expenses
    .filter((e) => e.date.startsWith('2026-06'))
    .reduce((sum, e) => sum + e.amount, 0);

  const monthlyNetProfit = Math.max(0, monthlySalesTotal - monthlyCOGS - monthlyExpenses);

  // Low stock alert list
  const lowStockProducts = products.filter(
    (p) => p.stockQuantity <= p.minStockAlert
  );

  // Top products sold ranking
  const productSalesMap: Record<string, { name: string; qty: number; total: number }> = {};
  orders.forEach((o) => {
    if (o.status !== 'returned') {
      o.items.forEach((item) => {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = { name: item.productName, qty: 0, total: 0 };
        }
        productSalesMap[item.productId].qty += item.quantity;
        productSalesMap[item.productId].total += item.price * item.quantity;
      });
    }
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 4);

  // Dynamic SVG Chart computation (daily sales for June 1st to 4th)
  const dailyChartData = [
    { label: '01 يونيو', value: 850 },
    { label: '02 يونيو', value: 1200 },
    { label: '03 يونيو', value: 193 }, // from inv_101
    { label: '04 يونيو', value: Math.round(orders.filter((o) => o.date.startsWith('2026-06-04')).reduce((s, o) => s + o.total, 0)) },
  ];

  const maxChartVal = Math.max(...dailyChartData.map((d) => d.value), 1000);

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Top Banner with Clock / Greeting */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-lg border border-slate-700/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-12" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">مرحباً بك مجدداً، مدير النظام 👋</h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1">
              التقرير العام لمبيعات اليوم والمستودعات. النظام محدّث ويعمل بكامل كفاءته دون اتصال بالإنترنت.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-700/65 font-mono text-xs md:text-sm text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>4 يونيو 2026</span>
            <span className="border-r border-slate-700 pr-2">06:26 م (Local)</span>
          </div>
        </div>
      </div>

      {/* KPI Core Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">مبيعات اليوم</p>
            <h3 className="text-2xl font-black text-slate-900 font-mono">
              {dailySalesTotal.toFixed(2)} <span className="text-xs font-normal text-slate-500">{currencySymbol}</span>
            </h3>
            <p className="text-[11px] text-emerald-600 flex items-center gap-1">
              <span className="font-mono">+{todayOrders.length}</span> فواتير مباعة اليوم
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <ShoppingCart size={22} />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">مبيعات الشهر الحالي</p>
            <h3 className="text-2xl font-black text-indigo-900 font-mono">
              {monthlySalesTotal.toFixed(2)} <span className="text-xs font-normal text-slate-500">{currencySymbol}</span>
            </h3>
            <p className="text-[11px] text-indigo-600 flex items-center gap-1">
              <span className="font-mono">+{monthlyOrders.length}</span> إجمالي مبيعات يونيو
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">صافي الربح التقديري</p>
            <h3 className="text-2xl font-black text-emerald-700 font-mono">
              {monthlyNetProfit.toFixed(2)} <span className="text-xs font-normal text-slate-500">{currencySymbol}</span>
            </h3>
            <p className="text-[11px] text-slate-500">خصم ثمن التكلفة والمصروفات</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100/60 flex items-center justify-center text-emerald-700">
            <PackageCheck size={22} />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500">تنبيهات نواقص المخزن</p>
            <h3 className={`text-2xl font-black font-mono ${lowStockProducts.length > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-800'}`}>
              {lowStockProducts.length} <span className="text-xs font-normal text-slate-500">منتجات</span>
            </h3>
            <p className="text-[11px] text-amber-700 font-medium">وصلت للحد الأدنى المسموح</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockProducts.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* Charts & Top lists block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart Analytics Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-800">مخطط الإيرادات اليومية</h3>
              <p className="text-xs text-slate-500">حركة المبيعات خلال الأيام الأربعة الأخيرة لشهر يونيو</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 font-bold text-slate-600">
              إحصاء فوري
            </span>
          </div>

          {/* SVG Custom Sales Graph */}
          <div className="relative pt-4 h-60">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#e2e8f0" strokeWidth="1" />

              {/* Values and Line */}
              {(() => {
                const getPoints = () => {
                  const paddingX = 110;
                  const startX = 60;
                  return dailyChartData.map((d, index) => {
                    const x = startX + index * paddingX;
                    const y = 170 - (d.value / maxChartVal) * 130;
                    return { x, y, label: d.label, val: d.value };
                  });
                };
                const points = getPoints();
                const dPath = points.reduce((str, p, index) => {
                  return str + (index === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
                }, '');
                const dArea = dPath + ` L ${points[points.length - 1].x} 170 L ${points[0].x} 170 Z`;

                return (
                  <>
                    {/* Shadow Area under the line */}
                    <path d={dArea} fill="url(#chartGrad)" />

                    {/* Main Line with Pulse */}
                    <path d={dPath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Nodes and Labels */}
                    {points.map((p, index) => (
                      <g key={index} className="group cursor-pointer">
                        <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#10b981" strokeWidth="3" />
                        <circle cx={p.x} cy={p.y} r="10" fill="#10b981" fillOpacity="0.1" className="hover:scale-150 transition-all duration-200" />
                        
                        {/* Tooltip text */}
                        <text x={p.x} y={p.y - 12} textAnchor="middle" className="font-mono text-10px font-extrabold fill-emerald-600">
                          {p.val} ر.س
                        </text>

                        {/* Axis X Label */}
                        <text x={p.x} y="190" textAnchor="middle" className="text-11px font-medium fill-slate-500">
                          {p.label}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* Top Product list Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800">الأكثر مبيعاً</h3>
            <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">
              تحديث يومي
            </span>
          </div>

          <div className="divide-y divide-slate-100 space-y-3.5 pt-1">
            {topProducts.length > 0 ? (
              topProducts.map((prod, index) => (
                <div key={index} className="flex items-center gap-3 pt-3.5 first:pt-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm font-mono shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-slate-800 truncate">{prod.name}</p>
                    <p className="text-[10px] text-slate-500">تم بيع {prod.qty} وحدات</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-800 shrink-0">
                    {prod.total.toFixed(2)} {currencySymbol}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">لا توجد مبيعات مسجلة حتى الآن.</p>
            )}
          </div>
          <button
            onClick={() => onNavigate('pos')}
            className="w-full mt-2 text-center text-xs text-emerald-600 font-extrabold hover:text-emerald-700 flex items-center justify-center gap-1 group py-2 bg-emerald-50/50 rounded-xl"
          >
            <span>انتقل لشاشة البيع لتسجيل مبيعات جديدة</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition" />
          </button>
        </div>
      </div>

      {/* Row: Low Stock list & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts (1/3 of row) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <AlertTriangle className="text-amber-500 shrink-0" size={18} />
            <h3 className="font-bold text-slate-800">تنبيهات نقص المخزن</h3>
          </div>

          <div className="space-y-3 pt-1">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 bg-amber-50/70 border border-amber-200/50 rounded-xl flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-800 truncate">{prod.name}</p>
                    <p className="text-[10px] text-amber-700 font-mono">الحد الأدنى: {prod.minStockAlert}</p>
                  </div>
                  <div className="text-left">
                    <span className="px-2 py-0.5 text-10px font-extrabold bg-amber-100 text-amber-800 rounded-md block">
                      متبقي {prod.stockQuantity}
                    </span>
                    <button
                      onClick={() => onNavigate('inventory')}
                      className="text-[9px] text-indigo-600 font-extrabold hover:underline mt-1 block"
                    >
                      طلب توريد
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 font-medium">
                ✨ جميع البضائع كافية ومستقرة!
              </div>
            )}
          </div>
        </div>

        {/* Recent Invoices list (2/3 of row) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Receipt className="text-emerald-500 shrink-0" size={18} />
              <h3 className="font-bold text-slate-800">الفواتير المستخرجة مؤخراً</h3>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs text-bold text-indigo-600 hover:underline"
            >
              عرض الكل
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="p-3">رقم الفاتورة</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">طريقة الدفع</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3 text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.slice(0, 4).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-emerald-600">{order.invoiceNumber}</td>
                    <td className="p-3 text-slate-800">{order.customerName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        order.paymentMethod === 'cash' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        order.paymentMethod === 'card' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        order.paymentMethod === 'debt' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {order.paymentMethod === 'cash' ? 'نقدي' :
                         order.paymentMethod === 'card' ? 'بطاقة مدا' :
                         order.paymentMethod === 'transfer' ? 'تحويل بنكي' :
                         'آجل (دين)'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 font-mono">
                      {new Date(order.date).toLocaleDateString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3 text-left font-mono font-extrabold text-slate-800">
                      {order.total.toFixed(2)} {currencySymbol}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
