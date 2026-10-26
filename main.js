document.addEventListener("DOMContentLoaded", () => {

  // wait until the page is ready before connecting the interface
  // collect the form and the areas that will show search feedback
  const form = document.getElementById("search-form");
  const input = document.getElementById("word-input");
  const results = document.getElementById("results");
  const message = document.getElementById("status-message");
  const favoritesList = document.getElementById("favorites-list");

  // use the browser storage value to restore favorites between visits
  // start with an empty list when no saved favorites exist
  let favorites = JSON.parse(localStorage.getItem("wordly-favorites")) || [];

  // rebuild the favorites list from the current saved words
  function displayFavorites() {
    // clear old list items before drawing the current state
    favoritesList.innerHTML = "";

    // create one list item and removal control for each favorite
    favorites.forEach((word) => {
      // create a list row for the current saved word
      const li = document.createElement("li");
      li.textContent = word + " ";

      // create a button that lets the user remove this word
      const button = document.createElement("button");
      button.textContent = "Remove";
      // css class for the remove favorite button
      button.className = "remove-favorite";

      // update storage and show the list after a word is removed
      button.addEventListener("click", () => {
        favorites = favorites.filter((item) => item !== word);
        localStorage.setItem("wordly-favorites", JSON.stringify(favorites));
        displayFavorites();
      });

      // place the remove button inside the word row
      li.appendChild(button);
      // add the finished row to the favorites list
      favoritesList.appendChild(li);
    });

    // show an empty state when there are no words to display
    if (favorites.length === 0) {
      favoritesList.textContent = "No favorite words yet.";
    }
  }

  // look up a word and render the dictionary response
  async function searchWord(word) {
    // reset previous results while the new lookup is in progress
    message.textContent = "Searching...wait....just a second....umm...";
    results.innerHTML = "";

    try {
      // encode the search term so it can be safely placed in the request url
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
      );

      // treat unsuccessful responses as a lookup error
      if (!response.ok) {
        throw new Error("Word not found...check ur bad spelling...");
      }

      // read the first matching dictionary entry from the response
      const data = await response.json();
      // use the first returned entry to build the result card
      const entry = data[0];

      // create a card to keep all details for this word together
      const card = document.createElement("div");
      // css class for the word result card
      card.className = "word-card";

      // add the dictionary spelling as the card heading
      const title = document.createElement("h2");
      title.textContent = entry.word;
      // place the word heading at the top of the card
      card.appendChild(title);

      // use the first available phonetic spelling or a fallback message
      const pronunciation = document.createElement("p");
      // css class for the pronunciation text
      pronunciation.className = "pronunciation";
      pronunciation.textContent =
        entry.phonetics.find((item) => item.text)?.text || "Pronunciation unavailable";
      // add the pronunciation below the word heading
      card.appendChild(pronunciation);
      // show each part of speech and the details attached to it
      entry.meanings.forEach((meaning) => {
        const partOfSpeech = document.createElement("h3");
        partOfSpeech.textContent = meaning.partOfSpeech;
        // show the part of speech before its definitions
        card.appendChild(partOfSpeech);

        // add every definition associated with this part of speech
        meaning.definitions.forEach((definition) => {
          const paragraph = document.createElement("p");
          paragraph.textContent = definition.definition;
          // add the definition to the result card
          card.appendChild(paragraph);

          // include an example only when the dictionary supplies one
          if (definition.example) {
            const example = document.createElement("p");
            // css class for the definition example
            example.className = "example";
            example.textContent = "Example: " + definition.example;
            // keep each example next to its definition
            card.appendChild(example);
          }
        });

        // combine available synonyms into a readable list
        if (meaning.synonyms.length > 0) {
          const synonyms = document.createElement("p");
          synonyms.textContent = "Synonyms: " + meaning.synonyms.join(", ");
          // show synonyms only when the entry includes them
          card.appendChild(synonyms);
        }
      });

      // add a control that can save or unsave the displayed word
      const favoriteButton = document.createElement("button");
      // css class for the favorite button
      favoriteButton.className = "favorite-button";

      // keep the button label and style in sync with the saved words
      function updateFavoriteButton() {
        favoriteButton.textContent = favorites.includes(entry.word)
          ? " Saved"
          : " Save";
        // css class toggled when the word is saved
        favoriteButton.classList.toggle(
          "saved",
          favorites.includes(entry.word)
        );
      }

      // set the initial label before the button is shown
      updateFavoriteButton();

      // toggle this word in storage and refresh both favorite views
      favoriteButton.addEventListener("click", () => {
        if (favorites.includes(entry.word)) {
          favorites = favorites.filter((word) => word !== entry.word);
        } else {
          favorites.push(entry.word);
        }

        localStorage.setItem("wordly-favorites", JSON.stringify(favorites));
        // refresh the saved state shown by the button and favorites list
        updateFavoriteButton();
        displayFavorites();
      });

      // attach the completed card and report a successful lookup
      card.appendChild(favoriteButton);
      // display the completed word card in the results area
      results.appendChild(card);

      // let the user know the lookup completed
      message.textContent = "Word found successfully!";
    } catch (error) {
      // clear partial results and show the lookup failure
      message.textContent = error.message;
      results.innerHTML = "";
    }
  }

  // handle searches submitted through the form
  form.addEventListener("submit", (event) => {
    // keep form submission on the page instead of navigating away
    event.preventDefault();

    // trim whitespace so blank input is handled consistently
    const word = input.value.trim();

    // ask for a word when the search field is empty
    if (word === "") {
      message.textContent = "Please enter a word.";
      return;
    }

    // start the dictionary lookup for the cleaned search term
    searchWord(word);
  });

  // restore the favorites display as soon as the page is ready
  displayFavorites();
});
