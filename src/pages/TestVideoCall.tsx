import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Video } from 'lucide-react';

const TestVideoCall = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');

  const handleStartCall = () => {
    if (!roomId.trim()) {
      alert('Please enter a room ID');
      return;
    }
    navigate(`/video-call/${roomId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Start a Test Video Call</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Room ID</label>
              <Input 
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter a room ID (e.g., test-room-123)"
              />
            </div>
            <Button 
              className="w-full"
              onClick={handleStartCall}
            >
              <Video className="h-4 w-4 mr-2" />
              Start Video Call
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestVideoCall;