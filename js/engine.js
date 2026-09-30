/** 8 行 × 7 列消消乐，规则与原版关卡配置一致。 */
const ROWS = 8;
const COLS = 7;
const TYPES = [1, 2, 3, 4, 5];

const LEVELS = [
  { steps: 8, target: 28, weights: [0, 52, 17, 11, 10, 10] },
  { steps: 16, target: 41, weights: [0, 50, 17, 11, 11, 11] },
  { steps: 24, target: 50, weights: [0, 46, 18, 12, 12, 12] },
];

const SCORE = { 1: 50, 2: -5, 3: -10, 4: -10, 5: -20 };

const RANKS = [
  {
    min: 750,
    name: "优秀肠道卫士",
    stars: 5,
    image: "rank1.89c06a4f.png",
    tag: "tag1.d8ae3d69.png",
    comment: "你的菌群管理能力堪称大师级！好菌队伍壮大、坏菌无处藏身。继续保持，好好爱自己，好好爱肠道",
  },
  {
    min: 650,
    name: "肠道健康达人",
    stars: 4,
    image: "rank2.a6bbb56d.png",
    tag: "tag2.fccf6da1.png",
    comment: "你的菌群管理能力相当不错！有害菌基本被压制、有益菌稳步壮大。再进一步，肠道会更感谢你",
  },
  {
    min: -Infinity,
    name: "初级菌群管家",
    stars: 3,
    image: "rank3.1179177d.png",
    tag: "tag3.b6a17fe5.png",
    comment: "你的菌群管理刚刚起步，有害菌还在伺机作乱。别灰心，坚持良好饮食作息，肠道健康大有可为",
  },
];

const KNOWLEDGE = {
  1: ["肠道被称为人体的“第二大脑”!", "肠道拥有约5亿个神经元,", "能独立于大脑运作。", "肠道健康的人，情绪也更稳定。"],
  2: ["人体70%的免疫细胞生活在肠道中，", "肠道是人体最大的免疫器官。", "肠道菌群平衡，免疫力自然在线。"],
  3: ["50岁后肠道菌群会发生变化！", "有益菌数量自然减少,有害菌相对增多。", "所以50岁以后更要有意识的", "关注肠道健康。"],
};

const TIPS = [
  "肠道菌群会和身体进行信号交互",
  "肠道菌群非一成不变，可调节",
  "呵护肠道，也是在照顾免疫力",
  "良好作息利于维持菌群稳定",
  "多样化饮食，滋养肠道菌群",
  "肠道住着许许多多有益微生物",
  "不同人的肠道菌群各有差异",
  "不要盲目节食，伤害肠道",
  "肠道是大量微生物居住的场所",
  "充足膳食纤维是菌群的“养料”",
  "菌群平衡，身体状态倍儿舒适",
  "多样化饮食，能滋养肠道菌群噢！",
  "高糖重油，会搅动菌群平衡",
  "丰富蔬果，利于肠道微环境",
  "饮食单一，容易影响菌群多样性",
  "肠道菌群，和身体代谢息息相关",
  "充足的膳食纤维是菌群的养料",
  "呵护肠道，是在照顾免疫力",
  "肠道好舒适，日常好状态",
  "健康肠道，给身体解锁专属护盾",
  "压力偷袭，悄悄改组菌群战队",
  "久坐不动，肠道悄悄“摸鱼”",
  "盲目节食，肠道拒绝“断崖式裁员”",
  "注意饮食卫生，守护肠胃安全",
  "关注肠道感受，重视身体信号",
  "不同食物，喂养不同肠道微生物",
  "肠道菌群影响免疫力",
  "熬夜扰乱肠道菌群",
  "规律作息护菌群",
  "便秘常因菌群失调",
  "菌群失调易过敏",
  "细嚼慢咽助消化菌",
  "腌制品多吃伤菌群",
  "菌群好睡眠更香甜",
  "调整肠道菌群可改善睡眠",
];

let tileSeq = 1;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickType(weights, allowed = TYPES) {
  if (!weights) return allowed[Math.floor(Math.random() * allowed.length)];
  let total = 0;
  for (const type of allowed) total += weights[type] || 0;
  if (total <= 0) return allowed[allowed.length - 1];
  let roll = Math.random() * total;
  for (const type of allowed) {
    roll -= weights[type] || 0;
    if (roll < 0) return type;
  }
  return allowed[allowed.length - 1];
}

