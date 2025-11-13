import React, { useState, useEffect } from "react";
import RoomSetup from "./components/RoomSetup";
import OnlineGame from "./components/OnlineGame";
import { isValidWord } from "./utils/wordValidation";
import { db, ref, set, update, onValue } from "./firebaseConfig";

export default function App() {
  const [room, setRoom] = useState(null);
  const [words, setWords] = useState([]);
  const [turn, setTurn] = useState("");
  const [timer, setTimer] = useState(10);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const [players, setPlayers] = useState({});
  const [input, setInput] = useState("");

  // Handle joining or creating a room
  const handleJoin = (roomCode, nickname, isHost) => {
    const roomRef = ref(db, `rooms/${roomCode}`);

    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      setWords(data.words || []);
      setTurn(data.turn || "");
      setGameOver(data.status === "finished");
      setMessage(data.message || "");
      setPlayers(data.players || {});

      setRoom({
        code: roomCode,
        nickname,
        isHost,
        players: data.players || {},
      });

      if (data.status === "waiting") {
        setMessage("Waiting for opponent to join...");
      }
    });
  };

  // Timer logic
  useEffect(() => {
    if (!room || gameOver) return;

    if (timer === 0) {
      const winner = turn === room.nickname ? "Opponent" : "You";
      setMessage(`Time's up! ${winner} wins!`);
      setGameOver(true);
      update(ref(db, `rooms/${room.code}`), {
        status: "finished",
        message: `Time's up! ${winner} wins!`,
      });
      return;
    }

    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, gameOver, turn, room]);

  // Handle submitting a word
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!room) return;

    const trimmedWord = input.trim();
    if (!trimmedWord) return;

    setChecking(true);
    const result = await isValidWord(trimmedWord);
    setChecking(false);

    if (!result.valid) {
      setMessage(
        result.source === "not-found"
          ? `"${trimmedWord}" not found!`
          : `Couldn't verify "${trimmedWord}"`
      );
      return;
    }

    if (words.includes(trimmedWord)) {
      setMessage(`"${trimmedWord}" has already been used.`);
      return;
    }

    const lastWord = words[words.length - 1];
    if (lastWord && trimmedWord[0] !== lastWord.slice(-1)) {
      setMessage(`Must start with "${lastWord.slice(-1)}".`);
      return;
    }

    const newWords = [...words, trimmedWord];
    const nextTurn = Object.keys(players).find((p) => p !== room.nickname);

    await update(ref(db, `rooms/${room.code}`), {
      words: newWords,
      turn: nextTurn,
    });

    if (trimmedWord.endsWith("ん")) {
      const winner = turn === room.nickname ? "Opponent" : "You";
      setMessage(`"${trimmedWord}" ends with ん — ${winner} wins!`);
      setGameOver(true);
      await update(ref(db, `rooms/${room.code}`), {
        status: "finished",
        message: `"${trimmedWord}" ends with ん — ${winner} wins!`,
      });
      return;
    }

    setWords(newWords);
    setTurn(nextTurn);
    setInput("");
    setTimer(10);
  };

  // Restart the game
  const handleRestart = async () => {
    if (!room) return;

    const hostNickname = room.nickname;

    await set(ref(db, `rooms/${room.code}`), {
      host: hostNickname,
      players: { [hostNickname]: true },
      words: [],
      turn: hostNickname,
      status: "waiting",
      createdAt: Date.now(),
    });

    setWords([]);
    setTurn(hostNickname);
    setTimer(10);
    setGameOver(false);
    setMessage("Waiting for opponent to join...");
    setPlayers({ [hostNickname]: true });
    setInput("");
  };

  // Waiting screen if second player hasn't joined yet
  if (!room) return <RoomSetup onJoin={handleJoin} />;
  if (!gameOver && Object.keys(players).length < 2) {
    return (
      <div className="waiting-screen">
        <h2>Waiting for opponent to join...</h2>
        <p>Room Code: {room.code} (share this with your friend)</p>
      </div>
    );
  }

  return (
    <OnlineGame
      room={room}
      words={words}
      turn={turn}
      timer={timer}
      gameOver={gameOver}
      message={message}
      checking={checking}
      input={input}
      onInputChange={setInput}
      onSubmit={handleSubmit}
      onRestart={handleRestart}
    />
  );
}
