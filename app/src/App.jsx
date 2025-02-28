import { useEffect, useState } from 'react';
import { askAI } from './langchain';

function App() {
  const [message, setMessage] = useState("");
  const [question, setQuestion] = useState("Hello! What is the capital of France?");
  const [loading, setLoading] = useState(false);

  const handleAskQuestion = async () => {
    setLoading(true);
    try {
      const response = await askAI(question);
      setMessage(response);
    } catch (error) {
      console.error("Error asking AI:", error);
      setMessage("Error occurred while getting response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>AI Chat</h1>
      <div>
        <textarea 
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          cols={50}
        />
      </div>
      <button onClick={handleAskQuestion} disabled={loading}>
        {loading ? "Thinking..." : "Ask AI"}
      </button>
      <div>
        <h2>Response:</h2>
        <p>{message || "Ask a question to get started"}</p>
      </div>
    </div>
  );
}

export default App;