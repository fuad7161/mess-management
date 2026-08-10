import React from 'react';
import {EntryForm} from '../../components/EntryForm';
export default function BazarEntryFormScreen({navigation}: any) { return <EntryForm type="bazar" title="Add bazar entry" onDone={() => navigation.goBack()} />; }
