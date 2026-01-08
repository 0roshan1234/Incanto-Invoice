import React from 'react';
import { InvoiceData } from '../types';

interface InvoicePaperProps {
  data: InvoiceData;
  className?: string;
}

// Simple Number to Words converter for the footer
const numberToWords = (num: number): string => {
  const rounded = Math.round(num);
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + rounded.toFixed(0)).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';

  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  
  return str.trim() + ' Only';
};

export const InvoicePaper: React.FC<InvoicePaperProps> = ({ data, className = '' }) => {
  const taxRateSplit = data.taxRate / 2; // Assuming Intra-state (CGST + SGST)

  const itemsWithTax = data.items.map(item => {
    const taxableValue = item.price * item.quantity;
    const cgstVal = taxableValue * (taxRateSplit / 100);
    const sgstVal = taxableValue * (taxRateSplit / 100);
    const total = taxableValue + cgstVal + sgstVal;
    
    return { ...item, taxableValue, cgstVal, sgstVal, total };
  });

  const totalTaxable = itemsWithTax.reduce((acc, item) => acc + item.taxableValue, 0);
  const totalCGST = itemsWithTax.reduce((acc, item) => acc + item.cgstVal, 0);
  const totalSGST = itemsWithTax.reduce((acc, item) => acc + item.sgstVal, 0);
  const grandTotal = totalTaxable + totalCGST + totalSGST;

  return (
    <div id="invoice-paper" className={`bg-white text-black text-[10px] leading-tight font-sans shadow-xl print:shadow-none min-h-[29.7cm] w-[21cm] mx-auto flex flex-col relative ${className}`}>
      
      {/* Watermark */}
      {data.isPaid && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-8 border-green-600 text-green-600 font-bold text-9xl opacity-10 rotate-[-15deg] pointer-events-none select-none z-0">
          PAID
        </div>
      )}

      {/* Main Container with Border */}
      <div className="border-2 border-black flex-grow flex flex-col m-8 print:m-0 h-full">
        
        {/* Top Header Row with Peach Background */}
        <div className="flex border-b border-black bg-[#ffe4e1]">
            <div className="w-1/2 p-2 font-bold text-center border-r border-black text-sm uppercase">Invoice</div>
            <div className="w-1/2 p-2 text-center text-xs font-bold">Original / Duplicate / Triplicate</div>
        </div>

        {/* Sender & Invoice Info Grid */}
        <div className="flex border-b border-black">
            {/* Left: Sender Details */}
            <div className="w-1/2 border-r border-black flex flex-col">
                <div className="p-2 flex-grow">
                    <div className="font-bold text-sm mb-1">{data.senderName}</div>
                    <div className="whitespace-pre-line mb-2">{data.senderAddress}</div>
                    <div className="font-semibold">GST No.{data.senderGstin}</div>
                    <div className="font-semibold">CIN: {data.senderCin}</div>
                </div>
                {/* Reference Row */}
                 <div className="border-t border-black p-2 flex">
                    <span className="font-semibold">Reference:</span> <span className="ml-1">{data.senderEmail}</span>
                 </div>
            </div>

            {/* Right: Invoice Meta & Customer Details */}
            <div className="w-1/2 flex flex-col">
                 <div className="flex-grow"></div> {/* Empty space top right */}
                 
                 {/* PAN Line */}
                <div className="border-t border-black p-2 bg-white">
                    <span className="font-semibold">PAN:</span> {data.senderPan}
                </div>
            </div>
        </div>

        {/* Customer & Invoice Details Row */}
        <div className="flex border-b border-black">
            <div className="w-1/2 border-r border-black p-2 flex items-start">
                 <div className="font-bold whitespace-nowrap mr-2">CUSTOMER :</div>
                 <div className="font-bold flex flex-col">
                    <div>{data.clientName}</div>
                    <div>{data.clientAddress}</div>
                    <div>Handheld: {data.clientPhone}</div>
                 </div>
            </div>
            <div className="w-1/2 flex flex-col">
                <div className="p-2 border-b border-black">
                     <span className="font-bold">Invoice No : {data.invoiceNumber}</span>
                </div>
                <div className="p-2">
                     <span className="font-bold">Invoice Date : {data.date}</span>
                </div>
            </div>
        </div>

        {/* GSTIN & Place Row */}
        <div className="flex border-b border-black">
             <div className="w-1/2 border-r border-black flex flex-col">
                <div className="p-2 border-b border-black">
                    <span className="font-bold">Customer GSTIN No: {data.clientGstin}</span>
                </div>
                <div className="p-2">
                    <span className="font-bold">State Code: {data.clientStateCode}</span>
                </div>
             </div>
             <div className="w-1/2 flex">
                 <div className="w-1/2 p-2 border-r border-black font-bold">
                     DELIVERY PLACE: {data.deliveryPlace}
                 </div>
                 <div className="w-1/2 p-2">
                     <div className="font-bold">GSTIN no: {data.clientGstin}</div>
                     <div className="font-bold">State Code: {data.clientStateCode}</div>
                 </div>
             </div>
        </div>

        {/* Line Items Table */}
        <div className="flex-grow flex flex-col">
            <div className="grid grid-cols-[30px_1fr_50px_35px_35px_60px_70px_35px_50px_35px_50px_70px] border-b border-black text-center font-bold">
                <div className="border-r border-black p-1 flex items-center justify-center">SL No</div>
                <div className="border-r border-black p-1 flex items-center justify-center">Description Of Service</div>
                <div className="border-r border-black p-1 flex items-center justify-center">HSN Code</div>
                <div className="border-r border-black p-1 flex items-center justify-center">QTY</div>
                <div className="border-r border-black p-1 flex items-center justify-center">QTY</div> {/* Matches screenshot typo/style "QTY" for Unit */}
                <div className="border-r border-black p-1 flex items-center justify-center">Rate</div>
                <div className="border-r border-black p-1 flex items-center justify-center">Taxable value</div>
                <div className="border-r border-black p-1 flex items-center justify-center text-[9px]">CGST %</div>
                <div className="border-r border-black p-1 flex items-center justify-center">CGST Value</div>
                <div className="border-r border-black p-1 flex items-center justify-center text-[9px]">SGST %</div>
                <div className="border-r border-black p-1 flex items-center justify-center">SGST Value</div>
                <div className="p-1 flex items-center justify-center">Total</div>
            </div>

            {itemsWithTax.map((item, index) => (
                <div key={item.id} className="grid grid-cols-[30px_1fr_50px_35px_35px_60px_70px_35px_50px_35px_50px_70px] border-b border-black text-center relative min-h-[30px]">
                    <div className="border-r border-black p-1">{index + 1}</div>
                    <div className="border-r border-black p-1 text-left font-bold">{item.description}</div>
                    <div className="border-r border-black p-1">{item.hsnCode}</div>
                    <div className="border-r border-black p-1">{item.quantity}</div>
                    <div className="border-r border-black p-1">{item.unit}</div>
                    <div className="border-r border-black p-1">{Math.round(item.price).toLocaleString('en-IN')}</div>
                    <div className="border-r border-black p-1">{Math.round(item.taxableValue).toLocaleString('en-IN')}</div>
                    <div className="border-r border-black p-1">{taxRateSplit.toFixed(2)}</div>
                    <div className="border-r border-black p-1">{Math.round(item.cgstVal).toLocaleString('en-IN')}</div>
                    <div className="border-r border-black p-1">{taxRateSplit.toFixed(2)}</div>
                    <div className="border-r border-black p-1">{Math.round(item.sgstVal).toLocaleString('en-IN')}</div>
                    <div className="p-1 font-semibold">{Math.round(item.total).toLocaleString('en-IN')}</div>
                </div>
            ))}
            
            {/* Filler rows to push footer down */}
            <div className="flex-grow border-b border-black min-h-[50px] bg-white grid grid-cols-[30px_1fr_50px_35px_35px_60px_70px_35px_50px_35px_50px_70px]">
                 <div className="border-r border-black"></div>
                 <div className="border-r border-black"></div>
                 <div className="border-r border-black"></div>
                 <div className="border-r border-black"></div>
                 <div className="border-r border-black"></div>
                 <div className="border-r border-black"></div>
                 <div className="border-r border-black"></div>
                 <div className="border-r border-black"></div>
                 <div className="border-r border-black"></div>
                 <div className="border-r border-black"></div>
                 <div className="border-r border-black"></div>
                 <div></div>
            </div>
        </div>

        {/* Clean Totals Row - Aligned precisely with columns */}
        <div className="border-b border-black grid grid-cols-[30px_1fr_50px_35px_35px_60px_70px_35px_50px_35px_50px_70px] bg-white">
            {/* Span across first 6 cols for "Total" label */}
            <div className="col-span-6 p-1 text-center font-bold border-r border-black flex justify-end items-center pr-4">
                Total
            </div>
            {/* Taxable Value Col */}
            <div className="p-1 text-center font-bold border-r border-black flex items-center justify-center">
                {Math.round(totalTaxable).toLocaleString('en-IN')}
            </div>
            {/* CGST % Col (Empty) */}
            <div className="p-1 border-r border-black bg-slate-100"></div>
            {/* CGST Value Col */}
            <div className="p-1 text-center font-bold border-r border-black flex items-center justify-center">
                {Math.round(totalCGST).toLocaleString('en-IN')}
            </div>
            {/* SGST % Col (Empty) */}
            <div className="p-1 border-r border-black bg-slate-100"></div>
            {/* SGST Value Col */}
            <div className="p-1 text-center font-bold border-r border-black flex items-center justify-center">
                {Math.round(totalSGST).toLocaleString('en-IN')}
            </div>
            {/* Total Col */}
            <div className="p-1 text-center font-bold flex items-center justify-center">
                {Math.round(grandTotal).toLocaleString('en-IN')}
            </div>
        </div>

        {/* Footer Summary Section (Split Left/Right) */}
        <div className="flex border-b border-black">
            {/* Left Side: Tax Words */}
            <div className="flex-grow border-r border-black p-2 flex flex-col gap-1">
                 <div className="font-bold text-[9px] flex gap-1">
                    <span>CGST In Words:</span> 
                    <span className="font-normal">{numberToWords(totalCGST)}</span>
                 </div>
                 <div className="font-bold text-[9px] flex gap-1">
                    <span>SGST In Words:</span> 
                    <span className="font-normal">{numberToWords(totalSGST)}</span>
                 </div>
            </div>

            {/* Right Side Summary Table */}
            <div className="w-[35%] text-[9px]">
                  <div className="flex border-b border-black">
                      <div className="flex-grow p-1 font-bold border-r border-black pl-2">Total Assessable Value</div>
                      <div className="w-[70px] p-1 font-bold text-right pr-1">{Math.round(totalTaxable).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="flex border-b border-black">
                      <div className="flex-grow p-1 font-bold border-r border-black pl-2">CGST</div>
                      <div className="w-[70px] p-1 font-bold text-right pr-1">{Math.round(totalCGST).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="flex border-b border-black">
                      <div className="flex-grow p-1 font-bold border-r border-black pl-2">SGST</div>
                      <div className="w-[70px] p-1 font-bold text-right pr-1">{Math.round(totalSGST).toLocaleString('en-IN')}</div>
                  </div>
                   <div className="flex border-b border-black">
                      <div className="flex-grow p-1 font-bold border-r border-black pl-2 flex justify-between">
                        <span>RCM</span>
                        <span className="mr-2">Y/N</span>
                      </div>
                      <div className="w-[70px] p-1 font-bold text-right pr-1"></div>
                  </div>
                  <div className="flex font-bold">
                      <div className="flex-grow p-1 border-r border-black pl-2">Total Invoice Value</div>
                      <div className="w-[70px] p-1 text-right pr-1">{Math.round(grandTotal).toLocaleString('en-IN')}</div>
                  </div>
            </div>
        </div>

        {/* Invoice Value in Words - Separate Row */}
        <div className="border-b border-black p-2 text-[9px] font-bold">
             Invoice Value in words: <span className="font-normal uppercase">{numberToWords(grandTotal)}</span>
        </div>

        {/* Declaration - Separate Row */}
        <div className="border-b border-black p-1 px-2 text-[9px] leading-tight">
             Certified that particulars given above are true and correct and the amount indicated above represents the price actually charged and there is no flow of additional consideration directly or indirectly from the buyer.
        </div>

        {/* Signature - Separate Row */}
        <div className="flex justify-end p-2 min-h-[100px]">
            <div className="flex flex-col items-end gap-1">
                <div className="font-bold text-sm">For {data.senderName}</div>
                
                <div className="h-16 w-40 relative flex justify-end">
                     <img 
                        src="https://i.ibb.co/JjS5yV8k/image.png" 
                        alt="Authorized Signatory"
                        className="h-full object-contain mix-blend-multiply"
                        crossOrigin="anonymous" 
                     />
                </div>

                <div className="font-bold text-sm">
                    Authorised Signatory
                </div>
            </div>
        </div>
      </div>
      
      <div className="text-center text-[8px] mt-1 print:hidden">Generated by SmartInvoice AI</div>
    </div>
  );
};