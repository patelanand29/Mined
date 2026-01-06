import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  error?: string;
  error_description?: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  colorId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized - please sign in first');
    }

    const { action, code, timeMin, timeMax, eventData } = await req.json();
    
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    // This redirect URI should be your app URL where the OAuth callback lands
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI') || 'https://6ada2be1-9d0b-4af1-8c00-d6283ed1aedc.lovableproject.com/mood-calendar';

    console.log('Google Calendar action:', action);
    console.log('Redirect URI configured:', redirectUri);

    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth credentials');
      throw new Error('Google OAuth credentials not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET secrets.');
    }

    // Handle OAuth callback - exchange code for tokens
    if (action === 'exchange_code') {
      console.log('Exchanging authorization code for tokens...');
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokens: GoogleTokenResponse = await tokenResponse.json();
      console.log('Token exchange response status:', tokenResponse.status);
      
      if (!tokenResponse.ok || tokens.error) {
        console.error('Token exchange failed:', tokens.error, tokens.error_description);
        throw new Error(tokens.error_description || 'Failed to exchange authorization code');
      }

      // Store tokens in database
      const { error: storeError } = await supabaseClient
        .from('google_tokens')
        .upsert({
          user_id: user.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        }, { onConflict: 'user_id' });

      if (storeError) {
        console.error('Error storing tokens:', storeError);
        throw storeError;
      }

      console.log('Tokens stored successfully for user:', user.id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get auth URL
    if (action === 'get_auth_url') {
      const authUrl = getAuthUrl(clientId, redirectUri);
      console.log('Generated auth URL');
      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check connection status - also returns auth URL if not connected
    if (action === 'check_connection') {
      const { data: tokenData, error: tokenError } = await supabaseClient
        .from('google_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (tokenError || !tokenData) {
        console.log('No tokens found, returning auth URL');
        return new Response(JSON.stringify({ 
          needsAuth: true, 
          authUrl: getAuthUrl(clientId, redirectUri) 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if access token is still valid
      const isExpired = new Date(tokenData.expires_at) < new Date();
      if (isExpired && !tokenData.refresh_token) {
        console.log('Token expired and no refresh token');
        return new Response(JSON.stringify({ 
          needsAuth: true, 
          authUrl: getAuthUrl(clientId, redirectUri) 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('User is connected to Google Calendar');
      return new Response(JSON.stringify({ connected: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For list_events and create_event, we need valid tokens
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('google_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      console.log('No tokens found for calendar operations');
      return new Response(JSON.stringify({ 
        needsAuth: true, 
        authUrl: getAuthUrl(clientId, redirectUri) 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if token expired and refresh if needed
    let accessToken = tokenData.access_token;
    if (new Date(tokenData.expires_at) < new Date()) {
      console.log('Access token expired, refreshing...');
      if (!tokenData.refresh_token) {
        return new Response(JSON.stringify({ 
          needsAuth: true, 
          authUrl: getAuthUrl(clientId, redirectUri) 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const refreshedTokens = await refreshAccessToken(clientId, clientSecret, tokenData.refresh_token);
        if (refreshedTokens.error) {
          console.error('Token refresh failed:', refreshedTokens.error);
          return new Response(JSON.stringify({ 
            needsAuth: true, 
            authUrl: getAuthUrl(clientId, redirectUri) 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        accessToken = refreshedTokens.access_token;
        
        await supabaseClient
          .from('google_tokens')
          .update({
            access_token: refreshedTokens.access_token,
            expires_at: new Date(Date.now() + refreshedTokens.expires_in * 1000).toISOString(),
          })
          .eq('user_id', user.id);
        
        console.log('Token refreshed successfully');
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        return new Response(JSON.stringify({ 
          needsAuth: true, 
          authUrl: getAuthUrl(clientId, redirectUri) 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Fetch calendar events
    if (action === 'list_events') {
      console.log('Fetching calendar events...');
      const events = await fetchCalendarEvents(accessToken, timeMin, timeMax);
      console.log('Fetched', events.length, 'events');
      return new Response(JSON.stringify({ events }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create mood event on calendar
    if (action === 'create_event') {
      console.log('Creating calendar event...');
      const event = await createCalendarEvent(accessToken, eventData);
      console.log('Event created:', event.id);
      return new Response(JSON.stringify({ event }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Google Calendar error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getAuthUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
    access_type: 'offline',
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function refreshAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<GoogleTokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  return response.json();
}

async function fetchCalendarEvents(accessToken: string, timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    maxResults: '100',
    singleEvents: 'true',
    orderBy: 'startTime',
  });
  
  if (timeMin) params.set('timeMin', timeMin);
  if (timeMax) params.set('timeMax', timeMax);

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('Calendar API error:', error);
    throw new Error('Failed to fetch calendar events');
  }

  const data = await response.json();
  return data.items || [];
}

async function createCalendarEvent(accessToken: string, eventData: any): Promise<GoogleCalendarEvent> {
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('Create event error:', error);
    throw new Error('Failed to create calendar event');
  }

  return response.json();
}
