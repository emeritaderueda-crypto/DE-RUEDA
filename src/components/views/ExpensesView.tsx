import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Receipt, Plus, Filter, Search, X } from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { expenses, sites, currentSite, addExpense } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [siteFilter, setSiteFilter] = useState(currentSite);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [form, setForm] = useState({
    site_id: 'SITE-001',
    date: '2026-10-06',
    category: 'Equipment Rental',
    vendor: '',
    amount: 5000,
    payment_method: 'Check/Bank Transfer',
    reference_no: '',
    notes: '',
  });

  const filtered = expenses.filter((ex) => {
    const q = searchQuery.toLowerCase();
    const matchQ =
      ex.vendor.toLowerCase().includes(q) ||
      ex.reference_no.toLowerCase().includes(q) ||
      ex.notes.toLowerCase().includes(q);
    const matchS = siteFilter === 'ALL' || ex.site_id === siteFilter;
    const matchC = categoryFilter === 'ALL' || ex.category === categoryFilter;
    return matchQ && matchS && matchC;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      site_id: form.site_id,
      date: form.date,
      category: form.category,
      vendor: form.vendor.trim(),
      amount: Number(form.amount),
      payment_method: form.payment_method,
      reference_no: form.reference_no.trim(),
      notes: form.notes.trim(),
      status: 'Approved',
    });
    setIsAddOpen(false);
  };

  const totalExpenseAmount = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Project Costs & Site Expenses Control
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Heavy equipment rentals, fuel lubricants, permits & utility bills</span>
            <span>·</span>
            <span>Total Filtered Costs: <strong className="text-[#a3e635] font-mono">₱{totalExpenseAmount.toLocaleString()}</strong></span>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Record Project Expense
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payee vendor, receipt OR, notes..."
            className="w-full bg-[#13241f] border border-[#234338] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
          >
            <option value="ALL">All Project Sites</option>
            {sites.map((s) => (
              <option key={s.site_id} value={s.site_id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
          >
            <option value="ALL">All Expense Categories</option>
            <option value="Canteen & Worker Meals">Canteen & Worker Meals</option>
            <option value="Equipment Rental">Equipment Rental</option>
            <option value="Fuel & Lubricants">Fuel & Lubricants</option>
            <option value="Permits & Licenses">Permits & Licenses</option>
            <option value="Site Utilities">Site Utilities</option>
            <option value="Safety & Health">Safety & Health</option>
            <option value="Miscellaneous">Miscellaneous</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-400 ml-auto font-mono">
          {filtered.length} expense entries
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#13241f] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-3">Date</th>
                <th className="p-3">Site</th>
                <th className="p-3">Expense Category</th>
                <th className="p-3">Payee / Vendor</th>
                <th className="p-3 text-right text-[#a3e635]">Amount (₱)</th>
                <th className="p-3">Payment Method</th>
                <th className="p-3">Voucher / OR #</th>
                <th className="p-3">Status</th>
                <th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#234338]/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No expense records matching the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((ex) => (
                  <tr key={ex.expense_id} className="hover:bg-[#13241f]/70 transition-colors">
                    <td className="p-3 font-mono text-slate-400 whitespace-nowrap">{ex.date}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-300">{ex.site_id}</td>
                    <td className="p-3 font-bold text-white">{ex.category}</td>
                    <td className="p-3 font-medium text-slate-200">{ex.vendor}</td>
                    <td className="p-3 text-right font-mono font-black text-[#a3e635]">
                      ₱{ex.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] bg-[#13241f] border border-[#234338] px-2 py-0.5 rounded text-slate-300">
                        {ex.payment_method}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">{ex.reference_no || 'None'}</td>
                    <td className="p-3">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {ex.status}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-400 max-w-[220px] truncate">{ex.notes || 'None'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#a3e635]" />
                Record Project Cost / Expense
              </h2>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Expense Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="Equipment Rental">Equipment Rental (Crane/Backhoe)</option>
                    <option value="Canteen & Worker Meals">Canteen & Worker Meals (Site Mess)</option>
                    <option value="Fuel & Lubricants">Fuel & Lubricants (Diesel)</option>
                    <option value="Permits & Licenses">Permits & Clearances</option>
                    <option value="Site Utilities">Site Utilities (Power/Water)</option>
                    <option value="Safety & Health">Safety & Health / PPE</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payee / Vendor Name *</label>
                  <input
                    type="text"
                    required
                    value={form.vendor}
                    onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="e.g. Petron Gas, Bataan Heavy Lift"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project Site *</label>
                  <select
                    value={form.site_id}
                    onChange={(e) => setForm({ ...form, site_id: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    {sites.map((s) => (
                      <option key={s.site_id} value={s.site_id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount (PHP) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Method *</label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="Check/Bank Transfer">Check / Bank Transfer</option>
                    <option value="Cash">Cash (Petty Cash)</option>
                    <option value="GCash">GCash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Receipt (OR) / Voucher No.</label>
                  <input
                    type="text"
                    value={form.reference_no}
                    onChange={(e) => setForm({ ...form, reference_no: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    placeholder="e.g. OR-PET-448102"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Expense Date *</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Project Notes / Requisition Purpose</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white h-16"
                  placeholder="Purpose of disbursement, equipment hour meter..."
                />
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16]"
                >
                  Record Project Cost
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
