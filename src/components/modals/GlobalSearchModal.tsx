import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { PageId } from '../layout/Sidebar';
import { Search, Users, Building, Banknote, Package, Receipt, FileText, UtensilsCrossed, X } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageId) => void;
}

interface SearchResult {
  id: string;
  category: 'employee' | 'site' | 'payroll' | 'material' | 'expense' | 'document' | 'canteen';
  title: string;
  subtitle: string;
  page: PageId;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { employees, sites, payroll, materials, expenses, documents } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const results: SearchResult[] = [];

  if (q) {
    // Search Employees
    employees.forEach((e) => {
      if (
        e.name.toLowerCase().includes(q) ||
        e.employee_id.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q)
      ) {
        results.push({
          id: e.employee_id,
          category: 'employee',
          title: `${e.name} (${e.employee_id})`,
          subtitle: `${e.position} • Daily: ₱${e.daily_rate} • ${e.site_id}`,
          page: 'employees',
        });
      }
    });

    // Search Sites
    sites.forEach((s) => {
      if (
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.supervisor.toLowerCase().includes(q)
      ) {
        results.push({
          id: s.site_id,
          category: 'site',
          title: `${s.code}: ${s.name}`,
          subtitle: `${s.location} • Supervisor: ${s.supervisor}`,
          page: 'sites',
        });
      }
    });

    // Search Payroll
    payroll.forEach((p) => {
      if (
        p.reference_no.toLowerCase().includes(q) ||
        p.payroll_id.toLowerCase().includes(q) ||
        p.employee_id.toLowerCase().includes(q)
      ) {
        results.push({
          id: p.payroll_id,
          category: 'payroll',
          title: `Payroll ${p.payroll_id} (${p.week_key})`,
          subtitle: `Net: ₱${p.net_pay.toLocaleString()} • ${p.payment_method} Ref: ${p.reference_no || 'Pending'}`,
          page: 'payroll',
        });
      }
    });

    // Search Materials
    materials.forEach((m) => {
      if (
        m.material_name.toLowerCase().includes(q) ||
        m.supplier.toLowerCase().includes(q) ||
        m.delivery_ref.toLowerCase().includes(q)
      ) {
        results.push({
          id: m.material_id,
          category: 'material',
          title: `Material: ${m.material_name}`,
          subtitle: `${m.quantity} ${m.unit} from ${m.supplier} (₱${m.total_cost.toLocaleString()})`,
          page: 'materials',
        });
      }
    });

    // Search Expenses
    expenses.forEach((ex) => {
      if (
        ex.category.toLowerCase().includes(q) ||
        ex.vendor.toLowerCase().includes(q) ||
        ex.reference_no.toLowerCase().includes(q)
      ) {
        results.push({
          id: ex.expense_id,
          category: 'expense',
          title: `Expense: ${ex.category} (₱${ex.amount.toLocaleString()})`,
          subtitle: `Payee: ${ex.vendor} • Ref: ${ex.reference_no || 'N/A'}`,
          page: 'expenses',
        });
      }
    });

    // Search Documents
    documents.forEach((d) => {
      if (d.file_name.toLowerCase().includes(q) || d.module.toLowerCase().includes(q)) {
        results.push({
          id: d.document_id,
          category: 'document',
          title: `Document: ${d.file_name}`,
          subtitle: `Module: ${d.module} • Link: ${d.drive_url}`,
          page: 'documents',
        });
      }
    });

    // Search Canteen & Concessionaires
    sites.forEach((s) => {
      const vendor = s.canteen_vendor_name || `${s.name} Canteen`;
      const gcash = s.canteen_gcash_number || '';
      if (
        vendor.toLowerCase().includes(q) ||
        gcash.includes(q) ||
        'canteen'.includes(q) ||
        'meal'.includes(q) ||
        'food'.includes(q) ||
        'mess'.includes(q)
      ) {
        results.push({
          id: `canteen-${s.site_id}`,
          category: 'canteen',
          title: `Canteen: ${vendor} (${s.code})`,
          subtitle: `GCash: ${gcash} • Contact: ${s.canteen_contact_person || 'Manager'} • ${s.name}`,
          page: 'canteen',
        });
      }
    });
  }

  const getCategoryIcon = (cat: SearchResult['category']) => {
    switch (cat) {
      case 'employee':
        return <Users className="w-4 h-4 text-[#10b981]" />;
      case 'site':
        return <Building className="w-4 h-4 text-[#a3e635]" />;
      case 'canteen':
        return <UtensilsCrossed className="w-4 h-4 text-lime-400" />;
      case 'payroll':
        return <Banknote className="w-4 h-4 text-emerald-400" />;
      case 'material':
        return <Package className="w-4 h-4 text-blue-400" />;
      case 'expense':
        return <Receipt className="w-4 h-4 text-amber-400" />;
      case 'document':
        return <FileText className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="p-3 border-b border-[#234338] flex items-center gap-3 bg-[#13241f]">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search employees, sites, payroll, materials, documents..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#234338]/50">
          {!q ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Search by worker name, DRC ID, site code, voucher reference, or material description.
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching records found for "{query}".
            </div>
          ) : (
            results.map((r) => (
              <button
                key={`${r.category}-${r.id}`}
                onClick={() => {
                  onNavigate(r.page);
                  onClose();
                }}
                className="w-full text-left p-2.5 rounded-lg hover:bg-[#13241f] transition-colors flex items-center gap-3 group"
              >
                <div className="p-2 rounded-md bg-[#080f0d] border border-[#234338] shrink-0">
                  {getCategoryIcon(r.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-[#a3e635] truncate">
                    {r.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{r.subtitle}</div>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-500 group-hover:text-slate-300">
                  Go &rarr;
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
