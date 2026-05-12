import { Link } from 'react-router-dom';
import { Tv, Settings } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-brand-green flex flex-col items-center justify-center p-4">
      {/* Admin Link */}
      <Link 
        to="/admin" 
        className="absolute top-4 right-4 text-white/50 hover:text-white flex items-center gap-2 transition-colors"
      >
        <Settings size={20} />
        <span className="hidden sm:inline">Admin Panel</span>
      </Link>

      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">L.UZ</h1>
        <p className="text-brand-cream text-xl">Digital Menu Board System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {[1, 2, 3].map((tvNum) => (
          <Link
            key={tvNum}
            to={`/tv/${tvNum}`}
            className="group relative bg-white rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-brand-red rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            <Tv size={64} className="text-brand-green group-hover:text-brand-red transition-colors duration-300" />
            <h2 className="text-3xl font-bold text-gray-900 group-hover:text-brand-red transition-colors duration-300">
              {tvNum}-TV
            </h2>
            <p className="text-gray-500 text-sm font-medium">Fullscreen Display</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
