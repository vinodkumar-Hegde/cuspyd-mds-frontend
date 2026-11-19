import { Loader2, Lock, Unlock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';
import { apiResult } from '../services/apiClient';
import { contentApi } from '../services/contentApi';

export default function AdminFeatureToggle() {
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    const { data, error } = await apiResult(contentApi.featureSettings());
    if (error) {
        console.error('Error fetching features:', error);
        alert('Unable to load feature settings. Please try again.');
    } else {
        setFeatures(data || []);
    }
    setLoading(false);
  };

  const toggleFeature = async (key: string, currentStatus: boolean) => {
    const {error} = await apiResult(adminApi.updateFeature(key, !currentStatus));
    if (error) { alert(error.message); return; }
    fetchFeatures();
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold">Feature Access Control</h2>
      {features.length === 0 ? (
        <div className="p-8 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
            <h3 className="font-bold mb-2">No features configured</h3>
            <p>Feature settings will appear here when available.</p>
        </div>
      ) : (
        <div className="grid gap-4">
            {features.map((f) => (
            <div key={f.feature_key} className="flex items-center justify-between p-4 bg-white rounded-xl border shadow-sm">
                <span className="font-bold capitalize">{f.feature_key.replace('_', ' ')}</span>
                <button 
                onClick={() => toggleFeature(f.feature_key, f.is_visible)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold ${f.is_visible ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                >
                {f.is_visible ? <Unlock size={18} /> : <Lock size={18} />}
                {f.is_visible ? 'Unlocked (Visible)' : 'Locked (Hidden)'}
                </button>
            </div>
            ))}
        </div>
      )}
    </div>
  );
}
