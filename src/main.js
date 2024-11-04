import * as THREE from "three";
import { PlaneGeometry } from "three";

let scene, camera, renderer;
let snake = [],
  snakeDirection = new THREE.Vector3(1, 0, 0);
let snacks = [
  { text: "Hi", message: "Let's Know me" },
  { text: "Name", message: "Jayant" },
  {
    text: "About me",
    message:
      "I am a final year MSc Informatics student with experience in building web apps and working with libraries like D3.js and Three.js",
  },
  { text: "Skills and Languages", message: "HTML, CSS, JavaScript, and C++" },
  {
    text: "Projects",
    message:
      "Data visualization with D3.js and Gamified portfolio with Three.js",
  },
  { text: "Contact", message: "jayant.2023@iic.ac.in" },
];
let currentSnackIndex = 0;
let snack,
  gridSize = 18,
  cubeSize = 1,
  moveInterval = 300,
  radius = 0.7;
let eatSound = new Audio("assets/sounds/snake-eat.mp3");
let touchStartX = 0;
let touchStartY = 0;

let clock,
  gameOver = false;

//snake texture
let textureLoader = new THREE.TextureLoader();
let snakeTexture = textureLoader.load("assets/textures/snake.jpg");
snakeTexture.wrapS = THREE.RepeatWrapping;
snakeTexture.wrapT = THREE.RepeatWrapping;
snakeTexture.repeat.set(3, 3); // Adjust these values as needed

let keyDirectionMap = {
  37: new THREE.Vector3(-1, 0, 0), // Left arrow
  38: new THREE.Vector3(0, 0, -1), // Up arrow
  39: new THREE.Vector3(1, 0, 0), // Right arrow
  40: new THREE.Vector3(0, 0, 1), // Down arrow
};

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 10, 20);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true; // Enable shadows
  document.body.appendChild(renderer.domElement);

  // Add lighting
  let ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Soft ambient light
  scene.add(ambientLight);

  let directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true; // Enable shadows for the light
  scene.add(directionalLight);
  //load grass
  let textureLoader = new THREE.TextureLoader();
  let grassTexture = textureLoader.load("assets/textures/grass.jpg");
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(10, 10);
  // Create a floor
  let floorGeometry = new THREE.PlaneGeometry(gridSize * 1.05, gridSize * 1.05);
  let floorMaterial = new THREE.MeshStandardMaterial({ map: grassTexture });
  let floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(0, -0.4, 0);
  floor.rotation.x = -Math.PI / 2; // Rotate the floor to be horizontal
  floor.receiveShadow = true;
  scene.add(floor);

  // Create initial snake
  createSnake();

  // Create initial snack
  createSnack();

  // Keyboard controls

  document.addEventListener("keydown", (event) => {
    if (keyDirectionMap[event.keyCode] && !gameOver) {
      const newDirection = keyDirectionMap[event.keyCode];
      if (!newDirection.equals(snakeDirection.clone().multiplyScalar(-1))) {
        snakeDirection = newDirection;
      }
    }
  });

  //touch controls
  addTouchControls();
  // Event listener for restart button
  document
    .getElementById("restartButton")
    .addEventListener("click", restartGame);

  // Start game loop

  window.addEventListener("resize", onWindowResize);

  clock = new THREE.Clock();
  animate();
}
function createCube(x, y, z, color) {
  // Use the loaded texture to create a material
  let material = new THREE.MeshStandardMaterial({
    map: snakeTexture, // Apply the texture to the material
    color: color, // You can keep the color if you want to tint the texture
  });

  let geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  let cube = new THREE.Mesh(geometry, material);
  cube.position.set(x, y, z);
  scene.add(cube);
  return cube;
}

function createsphere(x, y, z, color) {
  const geometry = new THREE.SphereGeometry(radius, 32, 16);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.3,
    roughness: 0.7,
  });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(x, y, z);
  sphere.castShadow = true; // Enable shadows for the cube
  sphere.receiveShadow = true;
  scene.add(sphere);
  return sphere;
}

function createSnake() {
  snake.push(createCube(0, 0, 0, 0x00ff00)); // Snake head
  for (let i = 1; i < 3; i++) {
    // Initial length
    snake.push(createCube(-i, 0, 0, 0x00ff00));
  }
}

function createSnack() {
  if (snack) scene.remove(snack); // Remove previous snack

  let x = Math.floor(Math.random() * gridSize - gridSize / 2);
  let z = Math.floor(Math.random() * gridSize - gridSize / 2);

  // snack = createCube(x, 0, z, 0xff0000); // Create new snack
  snack = createsphere(x, 0, z, 0xff0000);
  // Display the snack's text
  updateSnackLabel(snack.position);
}

function updateSnackLabel(position) {
  let vector = position.clone().project(camera); // Convert 3D position to 2D

  let halfWidth = window.innerWidth / 2;
  let halfHeight = window.innerHeight / 2;

  let screenX = vector.x * halfWidth + halfWidth - 30;
  let screenY = -(vector.y * halfHeight) + halfHeight;

  let snackLabel = document.getElementById("snackLabel");
  snackLabel.style.left = `${screenX}px`;
  snackLabel.style.top = `${screenY}px`;
  snackLabel.textContent = snacks[currentSnackIndex].text; // Update the snack label with current text
}

