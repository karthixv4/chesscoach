import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Upload, LayoutGrid, RotateCcw, Users, ImagePlus, Loader2, Calendar, Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { createHomework, updateHomework } from "../../store/classroomsSlice";
import { uploadImages } from "../../lib/cloudinaryService";

import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

const ChessboardAny = Chessboard;

export default function AssignHomeworkModal({
  classroomId,
  onClose,
  homework,
}) {
  const dispatch = useDispatch();
  const { classrooms, status } = useSelector((state) => state.classrooms);

  const resolveInitialType = (backendType) => {
    if (!backendType) return "worksheet";
    const t = backendType.toLowerCase();
    if (t === "puzzle") return "puzzle";
    if (t === "image" || t === "worksheet") return "worksheet";
    return "board";
  };

  const [title, setTitle] = useState(homework?.title || "");
  const [type, setType] = useState(resolveInitialType(homework?.type));
  const [description, setDescription] = useState(homework?.description || "");
  const [selectedClassroomId, setSelectedClassroomId] = useState(classroomId);
  const [dueDate, setDueDate] = useState(
    homework?.dueDate ? new Date(homework.dueDate).toISOString().split('T')[0] : ""
  );
  const dueDateRef = useRef(null);

  // Worksheet specific
  const [fileUrl, setFileUrl] = useState(homework?.fileUrl || "");

  // Image upload
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState(homework?.imageUrls || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Puzzle specific
  const [puzzleSets, setPuzzleSets] = useState(
    homework?.puzzleSets || []
  );

  const addPuzzleSet = () => {
    setPuzzleSets([...puzzleSets, { link: "", expectedCount: 10, instruction: "" }]);
  };

  const updatePuzzleSet = (index, field, value) => {
    const updated = [...puzzleSets];
    updated[index][field] = field === 'expectedCount' ? parseInt(value) || 0 : value;
    setPuzzleSets(updated);
  };

  const removePuzzleSet = (index) => {
    setPuzzleSets(puzzleSets.filter((_, i) => i !== index));
  };

  // Board specific
  const [game, setGame] = useState(
    new Chess(homework?.challenge?.fen || undefined),
  );
  const [fen, setFen] = useState(homework?.challenge?.fen || game.fen());
  const [winningMoves, setWinningMoves] = useState(
    homework?.challenge?.winningMoves || [],
  );
  const [isRecording, setIsRecording] = useState(false);
  const [boardOrientation, setBoardOrientation] = useState("white");

  useEffect(() => {
    if (homework) {
      setTitle(homework.title);
      setType(resolveInitialType(homework.type));
      setDescription(homework.description || "");
      setFileUrl(homework.fileUrl || "");
      setImagePreviews(homework.imageUrls || []);
      setImageFiles([]);
      setDueDate(homework.dueDate ? new Date(homework.dueDate).toISOString().split('T')[0] : "");
      setPuzzleSets(homework.puzzleSets || []);
      if (homework.challenge) {
        setFen(homework.challenge.fen);
        setWinningMoves(homework.challenge.winningMoves || []);
        try {
          setGame(new Chess(homework.challenge.fen || undefined));
        } catch (e) {
          setGame(new Chess());
        }
      }
    }
  }, [homework]);

  const handleImagePick = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    setImageFiles((prev) => [...prev, ...picked]);
    const newPreviews = picked.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle FEN updates from input (now handled directly in onChange)
  // But we still need this for when 'fen' state changes from elsewhere (like handlePieceDrop)
  // Actually, handlePieceDrop updates 'game' directly.
  // So we only need to sync 'game' to 'fen' when 'game' changes?
  // No, 'handlePieceDrop' updates 'fen' from 'game'.
  // Let's keep a simplified version for when 'fen' is updated programmatically.
  useEffect(() => {
    if (!isRecording) {
      try {
        const newGame = new Chess(fen || undefined);
        if (newGame.fen() !== game.fen()) {
          setGame(newGame);
        }
      } catch (e) {}
    }
  }, [fen, isRecording]);

  const handlePieceDrop = useCallback(
    (sourceSquare, targetSquare, piece) => {
      console.log("handlePieceDrop", { sourceSquare, targetSquare, piece });
      try {
        const gameCopy = new Chess(game.fen());
        const isPromotion =
          piece &&
          piece.toLowerCase().endsWith("p") &&
          (targetSquare.endsWith("8") || targetSquare.endsWith("1"));

        const move = gameCopy.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: isPromotion ? "q" : undefined,
        });

        console.log("moveResult", move);

        if (move) {
          setGame(gameCopy);
          const newFen = gameCopy.fen();
          if (isRecording) {
            setWinningMoves([...winningMoves, move.san]);
          } else {
            setFen(newFen);
            setWinningMoves([]);
          }
          return true;
        }
      } catch (e) {
        console.error("Move error:", e);
        return false;
      }
      return false;
    },
    [game, isRecording, winningMoves],
  );

  const handleResetBoard = () => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setWinningMoves([]);
    setIsRecording(false);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setWinningMoves([]);
    // When starting recording, the current FEN is the starting position
    setFen(game.fen());
  };

  const toggleTurn = () => {
    try {
      const fenParts = game.fen().split(" ");
      fenParts[1] = fenParts[1] === "w" ? "b" : "w";
      fenParts[3] = "-"; // Clear en passant target to prevent invalid FEN errors
      const newFen = fenParts.join(" ");

      const newGame = new Chess(newFen);
      setGame(newGame);

      if (!isRecording) {
        setFen(newFen);
      }
    } catch (e) {
      console.error("Failed to toggle turn", e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);

      // Upload only newly picked files; keep already-known URLs from imagePreviews
      const existingUrls = imagePreviews.filter((p) => p.startsWith('http'));
      let freshUrls = [];
      if (imageFiles.length > 0) {
        freshUrls = await uploadImages(imageFiles);
      }
      const imageUrls = [...existingUrls, ...freshUrls];

      // Map UI types to backend enum: BOARD | TEXT | VIDEO | IMAGE | PUZZLE
      const typeMap = { board: "BOARD", worksheet: "IMAGE", puzzle: "PUZZLE" };
      const backendType = typeMap[type] || "IMAGE";

      const homeworkData = {
        id: homework?.id || `hw-${Date.now()}`,
        title,
        type: backendType,
        status: homework?.status || "assigned",
        imageUrls,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      };

      if (type === "puzzle") {
        homeworkData.puzzleSets = puzzleSets.filter(ps => ps.link.trim() !== "");
        homeworkData.description = description;
      } else if (type === "worksheet") {
        homeworkData.description = description;
        homeworkData.fileUrl = fileUrl || "#";
      } else {
        homeworkData.challenge = {
          id: homework?.challenge?.id || `ch-${Date.now()}`,
          fen: fen,
          winningMoves: winningMoves,
          orientation: boardOrientation,
          description,
        };
      }

      if (homework) {
        await dispatch(
          updateHomework({
            classroomId: selectedClassroomId,
            homeworkId: homework.id,
            homeworkData,
          }),
        ).unwrap();
      } else {
        delete homeworkData.id;
        if (homeworkData.challenge) delete homeworkData.challenge.id;
        await dispatch(
          createHomework({
            classroomId: selectedClassroomId,
            homeworkData,
          }),
        ).unwrap();
      }

      onClose();
    } catch (err) {
      console.error('Image upload failed:', err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log("AssignHomeworkModal render", {
    fen,
    gameFen: game.fen(),
    isRecording,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 pb-10 bg-slate-900/80 overflow-y-auto">
      {isSubmitting && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-md">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-emerald-400 font-medium">Saving homework...</p>
          </div>
        </div>
      )}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-8">
        <div className="flex justify-between items-center p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <h2 className="text-xl font-semibold text-white">Assign Homework</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Select Student
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={selectedClassroomId}
                  onChange={(e) => setSelectedClassroomId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 appearance-none"
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.studentName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Homework Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                placeholder="e.g., Mate in 2 Puzzles"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Due Date <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <div
                className="relative flex items-center w-full bg-slate-900 border border-slate-700 hover:border-emerald-500 focus-within:border-emerald-500 rounded-xl px-4 py-2.5 cursor-pointer transition-colors group"
                onClick={() => { try { dueDateRef.current?.showPicker(); } catch { dueDateRef.current?.focus(); } }}
              >
                <Calendar className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors mr-3 flex-shrink-0" />
                <span className={`text-sm ${dueDate ? 'text-white' : 'text-slate-500'}`}>
                  {dueDate
                    ? new Date(dueDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
                    : 'Click to choose a due date'}
                </span>
                {dueDate && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDueDate(''); }}
                    className="ml-auto text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <input
                  ref={dueDateRef}
                  type="date"
                  value={dueDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  tabIndex={-1}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Homework Type
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setType("worksheet")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${
                    type === "worksheet"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                      : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <Upload className="w-6 h-6 mb-2" />
                  <span className="font-medium text-sm text-center">Worksheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType("board")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${
                    type === "board"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                      : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <LayoutGrid className="w-6 h-6 mb-2" />
                  <span className="font-medium text-sm text-center">Board</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType("puzzle")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${
                    type === "puzzle"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                      : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <LinkIcon className="w-6 h-6 mb-2" />
                  <span className="font-medium text-sm text-center">Puzzles</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Description / Instructions
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none h-24"
                placeholder="Explain what the student needs to do..."
              />
            </div>

            {type === "puzzle" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-300">
                    Puzzle Sets
                  </label>
                  <button
                    type="button"
                    onClick={addPuzzleSet}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Link
                  </button>
                </div>
                
                {puzzleSets.length === 0 ? (
                  <div className="text-center p-6 border border-dashed border-slate-700 rounded-xl text-slate-500">
                    Click "Add Link" to assign puzzles.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {puzzleSets.map((ps, index) => (
                      <div key={index} className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-4 relative group">
                        <button
                          type="button"
                          onClick={() => removePuzzleSet(index)}
                          className="absolute top-3 right-3 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Puzzle Link</label>
                          <input
                            type="url"
                            required
                            value={ps.link}
                            onChange={(e) => updatePuzzleSet(index, 'link', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                            placeholder="https://lichess.org/training/tactics"
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-slate-400 mb-1">No. Puzzles</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={ps.expectedCount}
                              onChange={(e) => updatePuzzleSet(index, 'expectedCount', e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-400 mb-1">Remarks / Instructions</label>
                            <input
                              type="text"
                              value={ps.instruction}
                              onChange={(e) => updatePuzzleSet(index, 'instruction', e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                              placeholder="e.g. Focus on endgames"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : type === "worksheet" ? (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  File URL
                </label>
                <input
                  type="text"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="https://example.com/worksheet.pdf"
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Starting FEN Position
                  </label>
                  <input
                    type="text"
                    required
                    value={fen}
                    onChange={(e) => {
                      const newFen = e.target.value;
                      setFen(newFen);
                      setIsRecording(false);
                      setWinningMoves([]);
                      try {
                        const newGame = new Chess(newFen || undefined);
                        if (newGame.fen() !== game.fen()) {
                          setGame(newGame);
                        }
                      } catch (e) {
                        // ignore invalid FEN while typing
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
                    placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                  />

                  <p className="text-xs text-slate-500 mt-1">
                    Paste a FEN or play moves on the board below to reach the
                    desired starting position.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="w-full max-w-[340px] mx-auto space-y-4">
                    <div className="relative rounded-lg overflow-hidden shadow-xl border-4 border-slate-700 aspect-square">
                      <ChessboardAny
                        id="assign-homework-board"
                        position={game.fen()}
                        onPieceDrop={handlePieceDrop}
                        boardOrientation={boardOrientation}
                        customDarkSquareStyle={{ backgroundColor: "#334155" }}
                        customLightSquareStyle={{ backgroundColor: "#94a3b8" }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setBoardOrientation((prev) =>
                            prev === "white" ? "black" : "white",
                          )
                        }
                        className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                      >
                        Flip Board
                      </button>
                      <button
                        type="button"
                        onClick={toggleTurn}
                        className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                      >
                        Change Turn ({game.turn() === "w" ? "White" : "Black"})
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-4">
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex-1 min-h-[200px] flex flex-col">
                      <h3 className="text-sm font-medium text-slate-300 mb-3">
                        Answer Key (Winning Moves)
                      </h3>
                      <div className="flex-1 overflow-y-auto max-h-[200px] mb-4">
                        {winningMoves.length > 0 ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                              {(() => {
                                const isBlackToMove = fen.split(" ")[1] === "b";
                                const movesToRender = isBlackToMove
                                  ? ["...", ...winningMoves]
                                  : [...winningMoves];

                                return movesToRender
                                  .reduce((acc, move, i) => {
                                    if (i % 2 === 0) {
                                      acc.push({
                                        white: move,
                                        black: movesToRender[i + 1],
                                      });
                                    }
                                    return acc;
                                  }, [])
                                  .map((pair, i) => (
                                    <React.Fragment
                                      key={`move-pair-${i}-${pair.white}-${pair.black || ""}`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500 w-4">
                                          {i + 1}.
                                        </span>
                                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-sm font-mono flex-1 text-center">
                                          {pair.white}
                                        </span>
                                      </div>
                                      {pair.black && (
                                        <div className="flex items-center gap-2">
                                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-sm font-mono flex-1 text-center">
                                            {pair.black}
                                          </span>
                                        </div>
                                      )}
                                    </React.Fragment>
                                  ));
                              })()}
                            </div>
                            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                              <p className="text-xs text-slate-400 font-mono break-all leading-relaxed">
                                <span className="text-emerald-500 font-bold mr-2">
                                  Moves:
                                </span>
                                {(() => {
                                  const isBlackToMove =
                                    fen.split(" ")[1] === "b";
                                  const movesToRender = isBlackToMove
                                    ? ["...", ...winningMoves]
                                    : [...winningMoves];
                                  return movesToRender.map((m, i) => (
                                    <span key={`move-span-${i}`}>
                                      {i % 2 === 0
                                        ? `${Math.floor(i / 2) + 1}. `
                                        : ""}
                                      {m}{" "}
                                    </span>
                                  ));
                                })()}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic">
                            No moves recorded yet.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 mt-auto">
                        {!isRecording ? (
                          <button
                            type="button"
                            onClick={handleStartRecording}
                            className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors border border-emerald-500/50"
                          >
                            Start Recording Solution
                          </button>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="w-full py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium border border-red-500/50 text-center animate-pulse">
                              Recording... Play moves on board
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsRecording(false)}
                              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                            >
                              Stop Recording
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleResetBoard}
                          className="w-full py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" /> Reset Board
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Image Upload Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">Attach Reference Images (optional)</label>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleImagePick}
            />
            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt={`preview-${i}`} className="w-20 h-20 object-cover rounded-xl border border-slate-600" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-600 hover:border-emerald-500 rounded-xl text-slate-400 hover:text-emerald-400 transition-colors text-sm"
            >
              <ImagePlus className="w-4 h-4" />
              Add Images
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700 sticky bottom-0 bg-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Assign Homework"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
