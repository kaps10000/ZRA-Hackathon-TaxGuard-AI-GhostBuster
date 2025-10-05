import React from 'react';

export default function Placeholder({title, children}){
  return (
    <div className="border p-4 rounded bg-white shadow-sm">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}
