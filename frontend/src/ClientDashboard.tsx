import React, { useEffect, useState } from 'react';

interface ClientDashboardProps {
  userId: number;
}

function ClientDashboard({ userId }: ClientDashboardProps) {
  const [orderNotifications, setOrderNotifications] = useState<{order_id: number, status: string}[]>([]);

  useEffect(() => {
    if (!userId) return;
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/orders/${userId}/`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setOrderNotifications((prev) => [data, ...prev]);
    };
    ws.onclose = () => {
      // Optionally handle reconnect
    };
    return () => ws.close();
  }, [userId]);

  return (
    <div style={{marginTop: 32}}>
      <h2>Client Dashboard</h2>
      <p>Here you can browse products, manage your cart, and place orders.</p>
      {orderNotifications.length > 0 && (
        <div style={{background: '#e0ffe0', padding: 10, marginBottom: 16}}>
          <b>Order Updates:</b>
          <ul>
            {orderNotifications.map((n, idx) => (
              <li key={idx}>Order #{n.order_id} status changed to <b>{n.status}</b></li>
            ))}
          </ul>
        </div>
      )}
      {/* Product browsing, cart, and order UI will go here */}
    </div>
  );
}

export default ClientDashboard; 