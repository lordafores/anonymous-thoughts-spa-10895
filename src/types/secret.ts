export interface Secret {
  id: string;
  content: string;
  created_at: string;
  reactions: {
    turbio: number;
    impresionante: number;
    noMeGusta: number;
  };
  userReaction?: 'turbio' | 'impresionante' | 'noMeGusta' | null;
}

export type ReactionType = 'turbio' | 'impresionante' | 'noMeGusta';
