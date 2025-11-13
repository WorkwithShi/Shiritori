import { useState, useEffect } from "react";
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

  const createRoom = async () => {
    if (!nickname.trim()) return setStatus("Please enter your nickname!");
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
      setStatus("Room created! Waiting for opponent...");
      onJoin({ code, isHost: true }, nickname, true);

      // Listen for opponent
      const playersRef = ref(db, `rooms/${code}/players`);
      const unsubscribe = onValue(playersRef, (snapshot) => {
        const players = snapshot.val();
        if (players && Object.keys(players).length >= 2) {
          setStatus("Opponent joined! Game starting...");
          setWaiting(false);
          unsubscribe(); // stop listening
        }
      });
    } catch (err) {
      setStatus("Failed to create room. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!nickname.trim() || !roomCode.trim()) return setStatus("Enter both nickname and room code.");
    setLoading(true);

    try {
      const roomRef = ref(db, `rooms/${roomCode}`);
      const snapshot = await get(roomRef);
      if (!snapshot.exists()) return setStatus("Room not found!");

      const room = snapshot.val();
      if (Object.keys(room.players).length >= 2) return setStatus("Room is full!");
      if (room.players[nickname]) return setStatus("Nickname already taken!");

      await set(ref(db, `rooms/${roomCode}/players/${nickname}`), true);
      await set(ref(db, `rooms/${roomCode}/status`), "playing"); // start game
      await set(ref(db, `rooms/${roomCode}/isHost`), false);

      onJoin({ code: roomCode, isHost: false }, nickname, false);
    } catch (err) {
      console.error(err);
      setStatus("Failed to join room. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setStatus("Room code copied!");
    setTimeout(() => setStatus(""), 3000);
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
