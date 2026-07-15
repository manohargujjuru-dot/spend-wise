import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

export default function CategoryIcon({ name, size = 20, color, className }: CategoryIconProps) {
  // Access the icon dynamically from the Lucide icons object
  const IconComponent = (Icons as any)[name];
  
  if (!IconComponent) {
    // Fallback icon if the requested icon name is not found
    const HelpIcon = Icons.HelpCircle;
    return <HelpIcon size={size} style={{ color }} className={className} />;
  }
  
  return <IconComponent size={size} style={{ color }} className={className} />;
}
