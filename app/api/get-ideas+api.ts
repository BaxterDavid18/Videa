export async function GET(request: Request) {
  try {
    // Use environment variable for backend URL with fallback to localhost
    const backendUrl = `${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/get-ideas`;
    
    console.log('Calling backend API to fetch ideas...');
    
    const response = await fetch(backendUrl);
    const result = await response.json();

    if (response.ok) {
      console.log(`Successfully fetched ${result.ideas?.length || 0} ideas via backend API`);
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
    
    // Return sample data as fallback if backend is unavailable
    const sampleIdeas = [
      {
        title: "Smart Home Garden System",
        description: "An automated garden system that uses IoT sensors to monitor soil moisture, temperature, and light levels, automatically watering plants and adjusting conditions for optimal growth.",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        batchNumber: 1
      },
      {
        title: "AI-Powered Learning Assistant",
        description: "A personalized learning platform that adapts to individual learning styles and paces, providing customized content and exercises to help students master subjects more effectively.",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        batchNumber: 2
      },
      {
        title: "Sustainable Packaging Solution",
        description: "Biodegradable packaging made from agricultural waste that dissolves harmlessly in water, reducing plastic pollution while maintaining product protection.",
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        batchNumber: 3
      }
    ];
    
    return new Response(
      JSON.stringify({
        success: false,
        ideas: sampleIdeas,
        error: 'Backend API unavailable - showing sample data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}