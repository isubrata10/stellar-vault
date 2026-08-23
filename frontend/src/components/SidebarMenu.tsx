'use client';
import React from 'react';
import { BarChart2, Bell, Home, Search, Settings } from 'lucide-react';
import Link from 'next/link';

const SidebarMenu = () => {
  const handleFutureFeature = (feature: string) => {
    alert(`${feature} will be available in V2 of the decentralized protocol!`);
  };

  return (
    <div
      className="sidebar-wrapper"
      style={{
        background: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=764&auto=format&fit=crop") center / cover no-repeat',
      }}
    >
      <div className="liquid-glass-card">
        <nav className="sidebar-nav">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button className="sidebar-btn active" aria-current="page">
              <Home size={20} />
              <span>Dashboard</span>
            </button>
          </Link>

          <button className="sidebar-btn" onClick={() => handleFutureFeature("Global Search")}>
            <Search size={20} />
            <span>Search</span>
          </button>

          <button className="sidebar-btn" onClick={() => handleFutureFeature("Treasury Analytics")}>
            <BarChart2 size={20} />
            <span>Sales Analytics</span>
          </button>

          <button className="sidebar-btn" onClick={() => handleFutureFeature("Real-time Push Notifications")}>
            <Bell size={20} />
            <span>Notifications</span>
          </button>

          <button className="sidebar-btn" onClick={() => handleFutureFeature("DAO Settings")}>
            <Settings size={20} />
            <span>Account Settings</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default SidebarMenu;
