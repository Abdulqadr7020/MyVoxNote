export const formatSpeechWithAI = async (transcript, mode = 'default', provider = 'groq', model = null) => {
  try {
    const response = await fetch('/api/format', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transcript, mode, provider, model })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || response.statusText);
    }
    
    return await response.json();
  } catch (error) {
    console.error("AI Formatting Error: ", error);
    throw new Error("Failed to process instructions. Error: " + error.message);
  }
};
