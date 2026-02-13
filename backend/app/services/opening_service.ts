import { listOpenings, getOpening, createOpening, updateOpening, deleteOpening } from '../../infrastructure/db/opening_repository';
import { checkBodyPermission, BodyAction } from '../../infrastructure/db/body_repository';

export class OpeningService {
    static async listOpenings(filters: any) {
        return await listOpenings(filters);
    }

    static async createOpening(userId: string, openingData: any) {
        const { body_id, title, description, location_city, location_country, job_type, experience_level } = openingData;

        const hasPermission = await checkBodyPermission(userId, body_id, BodyAction.CREATE_EVENT);
        if (!hasPermission) {
            throw new Error('Forbidden: You are not authorized to create openings for this body');
        }

        return await createOpening({ body_id, title, description, location_city, location_country, job_type, experience_level });
    }

    static async updateOpening(userId: string, openingId: string, openingData: any) {
        const existingOpening = await getOpening(openingId);
        if (!existingOpening) throw new Error('Opening not found');

        const hasPermission = await checkBodyPermission(userId, existingOpening.body_id, BodyAction.CREATE_EVENT);
        if (!hasPermission) {
            throw new Error('Forbidden: You are not authorized to edit openings for this body');
        }

        return await updateOpening(openingId, openingData);
    }

    static async deleteOpening(userId: string, openingId: string) {
        const existingOpening = await getOpening(openingId);
        if (!existingOpening) throw new Error('Opening not found');

        const hasPermission = await checkBodyPermission(userId, existingOpening.body_id, BodyAction.CREATE_EVENT);
        if (!hasPermission) {
            throw new Error('Forbidden: You are not authorized to delete openings for this body');
        }

        await deleteOpening(openingId);
    }
}
