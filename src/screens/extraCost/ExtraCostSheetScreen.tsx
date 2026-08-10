import React, {useState} from 'react';
import {FinancialSheet} from '../../components/FinancialSheet';
import {EntryForm} from '../../components/EntryForm';
export default function ExtraCostSheetScreen() { const [mode, setMode] = useState<'sheet' | 'add' | 'manual'>('sheet'); return mode !== 'sheet' ? <EntryForm type="extraCost" manual={mode === 'manual'} title={mode === 'manual' ? 'Manual extra cost' : 'Add extra cost'} onDone={() => setMode('sheet')} /> : <FinancialSheet type="extraCost" title="Extra Cost Sheet" onAdd={() => setMode('add')} onManual={() => setMode('manual')} />; }
