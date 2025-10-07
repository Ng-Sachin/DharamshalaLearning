import React from 'react';
import { CardSkeleton } from '../Common/SkeletonLoader';

const MentorListSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, idx) => (
      <CardSkeleton key={idx} />
    ))}
  </div>
);

export default MentorListSkeleton;
