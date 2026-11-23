const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const recordEl = document.getElementById('record');

const gridSize = 24;
const tileCount = canvas.width / gridSize; 
const FOOD_PER_COLOR = 5;

// Палитра
const BG_COLOR = '#99ccee';       
const SNAKE_COLOR_1 = '#ff1493';  
const SNAKE_COLOR_2 = '#7cfc00';  
const EYE_COLOR = '#ffffff';
const PUPIL_COLOR = '#000000';

let snake, direction, foods, score, gameOver, started, tonguePhase;

// Загружаем рекорд из памяти браузера (или ставим 0, если его нет)
let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
recordEl.textContent = highScore;

function resetGame() {
    snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    foods = []; 
    score = 0;
    gameOver = false;
    started = false;
    tonguePhase = 0;
    scoreEl.textContent = 0;
    
    for (let i = 0; i < FOOD_PER_COLOR; i++) {
        spawnSpecificFood(SNAKE_COLOR_1);
    }
    for (let i = 0; i < FOOD_PER_COLOR; i++) {
        spawnSpecificFood(SNAKE_COLOR_2);
    }
    
    draw();
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        resetGame();
        return;
    }

    if (gameOver) return;
    started = true;

    switch (e.key) {
        case 'ArrowUp':
            if (direction.y === 0) direction = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
            if (direction.y === 0) direction = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
            if (direction.x === 0) direction = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
            if (direction.x === 0) direction = { x: 1, y: 0 };
            break;
    }
});

function spawnSpecificFood(color) {
    let newFood;
    let isOccupied = true;

    while (isOccupied) {
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount),
            color: color 
        };
        isOccupied = false;

        for (const segment of snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                isOccupied = true;
                break;
            }
        }
        if (!isOccupied) {
            for (const f of foods) {
                if (f.x === newFood.x && f.y === newFood.y) {
                    isOccupied = true;
                    break;
                }
            }
        }
    }
    foods.push(newFood);
}

