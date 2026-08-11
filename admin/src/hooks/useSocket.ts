import { useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { baseApi } from "../redux/api/baseApi";
import { connectSocket, disconnectSocket } from "../lib/socket";
import { useAppDispatch, useAppSelector } from "../redux/hooks";

type TNotificationPayload = {
  _id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
};

/** Cache tags to refresh when each event type arrives. */
const TAGS_BY_TYPE: Record<string, Parameters<typeof baseApi.util.invalidateTags>[0]> = {
  "lead.new": ["Lead", "Notification", "Dashboard"],
  "meeting.new": ["Meeting", "Notification", "Dashboard"],
  "meeting.upcoming": ["Meeting", "Notification"],
  "attendance.absent": ["Attendance", "Notification"],
};

/**
 * Connects the admin panel to the realtime feed. Incoming events show a toast
 * and invalidate the matching RTK Query caches so open tables refresh
 * themselves without a manual reload.
 */
export const useSocket = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    if (!token || !user) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(() => token);

    const onNotification = (payload: TNotificationPayload) => {
      dispatch(
        baseApi.util.invalidateTags(
          TAGS_BY_TYPE[payload.type] ?? ["Notification"]
        )
      );

      toast(payload.title, {
        description: payload.body,
        action: payload.link
          ? { label: "View", onClick: () => navigate(payload.link as string) }
          : undefined,
      });
    };

    /**
     * Any successful write anywhere in the API broadcasts the cache tags it
     * touched, so open tables refresh themselves without a reload.
     */
    const onDataChanged = (payload: { resource: string }) => {
      if (!payload?.resource) return;
      dispatch(
        baseApi.util.invalidateTags([
          payload.resource as Parameters<typeof baseApi.util.invalidateTags>[0][number],
        ])
      );
    };

    socket.on("notification:new", onNotification);
    socket.on("data:changed", onDataChanged);

    return () => {
      socket.off("notification:new", onNotification);
      socket.off("data:changed", onDataChanged);
    };
  }, [token, user, dispatch, navigate]);

  useEffect(() => () => disconnectSocket(), []);
};
