import { handleAuth } from '@auth0/nextjs-auth0';

const authHandler = handleAuth();

export const GET = async (req: Request, props: { params: Promise<{ auth0: string }> }) => {
    const params = await props.params;
    return authHandler(req, { params: params as any });
};
