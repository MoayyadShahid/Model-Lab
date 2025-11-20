"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ChatInterface } from "@/components/chat-interface";
import type { Chat, Message } from "@/lib/types";
import { LoadingSpinner } from "@/components/loading-spinner";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
        return;
      }
      
      setUser(session.user);
      await loadChats(session.user.id);
      setLoading(false);
    };
    
    checkUser();
  }, [router]);

  // Load chats from Supabase
  const loadChats = async (userId: string) => {
    try {
      // Get all chats for the user
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (chatsError) throw chatsError;
      
      if (!chatsData || chatsData.length === 0) {
        // Create a default chat if none exists
        const newChat = await createNewChat(userId);
        setChats([newChat]);
        setActiveChatId(newChat.id);
        return;
      }
      
      // For each chat, load its messages
      const chatsWithMessages = await Promise.all(
        chatsData.map(async (chat) => {
          const { data: messagesData } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: true });
          
          return {
            id: chat.id,
            title: chat.title,
            model: chat.model,
            createdAt: new Date(chat.created_at),
            messages: (messagesData || []).map((msg) => ({
              id: msg.id,
              role: msg.role as "user" | "assistant",
              content: msg.content,
              timestamp: new Date(msg.created_at),
              usage: msg.usage
            }))
          };
        })
      );
      
      setChats(chatsWithMessages);
      setActiveChatId(chatsWithMessages[0]?.id || null);
    } catch (error) {
      console.error("Error loading chats:", error);
      // Handle error appropriately
    }
  };

  // Create a new chat
  const createNewChat = async (userId: string) => {
    try {
      const newChatData = {
        user_id: userId,
        title: "New Chat",
        model: "gpt-4o"
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
      // Update local state first for immediate UI response
      setChats((prevChats) => 
        prevChats.map((chat) => 
          chat.id === chatId ? { ...chat, ...updates } : chat
        )
      );
      
      // If there are message updates, handle them
      if (updates.messages) {
        // Get the last message if it's new
        const chat = chats.find(c => c.id === chatId);
        const currentMessages = chat?.messages || [];
        const newMessages = updates.messages.slice(currentMessages.length);
        
        // Add any new messages to the database
        for (const message of newMessages) {
          await supabase
            .from('messages')
            .insert({
              chat_id: chatId,
              role: message.role,
              content: message.content,
              created_at: message.timestamp.toISOString(),
              usage: message.usage || null
            });
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
        <ChatInterface 
          chat={activeChat}
          onUpdateChat={updateChat}
          onCreateChat={() => createNewChat(user.id)}
          onDeleteChat={deleteChat}
          onChangeActiveChat={(chatId) => setActiveChatId(chatId)}
          chats={chats}
          user={user}
        />
      </div>
    </SidebarProvider>
  );
}
