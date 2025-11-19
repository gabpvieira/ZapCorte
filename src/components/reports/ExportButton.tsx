import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { BarberMetrics } from '@/lib/reports-queries';

interface ExportButtonProps {
  metrics: BarberMetrics[];
  period: string;
  barbershopName: string;
}

export function ExportButton({ metrics, period, barbershopName }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    try {
      setIsExporting(true);

      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.text(`Relatório de Performance - ${barbershopName}`, 14, 20);
      
      doc.setFontSize(12);
      doc.text(`Período: ${period}`, 14, 30);
      doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, 37);

      // Tabela de métricas
      const tableData = metrics.map((m, index) => [
        index + 1,
        m.barberName,
        m.totalAppointments,
        m.completedAppointments,
        m.cancelledAppointments,
        `R$ ${m.totalRevenue.toFixed(2)}`,
        `R$ ${m.avgTicket.toFixed(2)}`,
        `${m.completionRate.toFixed(1)}%`,
      ]);

      autoTable(doc, {
        startY: 45,
        head: [[
          '#',
          'Barbeiro',
          'Total',
          'Concluídos',
          'Cancelados',
          'Faturamento',
          'Ticket Médio',
          'Taxa Conclusão'
        ]],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 },
      });

      // Totais
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Totais Gerais:', 14, finalY);
      
      const totals = {
        appointments: metrics.reduce((sum, m) => sum + m.totalAppointments, 0),
        revenue: metrics.reduce((sum, m) => sum + m.totalRevenue, 0),
        avgTicket: metrics.reduce((sum, m) => sum + m.avgTicket, 0) / metrics.length,
      };

      doc.setFontSize(10);
      doc.text(`Total de Agendamentos: ${totals.appointments}`, 14, finalY + 7);
      doc.text(`Faturamento Total: R$ ${totals.revenue.toFixed(2)}`, 14, finalY + 14);
      doc.text(`Ticket Médio Geral: R$ ${totals.avgTicket.toFixed(2)}`, 14, finalY + 21);

      // Salvar
      doc.save(`relatorio-${barbershopName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`);
      
      toast.success('Relatório PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar relatório PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    try {
      setIsExporting(true);

      // Preparar dados
      const data = metrics.map((m, index) => ({
        'Posição': index + 1,
        'Barbeiro': m.barberName,
        'Total Agendamentos': m.totalAppointments,
        'Concluídos': m.completedAppointments,
        'Cancelados': m.cancelledAppointments,
        'Faturamento': m.totalRevenue,
        'Ticket Médio': m.avgTicket,
        'Taxa de Conclusão (%)': m.completionRate,
      }));

      // Adicionar linha de totais
      const totals = {
        'Posição': '',
        'Barbeiro': 'TOTAL',
        'Total Agendamentos': metrics.reduce((sum, m) => sum + m.totalAppointments, 0),
        'Concluídos': metrics.reduce((sum, m) => sum + m.completedAppointments, 0),
        'Cancelados': metrics.reduce((sum, m) => sum + m.cancelledAppointments, 0),
        'Faturamento': metrics.reduce((sum, m) => sum + m.totalRevenue, 0),
        'Ticket Médio': metrics.reduce((sum, m) => sum + m.avgTicket, 0) / metrics.length,
        'Taxa de Conclusão (%)': metrics.reduce((sum, m) => sum + m.completionRate, 0) / metrics.length,
      };
      data.push(totals);

      // Criar workbook
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório');

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 10 }, // Posição
        { wch: 25 }, // Barbeiro
        { wch: 18 }, // Total Agendamentos
        { wch: 12 }, // Concluídos
        { wch: 12 }, // Cancelados
        { wch: 15 }, // Faturamento
        { wch: 15 }, // Ticket Médio
        { wch: 20 }, // Taxa de Conclusão
      ];
      ws['!cols'] = colWidths;

      // Salvar
      XLSX.writeFile(wb, `relatorio-${barbershopName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.xlsx`);
      
      toast.success('Relatório Excel exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar relatório Excel');
    } finally {
      setIsExporting(false);
    }
  };

  if (metrics.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Exportar como PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar como Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
