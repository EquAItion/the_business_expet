
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserRound, Star } from 'lucide-react';

export interface ExpertProps {
  id: string;
  name: string;
  title: string;
  expertise: string[];
  rating: number;
  reviews: number;
  imageUrl?: string;
  available: boolean;
}

const ExpertCard = ({ name, title, expertise, rating, reviews, imageUrl, available }: ExpertProps) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-gray-100">
              {imageUrl ? (
                <AvatarImage src={imageUrl} alt={name} />
              ) : (
                <AvatarFallback className="bg-blue-50 text-blue-500">
                  <UserRound size={18} />
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <CardTitle className="text-base font-medium">{name}</CardTitle>
              <CardDescription className="text-xs">{title}</CardDescription>
            </div>
          </div>
          <div className="flex items-center text-sm">
            <Star className="h-4 w-4 text-yellow-400 mr-1" />
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-gray-400 text-xs ml-1">({reviews})</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {expertise.map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100">
              {skill}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between items-center">
        <Badge variant={available ? "outline" : "secondary"} className={available ? "text-green-600 border-green-200 bg-green-50" : "text-gray-500"}>
          {available ? "Available Now" : "Available in 2-3 days"}
        </Badge>
        <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
          Connect
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExpertCard;
