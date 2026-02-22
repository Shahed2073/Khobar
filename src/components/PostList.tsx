import React from 'react';
import { IftarPost } from '../types';
import { ThumbsUp, ThumbsDown, CheckCircle, AlertTriangle, MapPin, Clock, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface PostListProps {
  posts: IftarPost[];
  user: any;
}

export const PostList: React.FC<PostListProps> = ({ posts, user }) => {
  const handleVote = async (postId: string, type: 'true' | 'false') => {
    if (!user) {
      toast.error('Please login to vote');
      return;
    }

    try {
      // 1. Check if user already voted for this post
      const { data: existingVote, error: checkError } = await supabase
        .from('votes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows found"
        throw checkError;
      }

      if (existingVote) {
        toast.error('You have already voted on this post');
        return;
      }

      // 2. Insert vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert([{ post_id: postId, user_id: user.id, vote_type: type }]);

      if (voteError) throw voteError;

      // 3. Update post count (In production, use an RPC or Trigger)
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const updateData = type === 'true' 
        ? { true_votes: post.true_votes + 1 } 
        : { false_votes: post.false_votes + 1 };

      const { error: updateError } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId);

      if (updateError) throw updateError;

      toast.success('Vote recorded!');
    } catch (error: any) {
      toast.error('Error voting: ' + error.message);
    }
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-inner border-2 border-dashed border-gray-200">
        <p className="text-gray-500 font-medium">No Iftar posts yet. Be the first to share!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#064e3b] flex items-center gap-2 px-2">
        <span className="w-2 h-8 bg-[#fbbf24] rounded-full"></span>
        Recent Iftar Updates
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => {
          const isVerified = post.true_votes >= 10;
          const isReported = post.false_votes >= 5;

          return (
            <div 
              key={post.id} 
              className={`bg-white rounded-2xl shadow-md overflow-hidden border-t-4 transition-transform hover:scale-[1.01] ${
                isVerified ? 'border-green-500' : isReported ? 'border-red-500' : 'border-[#fbbf24]'
              }`}
            >
              {post.image_url && (
                <div className="h-48 w-full overflow-hidden">
                  <img 
                    src={post.image_url} 
                    alt={post.location_name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-[#064e3b] leading-tight">
                    {post.location_name}
                  </h3>
                  <div className="flex flex-col gap-1 items-end">
                    {isVerified && (
                      <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                    {isReported && (
                      <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                        <AlertTriangle className="w-3 h-3" />
                        Reported
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-[#fbbf24]" />
                    <span>{post.upazila}, {post.district}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-[#fbbf24]" />
                    <span>Iftar at {post.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4 text-[#fbbf24]" />
                    <span className="truncate">By {post.owner_email.split('@')[0]}</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm text-gray-700 italic">
                  "{post.food_description}"
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => handleVote(post.id!, 'true')}
                    className="flex items-center gap-2 text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors"
                  >
                    <ThumbsUp className="w-5 h-5" />
                    <span className="font-bold">{post.true_votes}</span>
                  </button>
                  
                  <button 
                    onClick={() => handleVote(post.id!, 'false')}
                    className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                  >
                    <ThumbsDown className="w-5 h-5" />
                    <span className="font-bold">{post.false_votes}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
