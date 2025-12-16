import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export default function App() {
  const socket = useRef(null);

  const [name, setName] = useState('');
  const [input, setInput] = useState('');
  const [joined, setJoined] = useState(false);

  const [users, setUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState('group');
  const [messages, setMessages] = useState({ group: [] });
  const [text, setText] = useState('');

  const [showUsers, setShowUsers] = useState(false); // 👈 mobile users panel

  // SOCKET
  useEffect(() => {
    socket.current = io(import.meta.env.VITE_BACKEND_URL);


    socket.current.on('users', (list) => setUsers(list));

    socket.current.on('chatMessage', (msg) => {
      setMessages((prev) => ({
        ...prev,
        group: [...prev.group, msg],
      }));
    });

    socket.current.on('privateMessage', (msg) => {
      setMessages((prev) => ({
        ...prev,
        [msg.sender]: [...(prev[msg.sender] || []), msg],
      }));
    });

    return () => socket.current.disconnect();
  }, []);

  // JOIN
  function joinApp(e) {
    e.preventDefault();
    if (!input.trim()) return;
    socket.current.emit('joinRoom', input);
    setName(input);
    setJoined(true);
  }

  // OPEN PRIVATE CHAT
  function openPrivate(user) {
    setCurrentChat(user);
    socket.current.emit('joinPrivate', { from: name, to: user });
    setMessages((prev) => ({
      ...prev,
      [user]: prev[user] || [],
    }));
  }

  // SEND MESSAGE
  function sendMessage() {
    if (!text.trim()) return;

    const msg = { sender: name, text, ts: Date.now() };

    if (currentChat === 'group') {
      socket.current.emit('chatMessage', msg);
      setMessages((prev) => ({
        ...prev,
        group: [...prev.group, msg],
      }));
    } else {
      socket.current.emit('joinPrivate', { from: name, to: currentChat });
      socket.current.emit('privateMessage', {
        from: name,
        to: currentChat,
        msg: text,
      });
      setMessages((prev) => ({
        ...prev,
        [currentChat]: [...prev[currentChat], msg],
      }));
    }

    setText('');
  }

  const currentMessages = messages[currentChat] || [];

  // LOGIN SCREEN
  if (!joined) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-zinc-900 text-white">
        <form
          onSubmit={joinApp}
          className="bg-zinc-800 p-6 rounded-2xl w-80 shadow-xl"
        >
          <h2 className="text-xl font-semibold mb-4 text-center">
            Join Chat
          </h2>
          <input
            className="w-full bg-zinc-700 border border-zinc-600 px-4 py-2 rounded-lg mb-4 outline-none"
            placeholder="Your name"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="w-full bg-emerald-600 py-2 rounded-lg font-medium">
            Continue
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-zinc-900 text-white flex overflow-hidden">

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex md:w-64 flex-col bg-zinc-800 border-r border-zinc-700 p-3">
        <div
          onClick={() => setCurrentChat('group')}
          className={`p-2 rounded-lg cursor-pointer mb-2 ${
            currentChat === 'group' && 'bg-zinc-700'
          }`}
        >
          👥 Group Chat
        </div>

        <div className="text-xs text-zinc-400 mb-1">Private</div>

        <div className="space-y-2">
          {users.filter(u => u !== name).map(u => (
            <div
              key={u}
              onClick={() => openPrivate(u)}
              className={`px-3 py-2 rounded-lg cursor-pointer ${
                currentChat === u && 'bg-zinc-700'
              }`}
            >
              👤 {u}
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <div className="bg-zinc-800 border-b border-zinc-700 p-4 font-semibold flex justify-between items-center">
          <span>
            {currentChat === 'group'
              ? 'Group Chat'
              : `Chat with ${currentChat}`}
          </span>

          {/* MOBILE USERS BUTTON */}
          <button
            onClick={() => setShowUsers(true)}
            className="md:hidden bg-zinc-700 px-3 py-1 rounded-lg text-sm"
          >
            Users
          </button>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {currentMessages.map((m, i) => {
            const mine = m.sender === name;
            return (
              <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                    mine
                      ? 'bg-emerald-600 rounded-br-none'
                      : 'bg-zinc-700 rounded-bl-none'
                  }`}
                >
                  <div className="text-xs opacity-70">{m.sender}</div>
                  <div>{m.text}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* INPUT */}
        <div className="bg-zinc-800 border-t border-zinc-700 p-3 flex gap-2">
          <input
            className="flex-1 bg-zinc-700 px-4 py-2 rounded-full outline-none"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={sendMessage}
            className="bg-emerald-600 px-6 rounded-full font-medium"
          >
            Send
          </button>
        </div>
      </div>

      {/* MOBILE USERS OVERLAY */}
      {showUsers && (
        <div className="fixed inset-0 bg-zinc-900 z-50 md:hidden flex flex-col">
          <div className="p-4 border-b border-zinc-700 flex justify-between">
            <span className="font-semibold">Chats</span>
            <button
              onClick={() => setShowUsers(false)}
              className="bg-zinc-700 px-3 py-1 rounded text-sm"
            >
              Close
            </button>
          </div>

          <div className="p-4 space-y-2 overflow-y-auto">
            <div
              onClick={() => {
                setCurrentChat('group');
                setShowUsers(false);
              }}
              className="p-3 rounded-lg bg-zinc-800 cursor-pointer"
            >
              👥 Group Chat
            </div>

            {users.filter(u => u !== name).map(u => (
              <div
                key={u}
                onClick={() => {
                  openPrivate(u);
                  setShowUsers(false);
                }}
                className="p-3 rounded-lg bg-zinc-800 cursor-pointer"
              >
                👤 {u}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
