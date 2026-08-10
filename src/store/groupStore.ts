import {create} from 'zustand';
import {Group, GroupMember} from '../types/group';

interface GroupState {
  group: Group | null;
  members: GroupMember[];
  myRole: 'admin' | 'member' | null;
  setGroup: (group: Group | null) => void;
  setMembers: (members: GroupMember[]) => void;
  setMyRole: (role: 'admin' | 'member' | null) => void;
  clear: () => void;
}

export const useGroupStore = create<GroupState>(set => ({
  group: null,
  members: [],
  myRole: null,
  setGroup: group => set({group}),
  setMembers: members => set({members}),
  setMyRole: myRole => set({myRole}),
  clear: () => set({group: null, members: [], myRole: null}),
}));
