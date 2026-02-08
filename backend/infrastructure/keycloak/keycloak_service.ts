import 'dotenv/config';

interface KeycloakUser {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    enabled: boolean;
    credentials: {
        type: string;
        value: string;
        temporary: boolean;
    }[];
    attributes?: Record<string, string[]>;
}

export async function createKeycloakUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    headline?: string;
}) {
    const { email, firstName, lastName, password, headline } = userData;
    const realmUrl = process.env.KEYCLOAK_ISSUER;
    const adminClientId = process.env.KEYCLOAK_ADMIN_CLIENT_ID;
    const adminClientSecret = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET;

    if (!realmUrl || !adminClientId || !adminClientSecret) {
        throw new Error('Missing Keycloak Admin configuration');
    }

    // 1. Get Admin Token
    const tokenParams = new URLSearchParams();
    tokenParams.append('client_id', adminClientId);
    tokenParams.append('client_secret', adminClientSecret);
    tokenParams.append('grant_type', 'client_credentials');

    const tokenUrl = `${realmUrl}/protocol/openid-connect/token`;

    console.log('Fetching admin token from:', tokenUrl);

    const tokenRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams,
    });

    if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        throw new Error(`Failed to get admin token: ${tokenRes.status} ${errorText}`);
    }

    const tokenData = await tokenRes.json();
    const adminToken = tokenData.access_token;

    // 2. Create User
    const usersUrl = `${process.env.KEYCLOAK_ISSUER ? process.env.KEYCLOAK_ISSUER.replace(/\/realms\/[^/]+$/, '') : 'http://localhost:8080'}/admin/realms/noticeboard/users`;

    // Note: The Admin API URL is usually /admin/realms/{realm}/users
    // If KEYCLOAK_ISSUER is http://localhost:8080/realms/noticeboard
    // Then we need to construct the admin URL correctly.
    // However, sometimes it's under /auth/admin... depending on Keycloak version.
    // Assuming standard modern Keycloak (Quarkus): http://host:port/admin/realms/{realm}/users
    // The issuer URL usually contains the realm.

    // Let's try to derive it safely.
    // If issuer is http://.../realms/noticeboard
    // We can just append /users IF we are using the internal admin endpoint which might be different.
    // Usually: POST {realm_url}/users works if we are authing against that realm.
    // Wait, the Admin API is strictly at /admin/realms/{realm}/users.

    // Let's parse the ISSUER to get the base.
    const issuer = process.env.KEYCLOAK_ISSUER || '';
    const baseUrl = issuer.split('/realms/')[0];
    const realm = 'noticeboard'; // Hardcoded or derived
    const adminUsersUrl = `${baseUrl}/admin/realms/${realm}/users`;

    console.log('Creating user at:', adminUsersUrl);

    const newUser: KeycloakUser = {
        username: email, // Use email as username
        email,
        firstName,
        lastName,
        enabled: true,
        credentials: [{
            type: 'password',
            value: password,
            temporary: false,
        }],
        attributes: headline ? { headline: [headline] } : undefined,
    };

    const userRes = await fetch(adminUsersUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(newUser),
    });

    if (!userRes.ok) {
        if (userRes.status === 409) {
            throw new Error('User with this email already exists');
        }
        const errorText = await userRes.text();
        throw new Error(`Failed to create user: ${userRes.status} ${errorText}`);
    }

    // Attempt to get ID from Location header
    const locationHeader = userRes.headers.get('location');
    let userId = '';

    if (locationHeader) {
        const parts = locationHeader.split('/');
        userId = parts[parts.length - 1];
    }

    // Fallback: Fetch user by email if location header is missing or parsing failed
    if (!userId) {
        console.log('Location header missing, fetching user by email to get ID');
        const searchUrl = `${adminUsersUrl}?email=${encodeURIComponent(email)}`;
        const searchRes = await fetch(searchUrl, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (searchRes.ok) {
            const users = await searchRes.json();
            if (users && users.length > 0) {
                userId = users[0].id;
            }
        }
    }

    if (!userId) {
        throw new Error('User created but failed to retrieve ID');
    }

    return { id: userId, email, firstName, lastName };
}
