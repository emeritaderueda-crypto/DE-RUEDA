import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DeductionRecord, Site } from '../../types';
import { CanteenGcashPayoutModal } from '../modals/CanteenGcashPayoutModal';
import {
  BadgePercent,
  Plus,
  Filter,
  Trash2,
  X,
  AlertCircle,
  UtensilsCrossed,
  Smartphone,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

export const DeductionsView: React.FC = () => {
  const {
    deductions,
    employees,
    sites,
    dtrWeeks,
    currentSite,
    gcashTransactions,
    addDeduction,
    voidDeduction,
  } = useApp();

  const [selectedWeek, setSelectedWeek] = useState(dtrWeeks[0]?.week_key || '2026-W40');
  const [siteFilter, setSiteFilter] = useState(currentSite);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Canteen GCash Payout Modal States
  const [canteenPayoutSite, setCanteenPayoutSite] = useState<Site | null>(null);
  const [isCanteenPayoutOpen, setIsCanteenPayoutOpen] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    employee_id: employees[0]?.employee_id || '',
    week_key: selectedWeek,
    site_id: 'SITE-001',
    canteen: 0,
    sss: 0,
    philhealth: 0,
    other_deduction: 0,
    cash_advance: 0,
    notes: '',
  });

  const filtered = deductions.filter((d) => {
    const matchW = selectedWeek === 'ALL' || d.week_key === selectedWeek;
    const matchS = siteFilter === 'ALL' || d.site_id === siteFilter;
    return matchW && matchS;
  });

  // Canteen Calculations for the current filter view
  const currentTargetSite = sites.find((s) => s.site_id === siteFilter) || sites[0];

  const filteredCanteenCollected = filtered
    .filter((d) => !d.is_void)
    .reduce((sum, d) => sum + Number(d.canteen || 0), 0);

  const filteredCanteenPaid = gcashTransactions
    .filter((tx) => tx.category === 'Site Canteen Payout' && (siteFilter === 'ALL' || tx.site_id === siteFilter) && tx.status === 'COMPLETED')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const filteredCanteenOutstanding = Math.max(0, filteredCanteenCollected - filteredCanteenPaid);

  const calcTotalPreview = () => {
    return (
      Number(form.canteen) +
      Number(form.sss) +
      Number(form.philhealth) +
      Number(form.other_deduction) +
      Number(form.cash_advance)
    );
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDeduction({
      employee_id: form.employee_id,
      week_key: form.week_key,
      site_id: form.site_id,
      canteen: Number(form.canteen),
      sss: Number(form.sss),
      philhealth: Number(form.philhealth),
      other_deduction: Number(form.other_deduction),
      cash_advance: Number(form.cash_advance),
      notes: form.notes.trim(),
    });
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Weekly Worker Deductions & Advances
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Linked by Employee ID + Week + Site</span>
            <span>·</span>
            <span>Automatically cascades into Net Take-Home Pay & Cash Flow</span>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Record Worker Deductions
        </button>
      </div>

      {/* Notification Toast */}
      {notificationMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Site Canteen Deduction & GCash Payout Settlement Banner */}
      <div className="bg-gradient-to-r from-[#0e1a16] via-[#13241f] to-[#0e1a16] border border-[#234338] rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lime-500/15 border border-lime-500/30 flex items-center justify-center text-lime-400 shrink-0">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                Site Canteen GCash Settlement Hub
              </h3>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-lime-400/20 text-lime-300">
                {siteFilter === 'ALL' ? 'ALL SITES' : siteFilter}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Concessionaire: <strong className="text-slate-200">{currentTargetSite?.canteen_vendor_name || 'Project Canteen'}</strong> &bull; GCash: <span className="font-mono text-sky-400 font-bold">{currentTargetSite?.canteen_gcash_number || '09171234567'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-[#080f0d] border border-[#234338] px-3 py-2 rounded-lg text-xs font-mono">
            <div>
              <div className="text-[10px] text-slate-500">Collected</div>
              <div className="font-bold text-white">₱{filteredCanteenCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="w-px h-6 bg-[#234338]"></div>
            <div>
              <div className="text-[10px] text-slate-500">Settled</div>
              <div className="font-bold text-emerald-400">₱{filteredCanteenPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="w-px h-6 bg-[#234338]"></div>
            <div>
              <div className="text-[10px] text-slate-500">Outstanding</div>
              <div className="font-black text-lime-400">₱{filteredCanteenOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <button
            onClick={() => {
              setCanteenPayoutSite(currentTargetSite);
              setIsCanteenPayoutOpen(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-lime-500 hover:from-emerald-500 hover:to-lime-400 text-white font-extrabold text-xs rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Smartphone className="w-4 h-4" />
            <span>Disburse Canteen via GCash</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">PAYROLL WEEK:</span>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="bg-[#13241f] border border-[#234338] rounded-lg px-2.5 py-1.5 text-xs text-[#a3e635] font-mono font-bold outline-none cursor-pointer"
          >
            <option value="ALL">All Payroll Weeks</option>
            {dtrWeeks.map((w) => (
              <option key={w.week_key} value={w.week_key}>
                {w.week_key} ({w.date_start} to {w.date_end})
              </option>
            ))}
          </select>
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

        <div className="text-[11px] text-slate-400 ml-auto font-mono">
          Showing {filtered.length} deduction ledger rows
        </div>
      </div>

      {/* Deductions Table */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#13241f] border-b border-[#234338] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-3">Employee</th>
                <th className="p-3">Week / Site</th>
                <th className="p-3 text-right">Canteen (₱)</th>
                <th className="p-3 text-right">SSS (₱)</th>
                <th className="p-3 text-right">PhilHealth (₱)</th>
                <th className="p-3 text-right">Other / PPE (₱)</th>
                <th className="p-3 text-right">Cash Advance (₱)</th>
                <th className="p-3 text-right text-red-400">Total Deductions</th>
                <th className="p-3">Notes / Purpose</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#234338]/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    No active deductions on record for this week/site.
                  </td>
                </tr>
              ) : (
                filtered.map((ded) => {
                  const emp = employees.find((e) => e.employee_id === ded.employee_id);
                  const isVoid = ded.is_void === 1;

                  return (
                    <tr
                      key={ded.deduction_id}
                      className={`hover:bg-[#13241f]/70 transition-colors ${isVoid ? 'opacity-40' : ''}`}
                    >
                      <td className="p-3">
                        <div className="font-bold text-white">{emp ? emp.name : ded.employee_id}</div>
                        <div className="font-mono text-[10px] text-[#a3e635]">{ded.employee_id}</div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-300">
                        <div>{ded.week_key}</div>
                        <div className="text-slate-500">{ded.site_id}</div>
                      </td>
                      <td className="p-3 text-right font-mono">
                        {ded.canteen > 0 ? `₱${ded.canteen.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {ded.sss > 0 ? `₱${ded.sss.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {ded.philhealth > 0 ? `₱${ded.philhealth.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {ded.other_deduction > 0 ? `₱${ded.other_deduction.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-400 font-semibold">
                        {ded.cash_advance > 0 ? `₱${ded.cash_advance.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-red-400">
                        {isVoid ? '(VOIDED)' : `₱${ded.total_deductions.toFixed(2)}`}
                      </td>
                      <td className="p-3 text-[11px] text-slate-400 max-w-[200px] truncate">
                        {ded.notes || 'N/A'}
                      </td>
                      <td className="p-3 text-right">
                        {!isVoid && (
                          <button
                            onClick={() => {
                              voidDeduction(ded.deduction_id);
                              setNotificationMsg(`Deduction for ${emp ? emp.name : ded.employee_id} (${ded.week_key}) has been voided. Net pay recalculated.`);
                              setTimeout(() => setNotificationMsg(null), 5000);
                            }}
                            className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer transition-colors"
                            title="Void Deduction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Deduction Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BadgePercent className="w-4 h-4 text-[#a3e635]" />
                Record Worker Deductions
              </h2>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Employee *</label>
                  <select
                    value={form.employee_id}
                    onChange={(e) => {
                      const emp = employees.find((em) => em.employee_id === e.target.value);
                      setForm({
                        ...form,
                        employee_id: e.target.value,
                        site_id: emp?.site_id || form.site_id,
                      });
                    }}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  >
                    {employees
                      .filter((e) => e.status !== 'archived')
                      .map((e) => (
                        <option key={e.employee_id} value={e.employee_id}>
                          {e.name} ({e.employee_id})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payroll Week *</label>
                  <select
                    value={form.week_key}
                    onChange={(e) => setForm({ ...form, week_key: e.target.value })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  >
                    {dtrWeeks.map((w) => (
                      <option key={w.week_key} value={w.week_key}>
                        {w.week_key}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Canteen / Commissary (₱)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.canteen}
                    onChange={(e) => setForm({ ...form, canteen: Number(e.target.value) })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cash Advance (CA) (₱)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.cash_advance}
                    onChange={(e) => setForm({ ...form, cash_advance: Number(e.target.value) })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono text-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">SSS Contribution (₱)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.sss}
                    onChange={(e) => setForm({ ...form, sss: Number(e.target.value) })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">PhilHealth Contribution (₱)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.philhealth}
                    onChange={(e) => setForm({ ...form, philhealth: Number(e.target.value) })}
                    className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Other Deductions (PPE/Tools) (₱)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.other_deduction}
                  onChange={(e) => setForm({ ...form, other_deduction: Number(e.target.value) })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>

              <div className="p-3 bg-[#13241f] border border-[#234338] rounded-lg flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">CALCULATED TOTAL DEDUCTION:</span>
                <span className="text-red-400 font-mono text-sm">₱{calcTotalPreview().toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Remarks & Details</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white h-16"
                  placeholder="e.g. 5 days meal allowance, emergency medical advance..."
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
                  Save Deductions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Canteen GCash Payout Modal */}
      {canteenPayoutSite && (
        <CanteenGcashPayoutModal
          isOpen={isCanteenPayoutOpen}
          onClose={() => {
            setIsCanteenPayoutOpen(false);
            setCanteenPayoutSite(null);
          }}
          site={canteenPayoutSite}
          defaultAmount={filteredCanteenOutstanding}
          weekKey={selectedWeek}
          onSuccess={(ref) => {
            setNotificationMsg(`Canteen settlement disbursed via GCash. Ref: ${ref}`);
            setTimeout(() => setNotificationMsg(null), 5000);
          }}
        />
      )}
    </div>
  );
};
