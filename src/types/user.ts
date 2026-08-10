export interface AppUser {
  uid: string;
  name: string;
  phone: string;
  photoUrl: string | null;
  currentGroupId: string | null;
  pendingGroupId?: string | null;
  pendingGroupName?: string | null;
}
