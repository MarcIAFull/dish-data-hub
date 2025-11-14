import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface MetadataDiffProps {
  before: any;
  after: any;
}

export function MetadataDiff({ before, after }: MetadataDiffProps) {
  if (!before && !after) {
    return <p className="text-sm text-muted-foreground">Sem mudanças no metadata</p>;
  }

  const getChangedKeys = () => {
    const beforeKeys = Object.keys(before || {});
    const afterKeys = Object.keys(after || {});
    const allKeys = new Set([...beforeKeys, ...afterKeys]);
    
    const changes: Array<{ key: string; before: any; after: any; changed: boolean }> = [];
    
    allKeys.forEach(key => {
      const beforeVal = before?.[key];
      const afterVal = after?.[key];
      const changed = JSON.stringify(beforeVal) !== JSON.stringify(afterVal);
      
      if (changed) {
        changes.push({ key, before: beforeVal, after: afterVal, changed });
      }
    });
    
    return changes;
  };

  const changes = getChangedKeys();

  if (changes.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem mudanças no metadata</p>;
  }

  return (
    <div className="space-y-2">
      {changes.map(({ key, before: beforeVal, after: afterVal }) => (
        <Card key={key}>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium">{key}</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex items-start gap-2 text-xs">
              <div className="flex-1">
                <p className="text-muted-foreground mb-1">Antes:</p>
                <pre className="bg-muted p-2 rounded overflow-auto max-h-20">
                  {JSON.stringify(beforeVal, null, 2)}
                </pre>
              </div>
              <ArrowRight className="h-4 w-4 mt-6 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="text-muted-foreground mb-1">Depois:</p>
                <pre className="bg-muted p-2 rounded overflow-auto max-h-20">
                  {JSON.stringify(afterVal, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
