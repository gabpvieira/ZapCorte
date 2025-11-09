// Debug temporário para diagnosticar tela branca

import React, { useEffect } from 'react';

function App() {
  useEffect(() => {
    console.log('%cApp.tsx renderizou ✅', 'color: green; font-weight: bold');

    import('./lib/supabase')
      .then(({ supabase }) => {
        supabase.auth.getUser().then(({ data, error }) => {
          if (error) {
            console.error('Erro ao obter usuário:', error.message);
          } else {
            console.log('Usuário autenticado:', data.user);
          }
        });
      })
      .catch(err => {
        console.error('Erro ao importar supabase:', err);
      });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Debug App</h1>
      <p>Se você está vendo isso, o React está funcionando.</p>
    </div>
  );
}

export default App;
