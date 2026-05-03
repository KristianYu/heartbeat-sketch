import React from 'react';

export const StopMotion: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="animate-stop-motion">
      {children}
    </div>
  );
};
