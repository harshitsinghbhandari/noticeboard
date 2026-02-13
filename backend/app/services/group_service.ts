import {
    createGroup,
    addGroupMember,
    leaveGroup,
    saveGroupMessage,
    markGroupRead,
    getGroup,
    getUserGroups,
    getGroupMessages,
    getGroupUnreadSummary
} from '../../infrastructure/db/group_repository';
import { getEventByGroupId, isOrganizer } from '../../infrastructure/db/event_repository';
import { io } from '../server';

export class GroupService {
    static async createGroup(creatorId: string, groupData: any) {
        const { name, description, memberIds } = groupData;

        if (!name || !Array.isArray(memberIds)) {
            throw new Error('Name and memberIds array are required');
        }

        const group = await createGroup({
            name,
            description: description || '',
            creatorId: creatorId,
            memberIds
        });

        // Notify members about new group
        const allMembers = [...new Set([...memberIds, creatorId])];
        allMembers.forEach(uid => {
            io.to(`user:${uid}`).emit('group:created', group);
        });

        // Update connected sockets to join the new room
        const sockets = await io.fetchSockets();
        for (const socket of sockets) {
            // @ts-ignore
            if (socket.user && allMembers.includes(socket.user.id)) {
                socket.join(`group:${group.id}`);
            }
        }

        return group;
    }

    static async listUserGroups(userId: string) {
        return await getUserGroups(userId);
    }

    static async addMember(adminId: string, groupId: string, userId: string) {
        if (!userId) throw new Error('userId is required');

        await addGroupMember(groupId, userId, adminId);

        // Notify group and user
        io.to(`group:${groupId}`).emit('group:member:added', { groupId, userId, addedBy: adminId });
        io.to(`user:${userId}`).emit('group:added', { groupId });

        // Force join socket for the new user
        const sockets = await io.fetchSockets();
        for (const socket of sockets) {
            // @ts-ignore
            if (socket.user && socket.user.id === userId) {
                socket.join(`group:${groupId}`);
            }
        }
    }

    static async leaveGroup(userId: string, groupId: string) {
        await leaveGroup(groupId, userId);

        io.to(`group:${groupId}`).emit('group:member:left', { groupId, userId });

        // Leave socket room
        const sockets = await io.fetchSockets();
        for (const socket of sockets) {
            // @ts-ignore
            if (socket.user && socket.user.id === userId) {
                socket.leave(`group:${groupId}`);
            }
        }
    }

    static async sendMessage(userId: string, groupId: string, content: string) {
        if (!content) throw new Error('Content is required');

        const group = await getGroup(groupId);
        if (!group) throw new Error('Group not found');

        let isOrganizerFlag = false;

        if (group.type === 'event') {
            const event = await getEventByGroupId(groupId);
            if (event) {
                if (event.status === 'cancelled') {
                    const cancelledAt = new Date(event.cancelled_at || event.updated_at);
                    const now = new Date();
                    if (now.getTime() > cancelledAt.getTime() + 24 * 60 * 60 * 1000) {
                        throw new Error('Messaging is blocked for this cancelled event after 24 hours');
                    }
                }
                isOrganizerFlag = await isOrganizer(groupId, userId);
            }
        }

        const message = await saveGroupMessage(groupId, userId, content);
        const messageWithFlag = { ...message, isOrganizer: isOrganizerFlag };

        io.to(`group:${groupId}`).emit('group:message:new', messageWithFlag);

        return messageWithFlag;
    }

    static async listMessages(userId: string, groupId: string) {
        return await getGroupMessages(groupId, userId);
    }

    static async markAsRead(userId: string, groupId: string) {
        const count = await markGroupRead(groupId, userId);

        // Emit summary event only
        io.to(`group:${groupId}`).emit("group:read", {
            userId: userId,
            groupId
        });

        return { readCount: count };
    }

    static async getUnreadSummary(userId: string) {
        return await getGroupUnreadSummary(userId);
    }
}
