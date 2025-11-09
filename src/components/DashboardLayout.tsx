import { ReactNode } from "react";
import { motion } from "framer-motion";
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
      <div className="md:pl-64">
        <motion.main
          variants={contentVariants}
          initial="initial"
          animate="animate"
          className="min-h-screen"
        >
          {/* Header */}
          {(title || subtitle || action) && (
            <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-30">
              <div className="container mx-auto px-4 py-6 md:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 ml-12 md:ml-0">
                    {/* Logo no header do dashboard */}
                    <img
                      src="/midia/logotipo-zapcorte.png"
                      alt="ZapCorte"
                      className="h-8 w-auto hidden md:block"
                    />
                    {title && (
                      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                        {title}
                      </h1>
                    )}
                    {subtitle && (
                      <p className="text-muted-foreground mt-1">
                        {subtitle}
                      </p>
                    )}
                  </div>
                  {action && (
                    <div className="flex items-center space-x-2">
                      {action}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="container mx-auto px-4 py-6 md:px-6">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardLayout;