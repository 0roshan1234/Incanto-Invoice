import React, { useState, useEffect } from 'react';
import { InvoicePaper } from './components/InvoicePaper';
import { PaymentModal } from './components/PaymentModal';
import { Dashboard } from './components/Dashboard';
import { geminiService } from './services/geminiService';
import { InvoiceData, LineItem } from './types';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Printer, 
  CreditCard,
  LayoutTemplate,
  Wand2,
  RefreshCw,
  ChevronRight,
  Download,
  History,
  PenLine
} from 'lucide-react';

// Generator for persistent unique IDs
const getNextInvoiceNumber = () => {
  if (typeof window === 'undefined') return 'INDY0187';
  
  const lastKey = 'smartinvoice_last_id';
  const lastVal = localStorage.getItem(lastKey);
  
  let nextNum = 187; // Start from screenshot default
  
  if (lastVal) {
    // Extract number from INDYxxxx
    const match = lastVal.match(/\d+/);
    if (match) {
      nextNum = parseInt(match[0], 10) + 1;
    }
  }
  
  const newId = `INDY${nextNum.toString().padStart(4, '0')}`;
  localStorage.setItem(lastKey, newId);
  return newId;
};

const INITIAL_DATA: InvoiceData = {
  invoiceNumber: '', // Will be set on mount
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  
  senderName: 'Incanto Dynamics Pvt. Ltd.',
  senderAddress: 'No.373, 2nd Stage, 2nd Phase,\nWOC Road Rajajinagar\nBengaluru - 560 086.',
  senderEmail: 'enquiry@digitalmaven.co.in',
  senderGstin: '29AAHCI4821K1Z9',
  senderPan: 'AAHCI4821K',
  senderCin: 'U62099KA2024PTC183531',

  clientName: 'Bhoomika',
  clientAddress: 'Bengaluru, Karnataka',
  clientEmail: '',
  clientPhone: '91- 98867 68322',
  clientGstin: 'NA',
  clientStateCode: '29',
  
  deliveryPlace: 'NA',

  items: [
    { 
      id: '1', 
      description: 'Advanced Certification in AI Powered Data Analytics', 
      hsnCode: '9992',
      quantity: 1, 
      unit: 'No',
      price: 21186.4407 
    }
  ],
  taxRate: 18, // 9% CGST + 9% SGST
  notes: '',
  isPaid: false,
};

type ViewMode = 'editor' | 'dashboard';

function App() {
  const [data, setData] = useState<InvoiceData>(INITIAL_DATA);
  const [history, setHistory] = useState<InvoiceData[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [smartFillText, setSmartFillText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Load history & set initial invoice number
  useEffect(() => {
    // Load History
    const savedHistory = localStorage.getItem('smartinvoice_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }

    // Set Initial ID
    setData(prev => ({ ...prev, invoiceNumber: getNextInvoiceNumber() }));
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    localStorage.setItem('smartinvoice_history', JSON.stringify(history));
  }, [history]);

  // Update document title for download filename fallback
  useEffect(() => {
    if (data.invoiceNumber) {
      document.title = `Invoice-${data.invoiceNumber}`;
    }
  }, [data.invoiceNumber]);

  const updateField = (field: keyof InvoiceData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      hsnCode: '',
      quantity: 1,
      unit: 'No',
      price: 0
    };
    setData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const updateItemTotal = (id: string, totalAmount: number) => {
    const item = data.items.find(i => i.id === id);
    if (!item) return;

    const qty = item.quantity || 1;
    const taxMultiplier = 1 + (data.taxRate / 100);
    const rawPrice = (totalAmount / taxMultiplier) / qty;
    updateItem(id, 'price', rawPrice);
  };

  const removeItem = (id: string) => {
    setData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleSmartFill = async () => {
    if (!smartFillText.trim()) return;
    setIsThinking(true);
    const result = await geminiService.parseInvoiceItems(smartFillText);
    
    if (result) {
      setData(prev => {
        let newData = { ...prev };

        // 1. Handle Actions (Clear/Reset)
        if (result.actions?.clearClient) {
          newData.clientName = '';
          newData.clientAddress = '';
          newData.clientEmail = '';
          newData.clientPhone = '';
          newData.clientGstin = 'NA';
          newData.clientStateCode = '';
        }

        if (result.actions?.clearItems) {
          newData.items = [];
        }

        if (result.actions?.markAsUnpaid) {
          newData.isPaid = false;
        }
        
        if (result.actions?.markAsPaid) {
          newData.isPaid = true;
        }

        // 2. Apply extracted data (overwriting if necessary)
        if (result.clientDetails) {
          newData.clientName = result.clientDetails.name || newData.clientName;
          newData.clientAddress = result.clientDetails.address || newData.clientAddress;
          newData.clientGstin = result.clientDetails.gstin || newData.clientGstin;
          newData.clientPhone = result.clientDetails.phone || newData.clientPhone;
        }

        if (result.items && result.items.length > 0) {
          const currentTaxRate = newData.taxRate || 18;
          const taxMultiplier = 1 + (currentTaxRate / 100);

          const newItems = result.items.map(item => {
            // Treat AI input price as Total Amount (Inclusive of Tax)
            // Calculate taxable rate backwards
            // Formula: Rate = Total / (1 + Tax%)
            const totalAmount = item.price; 
            const derivedRate = totalAmount / taxMultiplier;

            return {
              id: Math.random().toString(36).substr(2, 9),
              description: item.description,
              hsnCode: '',
              quantity: item.quantity,
              unit: 'No',
              price: derivedRate // Set the derived taxable value
            };
          });
          
          // Append new items to existing ones (unless cleared)
          newData.items = [...newData.items, ...newItems];
        }

        return newData;
      });
      
      setSmartFillText('');
    }
    setIsThinking(false);
  };

  const getTotal = () => {
    const subtotal = data.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const tax = subtotal * (data.taxRate / 100);
    return subtotal + tax; 
  };

  const saveToHistory = (currentData: InvoiceData) => {
    setHistory(prev => {
      // Check if invoice number already exists, if so update it
      const existingIndex = prev.findIndex(i => i.invoiceNumber === currentData.invoiceNumber);
      if (existingIndex >= 0) {
        const newHistory = [...prev];
        newHistory[existingIndex] = currentData;
        return newHistory;
      }
      return [...prev, currentData];
    });
  };

  const handlePaymentSuccess = () => {
    const updatedData = { ...data, isPaid: true };
    setData(updatedData);
    setIsPaymentModalOpen(false);
    setActiveTab('preview');
    // Auto-save on payment success
    saveToHistory(updatedData);
  };

  const generatePDF = (invoiceNumber: string) => {
    const originalElement = document.getElementById('invoice-paper');
    if (!originalElement) {
        alert('Error: Invoice element not found');
        return;
    }

    // Clone the element to render for PDF cleanly
    // This avoids issues with CSS transforms (zoom) and margins affecting the output
    const element = originalElement.cloneNode(true) as HTMLElement;
    
    // Normalize styles for A4 PDF
    // Use 'mm' to match PDF units. 210mm is A4 width.
    element.style.width = '210mm'; 
    element.style.minHeight = '295mm'; // Slightly less than 297mm to avoid overflow page break
    element.style.height = 'auto';
    element.style.margin = '0';
    element.style.padding = '0';
    element.style.transform = 'none';
    element.style.boxShadow = 'none';
    element.style.background = 'white';
    
    // Remove conflicting classes
    element.classList.remove('mx-auto', 'shadow-xl', 'my-8', 'm-8'); 

    // Fix inner content margins that might cause overflow
    const innerContainer = element.querySelector('.border-2.border-black');
    if (innerContainer) {
        innerContainer.classList.remove('m-8');
        // Add consistent margin inside the page
        (innerContainer as HTMLElement).style.margin = '10mm'; 
    }

    // Create a temporary container
    // CRITICAL FIX: Place it at (0,0) fixed, but behind everything (z-index -9999).
    // Do NOT move it off-screen (e.g., left: -9999px) as this causes left-side clipping in html2canvas.
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.zIndex = '-9999';
    container.style.width = '210mm';
    container.style.background = '#ffffff'; // Ensure white background
    container.appendChild(element);
    document.body.appendChild(container);

    const opt = {
      margin: 0,
      filename: `Invoice-${invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        logging: false,
        x: 0, 
        y: 0,
        windowWidth: 800, // Explicitly set wide enough for A4 (approx 794px at 96dpi)
      },
      jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
      },
      pagebreak: { mode: 'avoid-all', after: '#invoice-paper' }
    };
    
    // Check if library exists (loaded via CDN)
    if ((window as any).html2pdf) {
       (window as any).html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
            // Cleanup
            document.body.removeChild(container);
        })
        .catch((err: any) => {
            console.error('PDF generation error:', err);
            document.body.removeChild(container);
            alert('Could not generate PDF. Please try printing.');
        });
    } else {
       // Fallback
       document.body.removeChild(container);
       window.print();
    }
  };

  const handleDownload = () => {
    // Save to history before generating PDF to ensure records are kept
    saveToHistory(data);
    generatePDF(data.invoiceNumber);
  };

  const handleLoadInvoice = (invoice: InvoiceData) => {
    setData(invoice);
    setViewMode('editor');
    if (window.innerWidth < 768) {
        setActiveTab('preview');
    }
  };

  const handleDownloadHistoryItem = (invoice: InvoiceData) => {
    setData(invoice);
    // Allow React to render the new data into the InvoicePaper view
    setTimeout(() => {
        generatePDF(invoice.invoiceNumber);
    }, 100);
  };

  const handleDeleteInvoice = (invoiceNumber: string) => {
    if (confirm('Are you sure you want to delete this invoice history?')) {
        setHistory(prev => prev.filter(i => i.invoiceNumber !== invoiceNumber));
    }
  };

  const getItemTotal = (item: LineItem) => {
    const sub = item.quantity * item.price;
    const tax = sub * (data.taxRate / 100);
    const val = sub + tax;
    return Math.round(val * 100) / 100;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row print:bg-white">
      
      {/* --- Sidebar / Editor (Hidden on print) --- */}
      <div className={`no-print w-full md:w-[450px] lg:w-[500px] bg-white border-r border-slate-200 h-auto md:h-screen overflow-y-auto flex-shrink-0 flex flex-col transition-all duration-300 ${activeTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 sticky top-0 bg-white z-20">
            <div className="flex items-center gap-2 mb-4">
                <LayoutTemplate className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Incanto Invoice</h1>
            </div>

            {/* Tab Switcher (Editor vs Dashboard) */}
            <div className="flex p-1 bg-slate-100 rounded-lg">
                <button 
                    onClick={() => setViewMode('editor')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'editor' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <PenLine size={16} /> Editor
                </button>
                <button 
                    onClick={() => setViewMode('dashboard')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'dashboard' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <History size={16} /> History
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
            
            {viewMode === 'dashboard' ? (
                <Dashboard 
                    history={history} 
                    onLoad={handleLoadInvoice} 
                    onDelete={handleDeleteInvoice}
                    onDownload={handleDownloadHistoryItem}
                />
            ) : (
                <div className="p-6 space-y-8 pb-32">
                
                {/* Smart Fill Section */}
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <div className="flex items-center gap-2 mb-2 text-indigo-900 font-semibold">
                        <Sparkles className="w-4 h-4" />
                        <span>AI Smart Fill</span>
                    </div>
                    <textarea 
                        className="w-full text-sm p-3 rounded-lg border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white"
                        rows={3}
                        placeholder="e.g., 'Invoice for John Doe for 50000'; 'Remove payment details'"
                        value={smartFillText}
                        onChange={(e) => setSmartFillText(e.target.value)}
                    />
                    <button 
                        onClick={handleSmartFill}
                        disabled={isThinking || !smartFillText}
                        className="mt-2 w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                    >
                        {isThinking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        {isThinking ? 'Processing...' : 'Update Invoice'}
                    </button>
                </div>

                {/* Invoice Details */}
                <section className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Invoice No</label>
                            <input type="text" value={data.invoiceNumber} onChange={(e) => updateField('invoiceNumber', e.target.value)} className="w-full p-2 text-sm border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                            <input type="date" value={data.date} onChange={(e) => updateField('date', e.target.value)} className="w-full p-2 text-sm border rounded-md" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Delivery Place</label>
                            <input type="text" value={data.deliveryPlace} onChange={(e) => updateField('deliveryPlace', e.target.value)} className="w-full p-2 text-sm border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Total GST Rate %</label>
                            <input type="number" value={data.taxRate} onChange={(e) => updateField('taxRate', parseFloat(e.target.value))} className="w-full p-2 text-sm border rounded-md" />
                        </div>
                    </div>
                </section>

                {/* Sender Info */}
                <section className="space-y-4 bg-slate-50 p-4 rounded-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company Details (Sender)</h3>
                    <input type="text" placeholder="Company Name" value={data.senderName} onChange={(e) => updateField('senderName', e.target.value)} className="w-full p-2 text-sm border rounded-md font-medium" />
                    <textarea placeholder="Address" value={data.senderAddress} onChange={(e) => updateField('senderAddress', e.target.value)} className="w-full p-2 text-sm border rounded-md h-20 resize-none" />
                    <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="GSTIN" value={data.senderGstin} onChange={(e) => updateField('senderGstin', e.target.value)} className="w-full p-2 text-sm border rounded-md" />
                        <input type="text" placeholder="PAN" value={data.senderPan} onChange={(e) => updateField('senderPan', e.target.value)} className="w-full p-2 text-sm border rounded-md" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="CIN" value={data.senderCin} onChange={(e) => updateField('senderCin', e.target.value)} className="w-full p-2 text-sm border rounded-md" />
                        <input type="email" placeholder="Email / Ref" value={data.senderEmail} onChange={(e) => updateField('senderEmail', e.target.value)} className="w-full p-2 text-sm border rounded-md" />
                    </div>
                </section>

                {/* Client Info */}
                <section className="space-y-4 bg-slate-50 p-4 rounded-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Details (Bill To)</h3>
                    <input type="text" placeholder="Client Name" value={data.clientName} onChange={(e) => updateField('clientName', e.target.value)} className="w-full p-2 text-sm border rounded-md font-medium" />
                    <textarea placeholder="Address" value={data.clientAddress} onChange={(e) => updateField('clientAddress', e.target.value)} className="w-full p-2 text-sm border rounded-md h-20 resize-none" />
                    <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Client GSTIN" value={data.clientGstin} onChange={(e) => updateField('clientGstin', e.target.value)} className="w-full p-2 text-sm border rounded-md" />
                        <input type="text" placeholder="State Code" value={data.clientStateCode} onChange={(e) => updateField('clientStateCode', e.target.value)} className="w-full p-2 text-sm border rounded-md" />
                    </div>
                    <input type="text" placeholder="Phone / Handheld" value={data.clientPhone} onChange={(e) => updateField('clientPhone', e.target.value)} className="w-full p-2 text-sm border rounded-md" />
                </section>

                {/* Items */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Line Items</h3>
                        <button onClick={addItem} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                            <Plus size={14} /> Add Item
                        </button>
                    </div>
                    <div className="space-y-3">
                        {data.items.map((item) => (
                            <div key={item.id} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm group">
                                <div className="flex gap-2 mb-2">
                                    <input 
                                        type="text" 
                                        placeholder="Description" 
                                        value={item.description} 
                                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                        className="flex-1 p-1 text-sm border-b border-transparent focus:border-primary outline-none font-medium"
                                    />
                                    <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-12 gap-2 mb-2">
                                    <div className="col-span-3">
                                        <label className="text-[10px] text-slate-400">HSN</label>
                                        <input type="text" value={item.hsnCode} onChange={(e) => updateItem(item.id, 'hsnCode', e.target.value)} className="w-full text-xs p-1 bg-slate-50 border rounded" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] text-slate-400">Qty</label>
                                        <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full text-xs p-1 bg-slate-50 border rounded" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] text-slate-400">Unit</label>
                                        <input type="text" value={item.unit} onChange={(e) => updateItem(item.id, 'unit', e.target.value)} className="w-full text-xs p-1 bg-slate-50 border rounded" />
                                    </div>
                                    {/* REVERSE CALCULATION INPUT */}
                                    <div className="col-span-5">
                                        <label className="text-[10px] text-blue-600 font-bold">Total (Inc. Tax)</label>
                                        <div className="relative">
                                            <span className="absolute left-1 top-1 text-xs text-slate-400">₹</span>
                                            <input 
                                                type="number" 
                                                value={getItemTotal(item)} 
                                                onChange={(e) => updateItemTotal(item.id, parseFloat(e.target.value) || 0)} 
                                                className="w-full text-xs p-1 pl-3 bg-blue-50 border border-blue-200 rounded font-bold text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none" 
                                            />
                                        </div>
                                        <div className="text-[9px] text-slate-400 mt-1 text-right">
                                            Rate: {item.price.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                </div>
            )}
        </div>

        {/* Mobile Tab Switcher for View */}
        <div className="md:hidden sticky bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-4 z-30">
            <button 
                onClick={() => setActiveTab('preview')}
                className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold shadow-lg flex items-center justify-center gap-2"
            >
                Preview Invoice <ChevronRight size={18} />
            </button>
        </div>
      </div>

      {/* --- Preview / Action Area --- */}
      <div className={`flex-1 relative bg-slate-300 flex flex-col h-screen overflow-hidden ${activeTab === 'edit' ? 'hidden md:flex' : 'flex fixed inset-0 z-40 md:static'}`}>
        
        {/* Toolbar */}
        <div className="no-print h-16 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-20 shadow-sm">
            <button 
                onClick={() => setActiveTab('edit')} 
                className="md:hidden text-slate-600 text-sm font-medium"
            >
                ← Back to Edit
            </button>
            <div className="hidden md:block text-slate-600 font-semibold">
                Preview
            </div>
            
            <div className="flex gap-3">
                 <button 
                 onClick={handleDownload}
                 className="px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors flex items-center gap-2 shadow-lg"
                 >
                     <Download size={18} /> Generate & Download Invoice
                 </button>
            </div>
        </div>

        {/* Invoice Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center items-start print:p-0 print:overflow-visible print:block">
            <div className="scale-[0.8] lg:scale-100 origin-top print:transform-none transition-transform duration-300 shadow-2xl">
                <InvoicePaper data={data} />
            </div>
        </div>

      </div>

      {/* Modals */}
      <PaymentModal 
        amount={getTotal()}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

    </div>
  );
}

export default App;