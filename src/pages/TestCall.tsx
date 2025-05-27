// import React, { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import AgoraVideoCall from '@/components/session/AgoraVideoCall';
// import { toast } from '@/components/ui/use-toast';

// // Simple header component for testing
// const SimpleHeader = () => (
//   <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 shadow-sm py-4 px-4">
//     <div className="max-w-7xl mx-auto flex items-center justify-between">
//       <Link to="/" className="text-2xl font-bold">ExpertiseStation</Link>
//       <Link to="/" className="text-primary">Back to Home</Link>
//     </div>
//   </header>
// );

// const TestCall = () => {
//   const navigate = useNavigate();
//   const [channelName, setChannelName] = useState('test-channel');
//   const [uid, setUid] = useState('1234');
//   const [sessionType, setSessionType] = useState<'video' | 'audio'>('video');
//   const [inCall, setInCall] = useState(false);

//   const startCall = () => {
//     if (!channelName.trim()) {
//       alert('Please enter a channel name');
//       return;
//     }
    
//     // Validate that UID is a number
//     if (!uid.trim() || isNaN(parseInt(uid, 10))) {
//       alert('Please enter a valid numeric user ID');
//       return;
//     }
    
//     setInCall(true);
//   };

//   const endCall = () => {
//     setInCall(false);
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       <SimpleHeader />
//       <div className="container mx-auto py-24 px-4">
//         <h1 className="text-3xl font-bold mb-8">Test Agora Call</h1>
        
//         {!inCall ? (
//           <Card className="max-w-md mx-auto">
//             <CardHeader>
//               <CardTitle>Start a Test Call</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="space-y-2">
//                 <label htmlFor="channel" className="text-sm font-medium">Channel Name</label>
//                 <Input 
//                   id="channel" 
//                   value={channelName} 
//                   onChange={(e) => setChannelName(e.target.value)} 
//                   placeholder="Enter channel name"
//                 />
//               </div>
              
//               <div className="space-y-2">
//                 <label htmlFor="uid" className="text-sm font-medium">User ID (must be numeric)</label>
//                 <Input 
//                   id="uid" 
//                   value={uid} 
//                   onChange={(e) => {
//                     // Only allow numeric input
//                     if (e.target.value === '' || /^\d+$/.test(e.target.value)) {
//                       setUid(e.target.value);
//                     }
//                   }}
//                   placeholder="Enter numeric user ID"
//                   type="number"
//                 />
//                 <p className="text-xs text-muted-foreground">Use different IDs for different users</p>
//               </div>
              
//               <div className="space-y-2">
//                 <label htmlFor="type" className="text-sm font-medium">Session Type</label>
//                 <Select value={sessionType} onValueChange={(value: 'video' | 'audio') => setSessionType(value)}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select session type" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="video">Video</SelectItem>
//                     <SelectItem value="audio">Audio</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
              
//               <Button className="w-full" onClick={startCall}>
//                 Start Call
//               </Button>
//             </CardContent>
//           </Card>
//         ) : (
//           <div className="bg-card rounded-lg shadow-lg overflow-hidden h-[600px]">
//             <AgoraVideoCall 
//               channelName={channelName}
//               token={null}
//               uid={uid}
//               sessionType={sessionType}
//               onEndCall={endCall}
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TestCall;















import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import AgoraVideoCall from '../components/session/AgoraVideoCall';
import { toast } from '../components/ui/use-toast';

// Simple header component for testing
const SimpleHeader = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 shadow-sm py-4 px-4">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <Link to="/" className="text-2xl font-bold">ExpertiseStation</Link>
      <Link to="/" className="text-primary">Back to Home</Link>
    </div>
  </header>
);

const TestCall = () => {
  const navigate = useNavigate();
  const [channelName, setChannelName] = useState('test-channel');
  const [uid, setUid] = useState('1234');
  const [sessionType, setSessionType] = useState<'video' | 'audio'>('video');
  const [inCall, setInCall] = useState(false);

  const startCall = () => {
    if (!channelName.trim()) {
      alert('Please enter a channel name');
      return;
    }
    
    // Validate that UID is a number
    if (!uid.trim() || isNaN(parseInt(uid, 10))) {
      alert('Please enter a valid numeric user ID');
      return;
    }
    
    setInCall(true);
  };

  const endCall = () => {
    setInCall(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <SimpleHeader />
      <div className="container mx-auto py-24 px-4">
        <h1 className="text-3xl font-bold mb-8">Test Agora Call</h1>
        
        {!inCall ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Start a Test Call</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="channel" className="text-sm font-medium">Channel Name</label>
                <Input 
                  id="channel" 
                  value={channelName} 
                  onChange={(e) => setChannelName(e.target.value)} 
                  placeholder="Enter channel name"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="uid" className="text-sm font-medium">User ID (must be numeric)</label>
                <Input 
                  id="uid" 
                  value={uid} 
                  onChange={(e) => {
                    // Only allow numeric input
                    if (e.target.value === '' || /^\d+$/.test(e.target.value)) {
                      setUid(e.target.value);
                    }
                  }}
                  placeholder="Enter numeric user ID"
                  type="number"
                />
                <p className="text-xs text-muted-foreground">Use different IDs for different users</p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">Session Type</label>
                <Select value={sessionType} onValueChange={(value: 'video' | 'audio') => setSessionType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select session type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button className="w-full" onClick={startCall}>
                Start Call
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-card rounded-lg shadow-lg overflow-hidden h-[600px]">
            <AgoraVideoCall 
              channelName={channelName}
              token={null}
              uid={uid}
              sessionType={sessionType}
              onEndCall={endCall}
              sessionStart={new Date()}
              sessionEnd={new Date(Date.now() + 60 * 60 * 1000)} // 1 hour from now
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TestCall;
