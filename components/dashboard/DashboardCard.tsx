import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type DashboardCardProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function DashboardCard({
  title,
  subtitle,
  action,
  children,
  footer,
  className,
  contentClassName,
}: DashboardCardProps) {
  return (
    <Card
      className={cn(
        'border rounded-2xl',
        'border-border relative overflow-hidden',
        className
      )}
    >
      {(title || subtitle || action) && (
        <CardHeader className="flex items-start justify-between gap-3">
          <div>
            {title && (
              <CardTitle className="text-high text-lg font-bold">
                {title}
              </CardTitle>
            )}
            {subtitle && (
              <CardDescription className="mt-1 text-sm text-med">
                {subtitle}
              </CardDescription>
            )}
          </div>
          {action}
        </CardHeader>
      )}

      <CardContent className={cn('space-y-3', contentClassName)}>
        {children}
      </CardContent>

      {footer && <CardFooter>{footer}</CardFooter>}

    </Card>
  );
}
