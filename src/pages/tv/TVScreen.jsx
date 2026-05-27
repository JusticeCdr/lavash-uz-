import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

// Fixed cycle pattern as requested by user
const CYCLE_SIZES = [3];

const TVScreen = () => {
  const { id } = useParams();
  const tvNumber = Number(id);

  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  
  const [pagination, setPagination] = useState({
    currentIndex: 0,
    cycleIndex: 0
  });

  useEffect(() => {
    fetchData();

    // Setup Realtime Subscriptions
    const productsSub = supabase
      .channel('products_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `tv_number=eq.${tvNumber}` }, fetchData)
      .subscribe();

    const settingsSub = supabase
      .channel('settings_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tv_settings', filter: `tv_number=eq.${tvNumber}` }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(productsSub);
      supabase.removeChannel(settingsSub);
    };
  }, [tvNumber]);

  useEffect(() => {
    // Rotation logic
    if (products.length === 0) return;

    // TV-2: 10 seconds per image, TV-1/TV-3: 8 seconds per batch
    const intervalTime = tvNumber === 2 ? 10000 : 8000;

    const interval = setInterval(() => {
      setPagination((prev) => {
        // TV-2: Rotate 1-by-1
        if (tvNumber === 2) {
          return { ...prev, currentIndex: (prev.currentIndex + 1) % products.length };
        }

        // TV-1 & TV-3: Rotate by batch size
        const currentBatchSize = CYCLE_SIZES[prev.cycleIndex];
        let nextIndex = prev.currentIndex + currentBatchSize;
        let nextCycle = (prev.cycleIndex + 1) % CYCLE_SIZES.length;

        // Strict Reset: if we have shown all items (or reached the end of the array)
        if (nextIndex >= products.length) {
          nextIndex = 0;
          nextCycle = 0;
        }

        return { currentIndex: nextIndex, cycleIndex: nextCycle };
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [products.length, tvNumber]);

  const fetchData = async () => {
    const { data: pData } = await supabase
      .from('products')
      .select('*')
      .eq('tv_number', tvNumber)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (pData) {
      setProducts(pData);
      
      // Aggressive Image Preloading for TVs
      pData.forEach(product => {
        if (product.image_url) {
          const img = new Image();
          img.src = product.image_url;
        }
      });
    }

    const { data: sData } = await supabase
      .from('tv_settings')
      .select('*')
      .eq('tv_number', tvNumber)
      .single();

    if (sData) setSettings(sData);
  };

  if (settings && !settings.is_active) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
        <h1 className="text-4xl text-gray-500 tracking-widest uppercase">Display Offline</h1>
      </div>
    );
  }

  // --- TV-2 FULLSCREEN IMAGE MODE ---
  if (tvNumber === 2) {
    // Cycle through all uploaded images using currentIndex
    const currentFullScreenProduct = products[pagination.currentIndex];
    
    if (!currentFullScreenProduct || !currentFullScreenProduct.image_url) {
      return (
        <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
          <h1 className="text-4xl text-gray-500 tracking-widest uppercase">No Background Image Set</h1>
        </div>
      );
    }
    
    // Instant zero-animation swap
    return (
      <div className="w-screen h-screen overflow-hidden bg-black flex items-center justify-center">
        <img 
          src={currentFullScreenProduct.image_url} 
          alt="TV-2 Background" 
          className="w-full h-full object-fill" 
          loading="eager"
          decoding="sync"
        />
      </div>
    );
  }

  const { currentIndex, cycleIndex } = pagination;
  const currentSize = CYCLE_SIZES[cycleIndex];
  
  // Take exactly the remainder without wrapping
  const currentBatch = products.slice(currentIndex, currentIndex + currentSize);

  // Determine the center product for the watermark based on the ACTUAL batch length
  const centerProduct = currentBatch[Math.floor(currentBatch.length / 2)];

  // No Animation Variants - Zero overhead for Low End TVs (Ultra Performance)

  return (
    <div className="w-screen h-screen bg-[#FACC15] overflow-hidden no-scrollbar flex flex-col relative font-sans">
      
      {/* Background Decor: Diagonal Green Stripe */}
      <div className="absolute top-1/2 left-1/2 w-[150%] h-[40%] bg-brand-green -translate-x-1/2 -translate-y-1/2 -rotate-[10deg] border-y-[12px] border-dashed border-white/30 pointer-events-none z-0"></div>

      {/* Dynamic Watermark */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center opacity-[0.04]">
        <AnimatePresence mode="wait">
          {centerProduct && (
            <motion.div
              key={centerProduct.name_uz}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 1 }}
              className="text-black font-black text-[12vw] leading-none whitespace-pre-wrap text-center rotate-[-10deg]"
              style={{ width: '200%', transformOrigin: 'center' }}
            >
              {Array(15).fill(centerProduct.name_uz.toUpperCase()).join('  •  ')}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Header (Fully Transparent & Blended) */}
      <header className="w-full flex justify-between items-center px-16 py-12 z-10 bg-transparent">
        {/* Premium stylized L.Uz logo */}
        <div className="font-black text-5xl xl:text-7xl tracking-tighter flex items-center">
          <span className="text-brand-red">L</span>
          <span className="text-brand-green">.Uz</span>
        </div>
        
        {settings && (
          <div className="flex flex-col text-right">
            <h1 className="text-5xl xl:text-6xl font-black text-gray-900 tracking-tight uppercase">
              {settings.title}
            </h1>
            {settings.subtitle && (
              <p className="text-3xl text-brand-green font-bold tracking-wide uppercase mt-2">
                {settings.subtitle}
              </p>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-row items-center justify-center w-full overflow-hidden z-10 px-12 pb-16">
        <>
          {products.length > 0 ? (
              <div
              key={cycleIndex}
              className="w-full h-full flex items-center justify-center gap-6"
            >
              {currentBatch.map((product, idx) => {
                let isDualPrice = false;
                let chickenPrice = null;
                let standardPrefix = product.category_title;

                try {
                  if (product.category_title && product.category_title.includes('"chickenPrice"')) {
                    const parsed = JSON.parse(product.category_title);
                    isDualPrice = true;
                    chickenPrice = parsed.chickenPrice;
                  }
                } catch(e) {}
                return (
                    <div
                      key={`${product.id}-${idx}`}
                      className={`flex flex-col items-center justify-center relative z-10`}
                    >
                      {/* Premium Card Layout - STRICT SIZING for TV */}
                      <div className="w-[460px] h-[750px] bg-[#fcf8f2] rounded-[4rem] flex flex-col overflow-hidden border border-yellow-400/30 shadow-sm">
                        
                        {/* Upper Block - Image (55%) */}
                        <div className="w-full h-[55%] shrink-0 relative bg-white">
                           {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.name_uz} 
                                className="w-full h-full object-cover"
                                loading="eager"
                                decoding="sync"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-brand-green font-bold text-3xl">
                                L.UZ
                              </div>
                            )}
                        </div>

                        {/* Lower Block - Text (45%) */}
                        <div className="w-full h-[45%] flex flex-col justify-center items-center p-6">
                           {/* Title */}
                           <h2 className="text-5xl font-black text-brand-green uppercase tracking-tight leading-tight line-clamp-2 text-center">
                            {product.name_uz}
                           </h2>
                           
                           {/* Price (Solid Color, No Margin Hacks) */}
                           {isDualPrice ? (
                             <div className="mt-4 flex flex-col gap-3 items-center justify-center">
                               <div className="text-5xl font-black text-brand-red flex items-center justify-center gap-3">
                                 <span>🐮</span>
                                 <span>{product.price.toLocaleString()} UZS</span>
                               </div>
                               <div className="text-5xl font-black text-brand-red flex items-center justify-center gap-3">
                                 <span>🐔</span>
                                 <span>{Number(chickenPrice).toLocaleString()} UZS</span>
                               </div>
                             </div>
                           ) : (
                             <div className="mt-4 text-7xl font-black text-brand-red flex items-center justify-center gap-3">
                               {standardPrefix && <span>{standardPrefix}</span>}
                               <span>{product.price.toLocaleString()} UZS</span>
                             </div>
                           )}
                        </div>

                      </div>
                    </div>
                );
              })}
            </div>
          ) : (
            <div
              className="text-center text-gray-800 text-4xl font-bold"
            >
              Hozircha mahsulotlar yo'q
            </div>
          )}
        </>
      </main>
    </div>
  );
};

export default TVScreen;
