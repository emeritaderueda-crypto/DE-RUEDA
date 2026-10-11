import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MaterialRecord } from '../../types';
import { Package, Plus, Filter, Search, Archive, X } from 'lucide-react';

export const MaterialsView: React.FC = () => {
  const { materials, sites, currentSite, addMaterial, archiveMaterial } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [siteFilter, setSiteFilter] = useState(currentSite);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [form, setForm] = useState({
    material_name: '',
    category: 'Structural',
    site_id: 'SITE-001',
    supplier: '',
    quantity: 100,
    unit: 'pcs',
    unit_cost: 280,
    date: '2026-10-06',
    delivery_ref: '',
    notes: '',
  });

  const filtered = materials.filter((m) => {
    if (m.is_archived === 1) return false;
    const q = searchQuery.toLowerCase();
    const matchQ =
      m.material_name.toLowerCase().includes(q) ||
      m.supplier.toLowerCase().includes(q) ||
      m.delivery_ref.toLowerCase().includes(q);
    const matchS = siteFilter === 'ALL' || m.site_id === siteFilter;
    const matchC = categoryFilter === 'ALL' || m.category === categoryFilter;
    return matchQ && matchS && matchC;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMaterial({
      material_name: form.material_name.trim(),
      category: form.category,
      site_id: form.site_id,
      supplier: form.supplier.trim(),
      quantity: Number(form.quantity),
      unit: form.unit,
      unit_cost: Number(form.unit_cost),
      date: form.date,
      delivery_ref: form.delivery_ref.trim(),
      notes: form.notes.trim(),
      is_archived: 0,
    });
    setIsAddOpen(false);
  };

  const totalValue = filtered.reduce((sum, m) => sum + m.total_cost, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Materials & Contractor Procurement Control
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Site deliveries, storage bays & supplier unit economics</span>
            <span>·</span>
            <span>Active Inventory Value: <strong className="text-[#a3e635] font-mono">₱{totalValue.toLocaleString()}</strong></span>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Log Delivered Materials
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
            placeholder="Search material, supplier, delivery ref..."
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
            <option value="ALL">All Categories</option>
            <option value="Structural">Structural (Rebar/Steel)</option>
            <option value="Masonry">Masonry (Cement/Blocks)</option>
            <option value="Concrete">Concrete (Ready-Mix)</option>
            <option value="Plumbing">Plumbing & Drainage</option>
            <option value="Electrical">Electrical Supplies</option>
            <option value="Finishing">Finishing & Paints</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-400 ml-auto font-mono">
          {filtered.length} delivery records
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#13241f] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-3">Date</th>
                <th className="p-3">Site</th>
                <th className="p-3">Material Description</th>
                <th className="p-3">Category</th>
                <th className="p-3">Supplier / Contractor</th>
                <th className="p-3 text-right">Quantity</th>
                <th className="p-3 text-right">Unit Cost</th>
                <th className="p-3 text-right text-[#a3e635]">Total Cost</th>
                <th className="p-3">Delivery Ref</th>
                <th className="p-3">Storage / Notes</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#234338]/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500">
                    No delivery records matching the filter.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.material_id} className="hover:bg-[#13241f]/70 transition-colors">
                    <td className="p-3 font-mono text-slate-400 whitespace-nowrap">{m.date}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-300">{m.site_id}</td>
                    <td className="p-3 font-bold text-white">{m.material_name}</td>
                    <td className="p-3">
                      <span className="text-[10px] bg-[#13241f] border border-[#234338] px-2 py-0.5 rounded text-slate-300">
                        {m.category}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-200">{m.supplier}</td>
                    <td className="p-3 text-right font-mono font-semibold">
                      {m.quantity.toLocaleString()} {m.unit}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-400">₱{m.unit_cost.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-black text-[#a3e635]">
                      ₱{m.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">{m.delivery_ref || 'None'}</td>
                    <td className="p-3 text-[11px] text-slate-400 max-w-[200px] truncate">{m.notes || 'None'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => archiveMaterial(m.material_id)}
                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer transition-colors"
                        title="Archive Delivery"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Material Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-[#a3e635]" />
                Log Delivered Construction Materials
              </h2>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Material Name & Spec *</label>
                  <input
                    type="text"
                    required
                    value={form.material_name}
                    onChange={(e) => setForm({ ...form, material_name: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="e.g. 16mm Grade 60 Rebar"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="Structural">Structural (Rebar/Steel)</option>
                    <option value="Masonry">Masonry (Cement/Blocks)</option>
                    <option value="Concrete">Concrete (Ready-Mix)</option>
                    <option value="Plumbing">Plumbing & Drainage</option>
                    <option value="Electrical">Electrical Supplies</option>
                    <option value="Finishing">Finishing & Paints</option>
                  </select>
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
                  <label className="block text-slate-300 font-semibold mb-1">Supplier / Trade Vendor *</label>
                  <input
                    type="text"
                    required
                    value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                    placeholder="e.g. SteelAsia, Holcim"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unit *</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="bags">bags (40kg Cement)</option>
                    <option value="cu.m">cu.m (Cubic Meters)</option>
                    <option value="trucks">trucks (Loads)</option>
                    <option value="kg">kg (Kilograms)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unit Cost (₱) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.unit_cost}
                    onChange={(e) => setForm({ ...form, unit_cost: Number(e.target.value) })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#13241f] border border-[#234338] rounded-lg flex items-center justify-between font-bold">
                <span className="text-slate-300">CALCULATED TOTAL PURCHASE COST:</span>
                <span className="text-[#a3e635] font-mono text-sm">
                  ₱{(Number(form.quantity) * Number(form.unit_cost)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Delivery Receipt (DR) No.</label>
                  <input
                    type="text"
                    value={form.delivery_ref}
                    onChange={(e) => setForm({ ...form, delivery_ref: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                    placeholder="e.g. DR-98124-SA"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Storage Bay & Inspection Remarks</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white h-16"
                  placeholder="Stored in Warehouse Bay 4 under protective tarp..."
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
                  Save Material Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
