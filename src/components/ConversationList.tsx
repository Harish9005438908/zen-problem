import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Plus, MessageSquare, Trash2 } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
  selectedId: string | null;
}

const ConversationList = ({ onSelectConversation, selectedId }: ConversationListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
      return;
    }

    setConversations(data || []);
  };

  const createConversation = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return;

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        title: `New Chat ${new Date().toLocaleDateString()}`,
        user_id: session.session.user.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
      return;
    }

    setConversations([data, ...conversations]);
    onSelectConversation(data.id);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const { error } = await supabase.from("conversations").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
      return;
    }

    setConversations(conversations.filter((c) => c.id !== id));
    if (selectedId === id) {
      onSelectConversation(conversations[0]?.id || "");
    }
  };

  return (
    <div className="flex h-full flex-col border-r bg-muted/30">
      <div className="p-4">
        <Button onClick={createConversation} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`group flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors hover:bg-accent ${
                selectedId === conv.id ? "bg-accent" : ""
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate text-sm">{conv.title}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => deleteConversation(conv.id, e)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationList;
