// 캔버스 초기화
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const messageElement = document.getElementById('message');

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// 동물 종류 및 타일 배열
const animalTypes = ['cat', 'dog', 'rabbit', 'fox', 'bird', 'elephant','mongkey','tiger','tiger1','tiger2'];
const stageCount = [4, 6, 12, 16, 20];
let tiles = []; // 타일 배열

// 게임 상태
let isRunning = false;
let currentStage = 1; // 현재 스테이지
const maxStages = 5; // 최대 스테이지
let imagesLoadedCount = 0;
let isImgLoad = false;

let timer; // 타이머 ID
let timeRemaining; // 남은 시간


// 동물 이미지 설정
const animalImages = {
    cat: new Image(),
    dog: new Image(),
    rabbit: new Image(),
    fox: new Image(),
    bird: new Image(),
    elephant: new Image(),
    mongkey: new Image(),
    tiger: new Image(),
    tiger1: new Image(),
    tiger2: new Image(),
};

const hiddenCardImage = new Image(); // 숨겨진 카드 이미지
hiddenCardImage.src = 'https://via.placeholder.com/80?text=hidden';

const totalImages = Object.keys(animalImages).length + 1;

animalImages.cat.src = 'https://via.placeholder.com/80?text=Cat';
animalImages.dog.src = 'https://via.placeholder.com/80?text=Dog';
animalImages.rabbit.src = 'https://via.placeholder.com/80?text=Rabbit';
animalImages.fox.src = 'https://via.placeholder.com/80?text=Fox';
animalImages.bird.src = 'https://via.placeholder.com/80?text=Bird';
animalImages.elephant.src = 'https://via.placeholder.com/80?text=Elephant';
animalImages.mongkey.src = 'https://via.placeholder.com/80?text=mongkey';
animalImages.tiger.src = 'https://via.placeholder.com/80?text=tiger';
animalImages.tiger1.src = 'https://via.placeholder.com/80?text=tiger1';
animalImages.tiger2.src = 'https://via.placeholder.com/80?text=tiger2';


// 이미지 로드 상태 추적
function checkAllImagesLoaded() {
    imagesLoadedCount++;
    if (imagesLoadedCount === totalImages) {
        isImgLoad = true;
    }
}

// 각 이미지의 onload 이벤트 핸들러 설정
Object.keys(animalImages).forEach((key) => {
    animalImages[key].onload = checkAllImagesLoaded;
});
hiddenCardImage.onload = checkAllImagesLoaded;



// 게임 시작
function startGame() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (!isRunning) {
        isRunning = true;
        startButton.disabled = true;
        messageElement.innerHTML = `스테이지 ${currentStage} 시작!`;
        
        if (isImgLoad) {
            generateTilePairs();
            revealAllTiles();
            drawTiles();
            timeRemaining = 30; // 초기 타이머 시간 설정 (30초)
            setTimeout(() => {
                hideAllTiles(); // 2초 뒤 타일 숨기기
                startTimer();
                gameLoop();
            }, 2000);
        }
    }
}

// 타이머 시작
function startTimer() {
    clearInterval(timer); // 기존 타이머 초기화
    timer = setInterval(() => {
        timeRemaining--;
        if (timeRemaining <= 0) {
            endGame(false); // 시간 초과 시 게임 종료
        }
    }, 1000);
}

// 타이머 중지
function stopTimer() {
    clearInterval(timer);
}

// 스테이지에 따른 타일 생성
function generateTilePairs() {
    tiles = []; // 이전 타일 초기화

    // 현재 스테이지에 따른 동물 쌍 수 계산
    const pairs = Math.min(stageCount[currentStage-1], animalTypes.length * 2);

    // 동물 타입마다 2개씩 타일을 생성
    for (let i = 0; i < pairs / 2; i++) {
        const type = animalTypes[i % animalTypes.length];
        for (let j = 0; j < 2; j++) {
            tiles.push({
                x: 0, // 초기 위치
                y: 0, // 초기 위치
                type,
                width: 80,
                height: 80,
                selected: false, // 선택 여부
                revealed: false, //타일 초기 상태 : 숨겨짐
            });
        }
    }

    // 타일 섞기
    shuffleTiles();

    // 캔버스 중앙에 정렬
    arrangeTilesInCenter();
}

// 타일 섞기
function shuffleTiles() {
    for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]]; // 타일 위치 교환
    }
}

