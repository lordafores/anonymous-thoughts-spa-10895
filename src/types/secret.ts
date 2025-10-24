export interface Profile {
  id: string;
  username: string;
  avatar_seed: string;
  created_at: string;
  updated_at: string;
}

export interface Secret {
  id: string;
  content: string;
  encrypted_content?: string;
  image_url?: string;
  created_at: string;
  user_id?: string;
  reactions: {
    turbio: number;
    impresionante: number;
    noMeGusta: number;
  };
  userReaction?: 'turbio' | 'impresionante' | 'noMeGusta' | null;
  profile?: Profile;
}

export interface Comment {
  id: string;
  secret_id: string;
  user_id?: string;
  content: string;
  encrypted_content?: string;
  image_url?: string;
  reactions: {
    turbio: number;
    impresionante: number;
    noMeGusta: number;
  };
  created_at: string;
  profile?: Profile;
  userReaction?: 'turbio' | 'impresionante' | 'noMeGusta' | null;
}

export type ReactionType = 'turbio' | 'impresionante' | 'noMeGusta';
