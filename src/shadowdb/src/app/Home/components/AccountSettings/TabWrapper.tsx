import { ReactNode } from 'react';

interface TabWrapperProps {
  children: ReactNode;
}

export function TabWrapper({ children }: TabWrapperProps) {
  return (
    <div className="h-full w-full overflow-y-auto flex flex-col py-2">
      {children}
    </div>
  );
}
