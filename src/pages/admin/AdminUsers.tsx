import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Download,
  Mail,
  Calendar,
  Crown,
  Zap,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminLayout } from './AdminLayout';
import { getAdminRecentUsers } from '@/lib/admin-queries';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportUsersToCSV } from '@/lib/export-utils';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
    setCurrentPage(1); // Reset para primeira página ao filtrar
  }, [searchTerm, planFilter, statusFilter, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminRecentUsers(100);
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de plano
    if (planFilter !== 'all') {
      filtered = filtered.filter((user) => user.plan_type === planFilter);
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((user) => user.subscription_status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleExport = () => {
    exportUsersToCSV(filteredUsers);
    toast({
      title: 'Exportado com sucesso!',
      description: `${filteredUsers.length} usuários exportados para CSV.`,
    });
  };

  // Paginação
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const getPlanBadge = (plan: string) => {
    const badges = {
      free: { label: 'Free', class: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
      starter: { label: 'Starter', class: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      pro: { label: 'Pro', class: 'bg-green-500/20 text-green-400 border-green-500/30' },
    };
    return badges[plan as keyof typeof badges] || badges.free;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { label: 'Ativo', icon: CheckCircle, class: 'bg-green-500/20 text-green-400' },
      inactive: { label: 'Inativo', icon: XCircle, class: 'bg-gray-500/20 text-gray-400' },
      cancelled: { label: 'Cancelado', icon: XCircle, class: 'bg-red-500/20 text-red-400' },
      expired: { label: 'Expirado', icon: XCircle, class: 'bg-orange-500/20 text-orange-400' },
    };
    return badges[status as keyof typeof badges] || badges.inactive;
  };

  if (loading) {
    return (
      <AdminLayout title="Usuários">
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <Card key={i} className="bg-zinc-950 border-zinc-900 animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-zinc-900 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Usuários">
      <div className="space-y-6">
        {/* Header com Filtros */}
        <Card className="bg-zinc-950 border-zinc-900 shadow-lg shadow-purple-500/5">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por email ou nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-zinc-900 border-zinc-800 text-white focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Filtro de Plano */}
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full lg:w-[180px] bg-zinc-900 border-zinc-800">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Planos</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro de Status */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-[180px] bg-zinc-900 border-zinc-800">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              {/* Botão Exportar */}
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={filteredUsers.length === 0}
                className="border-zinc-800 hover:bg-zinc-900 hover:border-green-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>

            {/* Contador */}
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
              <Users className="h-4 w-4" />
              <span>
                {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''} encontrado
                {filteredUsers.length !== 1 ? 's' : ''}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        <div className="space-y-3">
          {paginatedUsers.map((user, index) => {
            const planBadge = getPlanBadge(user.plan_type);
            const statusBadge = getStatusBadge(user.subscription_status);
            const StatusIcon = statusBadge.icon;

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="bg-zinc-950 border-zinc-900 hover:border-purple-500/50 transition-all shadow-lg hover:shadow-purple-500/10">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Avatar e Info Principal */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-green-500 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-purple-500/30">
                          {(user.full_name || user.email).charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold truncate">
                            {user.full_name || 'Sem nome'}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {user.barbershop_name && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <Zap className="h-3 w-3" />
                              <span className="truncate">{user.barbershop_name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Badges e Info */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Plano */}
                        <Badge className={`${planBadge.class} border`}>
                          {user.plan_type === 'pro' && <Crown className="h-3 w-3 mr-1" />}
                          {planBadge.label}
                        </Badge>

                        {/* Status */}
                        <Badge className={statusBadge.class}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusBadge.label}
                        </Badge>

                        {/* Data de Cadastro */}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <Card className="bg-zinc-950 border-zinc-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredUsers.length)} de{' '}
                  {filteredUsers.length} usuários
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-zinc-800 hover:bg-zinc-900"
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={
                            currentPage === pageNum
                              ? 'bg-purple-600 hover:bg-purple-700'
                              : 'border-zinc-800 hover:bg-zinc-900'
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-zinc-800 hover:bg-zinc-900"
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <Card className="bg-zinc-950 border-zinc-900">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Nenhum usuário encontrado</h3>
              <p className="text-gray-400">
                Tente ajustar os filtros ou termo de busca
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
