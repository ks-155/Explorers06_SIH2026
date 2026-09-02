import * as React from 'react';
export function Button({ className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md bg-[#0f766e] px-4 py-2 text-sm font-medium text-white hover:bg-[#115e59] disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
