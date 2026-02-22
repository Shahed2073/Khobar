import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Utensils, Send, Crosshair } from 'lucide-react';
import { IftarPost } from '../types';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface PostFormProps {
  user: any;
  selectedCoords: { lat: number; lng: number } | null;
  onSuccess: () => void;
}

export const PostForm: React.FC<PostFormProps> = ({ user, selectedCoords, onSuccess }) => {
  const [formData, setFormData] = useState({
    location_name: '',
    district: 'Lakshmipur',
    upazila: '',
    time: '',
    food_description: '',
    image_url: '',
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedCoords) {
      setCoords(selectedCoords);
    }
  }, [selectedCoords]);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          toast.error('লোকেশন পাওয়া যায়নি: ' + error.message);
        }
      );
    } else {
      toast.error('আপনার ব্রাউজার জিওলোকেশন সাপোর্ট করে না।');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('দয়া করে প্রথমে লগইন করুন');
    if (!coords) return toast.error('দয়া করে ম্যাপে লোকেশন সিলেক্ট করুন অথবা GPS ব্যবহার করুন');

    setLoading(true);
    try {
      const { error } = await supabase.from('posts').insert([
        {
          ...formData,
          latitude: coords.lat,
          longitude: coords.lng,
          owner_email: user.email,
          true_votes: 0,
          false_votes: 0,
        },
      ]);

      if (error) throw error;

      setFormData({
        location_name: '',
        district: 'Lakshmipur',
        upazila: '',
        time: '',
        food_description: '',
        image_url: '',
      });
      setCoords(null);
      onSuccess();
      toast.success('ইফতারের তথ্য সফলভাবে শেয়ার হয়েছে!');
    } catch (error: any) {
      toast.error('শেয়ার করতে সমস্যা হয়েছে: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-xl border-2 border-[#fbbf24]/20">
      <h2 className="text-2xl font-bold text-[#064e3b] mb-6 flex items-center gap-2">
        <Utensils className="w-6 h-6 text-[#fbbf24]" />
        ইফতারের তথ্য শেয়ার করুন
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">স্থানের নাম</label>
            <input
              type="text"
              value={formData.location_name}
              onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#064e3b] outline-none"
              placeholder="যেমন: রহিমের বাড়ি"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">উপজেলা</label>
            <input
              type="text"
              value={formData.upazila}
              onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#064e3b] outline-none"
              placeholder="যেমন: রামগঞ্জ"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">ইফতারের সময়</label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#064e3b] outline-none"
                placeholder="যেমন: ৬:৩০ PM"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">খাবারের বিবরণ</label>
            <input
              type="text"
              value={formData.food_description}
              onChange={(e) => setFormData({ ...formData, food_description: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#064e3b] outline-none"
              placeholder="যেমন: ছোলা, পিয়াজু, মুড়ি"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">ছবির লিঙ্ক (ঐচ্ছিক)</label>
          <input
            type="url"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#064e3b] outline-none"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#064e3b]" />
              লোকেশন কোঅর্ডিনেটস
            </span>
            <button
              type="button"
              onClick={handleGetLocation}
              className="text-xs bg-[#064e3b] text-white px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-[#065f46] transition-colors"
            >
              <Crosshair className="w-3 h-3" />
              GPS ব্যবহার করুন
            </button>
          </div>
          
          {coords ? (
            <div className="text-xs text-green-600 font-mono bg-green-50 p-2 rounded border border-green-200">
              Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic">
              উপরের ম্যাপে ক্লিক করুন অথবা GPS ব্যবহার করে লোকেশন সেট করুন
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#fbbf24] text-[#064e3b] py-4 rounded-xl font-bold text-lg hover:bg-[#f59e0b] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? 'শেয়ার হচ্ছে...' : (
            <>
              <Send className="w-5 h-5" />
              শেয়ার করুন
            </>
          )}
        </button>
      </form>
    </div>
  );
};