// 타일을 캔버스 중앙에 배치
function arrangeTilesInCenter() {
    const rows = Math.ceil(Math.sqrt(tiles.length)); // 줄의 수
    const cols = Math.ceil(tiles.length / rows); // 칸의 수
    const tileWidth = 80;
    const tileHeight = 80;
    const spacing = 10; // 타일 간 간격

    // 전체 타일의 크기를 계산
    const totalWidth = cols * tileWidth + (cols - 1) * spacing;
    const totalHeight = rows * tileHeight + (rows - 1) * spacing;

    // 시작 좌표 계산 (캔버스 중앙 기준)
    const startX = (canvasWidth - totalWidth) / 2;
    const startY = (canvasHeight - totalHeight) / 2;

    let currentX = startX;
    let currentY = startY;

    // 타일 위치 지정
    tiles.forEach((tile, index) => {
        tile.x = currentX;
        tile.y = currentY;

        currentX += tileWidth + spacing;

        if ((index + 1) % cols === 0) { // 한 줄이 끝나면 다음 줄로
            currentX = startX;
            currentY += tileHeight + spacing;
        }
    });
}

// 모든 타일 공개
function revealAllTiles() {
    tiles.forEach(tile => tile.revealed = true);
}

// 모든 타일 숨기기
function hideAllTiles() {
    tiles.forEach(tile => tile.revealed = false);
}

// 게임 루프
function gameLoop() {
    if (!isRunning) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    drawTimer(); // 타이머 그리기
    drawTiles();

    requestAnimationFrame(gameLoop);
}

// 타이머 그리기
function drawTimer() {
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.clearRect(0, 0, canvasWidth, 30); // 타이머 영역 지우기
    ctx.fillText(`Time Left: ${timeRemaining}s`, 10, 20);
}

// 타일 그리기
function drawTiles() {
    tiles.forEach(tile => {
        const img = tile.revealed ? animalImages[tile.type] : hiddenCardImage; //선택에 따라 이미지 결정
        ctx.drawImage(img, tile.x, tile.y, tile.width, tile.height);

        ctx.strokeStyle = tile.selected ? 'red' : 'black';
        ctx.lineWidth = tile.selected ? 4 : 1;

        ctx.strokeRect(tile.x, tile.y, tile.width, tile.height);
    });
}

// 마우스 클릭 이벤트
let selectedTiles = [];
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const clickedTile = checkCollision(mouseX, mouseY);
    if (clickedTile && !clickedTile.revealed) {
        toggleTileSelection(clickedTile);

        if (selectedTiles.length === 2) {
            checkPair();
        }
    }
});

// 충돌 체크
function checkCollision(mouseX, mouseY) {
    return tiles.find(tile => 
        mouseX >= tile.x && mouseX <= tile.x + tile.width &&
        mouseY >= tile.y && mouseY <= tile.y + tile.height
    );
}

// 타일 선택/해제
function toggleTileSelection(tile) {
    if (tile.selected) {
        tile.selected = false;
        selectedTiles = selectedTiles.filter(t => t !== tile);
    } else if (selectedTiles.length < 2) {
        tile.selected = true;
        tile.revealed = true;
        selectedTiles.push(tile);
    }
}

// 쌍 체크
function checkPair() {
    const [tile1, tile2] = selectedTiles;

    if (tile1.type === tile2.type) {
        removeTile(tile1);
        removeTile(tile2);
    }else{
        setTimeout(()=>{
            tile1.revealed = false; //다시 숨김
            tile2.revealed = false;
        },1000);
    }

    selectedTiles.forEach(tile => tile.selected = false);
    selectedTiles = [];

    if (tiles.length === 0) {
        ctx.clearRect(0,0,canvasWidth,canvasHeight);
        endGame(true);
    }
}

// 타일 제거
function removeTile(tile) {
    const index = tiles.indexOf(tile);
    if (index > -1) {
        tiles.splice(index, 1);
    }
}

// 스테이지 종료
function endGame(success) {
    if(success)
    {
        if (currentStage < maxStages) {
            currentStage++;
            messageElement.innerHTML = `스테이지 ${currentStage - 1} 완료! 다음 스테이지로 진행하려면 버튼을 클릭하세요.`;
            startButton.disabled = false;
        } else {
            messageElement.innerHTML = '모든 스테이지 완료! 축하합니다!';
            currentStage = 1;
        }
    }
    else
    {
        messageElement.innerHTML = "Time's up! Game Over.";
        currentStage = 1;
    }
    isRunning = false;
    stopTimer();
    startButton.disabled = false;
}

// 시작 버튼 클릭 이벤트
startButton.addEventListener('click', startGame);


// 추가사항
// 조금 꾸미기
// 광고 넣기
// 소리 효과음
// 카드 맞았을 때 효과