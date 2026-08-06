import { Avatar, Button, Empty, Input, Spin, Typography } from "antd";
import { format, isSameDay } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiSend } from "react-icons/fi";
import { toast } from "sonner";
import { BRAND } from "../../config";
import { getSocket } from "../../lib/socket";
import {
  useGetMessagesQuery,
  useMarkMessagesReadMutation,
  useSendMessageRestMutation,
  type TMessage,
} from "../../redux/api/projectApi";
import { useAppSelector } from "../../redux/hooks";

const dayLabel = (date: Date) => {
  const today = new Date();
  if (isSameDay(date, today)) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Yesterday";
  return format(date, "d MMMM yyyy");
};

const ProjectChat = ({ projectId }: { projectId: string }) => {
  const currentUser = useAppSelector((s) => s.auth.user);
  const { data, isFetching } = useGetMessagesQuery({ id: projectId, limit: 40 });
  const [sendRest] = useSendMessageRestMutation();
  const [markRead] = useMarkMessagesReadMutation();

  const [messages, setMessages] = useState<TMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();

  // Seed from the REST history, then keep it live over the socket.
  useEffect(() => {
    if (data?.data?.messages) setMessages(data.data.messages);
  }, [data]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() =>
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    );
  }, []);

  useEffect(scrollToBottom, [messages.length, scrollToBottom]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("project:join", projectId, (ok: boolean) => {
      if (!ok) toast.error("You don't have access to this project's chat");
    });

    const onMessage = (payload: { projectId: string; message: TMessage }) => {
      if (payload.projectId !== projectId) return;
      setMessages((prev) =>
        prev.some((m) => m._id === payload.message._id)
          ? prev
          : [...prev, payload.message]
      );
    };

    const onTyping = (payload: {
      projectId: string;
      name: string;
      typing: boolean;
    }) => {
      if (payload.projectId !== projectId) return;
      setTypingUsers((prev) =>
        payload.typing
          ? prev.includes(payload.name)
            ? prev
            : [...prev, payload.name]
          : prev.filter((n) => n !== payload.name)
      );
    };

    socket.on("message:new", onMessage);
    socket.on("typing", onTyping);

    void markRead(projectId);

    return () => {
      socket.emit("project:leave", projectId);
      socket.off("message:new", onMessage);
      socket.off("typing", onTyping);
    };
  }, [projectId, markRead]);

  const emitTyping = (typing: boolean) => {
    getSocket()?.emit("typing", { projectId, typing });
  };

  const onChange = (value: string) => {
    setDraft(value);
    emitTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 1500);
  };

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    emitTyping(false);

    const socket = getSocket();

    if (socket?.connected) {
      socket.emit(
        "message:send",
        { projectId, body },
        (res: { ok: boolean; error?: string }) => {
          setSending(false);
          if (res?.ok) setDraft("");
          else toast.error(res?.error ?? "Could not send the message");
        }
      );
      return;
    }

    // The socket is down — fall back to REST so chat still works.
    try {
      const res = await sendRest({ id: projectId, body }).unwrap();
      setMessages((prev) => [...prev, res.data]);
      setDraft("");
    } catch {
      toast.error("Could not send the message");
    } finally {
      setSending(false);
    }
  };

  let lastDay = "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "60vh" }}>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {isFetching && messages.length === 0 && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin />
          </div>
        )}

        {!isFetching && messages.length === 0 && (
          <Empty
            description="No messages yet — say hello"
            style={{ margin: "auto" }}
          />
        )}

        {messages.map((message) => {
          const isMine = message.sender?._id === currentUser?._id;
          const day = dayLabel(new Date(message.createdAt));
          const showDay = day !== lastDay;
          lastDay = day;

          if (message.system) {
            return (
              <div key={message._id}>
                {showDay && (
                  <div style={{ textAlign: "center", margin: "12px 0" }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {day}
                    </Typography.Text>
                  </div>
                )}
                <div style={{ textAlign: "center" }}>
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 12, fontStyle: "italic" }}
                  >
                    {message.body}
                  </Typography.Text>
                </div>
              </div>
            );
          }

          return (
            <div key={message._id}>
              {showDay && (
                <div style={{ textAlign: "center", margin: "12px 0" }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {day}
                  </Typography.Text>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: isMine ? "flex-end" : "flex-start",
                }}
              >
                {!isMine && (
                  <Avatar
                    size={30}
                    src={message.sender?.avatar}
                    style={{
                      background: BRAND.colorNavy,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {message.sender?.name?.[0]?.toUpperCase()}
                  </Avatar>
                )}
                <div style={{ maxWidth: "70%" }}>
                  {!isMine && (
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: 11, marginLeft: 4 }}
                    >
                      {message.sender?.name}
                    </Typography.Text>
                  )}
                  <div
                    style={{
                      background: isMine ? BRAND.colorPrimary : "rgba(128,128,128,.15)",
                      color: isMine ? BRAND.colorNavy : undefined,
                      padding: "8px 12px",
                      borderRadius: 12,
                      borderTopRightRadius: isMine ? 2 : 12,
                      borderTopLeftRadius: isMine ? 12 : 2,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {message.body}
                  </div>
                  <Typography.Text
                    type="secondary"
                    style={{
                      fontSize: 10,
                      display: "block",
                      textAlign: isMine ? "right" : "left",
                      marginTop: 2,
                    }}
                  >
                    {format(new Date(message.createdAt), "h:mm a")}
                  </Typography.Text>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {typingUsers.length > 0 && (
        <Typography.Text
          type="secondary"
          style={{ fontSize: 12, padding: "0 8px 4px" }}
        >
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…
        </Typography.Text>
      )}

      <div style={{ display: "flex", gap: 8, paddingTop: 10 }}>
        <Input.TextArea
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write a message…"
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <Button
          type="primary"
          icon={<FiSend />}
          loading={sending}
          onClick={send}
          disabled={!draft.trim()}
        />
      </div>
    </div>
  );
};

export default ProjectChat;
