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
      
      // Load existing chats with their messages (for sidebar)
      const chatsWithMessages = chatsData ? await Promise.all(
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
      ) : [];
      
      // ALWAYS create a fresh new chat when signing in
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
      setChats([newChat, ...chatsWithMessages]);
      setActiveChatId(newChat.id);
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
      // Update local state first for immediate UI response
      setChats((prevChats) => 
        prevChats.map((chat) => 
          chat.id === chatId ? { ...chat, ...updates } : chat
        )
      );
      
      // If there are message updates, handle them
      if (updates.messages) {
        // Filter out loading messages - they should NEVER be saved to database
        const finalMessages = updates.messages.filter(
          msg => msg.content !== "__LOADING__" && !msg.id.startsWith('loading-')
        );
        
        // Get current messages from state to compare
        const chat = chats.find(c => c.id === chatId);
        const currentMessages = chat?.messages || [];
        
        // Find messages that are actually new (not in current state)
        const currentMessageIds = new Set(currentMessages.map(m => m.id));
        const newMessages = finalMessages.filter(msg => !currentMessageIds.has(msg.id));
        
        // Also check for messages that were updated (same ID, different content)
        // This handles the case where a loading message is replaced with final content
        const updatedMessages = finalMessages.filter(msg => {
          const existingMsg = currentMessages.find(m => m.id === msg.id);
          return existingMsg && existingMsg.content !== msg.content;
        });
        
        // Save new messages to database
        for (const message of newMessages) {
          // Check if message already exists in database (prevent duplicates)
          const messageTime = new Date(message.timestamp);
          const timeStart = new Date(messageTime.getTime() - 2000);
          const timeEnd = new Date(messageTime.getTime() + 2000);
          
          const { data: existingMessages } = await supabase
            .from('messages')
            .select('id')
            .eq('chat_id', chatId)
            .eq('role', message.role)
            .eq('content', message.content)
            .gte('created_at', timeStart.toISOString())
            .lte('created_at', timeEnd.toISOString())
            .limit(1);
          
          // Only insert if it doesn't already exist
          if (!existingMessages || existingMessages.length === 0) {
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
        
        // Update messages that changed (e.g., loading -> final content)
        for (const message of updatedMessages) {
          const existingMsg = currentMessages.find(m => m.id === message.id);
          
          // Only update if the existing message was a loading message or content actually changed
          if (existingMsg && (
            existingMsg.content === "__LOADING__" || 
            existingMsg.id.startsWith('loading-') ||
            existingMsg.content !== message.content
          )) {
            // Check if this message exists in DB (it might not if it was only a loading state)
            const { data: dbMessage } = await supabase
              .from('messages')
              .select('id')
              .eq('chat_id', chatId)
              .eq('role', message.role)
              .eq('content', existingMsg.content)
              .limit(1);
            
            if (dbMessage && dbMessage.length > 0) {
              // Update existing message
              await supabase
                .from('messages')
                .update({
                  content: message.content,
                  usage: message.usage || null
                })
                .eq('id', dbMessage[0].id);
            } else {
              // Insert as new message (loading message was never saved)
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
