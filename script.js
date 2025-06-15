const findButton = document.getElementById("findButton");
const input = document.getElementById("ingredientInput");
const results = document.getElementById("results");
const favorites = document.getElementById("favorites");
const historyList = document.getElementById("historyList");
const clearHistory = document.getElementById("clearHistory");


const API_KEY = "6c2b54517ee8420eb92d6cdaff79153b"; 
let currentQuery = "";
let currentCount = 0;
const INCREMENT = 10;
const MAX_DISPLAYED = 50; 

// Load saved favorites and history on startup
window.onload = () => {
  loadFavorites();
  loadHistory();
};

findButton.addEventListener("click", () => {
  const ingredients = input.value.trim();
  if (!ingredients) return alert("Please enter ingredients.");
  addToHistory(ingredients);
  fetchRecipes(ingredients);
});

input.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    findButton.click();
  }
});

clearHistory.addEventListener("click", () => {
  localStorage.removeItem("mealMateHistory");
  historyList.innerHTML = "";
});

function fetchRecipes(ingredients, append = false) {
  if(!append){
    currentQuery = ingredients;
    currentCount = INCREMENT;
    results.innerHTML = "<p class='text-gray-600 col-span-full'>Loading recipes...</p>";
  }
  else{ 
    currentCount += INCREMENT;
  }
 

  fetch(`https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients}&number=${MAX_DISPLAYED}&apiKey=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if(!append) {
        results.innerHTML = ""; 
      }
      if (data.length === 0) {
        results.innerHTML = "<p class='text-red-500 col-span-full'>No recipes found.</p>";
        return;
      }

     const displayed = document.querySelectorAll("#results .bg-white").length;
      data.slice(displayed).forEach(recipe => renderCard(recipe, results, true));
    })
    .catch(err => {
      console.error(err);
      results.innerHTML = "<p class='text-red-500 col-span-full'>Error fetching recipes.</p>";
    });
}

function renderCard(recipe, container, showFavBtn = false) {
  const card = document.createElement("div");
  card.className = "bg-white rounded-lg shadow-md p-4 flex flex-col items-center text-center";

  const favBtn = showFavBtn
    ? `<button class="mt-2 text-red-500 hover:text-red-700 text-sm add-fav-btn" data-recipe='${JSON.stringify(recipe)}'>❤️ Add to Favorites</button>`
    : `<button class="mt-2 text-gray-500 hover:text-gray-700 text-sm remove-fav-btn" data-id="${recipe.id}">🗑 Remove</button>`;

  card.innerHTML = `
    <img src="${recipe.image}" alt="${recipe.title}" class="w-full h-40 object-cover rounded mb-2">
    <h2 class="text-lg font-semibold">${recipe.title}</h2>
    <a href="https://spoonacular.com/recipes/${recipe.title.toLowerCase().replace(/ /g, "-")}-${recipe.id}" 
       target="_blank" class="text-green-600 mt-2 underline">View Recipe</a>
    ${favBtn}
  `;

  container.appendChild(card);
}



function saveFavorite(recipe) {
  const current = JSON.parse(localStorage.getItem("mealMateFavorites") || "[]");

  if (!current.find(r => r.id === recipe.id)) {
    current.push(recipe);
    localStorage.setItem("mealMateFavorites", JSON.stringify(current));
    loadFavorites();
  }
}


function loadFavorites() {
  favorites.innerHTML = "";
  const saved = JSON.parse(localStorage.getItem("mealMateFavorites") || "[]");
  saved.forEach(recipe => renderCard(recipe, favorites, false));
}

function addToHistory(query) {
  const history = JSON.parse(localStorage.getItem("mealMateHistory") || "[]");
  if (!history.includes(query)) {
    history.push(query);
    localStorage.setItem("mealMateHistory", JSON.stringify(history));
    loadHistory();
  }
}

function loadHistory() {
  historyList.innerHTML = "";
  const history = JSON.parse(localStorage.getItem("mealMateHistory") || "[]");

  history.forEach(item => {
    const tag = document.createElement("button");
    tag.className = "bg-gray-200 px-2 py-1 rounded hover:bg-gray-300 text-sm";
    tag.textContent = item;
    tag.onclick = () => {
      input.value = item;
      fetchRecipes(item);
    };
    historyList.appendChild(tag);
  });
}

// Event delegation for dynamic favorite buttons
results.addEventListener("click", (e) => {
  if (e.target.classList.contains("add-fav-btn")) {
    const recipeData = JSON.parse(e.target.getAttribute("data-recipe"));
    saveFavorite(recipeData);
  }
});

favorites.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-fav-btn")) {
    const recipeId = parseInt(e.target.getAttribute("data-id"));
    deleteFavorite(recipeId);
  }
});

function deleteFavorite(id) {
  let saved = JSON.parse(localStorage.getItem("mealMateFavorites") || "[]");
  saved = saved.filter(r => r.id !== id);
  localStorage.setItem("mealMateFavorites", JSON.stringify(saved));
  loadFavorites();
}

window.addEventListener("scroll", () => {
  if(
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && 
    currentQuery && currentCount < MAX_DISPLAYED
  ){
    fetchRecipes(currentQuery, true);
  }
});

