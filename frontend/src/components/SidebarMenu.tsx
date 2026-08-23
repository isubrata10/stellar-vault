import React from 'react';
import { BarChart2, Bell, Home, Search, Settings } from 'lucide-react';
import Link from 'next/link';

const SidebarMenu = () => {
  return (
    <div
      className="sidebar-wrapper"
      style={{
        background: 'url("https://images.unsplash.com/photo-1752440093057-1c188e7137e9?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D") center / cover no-repeat',
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

          <button className="sidebar-btn">
            <Search size={20} />
            <span>Search</span>
          </button>

          <button className="sidebar-btn">
            <BarChart2 size={20} />
            <span>Sales Analytics</span>
          </button>

          <button className="sidebar-btn">
            <Bell size={20} />
            <span>Notifications</span>
          </button>

          <button className="sidebar-btn">
            <Settings size={20} />
            <span>Account Settings</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default SidebarMenu;
