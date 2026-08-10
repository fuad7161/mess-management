import {callable, groupsCol} from './firebase';
import {Group} from '../types/group';

export const createGroup = callable<{name: string; description?: string; location?: string}, {groupId: string}>('createGroup');
export const requestToJoinGroup = callable<{groupId: string}, {success: true}>('requestToJoinGroup');
export const cancelJoinRequest = callable<{groupId: string}, {success: true}>('cancelJoinRequest');
export const respondToJoinRequest = callable<{groupId: string; requestUid: string; decision: 'approve' | 'reject'}, {success: true}>('respondToJoinRequest');
export const promoteToAdmin = callable<{groupId: string; targetUid: string}, {success: true}>('promoteToAdmin');
export const demoteFromAdmin = callable<{groupId: string; targetUid: string}, {success: true}>('demoteFromAdmin');
export const leaveGroup = callable<{groupId: string}, {success: true}>('leaveGroup');
export const deleteGroup = callable<{groupId: string}, {success: true}>('deleteGroup');
export const updateMealWeights = callable<{groupId: string; breakfast: number; lunch: number; dinner: number}, {success: true}>('updateMealWeights');

export const findGroups = async (search: string): Promise<Group[]> => {
  const term = search.trim().toLowerCase();
  if (!term) return [];
  const snapshot = await groupsCol()
    .where('nameLower', '>=', term)
    .where('nameLower', '<=', `${term}\uf8ff`)
    .where('status', '==', 'active')
    .orderBy('nameLower', 'asc')
    .limit(20)
    .get();
  return snapshot.docs.map(item => ({id: item.id, ...item.data()} as Group));
};
