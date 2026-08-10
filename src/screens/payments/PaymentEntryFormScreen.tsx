import React from 'react';
import {EntryForm} from '../../components/EntryForm';
export default function PaymentEntryFormScreen({navigation}: any) { return <EntryForm type="payment" title="Log payment" onDone={() => navigation.goBack()} />; }
