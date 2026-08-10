import React from 'react';
import {EntryForm} from '../../components/EntryForm';
export default function ExtraCostEntryFormScreen({navigation}: any) { return <EntryForm type="extraCost" title="Add extra cost" onDone={() => navigation.goBack()} />; }
