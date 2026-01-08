import React from 'react';
import { InvoiceData } from '../types';
import { FileText, Download, Trash2, ArrowRight, User, Calendar } from 'lucide-react';

interface DashboardProps {
  history: InvoiceData[];
  onLoad: (invoice: InvoiceData) => void;
  onDelete: (invoiceNumber: string) => void;
  onDownload: (invoice: InvoiceData) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ history, onLoad, onDelete, onDownload }) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400">
        <div className="bg-slate-50 p-6 rounded-full mb-4">
          <FileText size={48} className="text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-600">No invoices generated yet</h3>
        <p className="text-sm text-center mt-2 max-w-xs">
          Create and download your first invoice to see it appear here in the dashboard.
        </p>
      </div>
    );
  }

  // Sort by latest first
  const sortedHistory = [...history].reverse();

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <FileText className="text-primary" size={20} />
        Invoice History
      </h2>
      
      <div className="space-y-3">
        {sortedHistory.map((invoice) => {
          const totalAmount = invoice.items.reduce((acc, item) => {
            const sub = item.price * item.quantity;
            return acc + sub + (sub * (invoice.taxRate / 100));
          }, 0);

          return (
            <div 
              key={invoice.invoiceNumber} 
              className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {invoice.invoiceNumber}
                    </span>
                    <h3 className="font-bold text-slate-800 mt-2 text-sm">{invoice.clientName || 'Unknown Client'}</h3>
                </div>
                <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${invoice.isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {invoice.isPaid ? 'PAID' : 'PENDING'}
                    </span>
                    <div className="font-bold text-slate-900 mt-2">
                        ₹{Math.round(totalAmount).toLocaleString('en-IN')}
                    </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 border-b border-slate-50 pb-2">
                <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    {invoice.date}
                </div>
                <div className="flex items-center gap-1">
                    <User size={12} />
                    {invoice.items.length} Items
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                    onClick={() => onLoad(invoice)}
                    className="flex-1 py-2 bg-slate-50 text-slate-700 text-xs font-semibold rounded hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                >
                    <ArrowRight size={14} /> View / Edit
                </button>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDownload(invoice);
                    }}
                    title="Download PDF"
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                    <Download size={16} />
                </button>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(invoice.invoiceNumber);
                    }}
                    title="Delete Invoice"
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                    <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};