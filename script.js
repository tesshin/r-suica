const { Engine, Render, World, Bodies, Body, Events } = Matter;

let clickCount = 0; // クリック数を記録する変数

// Matter.jsの主要なオブジェクトを作成します。
const engine = Engine.create(); // 物理エンジンのインスタンスを作成
const world = engine.world; // 物理世界を作成
const render = Render.create({
  // レンダリングエンジンを作成
  element: document.getElementById("game-container"), // ゲームを表示するHTML要素
  engine: engine,
  canvas: document.getElementById("game-canvas"),
  options: {
    width: 600, // キャンバスの幅
    height: 600, // キャンバスの高さ
    wireframes: false, // ワイヤーフレームモードを無効にする（カラーで表示）
  },
});

// ユーザーのクリック（タップ）によってフルーツを落とすイベントリスナーを設定
document
  .getElementById("game-canvas")
  .addEventListener("mousedown", function (event) {
    clickCount++; // クリック数を増やす
    // クリックされた位置を取得
    let rect = render.canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    // その位置にフルーツを生成
    let fruit = createFruit(currentFruitIndex, x, y);
    fruitsInGame.push(fruit);
    generateFruit();
  });

const fruits = [
  "Cherry",
  "Grape",
  "Orange",
  "Apple",
  "Pear",
  "Peach",
  "Pineapple",
  "Melon",
  "Watermelon",
];

const colors = [
  "#D00000",
  "#6A0DAD",
  "#FFA500",
  "#EA7373",
  "#D1E231",
  "#FFCBA4",
  "#FFE135",
  "#98FF98",
  "#008000",
];

let currentFruitIndex = 0; // 現在選択されているフルーツのインデックス
let score = 0; // スコア

let fruitsInGame = []; // ゲーム中のフルーツを追跡する配列

// 次に落とすフルーツをランダムに選択し、表示する関数
// 次に落とすフルーツをランダムに選択し、表示する関数（修正）
function generateFruit() {
  const maxIndex = fruits.length - 4; // Watermelon を除外した最大インデックス
  currentFruitIndex = Math.floor(Math.random() * maxIndex); // Watermelon を除外してランダムインデックスを生成
  document.getElementById("next-name").textContent = fruits[currentFruitIndex];
  document.getElementById("next-color").style.backgroundColor =
    colors[currentFruitIndex];
}

// ゲームボードの底に「床」を追加
const ground = Bodies.rectangle(300, 590, 600, 20, {
  isStatic: true, // 静的オブジェクト（動かない）
  render: { fillStyle: "#959595" },
});
World.add(world, ground); // 作成した床を物理世界に追加

// フルーツを落とす関数（修正）
function dropFruit() {
  let fruit = createFruit(currentFruitIndex, 300, 0); // 現在のフルーツを生成
  fruitsInGame.push(fruit);
  generateFruit(); // 次のフルーツを生成（注：これを先に呼び出すと、落とすフルーツが変わってしまう）
}

// スコア更新関数
function updateScore(points) {
  score += points;
  document.getElementById("score").textContent = score;
}

// 衝突イベント（修正）
Events.on(engine, "collisionStart", function (event) {
  let pairs = event.pairs;

  for (let i = 0, j = pairs.length; i != j; ++i) {
    let pair = pairs[i];

    // 衝突したフルーツを検出
    let fruitA = fruitsInGame.find((f) => f.body === pair.bodyA);
    let fruitB = fruitsInGame.find((f) => f.body === pair.bodyB);

    // Watermelon は特別な扱い
    const watermelonIndex = fruits.length - 1; // Watermelon のインデックス

    if (fruitA && fruitB) {
      if (fruitA.index === fruitB.index) {
        // スコアを更新（Watermelon 同士の衝突でも）
        updateScore(fruitA.index + 1);

        // Watermelon 同士の衝突では両方を削除
        if (fruitA.index === watermelonIndex) {
          World.remove(world, fruitA.body);
          World.remove(world, fruitB.body);
          fruitsInGame = fruitsInGame.filter(
            (f) => f.body !== fruitA.body && f.body !== fruitB.body
          );
          continue; // 次の衝突ペアへ
        }

        // それ以外のフルーツの衝突
        World.remove(world, fruitA.body);
        World.remove(world, fruitB.body);
        fruitsInGame = fruitsInGame.filter(
          (f) => f.body !== fruitA.body && f.body !== fruitB.body
        );

        // 新しいフルーツを生成（Melon 同士の衝突で Watermelon を生成）
        let newIndex = Math.min(fruitA.index + 1, fruits.length - 1);
        let newFruit = createFruit(
          newIndex,
          pair.bodyA.position.x,
          pair.bodyA.position.y
        );
        fruitsInGame.push(newFruit);
      }
    }
  }
});

