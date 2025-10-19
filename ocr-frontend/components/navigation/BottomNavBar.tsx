'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, PieChart, BarChart3 } from 'lucide-react';

const navItems = [
  { href: '/expenses', label: 'Expenses', icon: <Wallet size={20} /> },
  { href: '/budget', label: 'Budget', icon: <PieChart size={20} /> },
  { href: '/reports', label: 'Reports', icon: <BarChart3 size={20} /> },
];

const BottomNavBar: React.FC = () => {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const  [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
  
      if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)

    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    }
  }, [lastScrollY])


  return (
    <div 
    className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md rounded-full backdrop-blur-md bg-gray-900 shadow-lg z-50 border border-gray-700 transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : 'translate-y-20'
    }`} >
      <ul className="flex justify-around items-center py-2 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center text-xs font-medium transition-all ${
                  isActive ? 'text-green-400' : 'text-gray-400 hover:text-green-500'
                }`}
              >
                {item.icon}
                <span className="mt-1">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1 animate-bounce" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default BottomNavBar;
