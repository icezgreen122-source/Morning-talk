import React from 'react';
import { QuickStats } from '../types';
import { KPICards } from './KPICards';

interface SummaryCardsProps {
  stats: QuickStats;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ stats }) => {
  return <KPICards stats={stats} />;
};
