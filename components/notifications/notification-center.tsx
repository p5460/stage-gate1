"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Check,
  X,
  AlertTriangle,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  data?: any;
}

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount?: number;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "PROJECT_UPDATE":
      return FileText;
    case "GATE_REVIEW":
      return ClipboardCheck;
    case "RED_FLAG":
      return AlertTriangle;
    case "DOCUMENT_UPLOAD":
      return FileText;
    case "APPROVAL":
      return Check;
    case "REJECTION":
      return X;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "PROJECT_UPDATE":
      return "text-blue-600";
    case "GATE_REVIEW":
      return "text-purple-600";
    case "RED_FLAG":
      return "text-red-600";
    case "DOCUMENT_UPLOAD":
      return "text-green-600";
    case "APPROVAL":
      return "text-green-600";
    case "REJECTION":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
};

export function NotificationCenter({
  notifications,
  unreadCount = 0,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState(notifications);

  // Sync local state with props
  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });

      if (result.ok) {
        // Update local state
        setLocalNotifications((prev: Notification[]) =>
          prev.map((n: Notification) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        toast.success("Notification marked as read");
      } else {
        toast.error("Failed to mark notification as read");
      }
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
      });

      if (result.ok) {
        // Update local state
        setLocalNotifications((prev: Notification[]) =>
          prev.map((n: Notification) => ({ ...n, isRead: true }))
        );
        toast.success("All notifications marked as read");
      } else {
        toast.error("Failed to mark all notifications as read");
      }
    } catch (error) {
      toast.error("Failed to mark all notifications as read");
    }
  };

  const unreadNotifications = localNotifications.filter(
    (n: Notification) => !n.isRead
  );

  // Use passed unreadCount or calculate from notifications
  const displayUnreadCount =
    unreadCount > 0 ? unreadCount : unreadNotifications.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {displayUnreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500">
              {displayUnreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {displayUnreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {localNotifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {localNotifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);

                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      !notification.isRead ? "bg-blue-50" : ""
                    }`}
                    onClick={() =>
                      !notification.isRead && handleMarkAsRead(notification.id)
                    }
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 ${iconColor}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p
                            className={`text-sm font-medium ${
                              !notification.isRead
                                ? "text-gray-900"
                                : "text-gray-600"
                            }`}
                          >
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p
                          className={`text-sm ${
                            !notification.isRead
                              ? "text-gray-700"
                              : "text-gray-500"
                          }`}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            {
                              addSuffix: true,
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {localNotifications.length > 0 && (
          <div className="p-2 border-t">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
