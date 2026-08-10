import React, {useState} from 'react';
import {FinancialSheet} from '../../components/FinancialSheet';
import {EntryForm} from '../../components/EntryForm';

export default function BazarSheetScreen() {
  const [mode, setMode] = useState<'sheet' | 'add' | 'manual'>('sheet');
  return mode !== 'sheet' ? <EntryForm type="bazar" manual={mode === 'manual'} title={mode === 'manual' ? 'Manual bazar entry' : 'Add bazar entry'} onDone={() => setMode('sheet')} /> : <FinancialSheet type="bazar" title="Bazar Sheet" onAdd={() => setMode('add')} onManual={() => setMode('manual')} />;
}