function drawStrawberry(x, y, color) {
    const cx = x * gridSize + gridSize / 2;
    const cy = y * gridSize + gridSize / 2;
    const r = gridSize * 0.35;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy + r);
    ctx.quadraticCurveTo(cx - r, cy - r * 0.2, cx - r * 0.8, cy - r * 0.8);
    ctx.quadraticCurveTo(cx, cy - r * 1.3, cx + r * 0.8, cy - r * 0.8);
    ctx.quadraticCurveTo(cx + r, cy - r * 0.2, cx, cy + r);
    ctx.fill();

    ctx.fillStyle = '#228b22';
    for (let i = 0; i < 3; i++) {
        const angle = -Math.PI / 2 + (i - 1) * 0.6;
        ctx.beginPath();
        ctx.ellipse(
            cx + Math.cos(angle) * r * 0.3, 
            cy - r * 0.8 + Math.sin(angle) * r * 0.3, 
            r * 0.4, r * 0.15, angle, 0, Math.PI * 2
        );
        ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    const seeds = [
        { dx: 0, dy: 0.1 }, { dx: -0.3, dy: -0.2 }, { dx: 0.3, dy: -0.2 },
        { dx: 0, dy: -0.5 }, { dx: -0.2, dy: 0.4 }, { dx: 0.2, dy: 0.4 }
    ];
    seeds.forEach(s => {
        ctx.beginPath();
        ctx.arc(cx + s.dx * r, cy + s.dy * r, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawTongue(head) {
    tonguePhase = (tonguePhase + 1) % 24;
    const extended = tonguePhase < 12;

    const cx = head.x * gridSize + gridSize / 2;
    const cy = head.y * gridSize + gridSize / 2;

    const tipLen = extended ? gridSize * 1.2 : gridSize * 0.6;
    const tipX = cx + direction.x * tipLen;
    const tipY = cy + direction.y * tipLen;
    const baseX = cx + direction.x * (gridSize / 2);
    const baseY = cy + direction.y * (gridSize / 2);

    ctx.strokeStyle = '#ff69b4'; 
    ctx.lineWidth = 3; // Чуть тоньше
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    if (extended) {
        const px = -direction.y;
        const py = direction.x;
        const forkLen = 5;

        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX + px * forkLen - direction.x * 3,
                   tipY + py * forkLen - direction.y * 3);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - px * forkLen - direction.x * 3,
                   tipY - py * forkLen - direction.y * 3);
        ctx.stroke();
    }
}

function draw() {
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    foods.forEach(f => {
        drawStrawberry(f.x, f.y, f.color);
    });

    // ЗМЕЙКА СТАЛА ЧУТЬ МЕНЬШЕ
    // Благодаря отступу в 4 пикселя, визуально сегменты стали меньше
    const snakePadding = 4; 
    const snakeSize = gridSize - snakePadding;

    snake.forEach((segment, index) => {
        ctx.fillStyle = (index % 2 === 0) ? SNAKE_COLOR_1 : SNAKE_COLOR_2;
        ctx.fillRect(
            segment.x * gridSize + snakePadding / 2, 
            segment.y * gridSize + snakePadding / 2, 
            snakeSize, 
            snakeSize
        );
    });

    // Глаза (координаты центрируем под новый размер)
    const head = snake[0];
    const hx = head.x * gridSize + gridSize / 2;
    const hy = head.y * gridSize + gridSize / 2;
    const eyeOffset = 4.5; 
    const eyeSize = 3;

    const px = -direction.y;
    const py = direction.x;

    ctx.fillStyle = EYE_COLOR;
    ctx.beginPath();
    ctx.arc(hx + direction.x * 4 + px * eyeOffset, hy + direction.y * 4 + py * eyeOffset, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hx + direction.x * 4 - px * eyeOffset, hy + direction.y * 4 - py * eyeOffset, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PUPIL_COLOR;
    ctx.beginPath();
    ctx.arc(hx + direction.x * 5 + px * eyeOffset, hy + direction.y * 5 + py * eyeOffset, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hx + direction.x * 5 - px * eyeOffset, hy + direction.y * 5 - py * eyeOffset, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fill();

    drawTongue(head);

    // Текст
    ctx.textAlign = 'center';

    if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, canvas.height / 2 - 60, canvas.width, 120);
        ctx.fillStyle = SNAKE_COLOR_1;
        ctx.font = 'bold 32px Arial';
        ctx.fillText('Игра окончена!', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText('ПРОБЕЛ — рестарт', canvas.width / 2, canvas.height / 2 + 30);
    } else if (!started) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.font = '22px Arial';
        ctx.fillText('Нажмите стрелку, чтобы начать', canvas.width / 2, canvas.height / 2);
    }
}

function gameLoop() {
    if (gameOver) {
        draw();
        return;
    }

    if (started) {
        const head = { ...snake[0] };
        head.x += direction.x;
        head.y += direction.y;

        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            gameOver = true;
            
            // ПРОВЕРКА И СОХРАНЕНИЕ РЕКОРДА ПРИ СМЕРТИ
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('snakeHighScore', highScore);
                recordEl.textContent = highScore;
            }
            
            draw();
            return;
        }

        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                gameOver = true;
                
                // ПРОВЕРКА И СОХРАНЕНИЕ РЕКОРДА ПРИ СМЕРТИ
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('snakeHighScore', highScore);
                    recordEl.textContent = highScore;
                }
                
                draw();
                return;
            }
        }

        snake.unshift(head);

        const foodIndex = foods.findIndex(f => f.x === head.x && f.y === head.y);
        
        if (foodIndex !== -1) {
            score++;
            scoreEl.textContent = score;
            const eatenColor = foods[foodIndex].color;
            foods.splice(foodIndex, 1); 
            spawnSpecificFood(eatenColor); 
        } else {
            snake.pop();
        }
    }

    draw();
}

// Инициализация
resetGame();
setInterval(gameLoop, 120); 