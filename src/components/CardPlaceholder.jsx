import React from "react";

const CardPlaceholder = () => (
  <div className="min-w-[150px] w-[150px] sm:min-w-[180px] sm:w-[180px] animate-pulse">
    <div className="relative aspect-[2/3] bg-gray-700 rounded-lg">
      {/* Skeleton for Portrait Card */}
    </div>
    <div className="mt-3 space-y-2">
      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
      <div className="flex justify-between items-center pt-1">
        <div className="h-3 bg-gray-700 rounded w-1/3"></div>
        <div className="h-4 bg-gray-700 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);

export default CardPlaceholder;