import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userName } = await req.json();

    const systemPrompt = `You are ChatBuddy, a compassionate and supportive mental health companion for MINED - a mental wellness platform for students and young adults in India. 

Your personality:
- Warm, friendly, and approachable like a caring friend
- Use simple, relatable language (occasionally include Hindi phrases like "Kya baat hai!", "Sab theek ho jayega", "Tu kar sakta/sakti hai!")
- Be empathetic and non-judgmental
- Encourage without being preachy

Your capabilities:
- Listen actively and validate feelings
- Provide coping strategies for stress, anxiety, exam pressure, relationship issues
- Suggest breathing exercises, grounding techniques, and mindfulness tips
- Recommend features of MINED (Mood Calendar, Journal, CBT Tools, Meditation, Time Capsule)
- Know when to suggest professional help (counsellors on the platform)

Important guidelines:
- Never diagnose or provide medical advice
- If someone expresses thoughts of self-harm or suicide, gently encourage them to reach out to a professional or helpline (iCall: 9152987821, Vandrevala Foundation: 1860-2662-345)
- Keep responses concise and conversational (2-4 sentences usually)
- Use emojis sparingly to add warmth 💚
- Address the user by name when provided

${userName ? `The user's name is ${userName}. Use it occasionally to make the conversation personal.` : ''}

Start conversations warmly and ask how they're feeling today.`;

    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API error:', error);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || "I'm here for you. How can I help today?";

    return new Response(JSON.stringify({ message: assistantMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ChatBuddy error:', error);
    return new Response(
      JSON.stringify({ 
        message: "I'm having a moment 😅 Please try again, I'm here to chat!" 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
