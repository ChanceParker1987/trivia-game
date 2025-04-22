/**
 * Initializes the Trivia Game when the DOM is fully loaded.
 */
document.addEventListener("DOMContentLoaded", function () {
	const form = document.getElementById("trivia-form");
	const questionContainer = document.getElementById("question-container");
	const newPlayerButton = document.getElementById("new-player");

	// Initialize the game
	checkUsername(); // Check for existing username cookie and update UI
	fetchQuestions(); // Load trivia questions from API
	displayScores(); // Display scores from localStorage

	/**
	 * Fetches trivia questions from the API and displays them.
	 */
	function fetchQuestions() {
		showLoading(true); // Show loading state

		fetch("https://opentdb.com/api.php?amount=10&type=multiple")
			.then((response) => response.json())
			.then((data) => {
				displayQuestions(data.results);
				showLoading(false); // Hide loading state
			})
			.catch((error) => {
				console.error("Error fetching questions:", error);
				showLoading(false); // Hide loading state on error
			});
	}

	/**
	 * Toggles the display of the loading state and question container.
	 *
	 * @param {boolean} isLoading - Indicates whether the loading state should be shown.
	 */
	function showLoading(isLoading) {
		document.getElementById("loading-container").classList = isLoading
			? ""
			: "hidden";
		document.getElementById("question-container").classList = isLoading
			? "hidden"
			: "";
	}

	/**
	 * Displays fetched trivia questions.
	 * @param {Object[]} questions - Array of trivia questions.
	 */
	function displayQuestions(questions) {
		questionContainer.innerHTML = ""; // Clear existing questions
		questions.forEach((question, index) => {
			const questionDiv = document.createElement("div");
			questionDiv.innerHTML = `
                <p>${question.question}</p>
                ${createAnswerOptions(
					question.correct_answer,
					question.incorrect_answers,
					index
				)}
            `;
			questionContainer.appendChild(questionDiv);
		});
	}

	/**
	 * Creates HTML for answer options.
	 * @param {string} correctAnswer - The correct answer for the question.
	 * @param {string[]} incorrectAnswers - Array of incorrect answers.
	 * @param {number} questionIndex - The index of the current question.
	 * @returns {string} HTML string of answer options.
	 */
	function createAnswerOptions(
		correctAnswer,
		incorrectAnswers,
		questionIndex
	) {
		const allAnswers = [correctAnswer, ...incorrectAnswers].sort(
			() => Math.random() - 0.5
		);
		return allAnswers
			.map(
				(answer) => `
            <label>
                <input type="radio" name="answer${questionIndex}" value="${answer}" ${
					answer === correctAnswer ? 'data-correct="true"' : ""
				}>
                ${answer}
            </label>
        `
			)
			.join("");
	}

	// Event listeners for form submission and new player button
	form.addEventListener("submit", handleFormSubmit);
	newPlayerButton.addEventListener("click", newPlayer);

	/**
	 * Sets a cookie with the given name and value.
	 * @param {string} name - Cookie name.
	 * @param {string} value - Cookie value.
	 * @param {number} days - Number of days until the cookie expires.
	 */
	function setCookie(name, value, days) {
		const date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		const expires = "expires=" + date.toUTCString();
		document.cookie = `${name}=${value}; ${expires}; path=/`;
	}

	/**
	 * Retrieves the value of a specific cookie.
	 * @param {string} name - Name of the cookie to retrieve.
	 * @returns {string|null} - The value of the cookie or null if not found.
	 */
	function getCookie(name) {
		return document.cookie
			.split("; ")
			.find((row) => row.startsWith(name + "="))
			?.split("=")[1] || null;
	}

	/**
	 * Deletes a specific cookie by setting its expiration in the past.
	 * @param {string} name - Name of the cookie to delete.
	 */
	function deleteCookie(name) {
		document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
	}

	/**
	 * Updates the UI based on the presence of a username cookie.
	 * Hides or shows elements depending on whether the user is logged in.
	 */
	function updateUIBasedOnSession() {
		const username = getCookie("username");
		const usernameInput = document.getElementById("username");
		const newPlayerButton = document.getElementById("new-player");

		if (username) {
			usernameInput.classList.add("hidden");
			newPlayerButton.classList.remove("hidden");
		} else {
			usernameInput.classList.remove("hidden");
			newPlayerButton.classList.add("hidden");
		}
	}

	/**
	 * Checks if a username cookie exists and auto-fills it in the input field.
	 * Then updates the UI based on session state.
	 */
	function checkUsername() {
		const savedUsername = getCookie("username");
		if (savedUsername) {
			document.getElementById("username").value = savedUsername;
		}
		updateUIBasedOnSession();
	}

	/**
	 * Handles the trivia form submission.
	 * Manages session cookie, calculates score, stores data, and resets game state.
	 *
	 * @param {Event} event - The submit event.
	 */
	function handleFormSubmit(event) {
		event.preventDefault(); // Prevents form from refreshing the page

		const usernameInput = document.getElementById("username");
		const username = usernameInput.value.trim();

		if (username !== "") {
			setCookie("username", username, 7); // Save username in cookie
		}

		const score = calculateScore(); // Determine how many correct answers

		saveScore(username, score); // Store username and score in localStorage

		displayScores(); // Refresh the score table on screen

		// Optionally reload new questions for next round
		// fetchQuestions();

		updateUIBasedOnSession(); // Adjust the UI after submitting
	}

	/**
	 * Calculates the user's score based on correct selected answers.
	 * It loops through all selected radio buttons and checks if they are marked as correct.
	 *
	 * @returns {number} The total score based on correct answers
	 */
	function calculateScore() {
		let score = 0;

		const selectedAnswers = document.querySelectorAll("input[type=radio]:checked");

		selectedAnswers.forEach((input) => {
			if (input.dataset.correct === "true") {
				score += 1;
			}
		});

		return score;
	}

	/**
	 * Saves the user's score to localStorage without overwriting existing scores.
	 * If previous scores exist, it appends the new one to the array.
	 *
	 * @param {string} username - The user's name.
	 * @param {number} score - The score to be saved.
	 */
	function saveScore(username, score) {
		const scores = JSON.parse(localStorage.getItem("triviaScores")) || [];
		scores.push({ username, score });
		localStorage.setItem("triviaScores", JSON.stringify(scores));
	}

	/**
	 * Displays all stored scores in the score table.
	 * This reads from localStorage and updates the DOM accordingly.
	 */
	function displayScores() {
		const scores = JSON.parse(localStorage.getItem("triviaScores")) || [];
		const tbody = document.querySelector("#score-table tbody");
		tbody.innerHTML = "";

		scores.forEach((entry) => {
			const row = document.createElement("tr");
			row.innerHTML = `<td>${entry.username}</td><td>${entry.score}</td>`;
			tbody.appendChild(row);
		});
	}

	/**
	 * Resets the current session and prepares the game for a new player.
	 * Clears the username cookie, input field, and game UI.
	 */
	function newPlayer() {
		deleteCookie("username");

		const usernameInput = document.getElementById("username");
		usernameInput.value = "";
		usernameInput.classList.remove("hidden");

		document.getElementById("new-player").classList.add("hidden");

		// Clear any selected answers
		const selectedRadios = document.querySelectorAll("input[type=radio]:checked");
		selectedRadios.forEach((radio) => (radio.checked = false));

		// Optionally start a new round of questions
		fetchQuestions();

		updateUIBasedOnSession();
	}
});


