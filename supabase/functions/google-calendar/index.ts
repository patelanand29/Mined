import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  colorId?: string;
}

const VALID_ACTIONS = ['check_connection', 'list_events', 'create_event'];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated and get session
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the session to retrieve the provider token server-side
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to get session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, timeMin, timeMax, eventData } = await req.json();

    // Input validation
    if (!action || !VALID_ACTIONS.includes(action)) {
      return new Response(
        JSON.stringify({ error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing action: ${action} for user: ${user.id}`);

    // Check connection status
    if (action === 'check_connection') {
      const googleIdentity = user.identities?.find(i => i.provider === 'google');
      return new Response(
        JSON.stringify({ 
          connected: !!googleIdentity,
          needsAuth: !googleIdentity 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For calendar operations, get the provider token from the session (server-side)
    const providerToken = session?.provider_token;
    if (!providerToken) {
      console.log('No provider token in session');
      return new Response(
        JSON.stringify({ needsAuth: true, error: 'No provider token - please reconnect Google Calendar' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // List events
    if (action === 'list_events') {
      // Validate timeMin and timeMax if provided
      if (timeMin && typeof timeMin !== 'string') {
        return new Response(
          JSON.stringify({ error: 'timeMin must be a string' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (timeMax && typeof timeMax !== 'string') {
        return new Response(
          JSON.stringify({ error: 'timeMax must be a string' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Fetching calendar events...');
      const events = await fetchCalendarEvents(providerToken, timeMin, timeMax);
      return new Response(
        JSON.stringify({ events }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create event
    if (action === 'create_event') {
      // Validate eventData
      if (!eventData || typeof eventData !== 'object') {
        return new Response(
          JSON.stringify({ error: 'eventData is required and must be an object' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!eventData.summary || typeof eventData.summary !== 'string') {
        return new Response(
          JSON.stringify({ error: 'eventData.summary is required and must be a string' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (eventData.summary.length > 1000) {
        return new Response(
          JSON.stringify({ error: 'eventData.summary must be less than 1000 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Creating calendar event...');
      const event = await createCalendarEvent(providerToken, eventData);
      return new Response(
        JSON.stringify({ event }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in google-calendar function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchCalendarEvents(
  accessToken: string,
  timeMin?: string,
  timeMax?: string
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    maxResults: '50',
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  if (timeMin) params.append('timeMin', timeMin);
  if (timeMax) params.append('timeMax', timeMax);

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Google Calendar API error:', errorData);
    throw new Error(`Failed to fetch calendar events: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

async function createCalendarEvent(
  accessToken: string,
  eventData: { summary: string; description?: string; start: object; end: object; colorId?: string }
): Promise<GoogleCalendarEvent> {
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
    const errorData = await response.text();
    console.error('Google Calendar API error:', errorData);
    throw new Error(`Failed to create calendar event: ${response.status}`);
  }

  return await response.json();
}
