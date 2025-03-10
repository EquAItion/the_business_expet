
import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const AIChat = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; timestamp: Date }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Sample suggested questions
  const suggestedQuestions = [
    "How can I improve my business marketing strategy?",
    "What are the key trends in my industry for 2023?",
    "How can I optimize my cash flow?",
    "What strategies work best for customer retention?"
  ];
  
  useEffect(() => {
    // Scroll to bottom of messages
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = { role: 'user' as const, content: input, timestamp: new Date() };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const responses = [
        "Based on current market trends, I recommend focusing on digital transformation and sustainability initiatives in your business strategy.",
        "Looking at your industry, the key growth areas involve AI integration and personalized customer experiences. Consider investing in technologies that support these trends.",
        "To optimize your operations, consider implementing automated workflow solutions and data-driven decision making processes.",
        "For your specific question, I'd recommend establishing clear KPIs and regular performance reviews to track progress against your business objectives."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const aiMessage = { role: 'assistant' as const, content: randomResponse, timestamp: new Date() };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      setIsLoading(false);
      
      toast.success("New AI insight generated!");
    }, 1500);
  };
  
  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };
  
  if (!isOpen) {
    return (
      <Button 
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }
  
  return (
    <div className="fixed bottom-6 right-6 w-full max-w-md z-40 rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-white animate-scale-in">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-blue-50">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center mr-2">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-display font-semibold">Business Insights AI</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleChat}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="h-96 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Bot className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">AI Business Insights</h3>
            <p className="text-gray-600 mb-6">Ask me anything about business strategy, market trends, or operational improvements.</p>
            <div className="w-full grid gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  className="text-left text-sm bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors flex items-center justify-between group"
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  <span>{question}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white border border-gray-200 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    {message.role === 'assistant' ? (
                      <Bot className="h-4 w-4 mr-1 text-blue-500" />
                    ) : (
                      <User className="h-4 w-4 mr-1 text-white" />
                    )}
                    <span className={`text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.role === 'user' ? 'You' : 'AI Assistant'} • {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for business insights..."
            className="resize-none pr-12 min-h-[60px] max-h-[180px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-2 bottom-2"
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AIChat;
