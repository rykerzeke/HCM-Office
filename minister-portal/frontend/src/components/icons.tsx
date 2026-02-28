/**
 * Fluent Design icons - centralized exports for consistent UI
 * Using @fluentui/react-icons for modern, consistent iconography
 */
import React from 'react';
import {
  ArrowLeft24Regular,
  ArrowRight24Regular,
  Search24Regular,
  Person24Regular,
  CalendarLtr24Regular,
  CheckmarkCircle24Regular,
  Clock24Regular,
  Location24Regular,
  Document24Regular,
  Shield24Regular,
  Add24Regular,
  Folder24Regular,
  ChartMultiple24Regular,
  Globe24Regular,
  SignOut24Regular,
  Dismiss24Regular,
  PanelLeft24Regular,
  WeatherSunny24Regular,
  WeatherMoon24Regular,
  ChevronRight24Regular,
  Send24Regular,
  DocumentAdd24Regular,
} from '@fluentui/react-icons';

const iconClass = 'shrink-0';

export const Icons = {
  ArrowLeft: (p: React.SVGProps<SVGSVGElement>) => <ArrowLeft24Regular className={iconClass} {...p} />,
  ArrowRight: (p: React.SVGProps<SVGSVGElement>) => <ArrowRight24Regular className={iconClass} {...p} />,
  Search: (p: React.SVGProps<SVGSVGElement>) => <Search24Regular className={iconClass} {...p} />,
  User: (p: React.SVGProps<SVGSVGElement>) => <Person24Regular className={iconClass} {...p} />,
  Calendar: (p: React.SVGProps<SVGSVGElement>) => <CalendarLtr24Regular className={iconClass} {...p} />,
  CalendarDays: (p: React.SVGProps<SVGSVGElement>) => <CalendarLtr24Regular className={iconClass} {...p} />,
  CheckCircle: (p: React.SVGProps<SVGSVGElement>) => <CheckmarkCircle24Regular className={iconClass} {...p} />,
  Clock: (p: React.SVGProps<SVGSVGElement>) => <Clock24Regular className={iconClass} {...p} />,
  MapPin: (p: React.SVGProps<SVGSVGElement>) => <Location24Regular className={iconClass} {...p} />,
  FileText: (p: React.SVGProps<SVGSVGElement>) => <Document24Regular className={iconClass} {...p} />,
  Shield: (p: React.SVGProps<SVGSVGElement>) => <Shield24Regular className={iconClass} {...p} />,
  UserPlus: (p: React.SVGProps<SVGSVGElement>) => <Add24Regular className={iconClass} {...p} />,
  FilePlus2: (p: React.SVGProps<SVGSVGElement>) => <DocumentAdd24Regular className={iconClass} {...p} />,
  FolderSearch: (p: React.SVGProps<SVGSVGElement>) => <Folder24Regular className={iconClass} {...p} />,
  BarChart3: (p: React.SVGProps<SVGSVGElement>) => <ChartMultiple24Regular className={iconClass} {...p} />,
  Globe: (p: React.SVGProps<SVGSVGElement>) => <Globe24Regular className={iconClass} {...p} />,
  LogOut: (p: React.SVGProps<SVGSVGElement>) => <SignOut24Regular className={iconClass} {...p} />,
  X: (p: React.SVGProps<SVGSVGElement>) => <Dismiss24Regular className={iconClass} {...p} />,
  Menu: (p: React.SVGProps<SVGSVGElement>) => <PanelLeft24Regular className={iconClass} {...p} />,
  Sun: (p: React.SVGProps<SVGSVGElement>) => <WeatherSunny24Regular className={iconClass} {...p} />,
  Moon: (p: React.SVGProps<SVGSVGElement>) => <WeatherMoon24Regular className={iconClass} {...p} />,
  ChevronRight: (p: React.SVGProps<SVGSVGElement>) => <ChevronRight24Regular className={iconClass} {...p} />,
  ChevronDown: (p: React.SVGProps<SVGSVGElement>) => <ChevronRight24Regular className={`${iconClass} -rotate-90`} {...p} />,
  SendHorizonal: (p: React.SVGProps<SVGSVGElement>) => <Send24Regular className={iconClass} {...p} />,
  LayoutDashboard: (p: React.SVGProps<SVGSVGElement>) => <ChartMultiple24Regular className={iconClass} {...p} />,
  Phone: (p: React.SVGProps<SVGSVGElement>) => <Person24Regular className={iconClass} {...p} />,
};
