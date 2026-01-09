import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_TEXT_LENGTH = 5000;
const VALID_TYPES = ['mood-analysis', 'emotion-alchemist'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text, type } = await req.json();

    // Input validation
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Text cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (trimmedText.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Text too long. Maximum ${MAX_TEXT_LENGTH} characters allowed.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!type || !VALID_TYPES.includes(type)) {
      return new Response(
        JSON.stringify({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    let systemPrompt = "";
    let tools = undefined;
    let toolChoice = undefined;

    if (type === "mood-analysis") {
      systemPrompt = `You are a compassionate mental health AI assistant. Analyze the user's mood text and provide:
1. The primary emotion detected (e.g., anxious, calm, overwhelmed, hopeful, sad, angry, happy)
2. The intensity level (low, medium, or high)
3. A brief, supportive insight (2-3 lines max) that acknowledges their feelings and offers gentle encouragement.

Be warm, empathetic, and non-judgmental. Focus on validation and support.`;

      tools = [
        {
          type: "function",
          function: {
            name: "analyze_mood",
            description: "Analyze the user's mood and provide supportive insight",
            parameters: {
              type: "object",
              properties: {
                emotion: { 
                  type: "string",
                  description: "The primary emotion detected (e.g., anxious, calm, overwhelmed, hopeful)"
                },
                intensity: { 
                  type: "string", 
                  enum: ["low", "medium", "high"],
                  description: "The intensity level of the emotion"
                },
                insight: { 
                  type: "string",
                  description: "A brief supportive insight (2-3 lines)"
                }
              },
              required: ["emotion", "intensity", "insight"],
              additionalProperties: false
            }
          }
        }
      ];
      toolChoice = { type: "function", function: { name: "analyze_mood" } };
    } else if (type === "emotion-alchemist") {
      systemPrompt = `You are the Emotion Alchemist, a wise and compassionate AI guide specializing in emotional transformation and therapeutic support. Your role is to help users process their emotions and find clarity.

When a user shares their feelings or situation, provide:
1. A thoughtful reflection that validates their experience
2. A reframe that offers a new, empowering perspective
3. A practical suggestion they can try right away

Be warm, understanding, and non-judgmental. Use gentle, supportive language. Focus on emotional validation while offering hope and practical guidance.`;

      tools = [
        {
          type: "function",
          function: {
            name: "transform_emotion",
            description: "Transform the user's emotion with therapeutic guidance",
            parameters: {
              type: "object",
              properties: {
                reflection: { 
                  type: "string",
                  description: "A thoughtful reflection validating the user's experience (2-3 sentences)"
                },
                reframe: { 
                  type: "string",
                  description: "A new perspective that empowers the user (2-3 sentences)"
                },
                suggestion: { 
                  type: "string",
                  description: "A practical action the user can take right now (2-3 sentences)"
                }
              },
              required: ["reflection", "reframe", "suggestion"],
              additionalProperties: false
            }
          }
        }
      ];
      toolChoice = { type: "function", function: { name: "transform_emotion" } };
    }

    console.log(`Processing ${type} request for user: ${user.id}, text length: ${trimmedText.length}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: trimmedText }
        ],
        tools,
        tool_choice: toolChoice
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received successfully");

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback to content if no tool call
    const content = data.choices?.[0]?.message?.content;
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in analyze-emotion function:", error);
    const message = error instanceof Error ? error.message : "An error occurred";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
