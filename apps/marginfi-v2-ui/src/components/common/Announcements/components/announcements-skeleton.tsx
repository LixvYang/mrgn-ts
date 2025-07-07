import React from "react";
import { Skeleton } from "~/components/ui/skeleton";

interface AnnouncementsSkeletonProps {
  /** Number of skeleton items to show (default: 3) */
  itemCount?: number;
  /** Whether to show pagination dots (default: true) */
  showPagination?: boolean;
}

export const AnnouncementsSkeleton = ({ 
  itemCount = 3, 
  showPagination = true 
}: AnnouncementsSkeletonProps) => {
  return (
    <div className="px-4 w-full">
      <div className="max-w-[480px] mx-auto w-full text-sm md:text-base">
        {/* Single visible skeleton slide */}
        <div className="bg-background-gray border border-background-gray rounded-lg w-full p-2.5 px-2 md:p-3">
          <div className="flex items-center gap-2 w-full">
            {/* Token icon skeleton */}
            <Skeleton className="h-6 w-6 rounded-full bg-[#373F45]" />
            
            {/* Text content skeleton */}
            <div className="flex-1 flex items-center gap-1.5">
              <Skeleton className="h-4 w-12 bg-[#373F45]" /> {/* Token symbol */}
              <Skeleton className="h-4 w-32 bg-[#373F45]" /> {/* Announcement text */}
            </div>
            
            {/* Arrow icon skeleton */}
            <Skeleton className="h-5 w-5 bg-[#373F45] ml-auto" />
          </div>
        </div>
        
        {/* Pagination skeleton */}
        {showPagination && itemCount > 1 && (
          <nav className="flex justify-center mt-4">
            <ul className="flex items-center gap-2">
              {Array.from({ length: itemCount }).map((_, index) => (
                <li key={index}>
                  <Skeleton 
                    className={`h-1.5 bg-[#373F45] rounded-full ${
                      index === 0 ? 'w-4' : 'w-1.5'
                    }`} 
                  />
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
};
