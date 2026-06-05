import React from 'react';
import { Customer } from '../types';
import { Plus, Edit2, Trash2, Search, Users, AlertTriangle, Check, PhoneCall, MapPin } from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export default function CustomersView({
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
}: CustomersViewProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showModal, setShowModal] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);

  // Form states
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [balance, setBalance] = React.useState(0);
  const [debtLimit, setDebtLimit] = React.useState(2000);

  React.useEffect(() => {
    if (editingCustomer) {
      setName(editingCustomer.name);
      setPhone(editingCustomer.phone);
      setAddress(editingCustomer.address);
      setBalance(editingCustomer.balance);
      setDebtLimit(editingCustomer.debtLimit);
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setBalance(0);
      setDebtLimit(2000);
    }
  }, [editingCustomer, showModal]);

  const openAdd = () => {
    setEditingCustomer(null);
    setShowModal(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const payload: Customer = {
      id: editingCustomer ? editingCustomer.id : 'cust_' + Date.now(),
      name,
      phone,
      address,
      balance: parseFloat(balance.toString()) || 0,
      debtLimit: parseFloat(debtLimit.toString()) || 0,
      purchaseHistory: editingCustomer ? editingCustomer.purchaseHistory : [],
    };

    if (editingCustomer) {
      onUpdateCustomer(payload);
    } else {
      onAddCustomer(payload);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (id === 'cust_4') {
      alert('لا يمكنك حذف الحساب العام للعملاء النقديين!');
      return;
    }
    if (confirm('هل أنت متأكد من تصفية هذا العميل من السيستم نهائياً؟')) {
      onDeleteCustomer(id);
    }
  };

  const filteredCustomers = customers.filter((cust) => {
    return (
      cust.name.includes(searchQuery) ||
      cust.phone.includes(searchQuery) ||
      cust.address.includes(searchQuery)
    );
  });

  return (
    <div className="space-y-5">
      {/* Search and Trigger buttons */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث بالاسم، برقم الجوال، أو العنوان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <button
          onClick={openAdd}
          className="w-full md:w-auto py-2.5 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800 transition shadow-sm"
        >
          <Plus size={15} />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      {/* Main Customers List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const isOverDebt = cust.balance > cust.debtLimit;
          const isGeneral = cust.id === 'cust_4';

          return (
            <div
              key={cust.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition ${
                isOverDebt ? 'border-rose-450 bg-rose-50/5' : 'border-slate-200'
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm select-none ${
                        isGeneral ? 'bg-slate-100 text-slate-650' : 'bg-emerald-50 text-emerald-650'
                      }`}
                    >
                      {cust.name.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{cust.name}</h4>
                      <p className="text-[10px] text-slate-400">كود العميل: {cust.id}</p>
                    </div>
                  </div>

                  {cust.balance > 0 && (
                    <span className="text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <AlertTriangle size={10} />
                      مديونية
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 font-medium border-t border-slate-50 pt-3">
                  <div className="flex items-center gap-2">
                    <PhoneCall size={12} className="text-slate-400" />
                    <span>الجوال: {cust.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-slate-400 font-bold" />
                    <span className="truncate">العنوان: {cust.address || '-'}</span>
                  </div>
                </div>

                {/* Financial Debt details progress */}
                {!isGeneral && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">الدين المسجل:</span>
                      <strong className="text-rose-700 font-mono font-black">{cust.balance.toFixed(2)} ر.س</strong>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">سقف المديونية الأقصى:</span>
                      <strong className="text-slate-700 font-mono">{cust.debtLimit.toFixed(2)} ر.س</strong>
                    </div>
                    {/* Linear bar representation */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full ${isOverDebt ? 'bg-rose-500' : 'bg-amber-400'}`}
                        style={{ width: `${Math.min(100, (cust.balance / (cust.debtLimit || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-50 flex items-center justify-between shrink-0">
                <span className="text-[10px] text-slate-400 font-mono">
                  {cust.purchaseHistory.length} فواتير مسجلة
                </span>
                <div className="flex items-center gap-1">
                  {!isGeneral && (
                    <button
                      onClick={() => openEdit(cust)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="تعديل بيانات العميل"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                  {!isGeneral && (
                    <button
                      onClick={() => handleDelete(cust.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="إزالة العميل"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 text-slate-800 flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-xs">
                {editingCustomer ? 'تعديل الملف المالي للزبون' : 'إنشاء ملف مبيعات عميل جديد'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-800"
              >
                اغلاق
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">اسم العميل الكامل *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="الاسم الأول والثاني..."
                  className="w-full px-3.5 py-2 border border-slate-205 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">رقم جوال العميل *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xxxxxxx"
                  className="w-full px-3.5 py-2 border border-slate-205 rounded-xl text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">العنوان أو الحي</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="الرياض - حي الياسمين"
                  className="w-full px-3.5 py-2 border border-slate-205 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">المديونية الابتدائية (ر.س)</label>
                  <input
                    type="number"
                    min="0"
                    value={balance || ''}
                    onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 border border-slate-205 rounded-xl text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">الحد الأقصى للديون (ر.س)</label>
                  <input
                    type="number"
                    min="0"
                    value={debtLimit || ''}
                    onChange={(e) => setDebtLimit(parseFloat(e.target.value) || 0)}
                    placeholder="2000"
                    className="w-full px-3.5 py-2 border border-slate-205 rounded-xl text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 transition cursor-pointer"
                >
                  <Check size={14} />
                  <span>{editingCustomer ? 'حفظ الحساب للتعديل' : 'إنشاء الحساب المالي'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
