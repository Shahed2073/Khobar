import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { IftarPost } from './types';
import { Header } from './components/Header';
import { Map } from './components/Map';
import { Auth } from './components/Auth';
import { PostForm } from './components/PostForm';
import { PostList } from './components/PostList';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X } from 'lucide-react';
import { Toaster, toast } from 'sonner';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<IftarPost[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Initial fetch
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error('Error fetching posts');
      } else {
        setPosts(data || []);
      }
    };

    fetchPosts();

    // Real-time subscription
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPosts(prev => [payload.new as IftarPost, ...prev]);
          toast.success('New Iftar shared!');
        } else if (payload.eventType === 'UPDATE') {
          setPosts(prev => prev.map(post => post.id === payload.new.id ? payload.new as IftarPost : post));
        } else if (payload.eventType === 'DELETE') {
          setPosts(prev => prev.filter(post => post.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
    if (user) {
      setIsFormOpen(true);
    } else {
      toast.error('Please login to share Iftar');
    }
  };

  const handleMarkerClick = (post: IftarPost) => {
    console.log('Marker clicked:', post);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#064e3b]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] font-sans text-gray-900 pb-20">
      <Toaster position="top-center" richColors />
      <Header />
      
      <main>
        <Map 
          posts={posts} 
          onMarkerClick={handleMarkerClick} 
          onMapClick={handleMapClick} 
        />
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <PostList posts={posts} user={user} />
            </div>
            
            <div className="space-y-8">
              <Auth user={user} />
              
              {!user && (
                <div className="bg-[#064e3b] text-white p-6 rounded-xl shadow-lg border-l-4 border-[#fbbf24]">
                  <h3 className="text-lg font-bold mb-2">Want to share Iftar?</h3>
                  <p className="text-sm opacity-90">
                    Login or create an account to post your Iftar location and help others find a place to break their fast.
                  </p>
                </div>
              )}

              {user && !isFormOpen && (
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="w-full bg-[#064e3b] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#065f46] transition-all shadow-lg"
                >
                  <Plus className="w-6 h-6" />
                  SHARE NEW IFTAR
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Submission Modal */}
      <AnimatePresence>
        {isFormOpen && user && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsFormOpen(false)}
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <PostForm 
                user={user} 
                selectedCoords={selectedCoords} 
                onSuccess={() => {
                  setIsFormOpen(false);
                  setSelectedCoords(null);
                }} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Button for Mobile */}
      {user && !isFormOpen && (
        <button
          onClick={() => setIsFormOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#064e3b] text-white rounded-full shadow-2xl flex items-center justify-center z-40 border-2 border-[#fbbf24]"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}
    </div>
  );
}
