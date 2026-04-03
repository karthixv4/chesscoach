import { Chess } from 'chess.js';
const c = new Chess();
try {
  c.loadPgn('e4 e5 Nf3 Nc6');
  console.log('Success:', c.fen());
} catch (e) {
  console.error('Error:', e.message);
}
