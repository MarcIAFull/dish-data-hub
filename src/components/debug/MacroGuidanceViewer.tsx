// 🎯 Macro Guidance Viewer - FASE 2
// Visualiza as orientações dinâmicas dadas aos agentes

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Target, AlertCircle } from "lucide-react";

interface MacroGuidanceViewerProps {
  state: string;
  guidance?: string;
}

export function MacroGuidanceViewer({ state, guidance }: MacroGuidanceViewerProps) {
  if (!guidance) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <p>Nenhuma orientação macro disponível para este log</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Parse sections from guidance text
  const sections = parseGuidanceSections(guidance);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Orientação Macro para Estado: 
          <Badge variant="outline" className="ml-2">{state}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {sections.map((section, idx) => (
              <div key={idx} className="space-y-2">
                {section.title && (
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    {getIconForSection(section.type)}
                    {section.title}
                  </h3>
                )}
                
                {section.items.length > 0 ? (
                  <ul className="space-y-1 ml-6">
                    {section.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className={getSectionColor(section.type)}>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground ml-6 whitespace-pre-wrap">
                    {section.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface GuidanceSection {
  type: 'objective' | 'can' | 'cannot' | 'context' | 'next' | 'other';
  title?: string;
  items: string[];
  content?: string;
}

function parseGuidanceSections(guidance: string): GuidanceSection[] {
  const sections: GuidanceSection[] = [];
  const lines = guidance.split('\n').filter(line => line.trim());
  
  let currentSection: GuidanceSection | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detectar títulos de seções
    if (trimmed.includes('OBJETIVO DESTA FASE')) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        type: 'objective',
        title: trimmed.replace(/[=🎯]/g, '').trim(),
        items: []
      };
    } else if (trimmed.includes('✅ PODE FAZER')) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        type: 'can',
        title: '✅ Pode Fazer',
        items: []
      };
    } else if (trimmed.includes('❌ NÃO PODE')) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        type: 'cannot',
        title: '❌ Não Pode',
        items: []
      };
    } else if (trimmed.includes('📊 CONTEXTO') || trimmed.includes('📍') || trimmed.includes('💳') || trimmed.includes('🚚')) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        type: 'context',
        title: trimmed.split(':')[0].trim(),
        items: [],
        content: ''
      };
    } else if (trimmed.includes('💡 PRÓXIMO PASSO')) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        type: 'next',
        title: '💡 Próximo Passo Esperado',
        items: [],
        content: ''
      };
    } else if (trimmed.startsWith('-') && currentSection?.type !== 'context') {
      // Item de lista
      currentSection?.items.push(trimmed.substring(1).trim());
    } else if (trimmed && currentSection) {
      // Conteúdo genérico
      if (currentSection.type === 'context' || currentSection.type === 'next') {
        currentSection.content = (currentSection.content || '') + trimmed + '\n';
      }
    }
  }
  
  if (currentSection) sections.push(currentSection);
  
  return sections;
}

function getIconForSection(type: string) {
  switch (type) {
    case 'objective':
      return <span className="text-blue-500">🎯</span>;
    case 'can':
      return <span className="text-green-500">✅</span>;
    case 'cannot':
      return <span className="text-red-500">❌</span>;
    case 'context':
      return <span className="text-purple-500">📊</span>;
    case 'next':
      return <span className="text-yellow-500">💡</span>;
    default:
      return null;
  }
}

function getSectionColor(type: string): string {
  switch (type) {
    case 'can':
      return 'text-green-500';
    case 'cannot':
      return 'text-red-500';
    case 'context':
      return 'text-purple-500';
    case 'next':
      return 'text-yellow-500';
    default:
      return 'text-blue-500';
  }
}
