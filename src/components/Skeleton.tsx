import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rectangular",
  width,
  height,
  lines = 1,
}) => {
  const baseClasses = "animate-pulse bg-gray-200 rounded";

  const variantClasses = {
    text: "h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style = {
    width: width || "100%",
    height: height || "1rem",
  };

  if (lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${variantClasses[variant]} ${
              index < lines - 1 ? "mb-2" : ""
            }`}
            style={{
              ...style,
              width: index === lines - 1 ? "75%" : "100%",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

// Pre-built skeleton components for common use cases
export const ConversationSkeleton: React.FC = () => (
  <div className="p-4 bg-white rounded-2xl border border-gray-100">
    <div className="flex items-center space-x-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1">
        <Skeleton width="60%" height={20} className="mb-2" />
        <Skeleton width="80%" height={16} />
      </div>
    </div>
  </div>
);

export const MessageSkeleton: React.FC<{ isOwn?: boolean }> = ({
  isOwn = false,
}) => (
  <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
    <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
      {!isOwn && <Skeleton variant="circular" width={24} height={24} />}
      <div
        className={`px-4 py-2 rounded-2xl ${
          isOwn ? "bg-green-500" : "bg-white border border-gray-200"
        }`}
      >
        <Skeleton width="120px" height={16} />
        <div className="mt-1 flex justify-end">
          <Skeleton width="60px" height={12} />
        </div>
      </div>
    </div>
  </div>
);

export const UserSkeleton: React.FC = () => (
  <div className="p-4 bg-white rounded-2xl border border-gray-100">
    <div className="flex items-center space-x-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1">
        <Skeleton width="50%" height={18} className="mb-1" />
        <Skeleton width="30%" height={14} />
      </div>
      <Skeleton variant="circular" width={8} height={8} />
    </div>
  </div>
);
