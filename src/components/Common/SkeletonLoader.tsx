import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4' 
}) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${width} ${height} ${className}`}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center space-x-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton width="w-1/2" height="h-4" />
          <Skeleton width="w-1/3" height="h-3" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton width="w-full" height="h-3" />
        <Skeleton width="w-3/4" height="h-3" />
        <Skeleton width="w-1/2" height="h-3" />
      </div>
      <div className="flex space-x-2">
        <Skeleton width="w-20" height="h-8" className="rounded-md" />
        <Skeleton width="w-24" height="h-8" className="rounded-md" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex space-x-4">
          {Array.from({ length: cols }).map((_, index) => (
            <Skeleton key={index} width="w-24" height="h-4" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: cols }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  width={colIndex === 0 ? "w-32" : "w-20"} 
                  height="h-4" 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton width="w-64" height="h-8" />
        <Skeleton width="w-48" height="h-4" />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton width="w-16" height="h-4" />
                <Skeleton width="w-12" height="h-8" />
              </div>
              <Skeleton className="w-12 h-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      
      {/* Table */}
      <TableSkeleton />
    </div>
  );
};

export const MentorListSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <Skeleton width="w-48" height="h-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton width="w-full" height="h-10" className="rounded-md" />
          <Skeleton width="w-full" height="h-10" className="rounded-md" />
          <Skeleton width="w-full" height="h-10" className="rounded-md" />
          <Skeleton width="w-32" height="h-10" className="rounded-md" />
        </div>
      </div>
      
      {/* Mentor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
      
      {/* Pagination */}
      <div className="flex justify-center items-center space-x-2">
        <Skeleton width="w-20" height="h-10" className="rounded-md" />
        <div className="flex space-x-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="w-10 h-10 rounded-md" />
          ))}
        </div>
        <Skeleton width="w-20" height="h-10" className="rounded-md" />
      </div>
    </div>
  );
};