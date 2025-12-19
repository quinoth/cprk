// src/components/Layout.tsx
import React from 'react';
import AppHeader from './AppHeader';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <AppHeader />
    <main className="flex-1">
      {children}
    </main>
    <footer className="bg-gray-100 text-center text-sm text-gray-500 py-4 border-t border-gray-200">
      © 2025 Центр реабилитации ГКУ Иркутской области. Все права защищены.
    </footer>
  </div>
);

export default Layout;
