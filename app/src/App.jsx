import { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Faz requisição GET para o backend FastAPI
    fetch("http://localhost:8000/")  
      .then(response => response.json())
      .then(data => {
        // Atualiza estado com a mensagem recebida
        setMessage(data.message);
      })
      .catch(err => console.error("Erro ao buscar mensagem:", err));
  }, []);

  return (
    <div>
      <h1>{message || "Carregando..."}</h1>
    </div>
  );
}

export default App;
