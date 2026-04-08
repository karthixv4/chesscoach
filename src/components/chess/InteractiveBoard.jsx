import { useState, useEffect, useCallback } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, MessageCircle, Check, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { createNotification } from "../../store/classroomsSlice";

const ChessboardAny = Chessboard;

export default function InteractiveBoard({
  id,
  initialFen,
  winningMoves,
  isTrainer,
  onMove,
  onSuccess,
  classroomId,
  studentName,
  targetOrientation,
}) {
  const [game, setGame] = useState(() => {
    try {
      return new Chess(initialFen || undefined);
    } catch (e) {
      return new Chess();
    }
  });
  const [moveIndex, setMoveIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [hintMessage, setHintMessage] = useState("");
  const [hintSent, setHintSent] = useState(false);
  const [boardOrientation, setBoardOrientation] = useState(() => {
    if (targetOrientation) return targetOrientation;
    try {
      const g = new Chess(initialFen || undefined);
      return g.turn() === "w" ? "white" : "black";
    } catch (e) {
      return "white";
    }
  });

  const dispatch = useDispatch();

  useEffect(() => {
    try {
      const newGame = new Chess(initialFen || undefined);
      setGame(newGame);
      setBoardOrientation(targetOrientation || (newGame.turn() === "w" ? "white" : "black"));
    } catch (e) {
      setGame(new Chess());
      setBoardOrientation(targetOrientation || "white");
    }
    setMoveIndex(0);
    setFeedback(null);
    setShowHint(false);
    setHintSent(false);
  }, [initialFen, winningMoves]);

  const handleSendHint = () => {
    if (!hintMessage.trim() || !classroomId || !studentName) return;

    dispatch(
      createNotification({
        classroomId,
        data: {
          title: `Hint Request from ${studentName}`,
          message: hintMessage + `\n\nPosition: ${game.fen()}`,
          type: "message",
        },
      }),
    );

    setHintSent(true);
    setTimeout(() => {
      setShowHint(false);
      setHintSent(false);
      setHintMessage("");
    }, 2000);
  };

  useEffect(() => {
    if (isTrainer || !winningMoves || winningMoves.length === 0) return;
    if (moveIndex >= winningMoves.length) return;

    // Determine who plays the current move
    // If the student's assigned orientation is exactly opposite of the current starting turn,
    // then the opponent plays the first move (moveIndex 0).
    const isOpponentTurnToStart = game.turn() !== boardOrientation.charAt(0);
    const isOpponentTurn = isOpponentTurnToStart
      ? moveIndex % 2 === 0
      : moveIndex % 2 === 1;

    if (isOpponentTurn) {
      const timer = setTimeout(() => {
        try {
          const gameCopy = new Chess(game.fen());
          const expectedMove = winningMoves[moveIndex];

          const moveResult = gameCopy.move(expectedMove);

          if (moveResult) {
            setGame(gameCopy);
            const nextMoveIndex = moveIndex + 1;
            setMoveIndex(nextMoveIndex);

            if (nextMoveIndex === winningMoves.length && onSuccess) {
              setTimeout(onSuccess, 1000);
            }
          }
        } catch (e) {
          console.error("Opponent move error:", e);
        }
      }, 600); // 600ms delay for realism

      return () => clearTimeout(timer);
    }
  }, [moveIndex, winningMoves, isTrainer, game, onSuccess, boardOrientation]);

  const onDrop = useCallback(
    (sourceSquare, targetSquare, piece) => {
      console.log("onDrop", { sourceSquare, targetSquare, piece });
      try {
        const gameCopy = new Chess(game.fen());

        // Check for promotion
        const isPromotion =
          piece &&
          piece.toLowerCase().endsWith("p") &&
          (targetSquare.endsWith("8") || targetSquare.endsWith("1"));

        const moveResult = gameCopy.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: isPromotion ? "q" : undefined,
        });

        console.log("moveResult", moveResult);

        if (!moveResult) return false;

        // Trainer Mode or Free Exploration (no winning moves defined)
        if (isTrainer || !winningMoves || winningMoves.length === 0) {
          setGame(gameCopy);
          if (onMove) {
            onMove(gameCopy.fen(), moveResult.san);
          }
          return true;
        }

        // Challenge Mode (Student solving a puzzle)
        if (moveIndex < winningMoves.length) {
          // Check if it's the opponent's turn dynamically
          const isOpponentTurnToStart = game.turn() !== boardOrientation.charAt(0);
          const isOpponentTurn = isOpponentTurnToStart
            ? moveIndex % 2 === 0
            : moveIndex % 2 === 1;

          if (isOpponentTurn) return false;

          const expectedMove = winningMoves[moveIndex];
          console.log("Challenge mode", {
            moveResultSan: moveResult.san,
            expectedMove,
            moveIndex,
          });

          if (moveResult.san === expectedMove) {
            setGame(gameCopy);
            const nextMoveIndex = moveIndex + 1;
            setMoveIndex(nextMoveIndex);
            setFeedback("success");
            setTimeout(() => setFeedback(null), 1000);

            if (nextMoveIndex === winningMoves.length && onSuccess) {
              setTimeout(onSuccess, 1000);
            }
            return true;
          } else {
            setFeedback("error");
            setTimeout(() => setFeedback(null), 1000);
            return false;
          }
        }

        return false;
      } catch (e) {
        console.error("Move error:", e);
        return false;
      }
    },
    [game, isTrainer, winningMoves, moveIndex, onMove, onSuccess],
  );

  const resetBoard = () => {
    try {
      setGame(new Chess(initialFen || undefined));
    } catch (e) {
      setGame(new Chess());
    }
    setMoveIndex(0);
    setFeedback(null);
  };

  console.log("InteractiveBoard render", {
    fen: game.fen(),
    moveIndex,
    feedback,
  });

  return (
    <div className="flex flex-col items-center w-full max-w-[440px] mx-auto">
      <div className="relative w-full aspect-square mb-6">
        <AnimatePresence>
          {feedback === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-emerald-500/20 backdrop-blur-sm rounded-lg pointer-events-none"
            >
              <Check className="w-24 h-24 text-emerald-400 drop-shadow-lg" />
            </motion.div>
          )}
          {feedback === "error" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-red-500/20 backdrop-blur-sm rounded-lg pointer-events-none"
            >
              <X className="w-24 h-24 text-red-400 drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`relative w-full h-full rounded-lg overflow-hidden shadow-2xl border-4 border-slate-800 ${feedback === "error" ? "animate-shake" : ""}`}
        >
          <ChessboardAny
            id={id}
            key={id || initialFen || "board"}
            position={game.fen()}
            boardOrientation={boardOrientation}
            onPieceDrop={onDrop}
            customDarkSquareStyle={{ backgroundColor: "#334155" }}
            customLightSquareStyle={{ backgroundColor: "#94a3b8" }}
            animationDuration={300}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
        <div className="flex flex-wrap justify-center sm:justify-start gap-2">
          <button
            onClick={resetBoard}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {isTrainer ? "Reset" : "Retry"}
          </button>
          <button
            onClick={() =>
              setBoardOrientation((prev) =>
                prev === "white" ? "black" : "white",
              )
            }
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Flip Board
          </button>
        </div>

        {!isTrainer && (
          <div className="relative">
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Ask Trainer
            </button>

            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full right-0 mb-2 w-72 p-4 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20"
                >
                  {hintSent ? (
                    <div className="flex flex-col items-center justify-center py-4 text-emerald-400">
                      <Check className="w-8 h-8 mb-2" />
                      <p className="text-sm font-medium">
                        Message sent to trainer!
                      </p>
                    </div>
                  ) : (
                    <>
                      <textarea
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="I'm stuck here. Can you give me a hint?"
                        rows={3}
                        value={hintMessage}
                        onChange={(e) => setHintMessage(e.target.value)}
                      />

                      <div className="flex justify-end mt-3 gap-2">
                        <button
                          onClick={() => setShowHint(false)}
                          className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-sm transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSendHint}
                          disabled={!hintMessage.trim()}
                          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                          Send
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
