// Utilitários para exportação de dados

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    console.error('Nenhum dado para exportar');
    return;
  }

  // Obter cabeçalhos das colunas
  const headers = Object.keys(data[0]);
  
  // Criar linhas CSV
  const csvRows = [
    headers.join(','), // Cabeçalho
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escapar valores que contêm vírgulas ou aspas
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ];

  // Criar blob e fazer download
  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportUsersToCSV(users: any[]) {
  const formattedData = users.map(user => ({
    'Nome': user.full_name || 'Sem nome',
    'Email': user.email,
    'Plano': user.plan_type,
    'Status': user.subscription_status,
    'Barbearia': user.barbershop_name || 'Sem barbearia',
    'Data de Cadastro': new Date(user.created_at).toLocaleDateString('pt-BR'),
  }));

  exportToCSV(formattedData, 'usuarios_zapcorte');
}

export function exportTransactionsToCSV(transactions: any[]) {
  const formattedData = transactions.map(transaction => ({
    'Nome': transaction.user_name || 'Sem nome',
    'Email': transaction.user_email,
    'Plano': transaction.plan_type,
    'Valor': `R$ ${transaction.amount?.toFixed(2)}`,
    'Status': transaction.status,
    'Data': new Date(transaction.created_at).toLocaleDateString('pt-BR'),
  }));

  exportToCSV(formattedData, 'transacoes_zapcorte');
}

export function exportBarbershopsToCSV(barbershops: any[]) {
  const formattedData = barbershops.map(barbershop => ({
    'Nome': barbershop.name,
    'Slug': barbershop.slug,
    'Agendamentos': barbershop.appointments_this_month,
    'Plano': barbershop.plan_type,
    'Ativo': barbershop.is_active ? 'Sim' : 'Não',
  }));

  exportToCSV(formattedData, 'barbearias_zapcorte');
}
