import {useState , useEffect , useRef} from 'react';
import {io} from 'socket.io-client';

const AVATAR_COLORS = ["#00246b", "#0b6e6e", "#4b3f9e", "#7a2f5f", "#1f6b3b", "#9a4a1f"];

const getInitial = (name) => {
    const trimmed = (name || "").trim();
    return trimmed ? trimmed[0].toUpperCase() : "?";
};

const getAvatarColor = (name) => {
    const trimmed = (name || "").trim();
    let hash = 0;
    for (let i = 0; i < trimmed.length; i++) {
        hash = (hash * 31 + trimmed.charCodeAt(i)) % AVATAR_COLORS.length;
    }
    return AVATAR_COLORS[hash];
};

// createdAt only exists once the schema's timestamps option is fixed, so guard it.
const getTime = (msg) => {
    const stamp = msg.createdAt || msg.created;
    if (!stamp) return "";
    const date = new Date(stamp);
    return Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ChatRoom = ()=>{
    const [messages , setMessages ] = useState([]);
    const [user, setUser] = useState("");
    const [message , setMessage ] = useState("");
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);
    const bottomRef = useRef(null);

    useEffect(()=>{
        const fetchMessages = async()=>{
            try {
                const res = await fetch("http://localhost:8000/messages");
                const data = await res.json();
                console.log("messages ", messages);
                setMessages(data);

            } catch (error) {
                console.error("error fetching messages", err);

            }
        }
        fetchMessages();
        socketRef.current  = io('http://localhost:8000', {
            transports: ["websocket","polling"]
        });
        socketRef.current.on("connect", ()=>{
          console.log("connected to socket server ", socketRef.current.id)
          setConnected(true);
        })
        socketRef.current.on("message",(newMessage)=>{
            setMessages((prev)=>[...prev, newMessage]);
        });
        socketRef.current.on("disconnect", (reason)=>{
            console.log("socket disconnected", reason);
            setConnected(false);
        });
        return () =>{
            if(socketRef.current){
                socketRef.current.off("message");
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        }
    }, []);

    useEffect(()=>{
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages]);

    const sendMessages = ()=>{
        if(!user || !message) return;
        const payload = {user, message };
        if(socketRef.current && socketRef.current.connected){
            socketRef.current.emit("sendMessage" , payload);

        }else {
            console.warn("Socket got disconnected.")
        }
        setMessage("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessages();
        }
    };

    return (
    <div className='ChatRoomContainer'>
      <header className="chat-header">
        <div>
          <h2 className="chat-title">Chat Room</h2>
          <p className="chat-subtitle">
            {messages.length} {messages.length === 1 ? "message" : "messages"}
          </p>
        </div>
        <span className="chat-status" data-connected={connected}>
          <span className="chat-status-dot" />
          {connected ? "Live" : "Offline"}
        </span>
      </header>

      <ul className="message-list">
        {messages.length === 0 && (
          <li className="message-empty">No messages yet — say hello.</li>
        )}
        {messages.map((msg) => {
          const name = msg.user || "Unknown";
          const isOwn = Boolean(user) && msg.user === user;
          const time = getTime(msg);
          return (
            <li
              key={msg._id}
              className={isOwn ? "message-item is-own" : "message-item"}
            >
              <span
                className="message-avatar"
                style={{ backgroundColor: getAvatarColor(msg.user) }}
                aria-hidden="true"
              >
                {getInitial(msg.user)}
              </span>
              <div className="message-body">
                <span className="message-meta">
                  <span className="message-user">{isOwn ? "You" : name}</span>
                  {time && <span className="message-time">{time}</span>}
                </span>
                <span className="message-text">{msg.message}</span>
              </div>
            </li>
          );
        })}
        <li ref={bottomRef} aria-hidden="true" />
      </ul>

      <div className="composer">
        <input
          className="composer-name"
          type="text"
          placeholder="Your name"
          aria-label="Your name"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
        <input
          className="composer-message"
          type="text"
          placeholder="Type your message..."
          aria-label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={sendMessages} disabled={!user || !message}>
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatRoom;