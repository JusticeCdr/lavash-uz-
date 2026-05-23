import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

// Fixed cycle pattern as requested by user
const CYCLE_SIZES = [4, 5, 3];

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
    // Rotation logic: Every 8 seconds, move to the next batch strictly sequentially
    if (products.length === 0) return;

    const interval = setInterval(() => {
      setPagination((prev) => {
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
    }, 8000);

    return () => clearInterval(interval);
  }, [products.length]);

  const fetchData = async () => {
    const { data: pData } = await supabase
      .from('products')
      .select('*')
      .eq('tv_number', tvNumber)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (pData) setProducts(pData);

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

  const { currentIndex, cycleIndex } = pagination;
  const currentSize = CYCLE_SIZES[cycleIndex];
  
  // Take exactly the remainder without wrapping
  const currentBatch = products.slice(currentIndex, currentIndex + currentSize);

  // Determine the center product for the watermark based on the ACTUAL batch length
  const centerProduct = currentBatch[Math.floor(currentBatch.length / 2)];

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.5 }
    }
  };

  const dynamicVariants = {
    hidden: (custom) => {
      const { idx, total } = custom;
      const mid = Math.floor(total / 2);
      const dist = idx - mid;
      return { x: dist * 150, scale: 0.8 };
    },
    visible: (custom) => {
      const { idx, total } = custom;
      const mid = Math.floor(total / 2);
      const dist = Math.abs(idx - mid);
      const scale = 1.05 - (dist * 0.15); 
      // Increased y offset for the larger cards to maintain staggering effect
      const y = dist * 90; 
      
      return { 
        x: 0, 
        y, 
        scale, 
        transition: { type: 'tween', ease: 'easeInOut', duration: 0.8 } 
      };
    },
    exit: (custom) => {
      const { idx, total } = custom;
      const mid = Math.floor(total / 2);
      const dist = idx - mid;
      return { x: dist * 150, scale: 0.8, transition: { duration: 0.8, ease: 'easeInOut' } };
    }
  };

  const floatingVariants = {
    floating: (custom) => {
      const { idx, total } = custom;
      const dist = Math.abs(idx - Math.floor(total / 2));
      return {
        y: [0, -15 - (dist * 5), 0],
        transition: { 
          duration: 4 + (dist * 0.5), 
          repeat: Infinity, 
          ease: 'easeInOut', 
          delay: dist * 0.2 
        }
      };
    }
  };

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
      <main className="flex-1 flex items-center justify-center px-12 z-10 w-full h-full pb-20">
        <AnimatePresence mode="wait">
          {products.length > 0 ? (
              <motion.div
              key={cycleIndex}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full h-full flex items-center justify-center gap-6 will-change-transform transform-gpu"
            >
              {currentBatch.map((product, idx) => {
                const customProps = { idx, total: currentSize };
                const isCenter = idx === Math.floor(currentSize / 2);
                
                return (
                  <motion.div
                    key={`${product.id}-${idx}`}
                    custom={customProps}
                    variants={dynamicVariants}
                    className={`flex flex-col items-center justify-center relative ${isCenter ? 'z-20' : 'z-10'} will-change-transform transform-gpu`}
                  >
                    <motion.div custom={customProps} animate="floating" className="w-full relative group will-change-transform transform-gpu">
                      
                      {/* Premium Card Layout - MAX SIZES for TV with Border instead of Shadow */}
                      <div className="w-[360px] h-[600px] bg-[#fcf8f2] rounded-[3rem] p-6 pb-10 flex flex-col items-center overflow-hidden border border-yellow-400/30">
                        
                        {/* Image Box - MAX SIZES */}
                        <div className="w-full h-[340px] shrink-0 rounded-[2rem] overflow-hidden bg-white/50 relative">
                           {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.name_uz} 
                                className="w-full h-full object-cover mix-blend-multiply"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-brand-green font-bold text-3xl">
                                L.UZ
                              </div>
                            )}
                        </div>

                        {/* Title & Price Container with tight gap and bottom padding */}
                        <div className="w-full flex flex-col items-center justify-between text-center flex-1 mt-4">
                           <h2 className="text-5xl font-black text-brand-green uppercase tracking-tight leading-tight line-clamp-2">
                            {product.name_uz}
                           </h2>
                           
                           {/* Price separated below with Solid Text Color (No Animations for Max FPS) */}
                           <div className="mb-4 text-6xl xl:text-7xl font-black text-brand-red inline-block will-change-transform transform-gpu">
                             {product.price.toLocaleString()} UZS
                           </div>
                        </div>

                      </div>

                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-800 text-4xl font-bold"
            >
              Hozircha mahsulotlar yo'q
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default TVScreen;
