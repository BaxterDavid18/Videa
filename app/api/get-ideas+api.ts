export async function GET(request: Request) {
  try {
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
        const backendUrl = `${baseUrl}/api/get-ideas`;
        console.log(`Trying backend URL: ${backendUrl}`);
        
        const response = await fetch(backendUrl, {
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });
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
          console.error(`Backend API error from ${baseUrl}:`, result);
          lastError = result;
        }
      } catch (error) {
        console.error(`Failed to connect to ${baseUrl}:`, error.message);
        lastError = error;
        continue; // Try next URL
      }
    }

    // If all URLs failed, return sample data as fallback
    console.log('All backend URLs failed, returning sample data');
    
    const sampleIdeas = [
      {
        title: "Smart Home Garden System",
        description: "An automated garden system that uses IoT sensors to monitor soil moisture, temperature, and light levels, automatically watering plants and adjusting conditions for optimal growth.",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        batchNumber: 1,
        script: "Welcome to the future of gardening! Our smart home garden system revolutionizes how you care for your plants. Using advanced IoT sensors, this system continuously monitors your garden's vital signs.",
        flag: "Complete"
      },
      {
        title: "AI-Powered Learning Assistant",
        description: "A personalized learning platform that adapts to individual learning styles and paces, providing customized content and exercises to help students master subjects more effectively.",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        batchNumber: 2,
        script: "Education is evolving, and our AI-powered learning assistant is at the forefront of this transformation. By analyzing your unique learning patterns and preferences, our system creates a truly personalized educational experience.",
        flag: "Incomplete"
      },
      {
        title: "Sustainable Packaging Solution",
        description: "Biodegradable packaging made from agricultural waste that dissolves harmlessly in water, reducing plastic pollution while maintaining product protection.",
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        batchNumber: 3,
        script: "",
        flag: "Incomplete"
      }
    ];
    
    return new Response(
      JSON.stringify({
        success: false,
        ideas: sampleIdeas,
        error: 'Backend API unavailable - showing sample data',
        details: lastError instanceof Error ? lastError.message : 'Connection failed',
        triedUrls: possibleUrls
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in get-ideas API route:', error);
    
    // Return empty array as ultimate fallback
    return new Response(
      JSON.stringify({
        success: false,
        ideas: [],
        error: 'Failed to fetch ideas',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}