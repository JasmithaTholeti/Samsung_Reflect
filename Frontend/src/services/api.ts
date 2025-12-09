// This function talks to your Python AI on port 8000
export const generateText = async (currentText: string) => {
  try {
    const response = await fetch('http://localhost:8000/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: currentText }),
    });

    if (!response.ok) throw new Error('Generation failed');
    
    const data = await response.json();
    return data.generated_text; // Returns the completed sentence
  } catch (error) {
    console.error("AI Auto-complete error:", error);
    return null;
  }
};