import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRestaurantMenu } from '@/hooks/useRestaurantMenu';

export default function RestaurantJSON() {
  const { slug } = useParams();
  const { getFormattedMenu, loading } = useRestaurantMenu(slug?.replace('.json', '') || '');

  useEffect(() => {
    const menu = getFormattedMenu();
    if (menu && !loading) {
      // Set content type and send JSON response
      document.body.innerHTML = `<pre>${JSON.stringify(menu, null, 2)}</pre>`;
      document.head.innerHTML += '<meta http-equiv="Content-Type" content="application/json">';
    }
  }, [getFormattedMenu, loading]);

  if (loading) {
    return (
      <div style={{ 
        fontFamily: 'monospace', 
        padding: '20px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh'
      }}>
        <div>Loading menu data...</div>
      </div>
    );
  }

  const menu = getFormattedMenu();
  
  if (!menu) {
    return (
      <div style={{ 
        fontFamily: 'monospace', 
        padding: '20px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh'
      }}>
        <div>{JSON.stringify({ "error": "Restaurant not found" }, null, 2)}</div>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'monospace', 
      padding: '20px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <pre style={{ 
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        margin: 0
      }}>
        {JSON.stringify(menu, null, 2)}
      </pre>
    </div>
  );
}