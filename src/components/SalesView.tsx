import React from 'react';
import { Order, Product } from '../types';
import { Search, Receipt, ArrowLeftRight, Check, Printer, X, ShoppingBag } from 'lucide-react';

interface SalesViewProps {
  orders: Order[];
  products: Product[];
  onRefundOrder: (orderId: string) => void;
  onRestockProduct: (productId: string, val: number) => void;
  onUpdateCustomerBalance: (customerId: string, balanceChange: number) => void;
  currencySymbol: string;
}

export default function SalesView({
  orders,
  products,
  onRefundOrder,
  onRestockProduct,
  onUpdateCustomerBalance,
  currencySymbol,
}: SalesViewProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // printable receipt overlay state
  const [viewedOrder, setViewedOrder] = React.useState<Order | null>(null);

  const handleProcessRefund = (order: Order) => {
    if (order.status === 'refunded' || order.status === 'returned') {
      alert('تم بالفعل ترحيل هذه الفاتورة وتنسيق المرتجعات السابقة الخاصة بها.');
      return;
    }

    if (confirm(`هل أنت متأكد من رغبتك في إرجاع الفاتورة رقم ${order.invoiceNumber} بالكامل وإلغاء المبيعات؟`)) {
      // 1. Process local state update status
      onRefundOrder(order.id);

      // 2. Replenish products inventory back upwards
      order.items.forEach((item) => {
        onRestockProduct(item.productId, item.quantity);
      });

      // 3. Deduct from client debt balance if it was purchased under "debt" payment type
      if (order.paymentMethod === 'debt' && order.customerId) {
        onUpdateCustomerBalance(order.customerId, -order.total);
      }

      alert('تم استيراد المرتجعات وتوليد سند التنازل وإعادة المنتجات لرفوف المستودع.');
    }
  };

  const filteredOrders = orders.filter((order) => {
    return (
      order.invoiceNumber.includes(searchQuery) ||
      order.customerName.includes(searchQuery) ||
      order.paymentMethod.includes(searchQuery)
    );
  });

  return (
    <div className="space-y-5">
      {/* Search Header widget */}
      <div className="bg-white p-4 rounded-2xl border border-slate-205 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search size={16} className="absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث برقم الفاتورة أو اسم الزبون..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <span className="text-[10px] bg-indigo-50 font-black text-indigo-700 border border-indigo-150 px-3 py-1.5 rounded-xl block font-mono">
          تم معالجة {orders.length} معاملات مبيعات بنجاح
        </span>
      </div>

      {/* Main invoices list table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="sales-history-table">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-505 font-bold">
                <th className="p-3.5">رقم الفاتورة</th>
                <th className="p-3.5">العميل</th>
                <th className="p-3.5">طريقة الدفع</th>
                <th className="p-3.5">التاريخ والوقت</th>
                <th className="p-3.5 text-center">أصناف الفاتورة</th>
                <th className="p-3.5 text-left">قيمة الفاتورة المعتمدة</th>
                <th className="p-3.5 text-center">حالة الفاتورة</th>
                <th className="p-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrders.map((order) => {
                const isRefunded = order.status === 'refunded' || order.status === 'returned';
                return (
                  <tr key={order.id} className="hover:bg-slate-50/20">
                    <td className="p-3.5 font-mono font-bold text-emerald-600">{order.invoiceNumber}</td>
                    <td className="p-3.5 text-slate-800">{order.customerName}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        order.paymentMethod === 'cash' ? 'bg-emerald-50 text-emerald-700 border border-emerald-110' :
                        order.paymentMethod === 'card' ? 'bg-blue-50 text-blue-700 border border-blue-110' :
                        order.paymentMethod === 'debt' ? 'bg-rose-50 text-rose-700 border border-rose-110' :
                        'bg-amber-50 text-amber-700 border border-amber-110'
                      }`}>
                        {order.paymentMethod === 'cash' ? 'نقدي' :
                         order.paymentMethod === 'card' ? 'بطاقة مادا' :
                         order.paymentMethod === 'transfer' ? 'تحويل بنكي' :
                         'آجل (دين)'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono">
                      {new Date(order.date).toLocaleString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3.5 text-center text-slate-650 font-bold">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} وحدات ({order.items.length} أصناف)
                    </td>
                    <td className="p-3.5 text-left font-mono font-black text-slate-900">
                      {order.total.toFixed(2)} {currencySymbol}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        isRefunded ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isRefunded ? 'مرتجع / ملغية' : 'مكتملة ومرحلة'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewedOrder(order)}
                          className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md text-[10px] font-bold flex items-center gap-1 shrink-0"
                          title="عرض إيصال استلام حراري"
                        >
                          <Receipt size={12} />
                          <span>الإيصال</span>
                        </button>
                        
                        {!isRefunded && (
                          <button
                            onClick={() => handleProcessRefund(order)}
                            className="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 rounded-md text-[10px] font-extrabold flex items-center gap-1 shrink-0"
                            title="إرجاع المبيعات"
                          >
                            <ArrowLeftRight size={12} />
                            <span>إرجاع الفاتورة</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    لا يوجد فواتير مبيعات مسجلة ومحفوظة حالياً بالبحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Thermal view Modal dialog */}
      {viewedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 text-slate-800 flex flex-col max-h-[85vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <span className="font-bold text-xs">عرض الإيصال: {viewedOrder.invoiceNumber}</span>
              <button
                onClick={() => setViewedOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Simulated Printed Thermal Paper layout */}
            <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] text-right bg-amber-50/10 space-y-4">
              <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
                <p className="text-base font-black tracking-tight text-slate-900">سوبرماركت البرق التجاري</p>
                <p className="text-slate-500 text-[10px]">الرياض - شارع التخصصي</p>
                <p className="text-slate-500 text-[10px]">الهاتف: 0555555555</p>
                <p className="text-slate-500 font-bold text-[10px]">الرقم الضريبي VAT: 310022334400003</p>
              </div>

              <div className="space-y-1 text-slate-600 border-b border-dashed border-slate-250 pb-3">
                <p>رقم الفاتورة: <strong className="text-slate-900 font-bold">{viewedOrder.invoiceNumber}</strong></p>
                <p>التاريخ: {new Date(viewedOrder.date).toLocaleString('ar-EG')}</p>
                <p>العميل المستلم: {viewedOrder.customerName}</p>
                <p>الحالة الضريبية: {viewedOrder.status === 'refunded' ? 'مرتجع / مسترجع بالكامل' : 'مبيعات مكتملة بضريبة 15%'}</p>
              </div>

              {/* Items List */}
              <div className="space-y-2 border-b border-dashed border-slate-200 pb-3">
                <div className="flex font-bold text-slate-900 text-[11px] pb-1">
                  <span className="w-1/2">البيان (المنتج)</span>
                  <span className="w-1/6 text-center">الكمية</span>
                  <span className="w-1/3 text-left">المجموع</span>
                </div>
                {viewedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex text-slate-700 leading-tight">
                    <div className="w-1/2 pr-1">
                      <p className="truncate font-bold text-[10px]">{item.productName}</p>
                      <p className="text-[9px] text-slate-400 font-mono">
                        {item.price.toFixed(2)} {item.discount > 0 ? `(خصم %${item.discount})` : ''}
                      </p>
                    </div>
                    <span className="w-1/6 text-center font-bold">{item.quantity}</span>
                    <span className="w-1/3 text-left font-bold">
                      {((item.price - item.price * (item.discount / 100)) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Aggregated sums */}
              <div className="space-y-1.5 text-slate-800 text-[11px] border-b border-dashed border-slate-200 pb-3">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold">{viewedOrder.subtotal.toFixed(2)} {currencySymbol}</span>
                </div>
                {viewedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>الخصومات الكلية الممنوحة:</span>
                    <span>-{viewedOrder.discountAmount.toFixed(2)} {currencySymbol}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>ضريبة القيمة المضافة 15%:</span>
                  <span className="font-bold">{viewedOrder.taxAmount.toFixed(2)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-950 border-t border-slate-305 pt-1.5">
                  <span>الإجمالي الكلي:</span>
                  <span className="font-mono">{viewedOrder.total.toFixed(2)} {currencySymbol}</span>
                </div>
              </div>

              {/* QR Code Simulation */}
              <div className="flex flex-col items-center justify-center pt-3 pb-2 space-y-1 border-t border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-900 p-2 rounded-lg flex items-center justify-center relative">
                  <div className="grid grid-cols-5 gap-1 w-full h-full text-white opacity-95">
                    <div className="border-2 border-white rounded-xs" />
                    <div className="bg-white rounded-xs" />
                    <div className="bg-transparent" />
                    <div className="bg-white rounded-xs" />
                    <div className="border-2 border-white rounded-xs" />
                    <div className="bg-white rounded-xs" />
                    <div className="bg-transparent" />
                    <div className="bg-white rounded-xs" />
                    <div className="bg-white rounded-xs" />
                    <div className="bg-white rounded-xs" />
                    <div className="bg-transparent" />
                    <div className="bg-white rounded-xs" />
                    <div className="bg-white rounded-xs" />
                    <div className="bg-transparent" />
                    <div className="bg-white rounded-xs" />
                    <div className="bg-white rounded-xs" />
                    <div className="bg-white rounded-xs" />
                    <div className="bg-transparent" />
                    <div className="bg-white rounded-xs" />
                    <div className="bg-white rounded-xs" />
                    <div className="border-2 border-white rounded-xs" />
                    <div className="bg-transparent" />
                    <div className="bg-white rounded-xs" />
                    <div className="bg-transparent" />
                    <div className="border-2 border-white rounded-xs" />
                  </div>
                </div>
                <p className="text-[7px] text-slate-400 font-bold">QR فاتورة إلكترونية معتمدة من هيئة الزكاة</p>
              </div>
            </div>

            {/* Quick Action bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 shrink-0">
              <button
                onClick={() => {
                  alert('ميزة إعادة الطباعة تفاعلية! جاري تذليل أمر المستند للمكتتب.');
                }}
                className="flex-1 py-12px bg-slate-900 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-800 transition"
              >
                <Printer size={13} />
                <span>إعادة طباعة</span>
              </button>
              <button
                onClick={() => setViewedOrder(null)}
                className="flex-1 py-12px bg-slate-200 text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-300 transition"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
