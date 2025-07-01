export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title || !description) {
      return new Response(
        JSON.stringify({ error: 'Title and description are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Use environment variable for backend URL with fallback to localhost
    const backendUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/save-idea`;
    
    console.log('Calling backend API to save idea...');
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, description }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('Successfully saved idea via backend API');
      return new Response(
        JSON.stringify(result),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      console.error('Backend API error:', result);
      return new Response(
        JSON.stringify(result),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error calling backend API:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to save idea - backend API unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}