import React from 'react';
import { Moon, Star } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-[#064e3b] text-[#fbbf24] py-8 px-4 shadow-lg border-b-4 border-[#fbbf24] relative overflow-hidden">
      <div className="absolute top-2 right-4 opacity-20">
        <Star className="w-8 h-8 fill-current" />
      </div>
      <div className="absolute top-10 left-10 opacity-10">
        <Star className="w-4 h-4 fill-current" />
      </div>
      
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-4 mb-2">
          <Moon className="w-12 h-12 fill-[#fbbf24] transform -rotate-12" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-serif">
            খবর লও
          </h1>
        </div>
        <p className="text-xl md:text-2xl font-medium italic">
          – কার বাড়িতে ইফতার করবা? –
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm opacity-80 uppercase tracking-widest">
          <span>রমজান ২০২৬</span>
          <span className="w-1 h-1 bg-[#fbbf24] rounded-full"></span>
          <span>লাইভ ইফতার ম্যাপ</span>
        </div>
      </div>
    </header>
  );
};
