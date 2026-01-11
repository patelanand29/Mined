import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RiskAnalysisResult {
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  analysis_summary: string;
  recommendations: string[];
  data_analyzed: {
    cbt_entries: number;
    journal_entries: number;
    mood_entries: number;
    alchemist_sessions: number;
  };
}

Deno.serve(async (req) => {
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
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Verify user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing mental health data for user: ${user.id}`);

    // Get data from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // Fetch all relevant data in parallel
    const [cbtResult, journalResult, moodResult, alchemistResult] = await Promise.all([
      supabaseClient
        .from('cbt_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgoISO)
        .order('created_at', { ascending: false }),
      supabaseClient
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgoISO)
        .order('created_at', { ascending: false }),
      supabaseClient
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgoISO)
        .order('created_at', { ascending: false }),
      supabaseClient
        .from('emotion_alchemist_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgoISO)
        .order('created_at', { ascending: false }),
    ]);

    const cbtRecords = cbtResult.data || [];
    const journalEntries = journalResult.data || [];
    const moodEntries = moodResult.data || [];
    const alchemistSessions = alchemistResult.data || [];

    const dataAnalyzed = {
      cbt_entries: cbtRecords.length,
      journal_entries: journalEntries.length,
      mood_entries: moodEntries.length,
      alchemist_sessions: alchemistSessions.length,
    };

    // If no data, return low risk
    if (Object.values(dataAnalyzed).every(v => v === 0)) {
      return new Response(
        JSON.stringify({
          risk_level: 'low',
          analysis_summary: 'Not enough data to perform analysis. Keep logging your thoughts and moods.',
          recommendations: ['Log your mood daily', 'Use the journal to express your thoughts'],
          data_analyzed: dataAnalyzed,
        } as RiskAnalysisResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare data summary for AI analysis
    const dataSummary = {
      cbt_patterns: cbtRecords.map(r => ({
        situation: r.situation?.substring(0, 200),
        thought: r.automatic_thought?.substring(0, 200),
        emotion: r.emotion,
        distortions: r.distortions,
      })),
      journal_excerpts: journalEntries.map(j => ({
        mood: j.mood,
        title: j.title,
        contentSnippet: j.content?.substring(0, 300),
      })),
      mood_trend: moodEntries.map(m => ({
        label: m.mood_label,
        intensity: m.intensity,
        note: m.note?.substring(0, 200),
        ai_insight: m.ai_insight?.substring(0, 200),
      })),
      alchemist_inputs: alchemistSessions.map(a => ({
        input: a.input_text?.substring(0, 300),
        reflection: a.reflection?.substring(0, 200),
      })),
    };

    // Call Lovable AI for analysis
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a mental health risk assessment AI. Analyze the user's recent psychological data and determine their mental health risk level.

IMPORTANT: You are NOT diagnosing. You are identifying patterns that may indicate the user could benefit from support.

Risk Levels:
- low: User appears to be managing well, positive patterns
- moderate: Some concerning patterns, could benefit from self-care
- high: Multiple concerning patterns, should be encouraged to seek support
- critical: Urgent patterns suggesting the user may be in crisis

Look for:
- Persistent negative emotions (sadness, anxiety, anger)
- Cognitive distortions (catastrophizing, all-or-nothing thinking)
- Declining mood trend over time
- Keywords suggesting hopelessness, worthlessness, or self-harm
- Frequency and intensity of negative entries

Be compassionate but accurate. When in doubt, err on the side of caution.`;

    const userPrompt = `Analyze this mental health data from the past 7 days:

${JSON.stringify(dataSummary, null, 2)}

Provide your assessment.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'assess_risk',
              description: 'Provide mental health risk assessment',
              parameters: {
                type: 'object',
                properties: {
                  risk_level: {
                    type: 'string',
                    enum: ['low', 'moderate', 'high', 'critical'],
                    description: 'The assessed risk level',
                  },
                  analysis_summary: {
                    type: 'string',
                    description: 'A compassionate, brief summary for the user (2-3 sentences)',
                  },
                  recommendations: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '3-5 specific, actionable recommendations',
                  },
                },
                required: ['risk_level', 'analysis_summary', 'recommendations'],
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'assess_risk' } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service quota exceeded.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData, null, 2));

    // Extract the assessment from tool call
    let assessment: { risk_level: string; analysis_summary: string; recommendations: string[] };
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      assessment = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback if no tool call
      assessment = {
        risk_level: 'low',
        analysis_summary: 'Analysis completed. Continue taking care of yourself.',
        recommendations: ['Keep logging your moods', 'Practice self-care activities'],
      };
    }

    const result: RiskAnalysisResult = {
      risk_level: assessment.risk_level as RiskAnalysisResult['risk_level'],
      analysis_summary: assessment.analysis_summary,
      recommendations: assessment.recommendations,
      data_analyzed: dataAnalyzed,
    };

    console.log(`Risk analysis complete: ${result.risk_level}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in detect-mental-health-risk:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
