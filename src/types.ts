export interface IftarPost {
  id?: string;
  location_name: string;
  district: string;
  upazila: string;
  time: string;
  food_description: string;
  image_url: string;
  latitude: number;
  longitude: number;
  owner_email: string;
  true_votes: number;
  false_votes: number;
  created_at: string;
}

export interface Vote {
  id: string;
  post_id: string;
  user_id: string;
  vote_type: 'true' | 'false';
}
