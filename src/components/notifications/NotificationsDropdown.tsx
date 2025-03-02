import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Bell } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type Notification = {
  id: string;
  recipient_id?: string;
  recipient_type?: string;
  title: string;
  content: string;
  link?: string;
  is_read: boolean;
  created_at: string;
};

export function NotificationsDropdown() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`recipient_id.eq.${user.id},recipient_type.eq.manager`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });
  
  // Query to check if the current user is a manager
  const { data: isManager } = useQuery({
    queryKey: ['is-manager', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_manager')
        .eq('id', user.id)
        .single();
      
      if (error) return false;
      return data.is_manager;
    },
    enabled: !!user,
  });
  
  // Filter notifications based on whether user is a manager
  const filteredNotifications = notifications.filter(notification => {
    // Personal notifications
    if (notification.recipient_id === user?.id) return true;
    
    // Manager notifications
    if (notification.recipient_type === 'manager' && isManager) return true;
    
    return false;
  });
  
  const unreadCount = filteredNotifications.filter(n => !n.is_read).length;
  
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      const notificationIds = filteredNotifications
        .filter(n => !n.is_read)
        .map(n => n.id);
      
      if (notificationIds.length === 0) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds);
      
      if (error) throw error;
      
      toast({
        title: "Alla notifieringar markerade som lästa",
        description: `${notificationIds.length} notifieringar har markerats som lästa`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      toast({
        title: "Ett fel uppstod",
        description: error.message || "Kunde inte markera notifieringar som lästa",
        variant: "destructive",
      });
    }
  };
  
  // Subscribe to new notifications
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          
          // Show toast for new notification
          const newNotification = payload.new as Notification;
          toast({
            title: newNotification.title,
            description: newNotification.content,
          });
        }
      )
      .subscribe();
    
    // If user is manager, also subscribe to manager notifications
    if (isManager) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'recipient_type=eq.manager',
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          
          // Show toast for new notification
          const newNotification = payload.new as Notification;
          toast({
            title: newNotification.title,
            description: newNotification.content,
          });
        }
      );
    }
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isManager, queryClient, toast]);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifieringar</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={markAllAsRead}
            >
              Markera alla som lästa
            </Button>
          )}
        </div>
        
        {filteredNotifications.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            Inga notifieringar
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="grid divide-y">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 ${notification.is_read ? '' : 'bg-blue-50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium mb-1">{notification.title}</div>
                      <div className="text-sm text-gray-600">{notification.content}</div>
                      <div className="text-xs text-gray-400 mt-2">
                        {format(parseISO(notification.created_at), 'yyyy-MM-dd HH:mm')}
                      </div>
                    </div>
                    {!notification.is_read && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        Ny
                      </Badge>
                    )}
                  </div>
                  {notification.link && (
                    <div className="mt-2">
                      <Link
                        to={notification.link}
                        className="text-sm text-blue-600 hover:underline"
                        onClick={() => {
                          markAsRead(notification.id);
                          setOpen(false);
                        }}
                      >
                        Gå till sidan
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
