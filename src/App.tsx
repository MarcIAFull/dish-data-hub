import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import RestaurantForm from "./pages/RestaurantForm";
import RestaurantPublic from "./pages/RestaurantPublic";
import RestaurantJSON from "./pages/RestaurantJSON";
import RestaurantManagement from "./pages/RestaurantManagement";
import Conversations from "./pages/Conversations";
import Orders from "./pages/Orders";
import Analytics from "./pages/Analytics";

import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import WebhookDebug from "./pages/WebhookDebug";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <AppSidebar />
              <div className="flex-1 flex flex-col">
                <header className="h-14 flex items-center border-b bg-background px-4">
                  <SidebarTrigger />
                  <div className="ml-4">
                    <h1 className="text-lg font-semibold">Convergy AI</h1>
                  </div>
                </header>
                <BreadcrumbNav />
                <main className="flex-1">

                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/restaurant/new" element={
                      <ProtectedRoute>
                        <RestaurantForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/restaurant/:id" element={
                      <ProtectedRoute>
                        <RestaurantForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/restaurant/manage" element={
                      <ProtectedRoute>
                        <RestaurantManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/conversations" element={
                      <ProtectedRoute>
                        <Conversations />
                      </ProtectedRoute>
                    } />
                    <Route path="/orders" element={
                      <ProtectedRoute>
                        <Orders />
                      </ProtectedRoute>
                    } />
                    <Route path="/analytics" element={
                      <ProtectedRoute>
                        <Analytics />
                      </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                      <ProtectedAdminRoute>
                        <Admin />
                      </ProtectedAdminRoute>
                    } />
                    <Route path="/webhook-debug" element={
                      <ProtectedAdminRoute>
                        <WebhookDebug />
                      </ProtectedAdminRoute>
                    } />
                    <Route path="/r/:slug" element={<RestaurantPublic />} />
                    <Route path="/r/:slug.json" element={<RestaurantJSON />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
