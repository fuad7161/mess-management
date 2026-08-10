import {useEffect} from 'react';
import {groupsCol, groupMembersCol, usersCol} from '../api/firebase';
import {useAuthStore, useGroupStore} from '../store';
import {Group, GroupMember} from '../types/group';

export const useGroupListener = () => {
  const profile = useAuthStore(state => state.profile);
  const {setGroup, setMembers, setMyRole, clear} = useGroupStore();

  useEffect(() => {
    if (!profile?.currentGroupId) {
      clear();
      return;
    }
    const groupId = profile.currentGroupId;
    const unsubscribeGroup = groupsCol().doc(groupId).onSnapshot(snapshot => {
      setGroup(snapshot.exists() ? ({id: snapshot.id, ...snapshot.data()} as Group) : null);
    });
    const unsubscribeMembers = groupMembersCol(groupId)
      .where('active', '==', true)
      .onSnapshot(async snapshot => {
        const raw = snapshot.docs.map(item => ({uid: item.id, ...item.data()} as GroupMember));
        const hydrated = await Promise.all(raw.map(async member => {
          const user = await usersCol().doc(member.uid).get();
          return {...member, name: user.data()?.name, phone: user.data()?.phone};
        }));
        setMembers(hydrated);
        setMyRole(hydrated.find(member => member.uid === profile.uid)?.role ?? null);
      });
    return () => { unsubscribeGroup(); unsubscribeMembers(); };
  }, [profile?.currentGroupId, profile?.uid, clear, setGroup, setMembers, setMyRole]);
};
