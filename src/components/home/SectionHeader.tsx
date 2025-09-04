import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, LucideIcon } from "lucide-react";
import { useTranslation } from 'react-i18next';
import TabsNavigation from "./TabsNavigation";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  viewAllLink?: string;
  viewAllText?: string;
  titleTransform?: "uppercase" | "capitalize" | "none";
  // New props for tabs functionality
  showTabs?: boolean;
  tabs?: Array<{ id: string; label: string }>;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  tabsStyle?: "default" | "glassmorphic";
}

export default function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  viewAllLink,
  viewAllText,
  titleTransform = "uppercase",
  // Tabs props
  showTabs = false,
  tabs = [],
  activeTab,
  onTabChange,
  tabsStyle = "default"
}: SectionHeaderProps) {
  const { t } = useTranslation();

  const defaultViewAllText = viewAllText || t('product.viewAll');

  return (
    <div className="flex flex-col">
      {/* Header section with padding */}
      <div className="h-7 flex items-center px-2">
        <div className="flex items-center justify-between w-full">
          {/* First element (Title with Icon) */}
          <div className={`flex items-center gap-1 text-xs font-bold tracking-wide ${titleTransform === 'uppercase' ? 'uppercase' : titleTransform === 'capitalize' ? 'capitalize' : ''}`}>
            {Icon && <Icon className="w-4 h-4" />}
            {title}
          </div>

          {/* Last element (View All) */}
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="text-xs hover:underline flex items-center font-medium transition-colors"
            >
              {defaultViewAllText}
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Tabs Navigation - Outside the padded container for edge-to-edge scrolling */}
      {showTabs && tabs.length > 0 && activeTab && onTabChange && (
        <div className={tabsStyle === "glassmorphic" ? "mt-1" : "mt-2"}>
          <TabsNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            style={tabsStyle === "glassmorphic" ? {
              backgroundColor: 'white',
            } : undefined}
          />
        </div>
      )}
    </div>
  );
}