// function moveSnake() {
//     let headPos = snake[0].position.clone().add(snakeDirection);

//     if (headPos.x > gridSize / 2) headPos.x = -gridSize / 2;
//     if (headPos.x < -gridSize / 2) headPos.x = gridSize / 2;
//     if (headPos.z > gridSize / 2) headPos.z = -gridSize / 2;
//     if (headPos.z < -gridSize / 2) headPos.z = gridSize / 2;

//     for (let i = 1; i < snake.length; i++) {
//         if (headPos.distanceTo(snake[i].position) < 0.1) {
//             endGame();
//             return;
//         }
//     }

//     for (let i = snake.length - 1; i > 0; i--) {
//         snake[i].position.copy(snake[i - 1].position);
//     }

//     snake[0].position.copy(headPos);

//     if (snake[0].position.distanceTo(snack.position) < 0.1) {
//         snake.push(createCube(0, 0, 0, 0x00ff00)); // Increase snake size
//         displaySnackMessage(); // Show corresponding message
//         currentSnackIndex = (currentSnackIndex + 1) % snacks.length; // Move to next snack
//         createSnack();
//     }
// }
function moveSnake() {
  // Calculate the new head position
  let headPos = snake[0].position.clone().add(snakeDirection);

  // Handle boundary wrapping
  if (headPos.x > gridSize / 2) headPos.x = -gridSize / 2;
  if (headPos.x < -gridSize / 2) headPos.x = gridSize / 2;
  if (headPos.z > gridSize / 2) headPos.z = -gridSize / 2;
  if (headPos.z < -gridSize / 2) headPos.z = gridSize / 2;

  // Check for collision with the snake itself
  for (let i = 1; i < snake.length; i++) {
    if (headPos.distanceTo(snake[i].position) < 0.1) {
      endGame();
      return;
    }
  }

  // Move each segment of the snake to the position of the previous one
  for (let i = snake.length - 1; i > 0; i--) {
    snake[i].position.copy(snake[i - 1].position);
  }

  // Move the head to the new position
  snake[0].position.copy(headPos);

  // Check if the snake has eaten the snack
  if (snake[0].position.distanceTo(snack.position) < 0.1) {
    // Position the new segment at the last segment's position
    let lastSegment = snake[snake.length - 1];
    let newSegment = createCube(
      lastSegment.position.x,
      lastSegment.position.y,
      lastSegment.position.z,
      0x00ff00
    );

    // Add the new segment to the snake
    snake.push(newSegment);
    eatSound.play();
    displaySnackMessage(); // Show corresponding message
    currentSnackIndex = (currentSnackIndex + 1) % snacks.length; // Move to the next snack
    createSnack(); // Create a new snack
  }
}

function displaySnackMessage() {
  let infoBox = document.getElementById("infoBox");
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
  document.getElementById("gameOver").style.display = "block";
}

function restartGame() {
  for (let i = 0; i < snake.length; i++) {
    scene.remove(snake[i]);
  }
  snake = [];
  snakeDirection = new THREE.Vector3(1, 0, 0);
  gameOver = false;

  createSnake();
  currentSnackIndex = 0;
  createSnack();

  document.getElementById("gameOver").style.display = "none";

  clock = new THREE.Clock();
  animate();
}

function addTouchControls() {
  // Event listener for the start of a touch
  document.addEventListener("touchstart", (event) => {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  });

  // Event listener for the end of a touch
  document.addEventListener("touchend", (event) => {
    let touchEndX = event.changedTouches[0].clientX;
    let touchEndY = event.changedTouches[0].clientY;

    // Calculate the difference in position
    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;

    // Determine if the swipe was horizontal or vertical
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (diffX > 0) {
        // Swipe right
        if (!snakeDirection.equals(new THREE.Vector3(-1, 0, 0))) {
          snakeDirection = new THREE.Vector3(1, 0, 0); // Right
        }
      } else {
        // Swipe left
        if (!snakeDirection.equals(new THREE.Vector3(1, 0, 0))) {
          snakeDirection = new THREE.Vector3(-1, 0, 0); // Left
        }
      }
    } else {
      // Vertical swipe
      if (diffY > 0) {
        // Swipe down
        if (!snakeDirection.equals(new THREE.Vector3(0, 0, -1))) {
          snakeDirection = new THREE.Vector3(0, 0, 1); // Down
        }
      } else {
        // Swipe up
        if (!snakeDirection.equals(new THREE.Vector3(0, 0, 1))) {
          snakeDirection = new THREE.Vector3(0, 0, -1); // Up
        }
      }
    }
  });
}
// Adjust renderer size and camera aspect ratio on window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

const windowWidth = window.innerWidth;
if (windowWidth < 1300) {
  gridSize = 10;
  init();
  console.log("gridSize", gridSize);
} else {
  init();
}
