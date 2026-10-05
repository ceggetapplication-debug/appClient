import { databases, config, Query } from './appwriteConfig';

export function getUserIdentifier(fullName?: string, username?: string): string {
    const name = fullName || '';
    let nameInitials = '';
    const nameParts = name.split(' ').filter(part => part.length > 0);

    if (nameParts.length > 0) {
        nameInitials += nameParts[0].charAt(0).toUpperCase();
    }
    if (nameParts.length > 1) {
        nameInitials += nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    }

    const uname = username || '';
    const usernamePart = uname.length > 0
        ? uname.substring(0, Math.min(uname.length, 3)).toUpperCase()
        : '';

    let userIdentifier = `${nameInitials}${usernamePart}`;
    return userIdentifier.length > 0 ? userIdentifier : 'USER';
}

export function getFormattedDate(dateInput?: Date): string {
    const today = dateInput || new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}${month}${year}`;
}

export function buildOrderReference(
    fullName: string,
    username: string,
    orderCount: number,
    dateInput?: Date
): string {
    const userIdentifier = getUserIdentifier(fullName, username);
    const formattedDate = getFormattedDate(dateInput);
    return `${userIdentifier}-${formattedDate}-${orderCount}`;
}

export async function generateAndSyncOrderReference(params: {
    userId: string;
    fullName?: string;
    username?: string;
}): Promise<{ reference: string; orderCount: number }> {
    try {
        const ordersResp = await databases.listDocuments(
            config.databaseId,
            config.ordersCollectionId,
            [Query.equal('userId', params.userId)]
        );

        const nextOrderCount = (ordersResp.total || 0) + 1;
        const reference = buildOrderReference(
            params.fullName || '',
            params.username || '',
            nextOrderCount
        );

        return {
            reference,
            orderCount: nextOrderCount,
        };
    } catch (error) {
        console.error('Erreur génération référence commande BDD:', error);
        const fallbackCount = Date.now();
        const reference = buildOrderReference(
            params.fullName || '',
            params.username || '',
            fallbackCount
        );
        return {
            reference,
            orderCount: 1,
        };
    }
}

