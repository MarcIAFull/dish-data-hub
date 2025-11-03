import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationsLayoutProps {
  sidebar: React.ReactNode;
  chatWindow: React.ReactNode;
}

export function ConversationsLayout({ sidebar, chatWindow }: ConversationsLayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar colapsável */}
      <div 
        className={cn(
          "flex-shrink-0 transition-all duration-300 ease-in-out border-r border-border bg-card",
          sidebarExpanded ? "w-[400px]" : "w-[280px]"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Header da sidebar */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">Conversas</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
            >
              {sidebarExpanded ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Conteúdo da sidebar */}
          <div className="flex-1 overflow-hidden">
            {sidebar}
          </div>
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {chatWindow}
      </div>
    </div>
  );
}
