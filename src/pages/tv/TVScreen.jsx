import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const TVScreen = () => {
  const { id } = useParams();
  const tvNumber = Number(id);

  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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
    // Rotation logic: Every 8 seconds, move to the next batch of 3 products
    if (products.length <= 3) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 3;
        return nextIndex >= products.length ? 0 : nextIndex;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [products]);

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

  // Get current 3 products to display
  const currentBatch = products.slice(currentIndex, currentIndex + 3);
  // If we reach the end and have less than 3, we can wrap around or just show what's left.
  // For a seamless loop, we might want to pad with the beginning items if less than 3 are remaining in the slice.
  while (currentBatch.length < 3 && products.length > 0) {
     currentBatch.push(products[currentBatch.length % products.length]);
  }

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.3 }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.5 }
    }
  };

  const itemVariants = [
    // 1st Item: Left, slightly smaller
    {
      hidden: { opacity: 0, x: -100, scale: 0.8 },
      visible: { opacity: 1, x: 0, scale: 0.9, transition: { type: 'spring', stiffness: 100, damping: 20 } },
      exit: { opacity: 0, x: -100, scale: 0.8, transition: { duration: 0.5 } },
      floating: { y: [0, -15, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }
    },
    // 2nd Item: Center, largest (Hero)
    {
      hidden: { opacity: 0, y: 100, scale: 0.8 },
      visible: { opacity: 1, y: 0, scale: 1.1, transition: { type: 'spring', stiffness: 100, damping: 20 } },
      exit: { opacity: 0, y: -100, scale: 0.8, transition: { duration: 0.5 } },
      floating: { y: [0, -20, 0], transition: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 } }
    },
    // 3rd Item: Right, slightly smaller
    {
      hidden: { opacity: 0, x: 100, scale: 0.8 },
      visible: { opacity: 1, x: 0, scale: 0.9, transition: { type: 'spring', stiffness: 100, damping: 20 } },
      exit: { opacity: 0, x: 100, scale: 0.8, transition: { duration: 0.5 } },
      floating: { y: [0, -10, 0], transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 } }
    }
  ];

  return (
    <div className="w-screen h-screen bg-brand-cream overflow-hidden no-scrollbar flex flex-col relative font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-brand-green/5 rounded-full blur-3xl"></div>
        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] bg-brand-red/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="w-full flex justify-between items-center px-16 py-8 z-10 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-6">
          <div className="bg-brand-green text-white font-black text-5xl px-6 py-4 rounded-2xl shadow-lg">
            L.UZ
          </div>
          {settings && (
            <div className="flex flex-col">
              <h1 className="text-5xl font-black text-gray-900 tracking-tight uppercase">
                {settings.title}
              </h1>
              {settings.subtitle && (
                <p className="text-2xl text-brand-green font-semibold tracking-wide uppercase mt-1">
                  {settings.subtitle}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="text-3xl font-bold text-gray-400">
          TV-{tvNumber}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-12 z-10 w-full h-full pb-12">
        <AnimatePresence mode="wait">
          {products.length > 0 ? (
            <motion.div
              key={currentIndex}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full h-full flex items-center justify-center gap-8"
            >
              {currentBatch.map((product, idx) => (
                <motion.div
                  key={`${product.id}-${idx}`}
                  variants={itemVariants[idx % 3]}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={`flex flex-col items-center justify-center relative ${idx === 1 ? 'z-20 w-[35%]' : 'z-10 w-[28%] mt-24'}`}
                >
                  <motion.div animate="floating" className="w-full relative group">
                    {/* Image Container with premium shadow and border */}
                    <div className="w-full aspect-square rounded-[3rem] bg-white shadow-2xl overflow-hidden border-8 border-white relative flex flex-col">
                       {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name_uz} 
                            className="w-full h-full object-cover rounded-[2.5rem]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-[2.5rem]">
                            <span className="text-gray-300 text-6xl">No Image</span>
                          </div>
                        )}
                        
                        {/* Gradient Overlay for Text Readability */}
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8 pb-12 rounded-b-[2.5rem]">
                           <h2 className="text-white text-4xl xl:text-5xl font-extrabold leading-tight shadow-black drop-shadow-lg text-center w-full">
                            {product.name_uz}
                           </h2>
                        </div>
                    </div>

                    {/* Price Tag Overlay */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-brand-green text-white px-10 py-5 rounded-full shadow-2xl border-4 border-white whitespace-nowrap">
                      <span className="text-4xl xl:text-5xl font-black">
                        {product.price.toLocaleString()} UZS
                      </span>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-400 text-4xl"
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
