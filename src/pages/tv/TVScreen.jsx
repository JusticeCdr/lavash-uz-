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
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cycleIndex, setCycleIndex] = useState(0);

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
    // Rotation logic: Every 8 seconds, move to the next batch
    if (products.length === 0) return;

    const interval = setInterval(() => {
      setCycleIndex((prevCycle) => {
        const nextCycle = (prevCycle + 1) % CYCLE_SIZES.length;
        
        setCurrentIndex((prevIndex) => {
          // Advance index by the amount we JUST showed (which is CYCLE_SIZES[prevCycle])
          return (prevIndex + CYCLE_SIZES[prevCycle]) % products.length;
        });

        return nextCycle;
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

  const currentSize = CYCLE_SIZES[cycleIndex];
  const currentBatch = products.slice(currentIndex, currentIndex + currentSize);
  
  // Wrap around seamlessly
  while (currentBatch.length < currentSize && products.length > 0) {
     currentBatch.push(products[currentBatch.length % products.length]);
  }

  // Determine the center product for the watermark
  const centerProduct = currentBatch[Math.floor(currentSize / 2)];

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
      return { opacity: 0, x: dist * 100, scale: 0.8 };
    },
    visible: (custom) => {
      const { idx, total } = custom;
      const mid = Math.floor(total / 2);
      const dist = Math.abs(idx - mid);
      // Center item is largest, sides are progressively smaller
      const scale = 1.05 - (dist * 0.15); 
      // Center item is highest, sides are progressively lower
      const y = dist * 70; 
      
      return { 
        opacity: 1, 
        x: 0, 
        y, 
        scale, 
        transition: { type: 'spring', stiffness: 100, damping: 20 } 
      };
    },
    exit: (custom) => {
      const { idx, total } = custom;
      const mid = Math.floor(total / 2);
      const dist = idx - mid;
      return { opacity: 0, x: dist * 100, scale: 0.8, transition: { duration: 0.5 } };
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
      <div className="absolute top-1/2 left-1/2 w-[150%] h-[40%] bg-brand-green -translate-x-1/2 -translate-y-1/2 -rotate-[10deg] border-y-[12px] border-dashed border-white/30 shadow-2xl pointer-events-none z-0"></div>

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
        <div className="flex items-center gap-8">
          {/* Premium stylized L.Uz logo */}
          <div className="font-black text-5xl xl:text-6xl tracking-tighter drop-shadow-md flex items-center">
            <span className="text-brand-red">L</span>
            <span className="text-brand-green">.Uz</span>
          </div>
          {settings && (
            <div className="flex flex-col">
              <h1 className="text-5xl font-black text-gray-900 tracking-tight uppercase drop-shadow-md">
                {settings.title}
              </h1>
              {settings.subtitle && (
                <p className="text-2xl text-brand-green font-bold tracking-wide uppercase mt-1 drop-shadow-md">
                  {settings.subtitle}
                </p>
              )}
            </div>
          )}
        </div>
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
              className="w-full h-full flex items-center justify-center gap-6"
            >
              {currentBatch.map((product, idx) => {
                const customProps = { idx, total: currentSize };
                const isCenter = idx === Math.floor(currentSize / 2);
                
                return (
                  <motion.div
                    key={`${product.id}-${idx}`}
                    custom={customProps}
                    variants={dynamicVariants}
                    className={`flex-1 flex flex-col items-center justify-center relative ${isCenter ? 'z-20' : 'z-10'}`}
                    style={{ maxWidth: `${100 / currentSize}%` }}
                  >
                    <motion.div custom={customProps} animate="floating" className="w-full relative group">
                      
                      {/* Premium Card Layout matching Reference */}
                      <div className="w-full bg-[#fcf8f2] rounded-[2rem] p-4 pb-8 shadow-2xl flex flex-col items-center">
                        
                        {/* Image Box */}
                        <div className="w-full aspect-square rounded-[1.5rem] overflow-hidden bg-[#F3CA4B] relative shadow-inner">
                           {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.name_uz} 
                                className="w-full h-full object-cover scale-110"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-brand-green font-bold text-2xl">
                                L.UZ
                              </div>
                            )}
                        </div>

                        {/* Title & Price Container with Breathing Room */}
                        <div className="mt-8 flex flex-col items-center text-center px-2 w-full">
                           <h2 className="text-3xl xl:text-4xl font-black text-brand-green uppercase tracking-tight leading-tight line-clamp-2 min-h-[5rem] flex items-center justify-center drop-shadow-sm">
                            {product.name_uz}
                           </h2>
                           
                           {/* Price separated below with margin and shine animation */}
                           <motion.div 
                             initial={{ backgroundPosition: '200% 0' }}
                             animate={{ backgroundPosition: '-200% 0' }}
                             transition={{ duration: 2, repeat: Infinity, repeatDelay: 2.5, ease: "linear" }}
                             className="mt-6 text-3xl xl:text-5xl font-black drop-shadow-md bg-clip-text text-transparent inline-block pb-1"
                             style={{
                               backgroundImage: 'linear-gradient(110deg, #e31837 35%, #ffffff 50%, #e31837 65%)',
                               backgroundSize: '200% 100%'
                             }}
                           >
                             {product.price.toLocaleString()} UZS
                           </motion.div>
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
