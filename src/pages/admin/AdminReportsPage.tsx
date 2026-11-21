import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { api, extractApiError } from '../../services/api';

type ReportTab = 'bookings' | 'revenue' | 'passengers' | 'cancellations' | 'buses';

interface ReportsPayload {
  bookings: Array<Record<string, unknown>>;
  revenue: Array<Record<string, unknown>>;
  passengers: Array<Record<string, unknown>>;
  cancellations: Array<Record<string, unknown>>;
  buses: Array<Record<string, unknown>>;
}

export function AdminReportsPage() {
  const [data, setData] = useState<ReportsPayload | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>('bookings');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    api
      .get<ReportsPayload>('/admin/reports/bookings')
      .then((res) => setData(res.data))
      .catch((err) => showToast(extractApiError(err, 'Unable to load reports.'), 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleDownloadCsv = async () => {
    try {
      const res = await api.get('/admin/reports/bookings', {
        params: { type: activeTab, format: 'csv' },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BlueLine_${activeTab}_report.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${activeTab} CSV report.`, 'success');
    } catch (err) {
      showToast(extractApiError(err, 'Failed to export CSV report.'), 'error');
    }
  };

  const rows = data ? data[activeTab] || [] : [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <AdminLayout
      title="Operational & Financial Reports"
      breadcrumb="Reports"
      actions={
        <button
          type="button"
          onClick={handleDownloadCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F294A] hover:bg-[#163864] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>Download CSV Report</span>
        </button>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-xl w-fit">
          {(
            [
              { id: 'bookings', label: 'Booking Report' },
              { id: 'revenue', label: 'Revenue Report' },
              { id: 'passengers', label: 'Passenger Report' },
              { id: 'cancellations', label: 'Cancellation Report' },
              { id: 'buses', label: 'Bus Utilization Report' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === t.id ? 'bg-white text-[#0F294A] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner label="Generating operational reports..." />
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-600">
            No records available for this report yet.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="py-3 px-4 whitespace-nowrap">
                        {col.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {columns.map((col) => (
                        <td key={col} className="py-3 px-4 whitespace-nowrap tabular-nums text-slate-700">
                          {String(row[col] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
