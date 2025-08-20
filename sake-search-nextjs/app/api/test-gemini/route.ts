import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'API key not found',
        hasKey: false 
      }, { status: 500 });
    }

    // Gemini APIにシンプルなテストリクエストを送信
    const testPrompt = {
      contents: [{
        parts: [{
          text: "Hello, please respond with 'OK' if you can receive this message."
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 100,
      }
    };

    console.log('Testing Gemini API with key starting with:', apiKey.substring(0, 8));
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPrompt)
      }
    );

    const responseText = await response.text();
    console.log('Gemini API response status:', response.status);
    console.log('Gemini API response:', responseText.substring(0, 200));

    if (!response.ok) {
      return NextResponse.json({
        error: 'Gemini API error',
        status: response.status,
        message: responseText.substring(0, 500),
        keyPrefix: apiKey.substring(0, 8) + '...',
        suggestion: response.status === 400 ? 'Check if the API key is valid and has the correct permissions' : 
                   response.status === 403 ? 'API key may not have Gemini API enabled' :
                   response.status === 429 ? 'Rate limit exceeded' : 'Unknown error'
      }, { status: response.status });
    }

    const data = JSON.parse(responseText);
    
    return NextResponse.json({
      success: true,
      geminiResponse: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text',
      keyWorking: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test Gemini error:', error);
    return NextResponse.json({
      error: 'Failed to test Gemini API',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}