import { ReactNode } from "react";
import { motion } from "framer-motion";
import logotipo from "@/assets/zapcorte-icon.png";
import { DashboardSidebar } from "./DashboardSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export const DashboardLayout = ({ 
  children, 
  title, 
  subtitle, 
  action 
}: DashboardLayoutProps) => {
  const contentVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      
      {/* Main Content */}
      <div className="dashboard-main-content md:pl-64">
        <motion.main
          variants={contentVariants}
          initial="initial"
          animate="animate"
          className="min-h-screen"
        >
          {/* Header */}
          {(title || subtitle || action) && (
            <div className="dashboard-header border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-30 safe-area-top">
              <div className="container mx-auto px-4 py-4 md:py-6 md:px-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex flex-col gap-2 ml-12 md:ml-0">
                    <div className="flex items-center gap-4">
                      {/* Logo no header do dashboard */}
                      <img
                        src={logotipo}
                        alt="ZapCorte"
                        className="h-8 w-auto hidden md:block"
                      />
                      {title && (
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                          {title}
                        </h1>
                      )}
                    </div>
                    {subtitle && (
                      <p className="text-sm md:text-base text-muted-foreground">
                        {subtitle}
                      </p>
                    )}
                  </div>
                  {action && (
                    <div className="dashboard-header-actions flex items-center gap-2 w-full md:w-auto">
                      {action}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="container mx-auto px-4 py-4 md:py-6 md:px-6 container-padding">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardLayout;