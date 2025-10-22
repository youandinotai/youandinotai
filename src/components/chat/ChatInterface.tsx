import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { ArrowLeft, Send, Image, Crown, MoreVertical } from 'lucide-react';
import { LoadingAnimation, ChatLoadingBubbles } from "../shared/LoadingAnimations";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  isPremium?: boolean;
}

interface Match {
  id: number;
  otherUser: User;
}

interface Message {
  id: number;
  content: string;
  senderId: string;
  isContactInfo: boolean;
  readAt: string | null;
  createdAt: string;
  sender: User;
}

interface ChatInterfaceProps {
  match: Match;
  onBack: () => void;
  currentUserId: string;
}

export default function ChatInterface({ match, onBack, currentUserId }: ChatInterfaceProps) {
  const [messageText, setMessageText] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  useEffect(() => {
    if (user) {
      setCurrentUser(user as User);
    }
  }, [user]);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['/api/matches', match.id, 'messages'],
    queryFn: async () => {
      const response = await fetch(`/api/matches/${match.id}/messages`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return response.json();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', '/api/messages', {
        matchId: match.id,
        content,
        isContactInfo: /(\d{3}[-.]?\d{3}[-.]?\d{4}|\+\d{1,3}\s?\d{1,14}|@\w+\.\w+)/.test(content),
      });
      return response.json();
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['/api/matches', match.id, 'messages'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      setIsTyping(true);
      setTimeout(() => {
        sendMessageMutation.mutate(messageText.trim());
        setIsTyping(false);
      }, 500);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);

    // Simulate typing indicator for other user
    if (e.target.value.length > 0 && !showTypingIndicator) {
      setShowTypingIndicator(true);
      setTimeout(() => setShowTypingIndicator(false), 2000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const shouldBlurContent = (message: Message) => {
    return message.isContactInfo && !currentUser?.isPremium;
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-white via-red-50/30 to-pink-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 z-40 flex flex-col">
      {/* Enhanced Header */}
      <header className="bg-white/95 backdrop-blur-md dark:bg-gray-800/95 shadow-lg p-4 flex items-center space-x-4 border-b border-gray-100 dark:border-gray-700">
        <Button
          onClick={onBack}
          variant="ghost"
          size="icon"
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Button>
        <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-green-500 ring-offset-2">
          <img
            src={
              match.otherUser.profileImageUrl ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.otherUser.id}`
            }
            alt={match.otherUser.firstName}
            className="w-full h-full object-cover"
          />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            {match.otherUser.firstName} {match.otherUser.lastName}
            {match.otherUser.isPremium && <Crown className="inline w-4 h-4 ml-1 text-yellow-500" />}
          </h3>
          <p className="text-sm text-green-500 font-medium flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Online now
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </Button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {showTypingIndicator && (
              <div className="flex justify-start">
                <div className="max-w-xs p-3 rounded-2xl bg-gray-100 text-gray-800 rounded-tl-sm">
                  <ChatLoadingBubbles />
                </div>
              </div>
            )}
            {messages.map((message: Message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === currentUserId ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs p-3 rounded-2xl relative ${
                    message.senderId === currentUserId
                      ? 'bg-red-500 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}
                >
                  <p className={shouldBlurContent(message) ? 'blur-sm' : ''}>
                    {message.content}
                  </p>

                  {/* Premium blur overlay for contact info */}
                  {shouldBlurContent(message) && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className="flex items-center justify-end mt-1 space-x-1">
                    <span className="text-xs opacity-75">
                      {formatTime(message.createdAt)}
                    </span>
                    {/* Read receipts for premium users */}
                    {message.senderId === currentUserId && currentUser?.isPremium && (
                      <div className="w-4 h-4 flex items-center justify-center">
                        {message.readAt ? (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        ) : (
                          <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        )}
                      </div>
                    )}
                    {/* Premium lock for non-premium users */}
                    {message.senderId === currentUserId && !currentUser?.isPremium && (
                      <Crown className="w-3 h-3 opacity-50" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-gray-400"
          >
            <Image className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder={isTyping ? "Sending..." : "Type a message..."}
              value={messageText}
              onChange={handleInputChange}
              disabled={isTyping}
              className="w-full bg-gray-100 border-none rounded-full px-4 py-3 pr-12 focus:bg-gray-200 transition-colors disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}