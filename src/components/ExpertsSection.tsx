
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import ExpertCard, { ExpertProps } from './ExpertCard';

// Sample data for the experts
const experts: ExpertProps[] = [
  {
    id: '1',
    name: 'Dr. Sarah Chen',
    title: 'Market Strategy Consultant',
    expertise: ['Market Analysis', 'Growth Strategy', 'Competitive Intelligence'],
    rating: 4.9,
    reviews: 124,
    imageUrl: undefined,
    available: true
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    title: 'Financial Advisor',
    expertise: ['Financial Projections', 'Investment Planning', 'Funding'],
    rating: 4.8,
    reviews: 98,
    imageUrl: undefined,
    available: false
  },
  {
    id: '3',
    name: 'Amelia Rodriguez',
    title: 'Marketing Specialist',
    expertise: ['Digital Marketing', 'Brand Strategy', 'Customer Acquisition'],
    rating: 4.7,
    reviews: 87,
    imageUrl: undefined,
    available: true
  }
];

const ExpertsSection = () => {
  return (
    <Card className="glass shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-medium">Suggested Experts</CardTitle>
          <CardDescription>Business professionals who can help refine your plan</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700 p-0">
          View all experts <ChevronRight size={16} className="ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {experts.map((expert) => (
            <ExpertCard key={expert.id} {...expert} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpertsSection;
