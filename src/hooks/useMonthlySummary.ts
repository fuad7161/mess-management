import {useEffect, useState} from 'react';
import {summaryRef} from '../api/summaryApi';
import {MonthlySummary} from '../types/expense';

export const useMonthlySummary = (groupId: string | undefined, month: string) => {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!groupId) { setSummary(null); setLoading(false); return; }
    return summaryRef(groupId, month).onSnapshot(snapshot => {
      setSummary(snapshot.exists() ? ({month, ...snapshot.data()} as MonthlySummary) : null);
      setLoading(false);
    });
  }, [groupId, month]);
  return {summary, loading};
};
