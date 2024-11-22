// Scorll Animation
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    console.log(entry);
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
      console.log("added show");
    } else {
      entry.target.classList.remove("show");
      console.log("added hidden");
    }
  });
});

const hiddenElements = document.querySelectorAll(".hidden");
hiddenElements.forEach((element) => observer.observe(element));


// Load JSON Data
async function loadGameData() {
  const response = await fetch("data.json");
  const data = await response.json();
  return data;
}

// Generate Random Question
function generateQuestion(data) {
  const { voiceActors, voiceClips } = data;

  // Randomly pick a voice clip for the question
  const correctClip = voiceClips[Math.floor(Math.random() * voiceClips.length)];
  const correctActor = voiceActors.find(
    (actor) => actor.id === correctClip.actorId
  );

  // Get 3 random distractors
  const distractors = voiceActors
    .filter((actor) => actor.id !== correctActor.id)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  // Combine correct answer with distractors and shuffle
  const options = [...distractors, correctActor].sort(
    () => 0.5 - Math.random()
  );

  return { correctClip, correctActor, options };
}

// Render Question
function renderQuestion(question, data, questionList, currentIndex, correct) {
  const audioElement = document.querySelector("#audio");
  const optionsContainer = document.querySelector(".options");
  const questionCounter = document.querySelector("#questionCounter");
  const totalQuestions = questionList.length;

  // Update question counter
  questionCounter.textContent = `Question ${currentIndex} / ${totalQuestions}`;

  // Set audio clip
  audioElement.src = `assets/${question.correctClip.file}`;

  // Clear and add options
  optionsContainer.innerHTML = "";
  question.options.forEach((actor) => {
    const button = document.createElement("button");
    button.classList.add("option");
    button.textContent = actor.name;

    // Handle button click
    button.onclick = () => {
      // Mark the correct and incorrect answers
      if (actor.id === question.correctActor.id) {
        button.classList.add("correct");
        correct += 1
      } else {
        button.classList.add("incorrect");
      }

      // Show the modal with the correct answer
      const modal = document.querySelector("#modal");
      const modalText = document.querySelector("#modal-text");
      modalText.innerHTML = `The correct answer is:<br><span style="color: black; font-weight: bold;">${question.correctActor.name}</span><br><img src="assets/${question.correctActor.id}.jpg" alt="${question.correctActor.name}" style="width: 150px; height: auto; margin-top: 10px;">`;
      modal.classList.remove("hidden");

      // Disable all buttons
      document.querySelectorAll(".option").forEach((btn) => {
        btn.disabled = true;
      });
    };

    optionsContainer.appendChild(button);
  });

  // Next Question Button
  document.querySelector("#nextButton").onclick = () => {
    document.querySelector("#modal").classList.add("hidden");

    // Check if there are more questions
    if (currentIndex < totalQuestions) {
      renderQuestion(
        questionList[currentIndex],
        data,
        questionList,
        currentIndex + 1,
        correct
      );
    } else {
      // Game is finished
      const GOmodal = document.querySelector("#gameOverModal");
      const scoreText = document.querySelector("#finalScore");

      // Display the final score
      if (correct == 10) {
        scoreText.innerHTML = `You scored 10 / ${totalQuestions}!!<br><img src="assets/10.gif" style="width: 150px; height: auto; margin-top: 10px;">`;
      } else {
        scoreText.textContent = `You scored ${correct} / ${totalQuestions}!`;
      }
      // Show the modal
      GOmodal.classList.remove("hidden");

      // Add event listener for "Play Again" button
      document.querySelector("#playAgainButton").onclick = () => {
        GOmodal.classList.add("hidden");
        localStorage.removeItem("gameStarted"); // Reset game state
        document.body.classList.add("lock-scroll");
        document.querySelector("#game").classList.add("hidden"); // Hide game section
        initializeGame(); // Start a new game
      };
    }
  };
}

// Initialize Game
async function initializeGame() {
  const data = await loadGameData();
  const totalQuestions = 10; // Fixed number of questions
  let questionList = [];

  // Generate multiple questions based on the fixed number
  for (let i = 0; i < totalQuestions; i++) {
    const question = generateQuestion(data);
    questionList.push(question);
  }

  // Start rendering the first question
  renderQuestion(questionList[0], data, questionList, 1, 0);
}

// Event Listener for Play Button
document.getElementById("playButton").addEventListener("click", () => {
  // Enable scrolling and reveal the game section
  document.body.classList.remove("lock-scroll");
  document.querySelector("#game").classList.remove("hidden");

  // Smoothly scroll to the game section
  const gameSection = document.querySelector("#game");
  gameSection.scrollIntoView({ behavior: "smooth" });

  // Initialize the game
  initializeGame();
});
