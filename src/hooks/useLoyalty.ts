import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Loyalty } from '../data/loyalty';
export function useLoyalty() {
  const { getLoyalty } = useAuth();
  const [data, setData] = useState<Loyalty | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [revision, setRevision] = useState(0);
  useFocusEffect(useCallback(() => {
    void revision; let active = true;
    setLoading(true); setError('');
    getLoyalty().then(value => { if (active) setData(value); }).catch(cause => { if (active) { setData(null); setError(cause.message); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [getLoyalty, revision]));
  return { data, error, loading, refresh: () => setRevision(value => value + 1) };
}
