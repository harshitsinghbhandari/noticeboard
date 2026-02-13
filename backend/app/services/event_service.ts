import * as eventRepo from '../../infrastructure/db/event_repository';
import { checkBodyPermission, BodyAction, getMemberRole } from '../../infrastructure/db/body_repository';
import { getUser } from '../../infrastructure/db/user_repository';
import { io } from '../server';

export class EventService {
    static async createEvent(userId: string, data: any) {
        const { bodyId } = data;
        if (!bodyId) throw new Error('bodyId is required');

        const hasPermission = await checkBodyPermission(userId, bodyId, BodyAction.CREATE_EVENT);
        if (!hasPermission) {
            throw new Error('Forbidden: Only Body Admin or Manager can create events');
        }

        // Event creator must belong to that Body
        const role = await getMemberRole(bodyId, userId);
        if (!role) {
            throw new Error('Forbidden: You must be a member of the body to create an event');
        }

        return await eventRepo.createEvent(userId, data);
    }

    static async publishEvent(userId: string, eventId: string) {
        const isAdmin = await eventRepo.isEventAdmin(eventId, userId);
        if (!isAdmin) throw new Error('Forbidden: Only event admin can publish');

        await eventRepo.publishEvent(eventId);
    }

    static async updateEvent(userId: string, eventId: string, data: any) {
        const isAdmin = await eventRepo.isEventAdmin(eventId, userId);
        if (!isAdmin) throw new Error('Forbidden: Only event admin can update');

        return await eventRepo.updateEvent(eventId, data);
    }

    static async joinEvent(userId: string, eventId: string) {
        await eventRepo.joinEvent(userId, eventId);

        const event = await eventRepo.getEvent(eventId);
        if (event) {
            io.to(`group:${event.group_id}`).emit("group:member:joined", { userId });
        }
    }

    static async leaveEvent(userId: string, eventId: string) {
        await eventRepo.leaveEvent(userId, eventId);

        const event = await eventRepo.getEvent(eventId);
        if (event) {
            io.to(`group:${event.group_id}`).emit("group:member:left", { groupId: event.group_id, userId });
        }
    }

    static async cancelEvent(userId: string, eventId: string) {
        const isAdmin = await eventRepo.isEventAdmin(eventId, userId);
        if (!isAdmin) throw new Error('Forbidden: Only event admin can cancel');

        await eventRepo.cancelEvent(eventId);
    }

    static async getEvent(eventId: string) {
        return await eventRepo.getEvent(eventId);
    }

    static async getEventByGroupId(groupId: string) {
        return await eventRepo.getEventByGroupId(groupId);
    }

    static async listEvents(lat: number, lng: number, radius: number) {
        return await eventRepo.listEvents(lat, lng, radius);
    }

    static async addEventAdmin(userId: string, eventId: string, targetUserId: string) {
        const isAdmin = await eventRepo.isEventAdmin(eventId, userId);
        if (!isAdmin) throw new Error('Forbidden: Only event admin can add other admins');

        const event = await eventRepo.getEvent(eventId);
        if (!event) throw new Error('Event not found');

        // targetUserId must belong to same Body
        const role = await getMemberRole(event.body_id, targetUserId);
        if (!role) throw new Error('Target user must be a member of the same body');

        await eventRepo.addEventAdmin(eventId, targetUserId);
    }

    static async addEventOrganizer(userId: string, eventId: string, targetUserId: string) {
        const isAdmin = await eventRepo.isEventAdmin(eventId, userId);
        if (!isAdmin) throw new Error('Forbidden: Only event admin can add organizers');

        // targetUserId must exist
        const targetUser = await getUser(targetUserId);
        if (!targetUser) throw new Error('Target user not found');

        await eventRepo.addEventOrganizer(eventId, targetUserId);
    }
}
