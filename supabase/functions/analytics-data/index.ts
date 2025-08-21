import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { restaurantId, timeframe = '7d' } = await req.json();

    if (!restaurantId) {
      return new Response(JSON.stringify({ error: 'Restaurant ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching analytics data for restaurant:', restaurantId, 'timeframe:', timeframe);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Fetch conversations metrics
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        id,
        status,
        created_at,
        last_message_at,
        customer_phone,
        agents!inner(restaurant_id)
      `)
      .eq('agents.restaurant_id', restaurantId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
      throw conversationsError;
    }

    // Fetch orders metrics
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, total, created_at, conversation_id')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw ordersError;
    }

    // Fetch messages for response time analysis
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        sender_type,
        created_at,
        conversation_id,
        conversations!inner(
          agents!inner(restaurant_id)
        )
      `)
      .eq('conversations.agents.restaurant_id', restaurantId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw messagesError;
    }

    // Calculate metrics
    const totalConversations = conversations?.length || 0;
    const totalOrders = orders?.length || 0;
    const conversionRate = totalConversations > 0 ? ((totalOrders / totalConversations) * 100) : 0;
    const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Status distribution
    const conversationsByStatus = conversations?.reduce((acc: any, conv) => {
      acc[conv.status] = (acc[conv.status] || 0) + 1;
      return acc;
    }, {}) || {};

    const ordersByStatus = orders?.reduce((acc: any, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Response time analysis
    const responseTimeData = [];
    if (messages && messages.length > 0) {
      const conversationMessages = messages.reduce((acc: any, msg) => {
        if (!acc[msg.conversation_id]) acc[msg.conversation_id] = [];
        acc[msg.conversation_id].push(msg);
        return acc;
      }, {});

      Object.values(conversationMessages).forEach((convMsgs: any) => {
        for (let i = 0; i < convMsgs.length - 1; i++) {
          const current = convMsgs[i];
          const next = convMsgs[i + 1];
          
          if (current.sender_type === 'customer' && next.sender_type === 'agent') {
            const responseTime = new Date(next.created_at).getTime() - new Date(current.created_at).getTime();
            responseTimeData.push(responseTime / 1000 / 60); // Convert to minutes
          }
        }
      });
    }

    const avgResponseTime = responseTimeData.length > 0 
      ? responseTimeData.reduce((sum, time) => sum + time, 0) / responseTimeData.length 
      : 0;

    // Hourly activity patterns
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
      const hourMessages = messages?.filter(msg => 
        new Date(msg.created_at).getHours() === hour
      ).length || 0;
      return { hour, messages: hourMessages };
    });

    const analyticsData = {
      overview: {
        totalConversations,
        totalOrders,
        conversionRate: Number(conversionRate.toFixed(2)),
        totalRevenue: Number(totalRevenue.toFixed(2)),
        avgOrderValue: Number(avgOrderValue.toFixed(2)),
        avgResponseTime: Number(avgResponseTime.toFixed(2))
      },
      distributions: {
        conversationsByStatus,
        ordersByStatus
      },
      activity: {
        hourlyActivity
      },
      timeframe
    };

    console.log('Analytics data calculated:', analyticsData);

    return new Response(JSON.stringify(analyticsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analytics-data function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});