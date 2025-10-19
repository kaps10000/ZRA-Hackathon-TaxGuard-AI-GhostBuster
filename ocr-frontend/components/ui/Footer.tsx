"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Lock } from 'lucide-react';

const Footer = () => {
    const quickLinks = [
        {name: "Browse Hostels", path: "/listings"},
        {name: "List Hostels", path: "/listings"},
        {name: "Contact Us", path: "/contactus"},
        {name: "About", path: "/about"},
    ]

  return (
    <motion.footer 
        initial="hidden"
        animate="visible"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="w-full bg-gray-100 dark:dark:bg-gray-900 relative pt-10 text-gray-300 py-10 border-t border-gray-300 dark:border-blue-900 pb-20 sm:pb-5 ">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center">
        
        <div className='flex items-center space-x-2 text-blue-500'>
            <Lock />
            <span className="font-bold text-2xl">Fortress Key</span>
        </div>
        <p className='text-blue-400'>Secure Your Digital Life with Fortress Key</p>
        

      </motion.div>

      <div className="text-center text-gray-500 text-sm mt-8">
        &copy; {new Date().getFullYear()} Fortress Key. All rights reserved.
      </div>
    </motion.footer>
  );
};

export default Footer;
