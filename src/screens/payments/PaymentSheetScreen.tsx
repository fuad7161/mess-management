import React, {useState} from 'react';
import {FinancialSheet} from '../../components/FinancialSheet';
import {EntryForm} from '../../components/EntryForm';
export default function PaymentSheetScreen() { const [mode, setMode] = useState<'sheet' | 'add' | 'manual'>('sheet'); return mode !== 'sheet' ? <EntryForm type="payment" manual={mode === 'manual'} title={mode === 'manual' ? 'Manual payment entry' : 'Log payment'} onDone={() => setMode('sheet')} /> : <FinancialSheet type="payment" title="Payment Sheet" onAdd={() => setMode('add')} onManual={() => setMode('manual')} />; }
