"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ChatInterface } from "@/components/chat-interface";
import type { Chat, Message } from "@/lib/types";
import { LoadingSpinner } from "@/components/loading-spinner";
import { SidebarProvider } from "@/components/ui/sidebar";
import ErrorBoundary, { ChatErrorFallback } from "@/components/error-boundary";

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState<Set<string>>(new Set());
  // Removed failed messages queue - too complex

  // Removed testDatabaseInsertion function - was creating spam messages

  // Removed inspectDatabaseState function - too verbose

  // Removed generateDebugSummary function - too verbose

  // Simple validation function for testing
  const validateMessagePersistence = async (chatId: string) => {
    try {
      const currentChat = chats.find(c => c.id === chatId);
      const { data: dbMessages } = await supabase
        .from('messages')
        .select('id, role, content')
        .eq('chat_id', chatId);
      
      const uiMessageCount = currentChat?.messages.length || 0;
      const dbMessageCount = dbMessages?.length || 0;
      
      console.log("Message persistence check:", {
        chatId: chatId.substring(0, 8) + "...",
        uiMessages: uiMessageCount,
        dbMessages: dbMessageCount,
        consistent: uiMessageCount <= dbMessageCount // DB might have more due to async loading
      });
      
      return dbMessageCount > 0;
    } catch (error) {
      console.error("Validation failed:", error);
      return false;
    }
  };

  // Removed manual save function - simplifying approach

  useEffect(() => {
    let isMounted = true;
    
    // Check if user is authenticated
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!isMounted) return;
      
      if (!session) {
        router.push('/');
        return;
      }
      
      setUser(session.user);
      console.log("User authenticated:", session.user.id);
      
      // Ensure user profile exists
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .single();
        
        if (profileError && profileError.code === 'PGRST116') {
          // User profile doesn't exist, create it
          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: session.user.id,
              email: session.user.email || '',
            });
          
          if (createError) {
            console.error("Error creating user profile:", {
              errorMessage: createError.message || 'No message',
              errorCode: createError.code || 'No code', 
              errorString: String(createError),
              fullError: JSON.stringify(createError),
            });
            console.error("Raw profile creation error:", createError);
          } else {
            console.log("User profile created successfully");
          }
        }
      } catch (profileError) {
        console.warn("User profile check/creation failed:", profileError);
      }
      
      await loadChats(session.user.id);
      if (isMounted) {
        setLoading(false);
      }
    };
    
    checkUser();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Load messages when active chat changes (lazy loading)
  useEffect(() => {
    let isMounted = true;
    
    const loadActiveChat = async () => {
      if (activeChatId && isMounted) {
        const activeChat = chats.find(chat => chat.id === activeChatId);
        // Only load messages if they haven't been loaded yet
        if (activeChat && activeChat.messages.length === 0 && activeChat.title !== "New Chat") {
          await loadChatMessages(activeChatId);
        }
      }
    };
    
    loadActiveChat();
    
    return () => {
      isMounted = false;
    };
  }, [activeChatId, chats]);

  // Load chats from Supabase (lazy loading - messages loaded on demand)
  const loadChats = async (userId: string) => {
    try {
      console.log("Loading chats for user:", userId);
      
      // Get all chats for the user (metadata only)
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (chatsError) throw chatsError;
      
      // Create chat objects without messages (lazy loading)
      const chatsWithoutMessages = (chatsData || []).map((chat) => ({
        id: chat.id,
        title: chat.title,
        model: chat.model,
        createdAt: new Date(chat.created_at),
        messages: [] // Messages will be loaded on demand
      }));
      
      // Smart new chat creation: only create if no empty chats exist
      let activeChat: Chat | null = null;
      const emptyChatExists = chatsWithoutMessages.find(chat => 
        chat.title === "New Chat"
      );
      
      if (emptyChatExists) {
        // Use existing empty chat and load its messages
        await loadChatMessages(emptyChatExists.id);
        activeChat = emptyChatExists;
        setChats(chatsWithoutMessages);
        setActiveChatId(activeChat.id);
      } else {
        // Only create new chat if no empty chat exists
        const newChatData = {
          user_id: userId,
          title: "New Chat",
          model: "openai/gpt-4o"
        };
        
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .insert(newChatData)
          .select()
          .single();
        
        if (chatError) throw chatError;
        
        const newChat: Chat = {
          id: chat.id,
          title: chat.title,
          model: chat.model,
          createdAt: new Date(chat.created_at),
          messages: []
        };
        
        // Set chats with existing chats + new chat at the front
        setChats([newChat, ...chatsWithoutMessages]);
        setActiveChatId(newChat.id);
      }
    } catch (error) {
      console.error("Error loading chats:", {
        errorMessage: (error as any)?.message || 'No message',
        errorCode: (error as any)?.code || 'No code',
        errorString: String(error),
        fullError: JSON.stringify(error),
        errorKeys: Object.keys(error || {}),
      });
      console.error("Raw error:", error);
      
      // If it's a database error, we might need to create the user profile
      if ((error as any)?.code === 'PGRST116' || (error as any)?.message?.includes('violates row-level security policy')) {
        console.warn("User profile might not exist, attempting to create...");
        // The user profile should be automatically created by the trigger
        // but if it fails, we can handle it gracefully
      }
      
      // Create empty chat anyway to allow user to use the app
      const newChatData = {
        user_id: userId,
        title: "New Chat",
        model: "openai/gpt-4o"
      };
      
      try {
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .insert(newChatData)
          .select()
          .single();
        
        if (!chatError && chat) {
          const newChat: Chat = {
            id: chat.id,
            title: chat.title,
            model: chat.model,
            createdAt: new Date(chat.created_at),
            messages: []
          };
          
          setChats([newChat]);
          setActiveChatId(newChat.id);
        }
      } catch (fallbackError) {
        console.error("Fallback chat creation failed:", (fallbackError as any)?.message || fallbackError);
      }
    }
  };

  // Load messages for a specific chat (on-demand with race condition protection)
  const loadChatMessages = async (chatId: string) => {
    // Prevent duplicate loading requests
    if (loadingMessages.has(chatId)) {
      console.log("Skipping message load - already in progress:", chatId);
      return;
    }
    
    try {
      console.log("Loading messages for chat:", chatId);
      setLoadingMessages(prev => new Set(prev).add(chatId));
      
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Database query error:", error);
        throw error;
      }
      
      const messages = (messagesData || []).map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.created_at),
        usage: msg.usage
      }));
      
      console.log("Loaded", messages.length, "messages for chat", chatId);
      
      // Update the specific chat with its messages
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId ? { ...chat, messages } : chat
        )
      );
    } catch (error) {
      console.error("❌ Error loading chat messages:", {
        errorMessage: (error as any)?.message || 'No message',
        errorCode: (error as any)?.code || 'No code',
        errorString: String(error),
      });
      console.error("Raw error:", error);
    } finally {
      setLoadingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(chatId);
        return newSet;
      });
    }
  };

  // Create a new chat (with smart creation logic)
  const createNewChat = async (userId: string) => {
    try {
      // First check if there's an existing empty chat
      const existingEmptyChat = chats.find(chat => 
        chat.messages.length === 0 && chat.title === "New Chat"
      );
      
      if (existingEmptyChat) {
        // Just switch to the existing empty chat instead of creating a new one
        setActiveChatId(existingEmptyChat.id);
        return existingEmptyChat;
      }
      
      // Only create a new chat if no empty chat exists
      const newChatData = {
        user_id: userId,
        title: "New Chat",
        model: "openai/gpt-4o"
      };
      
      const { data: chat, error } = await supabase
        .from('chats')
        .insert(newChatData)
        .select()
        .single();
      
      if (error) throw error;
      
      const newChat: Chat = {
        id: chat.id,
        title: chat.title,
        model: chat.model,
        createdAt: new Date(chat.created_at),
        messages: []
      };
      
      setChats((prevChats) => [newChat, ...prevChats]);
      setActiveChatId(newChat.id);
      
      return newChat;
    } catch (error) {
      console.error("Error creating chat:", error);
      throw error;
    }
  };

  // Update a chat
  const updateChat = async (chatId: string, updates: Partial<Chat>) => {
    try {
      // Simplified logging
      console.log("Updating chat:", chatId, updates.messages?.length || 0, "messages");

      // Update local state first for immediate UI response
      setChats((prevChats) => 
        prevChats.map((chat) => 
          chat.id === chatId ? { ...chat, ...updates } : chat
        )
      );
      
      // If there are message updates, handle them with simplified logic
      if (updates.messages) {
        // Filter out loading messages - they should NEVER be saved to database
        const finalMessages = updates.messages.filter(
          msg => msg.content !== "__LOADING__" && !msg.id.startsWith('loading-')
        );
        
        // Get current messages from database to avoid state-based race conditions
        const { data: currentDbMessages } = await supabase
          .from('messages')
          .select('id, content, role')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });
        
        const currentDbMessageIds = new Set((currentDbMessages || []).map(m => m.id));
        
        // Simple, reliable message insertion
        for (const message of finalMessages) {
          // Skip messages that are already in database or have temporary IDs
          if (currentDbMessageIds.has(message.id)) {
            continue;
          }
          
          if (message.id.includes('temp-') || message.id.includes('loading-')) {
            continue;
          }
          
          // Prepare message data for insertion
          const messageData = {
            id: message.id,
            chat_id: chatId,
            role: message.role,
            content: message.content,
            created_at: message.timestamp.toISOString(),
            usage: message.usage || null
          };
          
          console.log("Inserting message:", message.id, message.role);
          
          // Try upsert first to handle duplicates gracefully
          const { error: upsertError } = await supabase
            .from('messages')
            .upsert(messageData, { onConflict: 'id' });
          
          if (upsertError) {
            console.error("❌ Message upsert failed:", {
              messageId: message.id,
              messageRole: message.role,
              errorMessage: upsertError.message || 'No message',
              errorCode: upsertError.code || 'No code',
            });
            console.error("Raw upsert error:", upsertError);
          } else {
            console.log("✅ Message saved:", message.id, message.role);
          }
        }
        
      }
      
      // Update other chat properties if needed
      if (updates.title || updates.model) {
        const updateData: any = {};
        if (updates.title) updateData.title = updates.title;
        if (updates.model) updateData.model = updates.model;
        
        await supabase
          .from('chats')
          .update(updateData)
          .eq('id', chatId);
      }
    } catch (error) {
      console.error("Error updating chat:", error);
    }
  };

  // Delete a chat
  const deleteChat = async (chatId: string) => {
    try {
      await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);
      
      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
      
      // If the active chat was deleted, set a new active chat
      if (chatId === activeChatId) {
        const remainingChats = chats.filter((chat) => chat.id !== chatId);
        if (remainingChats.length > 0) {
          setActiveChatId(remainingChats[0].id);
        } else {
          // Create a new chat if all were deleted
          const userId = user.id;
          await createNewChat(userId);
        }
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Get the active chat
  const activeChat = chats.find((chat) => chat.id === activeChatId);

  return (
    <SidebarProvider defaultOpen={true} className="w-full">
      <div className="h-screen overflow-hidden w-full flex-1 min-w-0">
        <ErrorBoundary fallback={ChatErrorFallback}>
          <ChatInterface 
            chat={activeChat}
            onUpdateChat={updateChat}
            onCreateChat={() => createNewChat(user.id)}
            onDeleteChat={deleteChat}
            onChangeActiveChat={(chatId) => {
              setActiveChatId(chatId);
              // Load messages for the selected chat if not already loaded
              const selectedChat = chats.find(chat => chat.id === chatId);
              if (selectedChat && selectedChat.messages.length === 0 && selectedChat.title !== "New Chat") {
                loadChatMessages(chatId);
              }
            }}
            onValidateMessages={validateMessagePersistence}
            chats={chats}
            user={user}
          />
        </ErrorBoundary>
      </div>
    </SidebarProvider>
  );
}
