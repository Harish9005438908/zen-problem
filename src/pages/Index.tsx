import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import ChatInterface from "@/components/ChatInterface";
import ConversationList from "@/components/ConversationList";
import { LogOut, GraduationCap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        createInitialConversation(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const createInitialConversation = async (userId: string) => {
    // Check if user has any conversations
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .limit(1)
      .single();

    if (existing) {
      setSelectedConversation(existing.id);
      return;
    }

    // Create first conversation
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        title: "Welcome Chat",
        user_id: userId,
      })
      .select()
      .single();

    if (!error && data) {
      setSelectedConversation(data.id);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <GraduationCap className="mx-auto h-12 w-12 animate-pulse text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Student Guidance</h1>
        </div>
        <Button variant="ghost" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64">
          <ConversationList
            onSelectConversation={setSelectedConversation}
            selectedId={selectedConversation}
          />
        </div>
        <div className="flex-1">
          {selectedConversation ? (
            <ChatInterface conversationId={selectedConversation} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">Select or create a conversation to start</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
