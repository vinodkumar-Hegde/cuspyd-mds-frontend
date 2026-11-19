import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { apiResult, mediaUrl } from '../../services/apiClient';
import { contentApi } from '../../services/contentApi';

export default function SyndromesViewer() {
  const [errorMessage, setErrorMessage] = useState('');
  const [groupedSyndromes, setGroupedSyndromes] = useState<any[]>([]);
  const [selectedSyndrome, setSelectedSyndrome] = useState<any | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    apiResult(contentApi.syndromes()).then(({ data, error }) => {
      if (error) {
        setErrorMessage(error.message);
      } else {
        if (data) {
          const grouped = data.reduce((acc: any, curr: any) => {
            const name = curr.name.trim().toLowerCase();
            if (!acc[name]) {
              acc[name] = { name: curr.name.trim(), description: curr.description, images: [] };
            }
            if (curr.image_url) {
                acc[name].images.push(curr.image_url);
            }
            return acc;
          }, {});
          setGroupedSyndromes(Object.values(grouped));
        }
      }
    });
  }, []);

  if (errorMessage) return <p role="alert" className="p-8 text-red-700">{errorMessage}</p>;
  if (groupedSyndromes.length === 0) return <div className="p-8 text-center text-slate-500">No syndromes found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {selectedSyndrome ? (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex flex-col h-full"
        >
          <button 
            onClick={() => setSelectedSyndrome(null)}
            className="mb-4 flex items-center text-slate-600 hover:text-red-600 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" /> Back to List
          </button>
          
          <div className="flex-grow overflow-y-auto bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 text-center">{selectedSyndrome.name}</h2>
            <p className="text-md sm:text-lg text-slate-800 leading-relaxed text-center mb-8">{selectedSyndrome.description}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {selectedSyndrome.images.map((url: string, idx: number) => (
                    <div key={idx} className="aspect-square bg-slate-50 p-2 rounded-lg shadow-sm border border-slate-100 flex items-center justify-center cursor-pointer hover:border-red-300 transition-colors" onClick={() => setSelectedImageIndex(idx)}>
                      <img src={mediaUrl(url)} alt={selectedSyndrome.name} className="max-w-full max-h-full object-contain" />
                    </div>
                ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {groupedSyndromes.map((syndrome, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedSyndrome(syndrome)}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-red-300 transition-all text-left"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-2">{syndrome.name}</h3>
              <p className="text-sm text-slate-600 line-clamp-3">{syndrome.description}</p>
              <div className="mt-4 text-xs font-semibold text-red-600">{syndrome.images.length} images</div>
            </motion.button>
          ))}
        </div>
      )}
      
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImageIndex(null)}>
          <button onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(null); }} className="absolute top-4 right-4 text-white p-2">Close</button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => (prev! > 0 ? prev! - 1 : prev)); }}
            className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-full"
            disabled={selectedImageIndex === 0}
          >
            <ChevronLeft size={48} />
          </button>
          
          <img src={mediaUrl(selectedSyndrome.images[selectedImageIndex])} alt="Full view" className="max-w-full max-h-full object-contain" />
          
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => (prev! < selectedSyndrome.images.length - 1 ? prev! + 1 : prev)); }}
            className="absolute right-4 text-white p-2 hover:bg-white/10 rounded-full"
            disabled={selectedImageIndex === selectedSyndrome.images.length - 1}
          >
            <ChevronRight size={48} />
          </button>
        </div>
      )}
    </div>
  );
}
