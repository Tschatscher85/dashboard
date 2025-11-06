import { ReactNode } from "react";

interface PropertyDetailFormLayoutProps {
  leftColumn: ReactNode;
  rightColumn: ReactNode;
  children?: ReactNode;
}

/**
 * Two-column layout wrapper for property detail form
 * Left column (60-65%): Main property details
 * Right column (35-40%): Contact, portals, sales info
 */
export function PropertyDetailFormLayout({ leftColumn, rightColumn, children }: PropertyDetailFormLayoutProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6">
        {/* Left Column - Main Details */}
        <div className="space-y-6">
          {leftColumn}
        </div>

        {/* Right Column - Contacts & Sales */}
        <div className="space-y-6">
          {rightColumn}
        </div>
      </div>
      {children}
    </>
  );
}
