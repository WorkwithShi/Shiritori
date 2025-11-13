import React from "react";
import { Cat, Rabbit, RotateCcw, Send, AlertTriangle, Clock } from "lucide-react";
import "../styles.css";

export default function OnlineGame({
  room,
  words,
  input,
  turn,
  timer,
  gameOver,
  message,
  checking,
  onInputChange,
  onSubmit,
  onRestart,
  restarting,
}) {
  if (!room) return null;

  const isPlayerTurn = turn === room.nickname;

  // Determine opponent info
  const opponentName = Object.keys(room.players).find((p) => p !== room.nickname) || "Opponent";
  const lastWord = words[words.length - 1] || "";

  return (
    <div className="game-container">
      {/* Room Info */}
      <div className="room-info">
        <span className="room-code">Room: {room.code}</span>
        <span className="nickname">You: {room.nickname}</span>
      </div>

      {/* Opponent */}
      <div className={`player opponent ${!isPlayerTurn ? "active-turn" : ""}`}>
        <Cat className="avatar-icon" size={48} />
        <div className="name">{opponentName}</div>
        <div className="last-word">{!isPlayerTurn ? lastWord : ""}</div>
      </div>

      {/* Timer */}
      <div className="timer">
        <Clock className="timer-icon" size={28} />
        <span className="timer-value">{timer}</span>
      </div>

      {/* Player */}
      <div className={`player self ${isPlayerTurn ? "active-turn" : ""}`}>
        <Rabbit className="avatar-icon" size={48} />
        <div className="name">{room.nickname}</div>
        <div className="last-word">{isPlayerTurn ? lastWord : ""}</div>

        <form
          className="input-area"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(e);
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Enter word..."
            className="word-input"
            disabled={gameOver || !isPlayerTurn}
          />
          <button
            type="submit"
            className="submit-btn"
            disabled={checking || gameOver || !isPlayerTurn}
          >
            {checking ? "..." : <Send size={18} />}
          </button>
        </form>
      </div>

      {/* Floating Message */}
      {message && !gameOver && (
        <div className="floating-message">
          <AlertTriangle size={16} />
          <span>{message}</span>
        </div>
      )}

      {/* Game Over */}
      {gameOver && (
  <div className="game-over">
    <h2>{message || "Game Over"}</h2>
    <button
      onClick={onRestart}
      className="restart-btn"
      disabled={restarting} // now works!
    >
      {restarting ? "Restarting..." : <><RotateCcw size={18} /> Restart</>}
    </button>
  </div>
)}

    </div>
  );
}
