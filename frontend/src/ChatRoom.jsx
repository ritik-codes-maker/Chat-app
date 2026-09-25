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

const ChatRoom = ()=>{
    const [messages , setMessages ] = useState([]);
    const [user, setUser] = useState("");
    const [message , setMessage ] = useState("");
    const socketRef = useRef(null);

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
        })
        socketRef.current.on("message",(newMessage)=>{
            setMessages((prev)=>[...prev, newMessage]);
        });
        socketRef.current.on("disconnect", (reason)=>{
            console.log("socket disconnected", reason);
        });
        return () =>{
            if(socketRef.current){
                socketRef.current.off("message");
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        }
    }, []);

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

    return (
    <div className='ChatRoomContainer'>
      <h2>Chat Room</h2>
      <ul className="message-list">
        {messages.map((msg) => (
          <li key={msg._id} className="message-item">
            <span
              className="message-avatar"
              style={{ backgroundColor: getAvatarColor(msg.user) }}
              aria-hidden="true"
            >
              {getInitial(msg.user)}
            </span>
            <div className="message-body">
              <span className="message-user">{msg.user || "Unknown"}</span>
              <span className="message-text">{msg.message}</span>
            </div>
          </li>
        ))}
      </ul>
      <div>
        <input
          type="text"
          placeholder="Your name"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
        <input
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendMessages}>Send</button>
      </div>
    </div>
  );
}

export default ChatRoom;