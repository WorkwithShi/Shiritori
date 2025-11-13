import { useState } from "react";
import { db, ref, set, get, onValue } from "../firebaseConfig";
import { PlusCircle, LogIn, AlertCircle, Users, Sparkles, Copy } from "lucide-react";

export default function RoomSetup({ onJoin }) {
  const [roomCode, setRoomCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [mode, setMode] = useState("create");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [waiting, setWaiting] = useState(false);

  const generateCode = () => Math.random().toString(36).substring(2, 7).toUpperCase();

  const showStatus = (msg, duration = 3000) => {
    setStatus(msg);
    if (duration) setTimeout(() => setStatus(""), duration);
  };

  const createRoom = async () => {
    if (!nickname.trim()) return showStatus("Please enter your nickname!");
    setLoading(true);

    const code = generateCode();
    setRoomCode(code);

    try {
      await set(ref(db, `rooms/${code}`), {
        host: nickname,
        players: { [nickname]: true },
        words: [],
        turn: nickname,
        status: "waiting",
        isHost: true,
        createdAt: Date.now(),
      });

      setWaiting(true);
      showStatus("Room created! Waiting for opponent...");

      onJoin(code, nickname, true);

      // Listen for opponent joining
      const playersRef = ref(db, `rooms/${code}/players`);
      const unsubscribe = onValue(playersRef, (snapshot) => {
        const players = snapshot.val();
        if (players && Object.keys(players).length >= 2) {
          showStatus("Opponent joined! Game starting...", 2000);
          setWaiting(false);
          unsubscribe();
        }
      });
    } catch (err) {
      console.error("Room creation error:", err);
      showStatus(`Failed to create room: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!nickname.trim() || !roomCode.trim())
      return showStatus("Enter both nickname and room code.");
    setLoading(true);

    try {
      const roomRef = ref(db, `rooms/${roomCode}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) return showStatus("Room not found!");

      const room = snapshot.val();
      if (Object.keys(room.players).length >= 2) return showStatus("Room is full!");
      if (room.players[nickname]) return showStatus("Nickname already taken!");

      await set(ref(db, `rooms/${roomCode}/players/${nickname}`), true);
      await set(ref(db, `rooms/${roomCode}/status`), "playing");
      await set(ref(db, `rooms/${roomCode}/isHost`), false);

      onJoin(roomCode, nickname, false); 
    } catch (err) {
      console.error("Join room error:", err);
      showStatus(`Failed to join room: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    showStatus("Room code copied!");
  };

  return (
    <div className="room-container">
      {/* Header */}
      <div className="room-header">
        <Sparkles size={32} className="text-pink-500" />
        <h1>Shiritori Online</h1>
      </div>

      {/* Mode toggle */}
      <div className="mode-toggle">
        <button className={mode === "create" ? "active" : ""} onClick={() => setMode("create")}>
          <PlusCircle size={18} /> Create Room
        </button>
        <button className={mode === "join" ? "active" : ""} onClick={() => setMode("join")}>
          <LogIn size={18} /> Join Room
        </button>
      </div>

      {/* Inputs */}
      <div className="input-group">
        <input
          type="text"
          placeholder="Enter your nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

        {mode === "join" && (
          <input
            type="text"
            placeholder="Enter room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          />
        )}

        {/* Show room code for host */}
        {mode === "create" && waiting && (
          <div className="room-code-display">
            Room Code: {roomCode}
            <button onClick={copyCode} className="copy-btn">
              <Copy size={16} />
            </button>
          </div>
        )}

        <button onClick={mode === "create" ? createRoom : joinRoom} disabled={loading || waiting}>
          {loading ? "..." : mode === "create" ? "Create Room" : "Join Room"}
        </button>
      </div>

      {/* Status */}
      {status && (
        <div className="status-message">
          <AlertCircle size={16} /> <span>{status}</span>
        </div>
      )}

      {/* Footer */}
      <div className="footer-info">
        <Users size={16} /> <span>Multiplayer powered by Firebase</span>
      </div>
    </div>
  );
}
