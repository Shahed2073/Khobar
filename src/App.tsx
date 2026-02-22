import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { IftarPost } from './types';
import { Header } from './components/Header';
import { IftarMap } from './components/Map';
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
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setConfigError(true);
      setLoading(false);
      return;
    }

    // Auth listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(err => {
      console.error('Auth error:', err);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (configError) return;

    // Initial fetch
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          toast.error('তথ্য আনতে সমস্যা হয়েছে');
        } else {
          setPosts(data || []);
        }
      } catch (e) {
        console.error('Fetch error:', e);
      }
    };

    fetchPosts();

    // Real-time subscription
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPosts(prev => [payload.new as IftarPost, ...prev]);
          toast.success('নতুন ইফতার শেয়ার হয়েছে!');
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
  }, [configError]);

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
    if (user) {
      setIsFormOpen(true);
    } else {
      toast.error('ইফতার শেয়ার করতে দয়া করে লগইন করুন');
    }
  };

  const handleMarkerClick = (post: IftarPost) => {
    console.log('Marker clicked:', post);
  };

  if (configError) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-2xl border-2 border-red-100 max-w-md">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">কনফিগারেশন পাওয়া যায়নি!</h1>
          <p className="text-gray-600 mb-6">
            দয়া করে আপনার Vercel ড্যাশবোর্ডে <code>VITE_SUPABASE_URL</code> এবং <code>VITE_SUPABASE_ANON_KEY</code> এনভায়রনমেন্ট ভেরিয়েবলগুলো যুক্ত করুন।
          </p>
          <div className="text-sm text-left bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono">
            <p className="font-bold text-gray-700 mb-2">কিভাবে ঠিক করবেন:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-500">
              <li>Vercel Project Settings-এ যান</li>
              <li>Environment Variables ট্যাবে যান</li>
              <li>Supabase এর কী-গুলো যুক্ত করুন</li>
              <li>আবার রি-ডিপ্লয় (Redeploy) করুন</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

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
        <IftarMap 
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
                  <h3 className="text-lg font-bold mb-2">ইফতার শেয়ার করতে চান?</h3>
                  <p className="text-sm opacity-90">
                    লগইন করুন অথবা একটি অ্যাকাউন্ট তৈরি করুন যাতে আপনি আপনার ইফতারের লোকেশন শেয়ার করতে পারেন এবং অন্যদের ইফতার খুঁজে পেতে সাহায্য করতে পারেন।
                  </p>
                </div>
              )}

              {user && !isFormOpen && (
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="w-full bg-[#064e3b] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#065f46] transition-all shadow-lg"
                >
                  <Plus className="w-6 h-6" />
                  নতুন ইফতার শেয়ার করুন
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
