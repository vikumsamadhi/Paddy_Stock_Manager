import React, { useState, useEffect, useMemo } from 'react';

// --- Local Database Helper Functions ---
// These functions will read and write data to the browser's localStorage.

const getFromDB = (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
};

const saveToDB = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// --- Main App Configuration ---
const PADDY_TYPES = ['Keeri Samba', 'Samba', 'Nadu', 'Red Nadu'];

// --- SVG Icons ---
const ArrowUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
);
const ArrowDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
);
const WarehouseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);
const OfficeBuildingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-4h1m-1 4h1m-1-4h1m-1-4h1" />
    </svg>
);
const DocumentReportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);


// --- Main App Component ---
export default function App() {
    const [activeView, setActiveView] = useState('dashboard');
    const [stockIn, setStockIn] = useState([]);
    const [stockOut, setStockOut] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pdfLibsReady, setPdfLibsReady] = useState(false);

    // --- Library Loading Effects ---
    useEffect(() => {
        const tailwindScriptId = 'tailwind-cdn-script';
        if (!document.getElementById(tailwindScriptId)) {
            const script = document.createElement('script');
            script.id = tailwindScriptId;
            script.src = 'https://cdn.tailwindcss.com';
            document.head.appendChild(script);
        }
        const jspdfScriptId = 'jspdf-script';
        if (!document.getElementById(jspdfScriptId)) {
            const jspdfScript = document.createElement('script');
            jspdfScript.id = jspdfScriptId;
            jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            jspdfScript.async = true;
            jspdfScript.onload = () => {
                const autotableScriptId = 'jspdf-autotable-script';
                 if (!document.getElementById(autotableScriptId)) {
                    const autotableScript = document.createElement('script');
                    autotableScript.id = autotableScriptId;
                    autotableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
                    autotableScript.async = true;
                    autotableScript.onload = () => setPdfLibsReady(true);
                    document.body.appendChild(autotableScript);
                 } else { setPdfLibsReady(true); }
            };
            document.body.appendChild(jspdfScript);
        } else { setPdfLibsReady(true); }
    }, []);

    // --- Data Loading Effect from Local Storage ---
    useEffect(() => {
        setStockIn(getFromDB('paddy_stockIn'));
        setStockOut(getFromDB('paddy_stockOut'));
        setWarehouses(getFromDB('paddy_warehouses'));
        setIsLoading(false);
    }, []);

    // --- Calculated Values ---
    const stockData = useMemo(() => {
        const data = { warehouses: {}, totals: { byType: {}, overall: 0, totalValue: 0 } };
        PADDY_TYPES.forEach(type => { data.totals.byType[type] = { weight: 0, totalValue: 0, count: 0 }; });
        warehouses.forEach(wh => {
            data.warehouses[wh.id] = { name: wh.name, byType: {} };
            PADDY_TYPES.forEach(type => { data.warehouses[wh.id].byType[type] = { weight: 0, totalValue: 0, count: 0 }; });
        });
        stockIn.forEach(item => {
            if (data.warehouses[item.warehouseId] && data.warehouses[item.warehouseId].byType[item.paddyType]) {
                const whTypeData = data.warehouses[item.warehouseId].byType[item.paddyType];
                whTypeData.weight += item.weightKg; whTypeData.totalValue += item.totalValue; whTypeData.count++;
                const totalTypeData = data.totals.byType[item.paddyType];
                totalTypeData.weight += item.weightKg; totalTypeData.totalValue += item.totalValue; totalTypeData.count++;
            }
        });
        stockOut.forEach(item => {
             if (data.warehouses[item.warehouseId] && data.warehouses[item.warehouseId].byType[item.paddyType]) {
                data.warehouses[item.warehouseId].byType[item.paddyType].weight -= item.weightKg;
                data.totals.byType[item.paddyType].weight -= item.weightKg;
            }
        });
        data.totals.overall = Object.values(data.totals.byType).reduce((acc, type) => acc + type.weight, 0);
        data.totals.totalValue = Object.values(data.totals.byType).reduce((acc, type) => acc + type.totalValue, 0);
        return data;
    }, [warehouses, stockIn, stockOut]);

    const currentStock = stockData.totals.overall;
    
    const stockByWarehouse = useMemo(() => {
        return warehouses.map(warehouse => {
            const stockByType = {};
             PADDY_TYPES.forEach(type => { stockByType[type] = stockData.warehouses[warehouse.id]?.byType[type]?.weight || 0; });
            const totalWarehouseStock = Object.values(stockByType).reduce((sum, stock) => sum + stock, 0);
            return { ...warehouse, stockByType, currentStock: totalWarehouseStock };
        });
    }, [warehouses, stockData]);

    const allTransactions = useMemo(() => {
        return [...stockIn.map(item => ({ ...item, type: 'IN' })), ...stockOut.map(item => ({ ...item, type: 'OUT' }))]
            .sort((a, b) => (new Date(b.timestamp) || 0) - (new Date(a.timestamp) || 0));
    }, [stockIn, stockOut]);

    // --- UI Components ---
    const Header = () => (
        <header className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <div className="flex items-center"><WarehouseIcon /><h1 className="text-2xl font-bold text-gray-800 ml-3">Paddy Stock Manager</h1></div>
            </div>
        </header>
    );

    const Navigation = () => (
        <nav className="bg-gray-100 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-center flex-wrap">
                    {['dashboard', 'stockIn', 'stockOut', 'ledger', 'warehouses', 'reports'].map((view) => (
                        <button key={view} onClick={() => setActiveView(view)}
                            className={`px-3 py-3 text-xs sm:text-sm font-medium transition-colors duration-200 ${activeView === view ? 'border-b-2 border-blue-500 text-blue-600' : 'border-b-2 border-transparent text-gray-600 hover:text-blue-500'}`}>
                           {view.charAt(0).toUpperCase() + view.slice(1).replace('In', ' In').replace('Out', ' Out')}
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
    
    const Dashboard = () => (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                <h3 className="text-lg font-medium text-gray-500">Total Current Stock (All Warehouses)</h3>
                <p className="text-5xl font-bold text-blue-600 mt-2">{currentStock.toLocaleString(undefined, {maximumFractionDigits: 0})} kg</p>
            </div>
            <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-gray-800">Stock by Warehouse</h3>
                {isLoading ? <p>Loading warehouses...</p> : warehouses.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {stockByWarehouse.map(wh => (
                            <div key={wh.id} className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                                <h4 className="text-xl font-bold text-gray-800">{wh.name}</h4>
                                <p className="text-lg font-semibold text-blue-500 mb-4">Total: {wh.currentStock.toLocaleString(undefined, {maximumFractionDigits: 0})} kg</p>
                                <ul className="space-y-2">
                                    {PADDY_TYPES.map(type => (
                                        <li key={type} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                                            <span className="font-medium text-gray-600">{type}</span>
                                            <span className="font-bold text-gray-900">{(wh.stockByType[type] || 0).toLocaleString(undefined, {maximumFractionDigits: 0})} kg</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-gray-500 text-center py-4 bg-white rounded-lg shadow-sm">No warehouses created yet. Go to the 'Warehouses' tab to add one.</p>}
            </div>
        </div>
    );

    const DataForm = ({ type }) => {
        const isStockIn = type === 'in';
        const [formData, setFormData] = useState({ 
            date: new Date().toISOString().split('T')[0],
            vehicleNumber: '', 
            weightKg: '', 
            grn: '', 
            pricePerKg: '', 
            warehouseId: '', 
            paddyType: '' 
        });
        const [message, setMessage] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);
        
        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        // Automatically calculate price per kg when GRN changes
        useEffect(() => {
            if (isStockIn) {
                const grnValue = parseFloat(formData.grn);
                if (!isNaN(grnValue) && grnValue > 0) {
                    const price = grnValue / 64;
                    setFormData(prev => ({ ...prev, pricePerKg: price.toFixed(2) }));
                } else {
                    setFormData(prev => ({ ...prev, pricePerKg: '' }));
                }
            }
        }, [formData.grn, isStockIn]);

        const handleSubmit = (e) => {
            e.preventDefault();
            setIsSubmitting(true); setMessage('');
            if (!formData.date || !formData.vehicleNumber || !formData.weightKg || !formData.warehouseId || !formData.paddyType) {
                setMessage('All fields are required.'); setIsSubmitting(false); return;
            }
            if (isStockIn && (!formData.grn || !formData.pricePerKg)) {
                setMessage('GRN and Price are required for Stock In.'); setIsSubmitting(false); return;
            }
            if (Number(formData.weightKg) <= 0) {
                setMessage('Weight must be a positive number.'); setIsSubmitting(false); return;
            }
            if (!isStockIn) {
                const warehouse = stockByWarehouse.find(wh => wh.id === formData.warehouseId);
                const availableStock = warehouse?.stockByType[formData.paddyType] ?? 0;
                if (Number(formData.weightKg) > availableStock) {
                    setMessage(`Cannot issue more ${formData.paddyType} than available. Current stock: ${availableStock.toLocaleString()} kg.`); setIsSubmitting(false); return;
                }
            }
            try {
                const selectedWarehouse = warehouses.find(w => w.id === formData.warehouseId);
                const newEntry = { 
                    id: crypto.randomUUID(), 
                    timestamp: new Date(formData.date).toISOString(),
                    vehicleNumber: formData.vehicleNumber, 
                    weightKg: Number(formData.weightKg), 
                    warehouseId: formData.warehouseId, 
                    warehouseName: selectedWarehouse?.name || 'Unknown', 
                    paddyType: formData.paddyType 
                };
                if (isStockIn) {
                    newEntry.grn = formData.grn;
                    newEntry.pricePerKg = Number(formData.grn) / 64;
                    newEntry.totalValue = (Number(formData.weightKg) / 64) * Number(formData.grn);
                    const updatedStockIn = [...stockIn, newEntry];
                    setStockIn(updatedStockIn);
                    saveToDB('paddy_stockIn', updatedStockIn);
                } else {
                    const updatedStockOut = [...stockOut, newEntry];
                    setStockOut(updatedStockOut);
                    saveToDB('paddy_stockOut', updatedStockOut);
                }
                setMessage(`Successfully ${isStockIn ? 'added stock' : 'issued stock'}!`);
                setFormData({ 
                    date: new Date().toISOString().split('T')[0],
                    vehicleNumber: '', weightKg: '', grn: '', pricePerKg: '', warehouseId: '', paddyType: '' 
                });
                setTimeout(() => setMessage(''), 3000);
            } catch (error) {
                console.error("Error saving document: ", error); setMessage('An error occurred. Please try again.');
            } finally { setIsSubmitting(false); }
        };
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">{isStockIn ? <ArrowUpIcon /> : <ArrowDownIcon />}{isStockIn ? 'Enter New Paddy Stock' : 'Issue Paddy Stock'}</h2>
                    {warehouses.length === 0 ? <p className="text-center text-red-500 bg-red-50 p-4 rounded-md">You must create a warehouse before you can manage stock. Please go to the 'Warehouses' tab.</p> : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                             <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                                <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full input-style" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label htmlFor="warehouseId" className="block text-sm font-medium text-gray-700">Warehouse</label><select name="warehouseId" id="warehouseId" value={formData.warehouseId} onChange={handleChange} required className="mt-1 block w-full input-style"><option value="" disabled>Select warehouse</option>{warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}</select></div>
                                <div><label htmlFor="paddyType" className="block text-sm font-medium text-gray-700">Paddy Type</label><select name="paddyType" id="paddyType" value={formData.paddyType} onChange={handleChange} required className="mt-1 block w-full input-style"><option value="" disabled>Select type</option>{PADDY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                            </div>
                            <div><label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700">Vehicle Number</label><input type="text" name="vehicleNumber" id="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} required className="mt-1 block w-full input-style" /></div>
                            <div><label htmlFor="weightKg" className="block text-sm font-medium text-gray-700">Weight (in kg)</label><input type="number" name="weightKg" id="weightKg" value={formData.weightKg} onChange={handleChange} required min="0.01" step="0.01" className="mt-1 block w-full input-style" /></div>
                            {isStockIn && (
                                <>
                                    <div><label htmlFor="grn" className="block text-sm font-medium text-gray-700">GRN (Price for 64kg)</label><input type="number" name="grn" id="grn" value={formData.grn} onChange={handleChange} required className="mt-1 block w-full input-style" /></div>
                                    <div><label htmlFor="pricePerKg" className="block text-sm font-medium text-gray-700">Price per kg (LKR)</label><input type="number" name="pricePerKg" id="pricePerKg" value={formData.pricePerKg} readOnly className="mt-1 block w-full input-style bg-gray-100" /></div>
                                </>
                            )}
                            <div><button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"> {isSubmitting ? 'Submitting...' : (isStockIn ? 'Add Stock' : 'Issue Stock')} </button></div>
                        </form>
                    )}
                    {message && <p className={`mt-4 text-sm text-center ${message.includes('error') || message.includes('required') || message.includes('Cannot') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
                </div>
            </div>
        );
    };

    const WarehouseManager = () => {
        const [name, setName] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [message, setMessage] = useState('');
        const handleSubmit = (e) => {
            e.preventDefault();
            if (!name.trim()) {setMessage('Warehouse name cannot be empty.'); return;}
            setIsSubmitting(true); setMessage('');
            try {
                const newWarehouse = { id: crypto.randomUUID(), name: name.trim() };
                const updatedWarehouses = [...warehouses, newWarehouse];
                setWarehouses(updatedWarehouses);
                saveToDB('paddy_warehouses', updatedWarehouses);
                setMessage(`Warehouse "${name}" added successfully!`);
                setName('');
                setTimeout(() => setMessage(''), 3000);
            } catch (error) {
                console.error("Error adding warehouse:", error); setMessage("Failed to add warehouse.");
            } finally { setIsSubmitting(false); }
        };
        return (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><OfficeBuildingIcon /> Manage Warehouses</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><label htmlFor="warehouseName" className="block text-sm font-medium text-gray-700">New Warehouse Name</label><input type="text" id="warehouseName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Main Polonnaruwa Warehouse" className="mt-1 block w-full input-style" /></div>
                        <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">{isSubmitting ? 'Adding...' : 'Add Warehouse'}</button>
                    </form>
                    {message && <p className={`mt-4 text-sm text-center ${message.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
                </div>
                <div className="max-w-xl mx-auto bg-white p-8 mt-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Existing Warehouses</h3>
                    {isLoading ? <p>Loading...</p> : warehouses.length > 0 ? (<ul className="divide-y divide-gray-200">{warehouses.map(wh => <li key={wh.id} className="py-3 text-gray-800">{wh.name}</li>)}</ul>) : <p className="text-gray-500">No warehouses found.</p>}
                </div>
            </div>
        );
    };
    
    const Ledger = () => (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <h2 className="text-2xl font-bold text-gray-800 p-6">Transaction Ledger</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>{["Date & Time", "Type", "Warehouse", "Paddy Type", "Vehicle No", "Weight (kg)", "GRN", "Price/kg (LKR)", "Total Value (LKR)"].map(h => <th scope="col" key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? <tr><td colSpan="9" className="text-center py-10">Loading transactions...</td></tr> : allTransactions.length === 0 ? <tr><td colSpan="9" className="text-center py-10 text-gray-500">No transactions recorded yet.</td></tr> : (
                                allTransactions.map((item) => (
                                    <tr key={item.id} className={item.type === 'IN' ? 'bg-green-50/50' : 'bg-red-50/50'}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.timestamp)?.toLocaleString() ?? 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.type}</span></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">{item.warehouseName || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{item.paddyType || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.vehicleNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{Number(item.weightKg).toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.grn || '---'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.pricePerKg ? Number(item.pricePerKg).toFixed(2) : '---'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalValue ? Number(item.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const Reports = ({ pdfLibsReady, stockByWarehouse, stockData }) => {
        const generatePaddyStockPDF = () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const today = new Date().toISOString().slice(0, 10);
            doc.setFontSize(18); doc.text("SEWMINI RICE PRODUCT (PVT) LTD", 105, 15, { align: 'center' });
            doc.setFontSize(12); doc.text("No.48, Wawethenna, Polonnaruwa.", 105, 22, { align: 'center' });
            doc.setFontSize(14); doc.text(`PADDY STOCK FINAL REPORT - ${today}`, 105, 35, { align: 'center' });
            const head = [['Warehouse', ...PADDY_TYPES, 'Total Kg']];
            const body = stockByWarehouse.map(wh => [ wh.name, ...PADDY_TYPES.map(type => (wh.stockByType[type] || 0).toLocaleString(undefined, {maximumFractionDigits:0})), wh.currentStock.toLocaleString(undefined, {maximumFractionDigits:0}) ]);
            const totalRow = [ 'Total sum', ...PADDY_TYPES.map(type => (stockData.totals.byType[type].weight || 0).toLocaleString(undefined, {maximumFractionDigits:0})), (stockData.totals.overall || 0).toLocaleString(undefined, {maximumFractionDigits:0}) ];
            body.push(totalRow);
            doc.autoTable({ head, body, startY: 40, headStyles: { fillColor: [22, 160, 133], halign: 'center' }, foot: [totalRow], footStyles: { fillColor: [211, 211, 211], textColor: [0,0,0], fontStyle: 'bold', halign: 'center'}, styles: { halign: 'right' }, columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } } });
            let finalY = doc.lastAutoTable.finalY + 10;
            const avgPriceBody = []; const avgPriceRow = ['Average Price / kg']; const amountRow = ['AMOUNT (LKR)'];
            PADDY_TYPES.forEach(type => {
                const typeData = stockData.totals.byType[type];
                const avgPrice = typeData.weight > 0 ? typeData.totalValue / typeData.weight : 0;
                avgPriceRow.push(avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                amountRow.push((typeData.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            });
            avgPriceBody.push(avgPriceRow); avgPriceBody.push(amountRow);
            doc.autoTable({ body: avgPriceBody, startY: finalY, theme: 'grid', styles: { halign: 'right' }, columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } } });
            finalY = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.text("Amount Total:", 14, finalY);
            doc.setFont(undefined, 'normal'); doc.text(`${stockData.totals.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} LKR`, 50, finalY);
            doc.save(`Paddy-Stock-Report-${today}.pdf`);
        };
        const generateConsumerAuthorityPDF = () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const today = new Date().toISOString().slice(0, 10);
            doc.setFontSize(18); doc.text("SEWMINI RICE PRODUCT (PVT) LTD", 105, 15, { align: 'center' });
            doc.setFontSize(12); doc.text("No.48, Wawethenna, Polonnaruwa.", 105, 22, { align: 'center' }); doc.text(`Date: ${today}`, 14, 30);
            doc.setFontSize(14); doc.text(`PADDY STOCK FINAL REPORT`, 105, 40, { align: 'center' });
            const paddyHead = [['',...PADDY_TYPES, 'Grand total Kg']];
            const paddyBody = [[ 'Total Stock', ...PADDY_TYPES.map(type => (stockData.totals.byType[type].weight || 0).toLocaleString(undefined, {maximumFractionDigits:0})), (stockData.totals.overall || 0).toLocaleString(undefined, {maximumFractionDigits:0}) ]];
            doc.autoTable({ head: paddyHead, body: paddyBody, startY: 45 });
            let finalY = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(14); doc.text(`RICE STOCK FINAL REPORT`, 105, finalY, { align: 'center' });
            const riceHead = [['Types of rice', 'NADU', 'KEERI', 'SAMBA', 'RED NADU', 'Grand total Kg']];
            const riceBody = [ ['Grand total Kg', '39,425', '16,690', '22,065', '7,770', '85,950'], ['Types of rice 1 Kg Rs', '225.00', '255.00', '235.00', '225.00', ''] ];
            doc.autoTable({ head: riceHead, body: riceBody, startY: finalY + 5 });
            finalY = doc.lastAutoTable.finalY + 20;
            doc.setFontSize(10); doc.text("CREAT BY- H.A.Asanga Sudath", 14, finalY); doc.text("Audit", 105, finalY, {align: 'center'}); doc.text("Sewmini Rice Product (PVT) Ltd", 196, finalY, {align: 'right'});
            doc.save(`Consumer-Authority-Report-${today}.pdf`);
        };
        return (
            <div className="p-4 sm:p-6 lg:p-8"> <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200"> <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"> <DocumentReportIcon /> Generate Reports </h2> <div className="space-y-4"> <p className="text-gray-600"> Click the buttons below to generate and download PDF reports based on the current stock data. </p> <button onClick={generatePaddyStockPDF} disabled={!pdfLibsReady} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed" > {pdfLibsReady ? 'Generate Paddy Stock Report (PDF)' : 'Loading PDF Libraries...'} </button> <button onClick={generateConsumerAuthorityPDF} disabled={!pdfLibsReady} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed" > {pdfLibsReady ? 'Generate Consumer Authority Report (PDF)' : 'Loading PDF Libraries...'} </button> </div> </div> </div>
        );
    }
    
    // --- Render Logic ---
    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><p className="text-lg text-gray-600">Loading Application...</p></div>;
    }
    
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Header />
            <Navigation />
            <main>
                {activeView === 'dashboard' && <Dashboard />}
                {activeView === 'stockIn' && <DataForm type="in" />}
                {activeView === 'stockOut' && <DataForm type="out" />}
                {activeView === 'ledger' && <Ledger />}
                {activeView === 'warehouses' && <WarehouseManager />}
                {activeView === 'reports' && <Reports pdfLibsReady={pdfLibsReady} stockByWarehouse={stockByWarehouse} stockData={stockData} />}
            </main>
             <footer className="text-center py-4 text-sm text-gray-500 border-t border-gray-200 mt-8">
                <p>Paddy Stock Management System</p>
            </footer>
        </div>
    );
}
