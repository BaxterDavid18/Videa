export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { batchNumber, newFlag } = body;

    console.log(`Frontend API: Received request to update batchNumber ${batchNumber} to ${newFlag}`);

    if (!batchNumber || !newFlag) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Batch number and new flag are required' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!['Complete', 'Incomplete'].includes(newFlag)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Flag must be either "Complete" or "Incomplete"' 
        }),
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

    let lastError: string = '';
    
    for (const baseUrl of possibleUrls) {
      try {
        const backendUrl = `${baseUrl}/api/update-idea-flag`;
        console.log(`Frontend API: Trying backend URL: ${backendUrl}`);
        
        const response = await fetch(backendUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ batchNumber, newFlag }),
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        const result = await response.json();

        if (response.ok) {
          console.log('Frontend API: Successfully updated flag via backend API');
          return new Response(
            JSON.stringify(result),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } else {
          console.error(`Frontend API: Backend API error from ${baseUrl}:`, result);
          lastError = typeof result === 'object' ? JSON.stringify(result) : String(result);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Frontend API: Failed to connect to ${baseUrl}:`, errorMessage);
        lastError = errorMessage;
        continue; // Try next URL
      }
    }

    // If all URLs failed, return error
    console.error('Frontend API: All backend URLs failed, last error:', lastError);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to update flag - all backend URLs unreachable',
        details: lastError,
        triedUrls: possibleUrls
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Frontend API: Error in update-idea-flag API route:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        details: errorMessage
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}