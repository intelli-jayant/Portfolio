import * as THREE from 'three';

let scene, camera, renderer;
let snake = [], snakeDirection = new THREE.Vector3(1, 0, 0);
let snacks = [
    { text: "Hi", message: "Let's Know me" },
    { text: "Name", message: "Jayant" },
    { text: "About me", message: "I am a final year MSc Informatics student with experience in building web apps and working with libraries like D3.js and Three.js" },
    { text: "Skills and Languages", message: "HTML, CSS, JavaScript, and C++" },
    { text: "Projects", message: "Data visualization with D3.js and Gamified portfolio with Three.js" },
    { text: "Contact", message: "jayant.2023@iic.ac.in" }
];
let currentSnackIndex = 0;
let snack, gridSize = 20, cubeSize = 1, moveInterval = 300;
let clock, gameOver = false;

let keyDirectionMap = {
    37: new THREE.Vector3(-1, 0, 0), // Left arrow
    38: new THREE.Vector3(0, 0, -1), // Up arrow
    39: new THREE.Vector3(1, 0, 0),  // Right arrow
    40: new THREE.Vector3(0, 0, 1)   // Down arrow
};

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);


    // Create initial snake
    createSnake();
    
    // Create initial snack
    createSnack();

    // Keyboard controls
    document.addEventListener('keydown', (event) => {
        if (keyDirectionMap[event.keyCode] && !gameOver) {
            const newDirection = keyDirectionMap[event.keyCode];
            if (!newDirection.equals(snakeDirection.clone().multiplyScalar(-1))) {
                snakeDirection = newDirection;
            }
        }
    });

    // Event listener for restart button
    document.getElementById('restartButton').addEventListener('click', restartGame);

    // Start game loop
    clock = new THREE.Clock();
    animate();
}

function createCube(x, y, z, color) {
    let geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    let material = new THREE.MeshBasicMaterial({ color: color });
    let cube = new THREE.Mesh(geometry, material);
    cube.position.set(x, y, z);
    scene.add(cube);
    return cube;
}

function createSnake() {
    snake.push(createCube(0, 0, 0, 0x00ff00)); // Snake head
    for (let i = 1; i < 3; i++) { // Initial length
        snake.push(createCube(-i, 0, 0, 0x00ff00));
    }
}

function createSnack() {
    if (snack) scene.remove(snack); // Remove previous snack

    let x = Math.floor(Math.random() * gridSize - gridSize / 2);
    let z = Math.floor(Math.random() * gridSize - gridSize / 2);
    
    snack = createCube(x, 0, z, 0xff0000); // Create new snack
     
    // Display the snack's text
    updateSnackLabel(snack.position);
    // let infoBox = document.getElementById('infoBox');
    // infoBox.textContent = snacks[currentSnackIndex].message;
}

function updateSnackLabel(position) {
    let vector = position.clone().project(camera); // Convert 3D position to 2D
    
    // Get the window width and height to calculate the position
    let halfWidth = window.innerWidth / 2;
    let halfHeight = window.innerHeight / 2;
    
    let screenX = (vector.x * halfWidth) + halfWidth - 30;
    let screenY = -(vector.y * halfHeight) + halfHeight;

    // Update the h3 tag position
    let snackLabel = document.getElementById('snackLabel');
    snackLabel.style.left = `${screenX}px`;
    snackLabel.style.top = `${screenY}px`;
    snackLabel.textContent = snacks[currentSnackIndex].text; // Update the snack label with current text
}

function moveSnake() {
    let headPos = snake[0].position.clone().add(snakeDirection);

    // Wrap around screen if the snake goes off the edge
    if (headPos.x > gridSize / 2) headPos.x = -gridSize / 2;
    if (headPos.x < -gridSize / 2) headPos.x = gridSize / 2;
    if (headPos.z > gridSize / 2) headPos.z = -gridSize / 2;
    if (headPos.z < -gridSize / 2) headPos.z = gridSize / 2;

    // Check for self-collision
    for (let i = 1; i < snake.length; i++) {
        if (headPos.distanceTo(snake[i].position) < 0.1) {
            endGame();
            return;
        }
    }

    // Move snake body
    for (let i = snake.length - 1; i > 0; i--) {
        snake[i].position.copy(snake[i - 1].position);
    }

    snake[0].position.copy(headPos);

    // Check if snake eats snack
    if (snake[0].position.distanceTo(snack.position) < 0.1) {
        snake.push(createCube(0, 0, 0, 0x00ff00)); // Increase snake size
        displaySnackMessage(); // Show corresponding message
        currentSnackIndex = (currentSnackIndex + 1) % snacks.length; // Move to next snack
        createSnack();
    }
}

function displaySnackMessage() {
    let infoBox = document.getElementById('infoBox');
    infoBox.textContent = snacks[currentSnackIndex].message;
}

function animate() {
    if (clock.getElapsedTime() * 1000 > moveInterval) {
        moveSnake();
        clock.start(); // Reset clock
    }
    if (!gameOver) {
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
}

function endGame() {
    gameOver = true;
    document.getElementById('gameOver').style.display = 'block';
}

function restartGame() {
    // Reset game state
    for (let i = scene.children.length - 1; i >= 0; i--) {
        let obj = scene.children[i];
        scene.remove(obj);
    }
    
    // Re-initialize the snake and snack
    snake = [];
    snakeDirection = new THREE.Vector3(1, 0, 0); // Reset snake direction
    gameOver = false;
    
    createSnake();
    currentSnackIndex = 0; // Reset snack index
    createSnack();
    
    // Hide Game Over message
    document.getElementById('gameOver').style.display = 'none';
    
    // Reset and restart the clock
    clock = new THREE.Clock(); // Create a new clock to reset elapsed time
    animate(); // Restart the animation loop
}

init();
