import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

interface AuthProps {
  user: any;
}

export const Auth: React.FC<AuthProps> = ({ user }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Logged in successfully!');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Account created! Please check your email.');
      }
      setEmail('');
      setPassword('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out');
  };

  if (user) {
    return (
      <div className="flex items-center gap-4 bg-[#064e3b] text-[#fbbf24] p-3 rounded-lg border border-[#fbbf24]/30">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5" />
          <span className="text-sm font-medium truncate max-w-[150px]">{user.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-xs bg-[#fbbf24] text-[#064e3b] px-3 py-1 rounded font-bold hover:bg-[#f59e0b] transition-colors"
        >
          <LogOut className="w-3 h-3" />
          LOGOUT
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-xl border-2 border-[#064e3b]/10 max-w-md w-full mx-auto">
      <h2 className="text-2xl font-bold text-[#064e3b] mb-6 flex items-center gap-2">
        {isLogin ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
        {isLogin ? 'Login to Post' : 'Create Account'}
      </h2>
      
      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#064e3b] focus:border-transparent outline-none transition-all"
            placeholder="your@email.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#064e3b] focus:border-transparent outline-none transition-all"
            placeholder="••••••••"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#064e3b] text-white py-3 rounded-lg font-bold hover:bg-[#065f46] transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {loading ? 'PROCESSING...' : (isLogin ? 'SIGN IN' : 'REGISTER')}
        </button>
      </form>
      
      <button
        onClick={() => setIsLogin(!isLogin)}
        className="w-full mt-4 text-sm text-[#064e3b] font-medium hover:underline"
      >
        {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
      </button>
    </div>
  );
};
