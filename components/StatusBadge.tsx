import React from 'react';

interface Props {
  status: string;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  let colorClass = "bg-gray-100 text-gray-800";

  switch (status) {
    case 'Low':
      colorClass = "bg-pink-100 text-pink-800 border border-pink-200";
      break;
    case 'Good':
      colorClass = "bg-green-100 text-green-800 border border-green-200";
      break;
    case 'Excess':
      colorClass = "bg-yellow-100 text-yellow-800 border border-yellow-200";
      break;
    case 'Flood Alert':
      colorClass = "bg-purple-100 text-purple-800 border border-purple-200 font-bold animate-pulse";
      break;
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
};