function makeTile(board, row, col, weights, direction = -1) {
  const allowed = TYPES.filter((type) => {
    const horizontal =
      col >= 2 &&
      board[row][col - 1] &&
      board[row][col - 2] &&
      board[row][col - 1].type === type &&
      board[row][col - 2].type === type;
    const r1 = row + direction;
    const r2 = row + direction * 2;
    const vertical =
      r2 >= 0 &&
      r2 < ROWS &&
      board[r1] &&
      board[r1][col] &&
      board[r2][col] &&
      board[r1][col].type === type &&
      board[r2][col].type === type;
    return !horizontal && !vertical;
  });
  return { id: tileSeq++, type: pickType(weights, allowed.length ? allowed : TYPES) };
}

function createBoard(weights) {
  const board = [];
  for (let row = 0; row < ROWS; row++) {
    board.push([]);
    for (let col = 0; col < COLS; col++) board[row].push(makeTile(board, row, col, weights));
  }
  return board;
}

function findMatches(board) {
  const set = new Set();
  for (let row = 0; row < ROWS; row++) {
    let run = 1;
    for (let col = 1; col <= COLS; col++) {
      const same =
        col < COLS &&
        board[row][col] &&
        board[row][col - 1] &&
        board[row][col].type === board[row][col - 1].type;
      if (same) run++;
      else {
        if (run >= 3) for (let c = col - run; c < col; c++) set.add(`${row},${c}`);
        run = 1;
      }
    }
  }
  for (let col = 0; col < COLS; col++) {
    let run = 1;
    for (let row = 1; row <= ROWS; row++) {
      const same =
        row < ROWS &&
        board[row][col] &&
        board[row - 1][col] &&
        board[row][col].type === board[row - 1][col].type;
      if (same) run++;
      else {
        if (run >= 3) for (let r = row - run; r < row; r++) set.add(`${r},${col}`);
        run = 1;
      }
    }
  }
  return set;
}

function swapCells(board, a, b) {
  const tile = board[a.r][a.c];
  board[a.r][a.c] = board[b.r][b.c];
  board[b.r][b.c] = tile;
}

function hasMove(board) {
  const trial = (a, b) => {
    swapCells(board, a, b);
    const ok = findMatches(board).size > 0;
    swapCells(board, a, b);
    return ok;
  };
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (col + 1 < COLS && trial({ r: row, c: col }, { r: row, c: col + 1 })) return true;
      if (row + 1 < ROWS && trial({ r: row, c: col }, { r: row + 1, c: col })) return true;
    }
  }
  return false;
}

function applyTiles(board, tiles) {
  let i = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) board[row][col] = tiles[i++] || null;
  }
}

function reshuffle(board, weights) {
  const tiles = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) if (board[row][col]) tiles.push(board[row][col]);
  }
  for (let n = 0; n < 50; n++) {
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    applyTiles(board, tiles);
    if (findMatches(board).size === 0 && hasMove(board)) return;
  }
  for (let n = 0; n < 50; n++) {
    const fresh = createBoard(weights);
    const flat = [];
    for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) flat.push(fresh[row][col]);
    applyTiles(board, flat);
    if (hasMove(board)) return;
  }
}

function collapse(board, weights) {
  for (let col = 0; col < COLS; col++) {
    let write = ROWS - 1;
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col]) {
        board[write][col] = board[row][col];
        if (write !== row) board[row][col] = null;
        write--;
      }
    }
    for (let row = write; row >= 0; row--) board[row][col] = makeTile(board, row, col, weights, 1);
  }
}

function idsOf(board) {
  const set = new Set();
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) if (board[row][col]) set.add(board[row][col].id);
  }
  return set;
}

function scoreOf(counts) {
  return SCORE[1] * counts[1] + SCORE[2] * counts[2] + SCORE[3] * counts[3] + SCORE[4] * counts[4] + SCORE[5] * counts[5];
}

function rankOf(score) {
  return RANKS.find((item) => score >= item.min) || RANKS[RANKS.length - 1];
}

function adjacent(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}
