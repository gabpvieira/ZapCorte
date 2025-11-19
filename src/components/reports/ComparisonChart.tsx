import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { BarberMetrics } from '@/lib/reports-queries';

interface ComparisonChartProps {
  metrics: BarberMetrics[];
  timelineData: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

export function ComparisonChart({ metrics, timelineData }: ComparisonChartProps) {
  // Dados para gráfico de barras (comparação de agendamentos)
  const appointmentsData = metrics.map(m => ({
    name: m.barberName.split(' ')[0], // Apenas primeiro nome
    agendamentos: m.totalAppointments,
    concluídos: m.completedAppointments,
    cancelados: m.cancelledAppointments,
  }));

  // Dados para gráfico de barras (faturamento)
  const revenueData = metrics.map(m => ({
    name: m.barberName.split(' ')[0],
    faturamento: m.totalRevenue,
  }));

  // Dados para gráfico de pizza (distribuição de agendamentos)
  const pieData = metrics.map(m => ({
    name: m.barberName.split(' ')[0],
    value: m.totalAppointments,
  }));

  return (
    <div className="space-y-6">
      {/* Gráfico de Barras - Agendamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Agendamentos</CardTitle>
          <CardDescription>
            Total, concluídos e cancelados por barbeiro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={appointmentsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="agendamentos" fill="#8884d8" name="Total" />
              <Bar dataKey="concluídos" fill="#82ca9d" name="Concluídos" />
              <Bar dataKey="cancelados" fill="#ff8042" name="Cancelados" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Barras - Faturamento */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Faturamento</CardTitle>
          <CardDescription>
            Receita gerada por cada barbeiro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
              />
              <Legend />
              <Bar dataKey="faturamento" fill="#0088FE" name="Faturamento (R$)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Linha - Evolução Temporal */}
      {timelineData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução Temporal</CardTitle>
            <CardDescription>
              Agendamentos por dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {metrics.map((metric, index) => (
                  <Line
                    key={metric.barberId}
                    type="monotone"
                    dataKey={metric.barberName}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Pizza - Distribuição */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Agendamentos</CardTitle>
          <CardDescription>
            Proporção de agendamentos por barbeiro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
