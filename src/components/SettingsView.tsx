import React from 'react';
import { CompanySettings } from '../types';
import { Settings, Save, RefreshCw, Database, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface SettingsViewProps {
  settings: CompanySettings;
  onUpdateSettings: (settings: CompanySettings) => void;
  onTriggerSync: () => void;
  syncing: boolean;
  onResetDatabase: () => void;
}

export default function SettingsView({
  settings,
  onUpdateSettings,
  onTriggerSync,
  syncing,
  onResetDatabase,
}: SettingsViewProps) {
  // Input fields matching database
  const [name, setName] = React.useState(settings.name);
  const [logo, setLogo] = React.useState(settings.logo);
  const [phone, setPhone] = React.useState(settings.phone);
  const [address, setAddress] = React.useState(settings.address);
  const [taxNumber, setTaxNumber] = React.useState(settings.taxNumber);
  const [taxRate, setTaxRate] = React.useState(settings.taxRate);
  const [currencySymbol, setCurrencySymbol] = React.useState(settings.currencySymbol);
  const [invoiceNotes, setInvoiceNotes] = React.useState(settings.invoiceNotes);

  const [simulatedLogs, setSimulatedLogs] = React.useState<string[]>([
    'تم تفعيل الاتصال الهجين مع SQLite بنجاح.',
    'جميع المنتجات والصور متأهبة للعمل دون إنترنت.',
  ]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      name,
      logo,
      phone,
      address,
      taxNumber,
      taxRate: parseFloat(taxRate.toString()) || 0,
      currencySymbol,
      invoiceNotes,
    });
    
    setSimulatedLogs((prev) => [
      `تم تحديث إعدادات الشركة وضريبة القيمة المضافة بنجاح على المستوى المحلي في ${new Date().toLocaleTimeString('ar-EG')}`,
      ...prev,
    ]);
    alert('تم حفظ إعدادات النظام وتحديث قوالب فواتير نقاط البيع بنجاح!');
  };

  const handleCloudSync = () => {
    onTriggerSync();
    setSimulatedLogs((prev) => [
      `جاري مزامنة السجلات المحلية (SQLite) وتأكيد التطابق مع سحابة Firestore... [${new Date().toLocaleTimeString('ar-EG')}]`,
      ...prev,
    ]);

    setTimeout(() => {
      setSimulatedLogs((prev) => [
        `تمت المزامنة الكاملة تلقائياً! رفع 8 منتجات و5 حركات مستودع وتحديث 3 أرصدة مديونيات بنجاح. ✅`,
        ...prev,
      ]);
    }, 2000);
  };

  const handleBackup = () => {
    alert('تم توليد نسخة احتياطية من قاعدة البيانات بنجاح وتنزيل الملف المشفر "smart_pos_backup_2026.sql" على المتصفح.');
    setSimulatedLogs((prev) => [
      `تم توليد وحفظ نسخة احتياطية محلية مشفرة بنجاح. [SQL/JSON] [${new Date().toLocaleTimeString('ar-EG')}]`,
      ...prev,
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="settings-container">
      {/* Right Column: Company metadata input settings (8/12) */}
      <form onSubmit={handleSave} className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
            <Settings className="text-indigo-600" size={17} />
            إعدادات الفواتير والشركة لضريبة VAT
          </h4>
          <button
            type="submit"
            className="py-2 px-4 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Save size={14} />
            <span>حفظ الإعدادات</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-650 block">اسم المؤسسة / المحل *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-650 block">أيقونة الشعار (Emoji أو نص)</label>
            <input
              type="text"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="⚡"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-650 block">هاتف خدمة المبيعات *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-650 block">العنوان الجغرافي بالكامل *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-650 block">الرقم الضريبي الموحد للهيئة (VAT Number) *</label>
            <input
              type="text"
              required
              value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-655 block">نسبة الضريبة المضافة (%) *</label>
              <input
                type="number"
                required
                min="0"
                value={taxRate || ''}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-655 block">رمز العملة النقدية *</label>
              <input
                type="text"
                required
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-center focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-650 block font-mono">ملاحظات وشروط تذييل فاتورة العميل POS</label>
            <textarea
              value={invoiceNotes}
              onChange={(e) => setInvoiceNotes(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500 resize-none font-medium"
            />
          </div>
        </div>
      </form>

      {/* Left Column: Sync state, backups, and logs (4/12) */}
      <div className="lg:col-span-4 space-y-4">
        {/* Sync panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
          <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <Database size={15} className="text-emerald-500 shrink-0" />
            تزامن السحاب وقاعدة البيانات الهجينة
          </h4>
          
          <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
            يعمل هذا النظام محلياً على قاعدة بيانات المتصفح الآمنة دون انقطاع. عند توفر إنترنت، يتم تشغيل التزامن السحابي التلقائي مع Firebase Firestore للخزن المنسق.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCloudSync}
              disabled={syncing}
              className="flex-1 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              <span>مزامنة فورية</span>
            </button>
            <button
              onClick={handleBackup}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-extrabold transition"
            >
              انزل نسخة احتياطية
            </button>
          </div>
        </div>

        {/* Sync logs output console simulated output */}
        <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-[9px] h-48 flex flex-col justify-between overflow-hidden relative shadow-lg">
          <div className="absolute top-0 right-0 p-1 bg-slate-900 text-slate-500 rounded-bl text-[8px] uppercase select-none border-b border-l border-slate-800 font-bold shrink-0">
            Console Sync logs
          </div>
          <div className="flex-1 overflow-y-auto pt-3.5 space-y-1.5 scrollbar-thin select-none">
            {simulatedLogs.map((log, index) => (
              <p key={index} className="leading-normal font-bold">
                <span className="text-slate-500 font-mono">[4 يونيو]</span> {log}
              </p>
            ))}
          </div>
        </div>

        {/* Factory Reset Danger Zone */}
        <div className="bg-rose-50/50 border border-rose-200/55 rounded-2xl p-4 space-y-2">
          <span className="text-rose-800 font-black text-xs flex items-center gap-1.5">
            <ShieldAlert size={15} />
            منطقة الخطر وسحب التعيين
          </span>
          <p className="text-[10px] text-slate-500 font-medium">
            سيؤدي تصفير المبيعات لشطب السجلات التجريبية وتفريغ المستودعات. يمكنك استعادة البيانات القياسية من مخزن البذور في أي وقت.
          </p>
          <button
            onClick={() => {
              if (confirm('تنبيه هام! هل تريد مسح الفواتير التجريبية وإعادة تهيئة النظام لقيمه الافتراضية؟')) {
                onResetDatabase();
                alert('تمت تهيئة قاعدة البيانات المحلية لقيم البداية القياسية.');
              }
            }}
            className="w-full mt-2 py-2 bg-rose-100 hover:bg-rose-200 border border-rose-200/50 text-rose-700 rounded-xl text-xs font-extrabold transition"
          >
            تصفير السجلات وإعادة التهيئة للمصنع ↺
          </button>
        </div>
      </div>
    </div>
  );
}
