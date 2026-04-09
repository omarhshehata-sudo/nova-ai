import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error, error_description } = req.query;

  // Check for GitHub errors
  if (error) {
    return res.status(400).json({
      error: error_description || 'GitHub authorization failed',
    });
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    console.log('=== OAuth Callback Debug ===');
    console.log('Client ID:', clientId ? `${clientId.substring(0, 10)}...` : '✗ missing');
    console.log('Client Secret:', clientSecret ? 'set (length: ' + clientSecret.length + ')' : '✗ missing');
    console.log('Code:', code);

    if (!clientId || !clientSecret) {
      throw new Error('GitHub credentials not configured');
    }

    // Prepare the body
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }).toString();
    
    console.log('Request body:', body.substring(0, 50) + '...');

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    });

    console.log('Token response status:', tokenResponse.status);
    const tokenData = await tokenResponse.json();
    console.log('Token Response:', JSON.stringify(tokenData));

    if (tokenData.error) {
      console.error('GitHub token error:', JSON.stringify(tokenData));
      return res.status(400).json({
        error: 'Failed to exchange code for token',
        details: tokenData.error_description || 'Unknown error',
        github_error: tokenData.error,
        http_status: tokenResponse.status,
      });
    }

    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'No access token received' });
    }

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/json',
      },
    });

    const userData = await userResponse.json();

    if (!userData.id) {
      return res.status(400).json({ error: 'Failed to fetch user data' });
    }

    // Return auth data to client
    // In production, you'd store this in a database and create a session
    const authData = {
      user: {
        id: userData.id,
        login: userData.login,
        name: userData.name,
        avatar_url: userData.avatar_url,
        email: userData.email,
      },
      accessToken: tokenData.access_token,
      tokenType: tokenData.token_type,
    };

    // Redirect back to frontend with token as URL parameter
    // In production, use secure HTTP-only cookies instead
    const redirectUrl = `https://nova-ai-blue.vercel.app?token=${Buffer.from(
      JSON.stringify(authData)
    ).toString('base64')}`;

    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
