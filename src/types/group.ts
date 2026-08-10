export type MemberRole = 'admin' | 'member';

export interface MealWeights {
  breakfast: number;
  lunch: number;
  dinner: number;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  status: 'active' | 'deleted';
  adminCount: number;
  memberCount: number;
  mealWeights: MealWeights;
}

export interface GroupMember {
  uid: string;
  name?: string;
  phone?: string;
  role: MemberRole;
  active: boolean;
  joinedAt?: unknown;
  leftAt?: unknown;
}

export interface JoinRequest {
  uid: string;
  name?: string;
  groupName?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt?: unknown;
}
