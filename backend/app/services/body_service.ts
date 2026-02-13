import {
    listBodies,
    listFollowedBodies,
    getBody,
    updateBody,
    deleteBody,
    isFollowingBody,
    followBody,
    unfollowBody,
    listMembers,
    addMember,
    removeMember,
    getMemberRole,
    countAdmins,
    checkBodyPermission,
    createBodyWithAdmin,
    BodyAction
} from '../../infrastructure/db/body_repository';
import { getUser } from '../../infrastructure/db/user_repository';
import { listPosts } from '../../infrastructure/db/post_repository';

export class BodyService {
    static async createBody(userId: string, bodyData: any) {
        const { name, description, website_url, initial_admin_id } = bodyData;

        if (!name || !initial_admin_id) {
            throw new Error('Missing required fields');
        }

        const user = await getUser(userId);
        if (!user || !user.is_system_admin) {
            throw new Error('Forbidden: Only System Admins can create bodies');
        }

        // Verify initial admin exists
        const initialAdmin = await getUser(initial_admin_id);
        if (!initialAdmin) {
            throw new Error('Initial admin user not found');
        }

        return await createBodyWithAdmin(name, description, website_url, initial_admin_id);
    }

    static async listAll() {
        return await listBodies();
    }

    static async listFollowed(userId: string) {
        return await listFollowedBodies(userId);
    }

    static async getBody(bodyId: string, userId: string) {
        const bodyObj = await getBody(bodyId);
        if (!bodyObj) return null;

        const isFollowing = await isFollowingBody(bodyObj.id, userId);
        const userRole = await getMemberRole(bodyObj.id, userId);
        return { ...bodyObj, is_following: isFollowing, user_role: userRole };
    }

    static async updateBody(userId: string, bodyId: string, bodyData: any) {
        const { name, description, website_url } = bodyData;
        if (!name) throw new Error('Name is required');

        const hasPermission = await checkBodyPermission(userId, bodyId, BodyAction.EDIT_BODY);
        if (!hasPermission) {
            throw new Error('Forbidden: You do not have permission to edit this body');
        }

        return await updateBody(bodyId, name, description, website_url);
    }

    static async deleteBody(userId: string, bodyId: string) {
        const hasPermission = await checkBodyPermission(userId, bodyId, BodyAction.DELETE_BODY);
        if (!hasPermission) {
            throw new Error('Forbidden: You do not have permission to delete this body');
        }

        await deleteBody(bodyId);
    }

    static async listBodyPosts(userId: string, bodyId: string, limit: number, cursor?: string) {
        return await listPosts(userId, limit, cursor, bodyId);
    }

    static async followBody(bodyId: string, userId: string) {
        await followBody(bodyId, userId);
    }

    static async unfollowBody(bodyId: string, userId: string) {
        await unfollowBody(bodyId, userId);
    }

    static async listMembers(userId: string, bodyId: string) {
        const hasPermission = await checkBodyPermission(userId, bodyId, BodyAction.MANAGE_MEMBERS);
        if (!hasPermission) {
            throw new Error('Forbidden: Only admins can view members list');
        }
        return await listMembers(bodyId);
    }

    static async addMember(userId: string, bodyId: string, memberData: any) {
        const { user_id, role } = memberData;
        if (!user_id || !role) throw new Error('Missing required fields');

        const hasPermission = await checkBodyPermission(userId, bodyId, BodyAction.MANAGE_MEMBERS);
        if (!hasPermission) {
            throw new Error('Forbidden: Only admins can add members');
        }
        await addMember(bodyId, user_id, role);
    }

    static async updateMemberRole(userId: string, bodyId: string, targetUserId: string, role: string) {
        const hasPermission = await checkBodyPermission(userId, bodyId, BodyAction.MANAGE_MEMBERS);
        if (!hasPermission) {
            throw new Error('Forbidden: Only admins can manage roles');
        }

        // Safeguard: preventing removal of the last BODY_ADMIN
        const currentRole = await getMemberRole(bodyId, targetUserId);
        if (currentRole === 'BODY_ADMIN' && role !== 'BODY_ADMIN') {
            const adminCount = await countAdmins(bodyId);
            if (adminCount <= 1) {
                throw new Error('Cannot demote the last administrator');
            }
        }

        await addMember(bodyId, targetUserId, role);
    }

    static async removeMember(userId: string, bodyId: string, targetUserId: string) {
        const hasPermission = await checkBodyPermission(userId, bodyId, BodyAction.MANAGE_MEMBERS);
        if (!hasPermission) {
            throw new Error('Forbidden: Only admins can remove members');
        }

        // Safeguard: preventing removal of the last BODY_ADMIN
        const currentRole = await getMemberRole(bodyId, targetUserId);
        if (currentRole === 'BODY_ADMIN') {
            const adminCount = await countAdmins(bodyId);
            if (adminCount <= 1) {
                throw new Error('Cannot remove the last administrator');
            }
        }

        await removeMember(bodyId, targetUserId);
    }
}
