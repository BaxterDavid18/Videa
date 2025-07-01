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

    // Try multiple backend URLs for different environments
    const possibleUrls = [
      process.env.EXPO_PUBLIC_BACKEND_URL,
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://0.0.0.0:3001'
    ].filter(Boolean);

    let lastError;
    
    for (const baseUrl of possibleUrls) {
      try {
        const backendUrl = `${baseUrl}/api/save-idea`;
        console.log(`Trying backend URL: ${backendUrl}`);
        
        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, description }),
          signal: AbortSignal.timeout(10000), // 10 second timeout
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
          console.error(`Backend API error from ${backendUrl}:`, result);
          lastError = result;
        }
      } catch (error) {
        console.error(`Failed to connect to ${baseUrl}:`, error.message);
        lastError = error;
        continue; // Try next URL
      }
    }

    // If all URLs failed, return error
    console.error('All backend URLs failed, last error:', lastError);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to save idea - all backend URLs unreachable',
        details: lastError instanceof Error ? lastError.message : 'Connection failed',
        triedUrls: possibleUrls
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in save-idea API route:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}