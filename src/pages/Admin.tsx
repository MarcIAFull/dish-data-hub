import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Building2, Settings, BarChart3 } from 'lucide-react';
import { UsersManagement } from '@/components/admin/UsersManagement';
import { RestaurantsManagement } from '@/components/admin/RestaurantsManagement';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { GlobalAnalytics } from '@/components/admin/GlobalAnalytics';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Painel de Administração</h1>
        </div>
        <p className="text-muted-foreground">
          Gerencie usuários, restaurantes e configurações do sistema
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="restaurants" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Restaurantes</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="restaurants" className="space-y-4">
          <RestaurantsManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <GlobalAnalytics />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
