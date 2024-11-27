let currentLang = localStorage.getItem("language") || "en";
switchLanguage(currentLang);

async function loadLocalizationData(lang) {
  try {
    // Fetch the localization data
    const response = await fetch(`${lang}.json`);
    const localizationData = await response.json();

    // Update text content on the page
    document.querySelector("h1").textContent = localizationData.welcome;
    document.querySelector(".rules").innerHTML = `
      <h2>${localizationData.howToPlay}</h2>
      ${localizationData.rules.map((rule) => `<p>${rule}</p>`).join("")}
    `;
    document.querySelector("#playButton").textContent = localizationData.play;
    document.querySelector("#nextButton").textContent = localizationData.next;
    document.querySelector("#playAgainButton").textContent =
      localizationData.playAgain;
    

    // Save localization data globally for game logic
    window.localizationData = localizationData;
  } catch (error) {
    console.error("Error loading localization data:", error);
  }
}


// Update language display
function updateLanguageDisplay() {
  const langButton = document.getElementById("currentLanguageButton");
  if (currentLang == "en") {
    langButton.textContent = "EN";
  } else if (currentLang == "zh") {
    langButton.textContent = "CN";
  }
}

// Switch language
function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("language", lang);
  updateLanguageDisplay();
  loadLocalizationData(lang); // Assuming a function to reload localization
}

// Initial setup
document.addEventListener("DOMContentLoaded", () => {
  updateLanguageDisplay();

  const langOptions = document.querySelectorAll("#languageDropdown li");
  langOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const selectedLang = option.dataset.lang;
      switchLanguage(selectedLang);
    });
  });
});

// Scorll Animation
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
      entry.target.classList.remove("hidden");
    } else {
      entry.target.classList.remove("show");
      entry.target.classList.add("hidden");
    }
  });
});

const hiddenElements = document.querySelectorAll(".hidden");
hiddenElements.forEach((element) => observer.observe(element));

// Scroll to top
document.addEventListener("DOMContentLoaded", () => {
  const welcomeSection = document.querySelector("#welcome");
  if (welcomeSection) {
    window.scrollTo({
      top: welcomeSection.offsetTop,
      behavior: "smooth",
    });
  }
  console.log("scroll back to top")
  document.body.classList.add("lock-scroll");
});


// Load JSON Data
async function loadGameData() {
  const response = await fetch("data.json");
  const data = await response.json();
  return data;
}

// Generate Random Question with Localization
function generateQuestion(data, lang = "en") {
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

  // Map options to localized names
  const options = [...distractors, correctActor]
    .map((actor) => ({
      id: actor.id,
      name: actor.name[currentLang]
    }))
    .sort(() => 0.5 - Math.random());

  return {
    correctClip, // Keep the clip as it is
    correctActor: {
      id: correctActor.id,
      name: correctActor.name[currentLang]
    },
    options,
  };
}


// Render Question
function renderQuestion(question, data, questionList, currentIndex, correct) {
  const audioElement = document.querySelector("#audio");
  const optionsContainer = document.querySelector(".options");
  const questionCounter = document.querySelector("#questionCounter");
  const totalQuestions = questionList.length;

  // Update question counter
  if (currentLang == "en") {
    questionCounter.textContent = `Question ${currentIndex} / ${totalQuestions}`;
  } else if (currentLang == "zh") {
    questionCounter.textContent = `问题  ${currentIndex} / ${totalQuestions}`;
  }

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
        correct += 1;
      } else {
        button.classList.add("incorrect");
      }

      // Show the modal with the correct answer
      const modal = document.querySelector("#modal");
      const modalText = document.querySelector("#modal-text");
      if (currentLang == "en") {
        modalText.innerHTML = `The correct answer is:<br><span style="font-weight: bold;">${question.correctActor.name}</span><br><img src="assets/${question.correctActor.id}.jpg" alt="${question.correctActor.name}" style="width: 150px; height: auto; margin-top: 10px;">`;
      } else if (currentLang == "zh") {
        modalText.innerHTML = `正确答案是:<br><span style="font-weight: bold;">${question.correctActor.name}</span><br><img src="assets/${question.correctActor.id}.jpg" alt="${question.correctActor.name}" style="width: 150px; height: auto; margin-top: 10px;">`;
      }
      modal.classList.remove("hidden");

      // Set audio volume to 0
      const audioElement = document.querySelector("#audio");
      if (audioElement) {
        audioElement.volume = 0;
      }

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
      // Set audio volume to 50% again
      const audioElement = document.querySelector("#audio");
      if (audioElement) {
        audioElement.volume = 0.5;
      }
    } else {
      // Game is finished
      const GOmodal = document.querySelector("#gameOverModal");
      const scoreText = document.querySelector("#finalScore");

      // Display the final score
      if (correct == 10) {
        scoreText.innerHTML = `10 / 10 PERFECT!!<br><img src="assets/10.gif" style="width: 150px; height: auto; margin-top: 10px;">`;
      } else {
        scoreText.textContent = `You scored ${correct} / ${totalQuestions}!`;
      }
      // Show the modal
      GOmodal.classList.remove("hidden");

      // Add event listener for "Play Again" button
      document.querySelector("#playAgainButton").onclick = () => {
        GOmodal.classList.add("hidden");
        document.body.classList.add("lock-scroll");
        document.querySelector("#game").classList.add("hidden"); // Hide game section
        initializeGame();
      };
    }
  };
}

// Initialize Game
async function initializeGame() {
  const data = await loadGameData();
  const totalQuestions = 10;
  let questionList = [];

  for (let i = 0; i < totalQuestions; i++) {
    let dup = false;
    const question = generateQuestion(data);
    // Check for duplicate
    questionList.forEach((q, index) => {
      if (q.correctClip == question.correctClip) {
        dup = true;
      }
    });
    if (dup == true) {
      console.log("dup ques");
    }
    questionList.push(question);
  }

  renderQuestion(questionList[0], data, questionList, 1, 0);

  // Set audio volume to 50% by default
  const audioElement = document.querySelector("#audio");
  if (audioElement) {
    audioElement.volume = 0.5; // Set volume to 50%
  }
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
  document.body.classList.add("lock-scroll");
});


// Dark Mode Toggle
const themeToggle = document.getElementById("themeToggle");

// Check for saved theme preference
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.checked = true;
  }
});

// Event listener for theme switch
themeToggle.addEventListener("change", () => {
  if (themeToggle.checked) {
    document.body.classList.add("dark-mode");
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.remove("dark-mode");
    localStorage.setItem("theme", "light");
  }
});