// 重力の設定（例）
engine.world.gravity.y = 1; // 重力を1に設定（調整可能）
// ゲームボードの左右に壁を追加
const leftWall = Bodies.rectangle(0, 300, 20, 600, { isStatic: true });
const rightWall = Bodies.rectangle(600, 300, 20, 600, { isStatic: true });
World.add(world, [leftWall, rightWall, ground]); // 壁と床を追加

// フルーツの大きさを設定する配列（サイズ変更）
const fruitSizes = [1000, 1500, 2000, 2500, 3000, 3500, 4500, 5000, 5500];

// フルーツの生成関数（大きさを変更）
function createFruit(index, x, y) {
  let size = fruitSizes[index] / 50; // サイズが大きすぎる場合は適切にスケーリングする
  let fruit = Bodies.circle(x, y, size, {
    render: {
      fillStyle: colors[index],
    },
    friction: 0.005,
    restitution: 0.5,
  });
  World.add(world, fruit);
  return { body: fruit, index: index };
}

// ゲームオーバー判定（修正）
function checkGameClear() {
  let isGameClear = fruitsInGame.some((fruit) => fruit.body.position.y < 0);

  if (isGameClear) {
    document.getElementById("game-over").textContent =
      "GAME CLEAR! Score: " + calculateScore();
    document.getElementById("game-over").style.display = "block";
    Engine.clear(engine);
    Render.stop(render);
    calculateScore(); // スコア計算関数を呼び出す
  }
}

function restartGame() {
  // ゲームの状態をリセット
  World.clear(world, true); // Matter.jsのワールドをクリア
  fruitsInGame = []; // ゲーム中のフルーツをリセット
  score = 0; // スコアをリセット
  clickCount = 0; // クリック数をリセット
  startTime = Date.now(); // 開始時間をリセット

  // ゲームのUIをリセット
  document.getElementById("score").textContent = score;
  document.getElementById("game-over").style.display = "none";

  // ゲームを再開始
  Engine.run(engine);
  Render.run(render);
  startGame(); // ゲーム開始関数を再度呼び出す
}

function calculateScore() {
  let endTime = Date.now(); // ゲーム終了時刻
  let gameTime = (endTime - startTime) / 1000; // ゲームの継続時間（秒）

  // 時間を分と秒に変換
  let minutes = Math.floor(gameTime / 60);
  let seconds = Math.floor(gameTime % 60);
  let milliseconds = Math.floor((gameTime % 1) * 100); // ミリ秒（小数点以下2桁まで）

  // スコアの計算
  let finalScore = gameTime + clickCount;

  // フォーマットに従ってスコアを表示
  alert(
    "かかった時間：" +
      minutes +
      "分" +
      seconds +
      "秒" +
      milliseconds +
      "=" +
      gameTime.toFixed(2) +
      "秒\n" +
      "クリック回数：" +
      clickCount +
      "回\n" +
      "スコア：" +
      gameTime.toFixed(2) +
      "+" +
      clickCount +
      "=" +
      finalScore.toFixed(2) +
      "\n" +
      "※スコアは小さいほどすごいです！"
  );
  restartGame();
}

// ゲームループでゲームオーバーをチェック
Events.on(engine, "afterUpdate", checkGameClear);

let gameStarted = false; // ゲームが開始されたかどうかを追跡するフラグ

let startTime; // ゲーム開始時刻の変数を定義

function startGame() {
  startTime = Date.now(); // ボタンクリック時にゲーム開始時刻を設定
  gameStarted = true;
  Engine.run(engine);
  Render.run(render);
  generateFruit();
  setInterval(updateStats, 100); // 状態更新の間隔設定
}

document.getElementById("start-button").addEventListener("click", function () {
  startGame();
  this.style.display = "none"; // ボタンを非表示にする
});

// 開始ボタンのイベントリスナーを設定
document.getElementById("start-button").addEventListener("click", function () {
  startGame();
  this.style.display = "none"; // ボタンを非表示にする
});

// 状態を更新する関数
function updateStats() {
  if (gameStarted) {
    let currentTime = (Date.now() - startTime) / 1000;
    document.getElementById("time").textContent =
      "Time: " + currentTime.toFixed(2) + "s";
  }
  document.getElementById("count").textContent = "Count: " + clickCount;
  document.getElementById("score").textContent = "Score: " + score;
}

setInterval(updateStats, 100); // 0.1秒ごとに更新

// ゲーム中定期的に状態を更新
setInterval(updateStats, 100); // 0.1秒ごとに更新

startGame();
