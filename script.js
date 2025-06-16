const findButton = document.getElementById("findButton");
const input = document.getElementById("ingredientInput");
const results = document.getElementById("results");
const favorites = document.getElementById("favorites");
const historyList = document.getElementById("historyList");
const clearHistory = document.getElementById("clearHistory");

// Authentication elements
const authModal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authSubmit = document.getElementById("authSubmit");
const toggleAuth = document.getElementById("toggleAuth");
const registerFields = document.getElementById("registerFields");
const closeModal = document.getElementById("closeModal");
const authError = document.getElementById("authError");

// User section elements
const guestSection = document.getElementById("guestSection");
const userInfo = document.getElementById("userInfo");
const usernameDisplay = document.getElementById("usernameDisplay");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginPrompt = document.getElementById("loginPrompt");
const loginPromptBtn = document.getElementById("loginPromptBtn");

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const SPOONACULAR_API_KEY = "6c2b54517ee8420eb92d6cdaff79153b"; 

// State management
let currentUser = null;
let authToken = null;
let isRegistering = false;
let currentQuery = "";
let currentCount = 0;
const INCREMENT = 10;
const MAX_DISPLAYED = 50;

// Initialize app
window.onload = () => {
  checkAuthStatus();
  loadHistory();
};

// Authentication functions
function checkAuthStatus() {
  authToken = localStorage.getItem('authToken');
  const userData = localStorage.getItem('userData');
  
  if (authToken && userData) {
    currentUser = JSON.parse(userData);
    showUserInterface();
    loadFavorites();
  } else {
    showGuestInterface();
  }
}

function showUserInterface() {
  guestSection.classList.add('hidden');
  userInfo.classList.remove('hidden');
  loginPrompt.classList.add('hidden');
  usernameDisplay.textContent = currentUser.username;
}

function showGuestInterface() {
  guestSection.classList.remove('hidden');
  userInfo.classList.add('hidden');
  loginPrompt.classList.remove('hidden');
  favorites.innerHTML = '';
}

function showAuthModal(register = false) {
  isRegistering = register;
  authTitle.textContent = register ? 'Register' : 'Login';
  authSubmit.textContent = register ? 'Register' : 'Login';
  toggleAuth.textContent = register ? 'Already have an account? Login' : "Don't have an account? Register";
  
  if (register) {
    registerFields.classList.remove('hidden');
  } else {
    registerFields.classList.add('hidden');
  }
  
  authModal.classList.remove('hidden');
  authError.classList.add('hidden');
  authForm.reset();
}

function hideAuthModal() {
  authModal.classList.add('hidden');
  authForm.reset();
  authError.classList.add('hidden');
}

function showAuthError(message) {
  authError.textContent = message;
  authError.classList.remove('hidden');
}

async function handleAuth(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  const payload = { username, password };
  
  if (isRegistering) {
    payload.email = document.getElementById('email').value;
    payload.firstName = document.getElementById('firstName').value;
    payload.lastName = document.getElementById('lastName').value;
  }
  
  try {
    const endpoint = isRegistering ? '/auth/register' : '/auth/login';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      authToken = data.token;
      currentUser = data.user;
      
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('userData', JSON.stringify(currentUser));
      
      hideAuthModal();
      showUserInterface();
      loadFavorites();
      
      // Migrate local favorites to server
      await migrateFavoritesToServer();
      
    } else {
      showAuthError(data.error || 'Authentication failed');
    }
  } catch (error) {
    console.error('Auth error:', error);
    showAuthError('Network error. Please try again.');
  }
}

async function logout() {
  try {
    if (authToken) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  authToken = null;
  currentUser = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  
  showGuestInterface();
}

// Migrate local favorites to server
async function migrateFavoritesToServer() {
  const localFavorites = JSON.parse(localStorage.getItem("mealMateFavorites") || "[]");
  
  for (const recipe of localFavorites) {
    try {
      await fetch(`${API_BASE_URL}/users/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          recipeImage: recipe.image
        })
      });
    } catch (error) {
      console.error('Error migrating favorite:', error);
    }
  }
  
  // Clear local favorites after migration
  localStorage.removeItem("mealMateFavorites");
}

// Recipe functions
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

clearHistory.addEventListener("click", async () => {
  if (currentUser) {
    try {
      await fetch(`${API_BASE_URL}/users/search-history`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
    } catch (error) {
      console.error('Error clearing server history:', error);
    }
  }
  
  localStorage.removeItem("mealMateHistory");
  historyList.innerHTML = "";
});

function fetchRecipes(ingredients, append = false) {
  if (!append) {
    currentQuery = ingredients;
    currentCount = INCREMENT;
    results.innerHTML = "<p class='text-gray-600 col-span-full'>Loading recipes...</p>";
  } else {
    currentCount += INCREMENT;
  }

  fetch(`https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients}&number=${MAX_DISPLAYED}&apiKey=${SPOONACULAR_API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (!append) {
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

  const favBtn = showFavBtn && currentUser
    ? `<button class="mt-2 text-red-500 hover:text-red-700 text-sm add-fav-btn" data-recipe='${JSON.stringify(recipe)}'>❤️ Add to Favorites</button>`
    : showFavBtn
    ? `<button class="mt-2 text-gray-400 text-sm cursor-not-allowed" disabled>❤️ Login to Save</button>`
    : `<button class="mt-2 text-gray-500 hover:text-gray-700 text-sm remove-fav-btn" data-id="${recipe.recipe_id || recipe.id}">🗑 Remove</button>`;

  card.innerHTML = `
    <img src="${recipe.image}" alt="${recipe.title || recipe.recipe_title}" class="w-full h-40 object-cover rounded mb-2">
    <h2 class="text-lg font-semibold">${recipe.title || recipe.recipe_title}</h2>
    <a href="https://spoonacular.com/recipes/${(recipe.title || recipe.recipe_title).toLowerCase().replace(/ /g, "-")}-${recipe.id || recipe.recipe_id}" 
       target="_blank" class="text-green-600 mt-2 underline">View Recipe</a>
    ${favBtn}
  `;

  container.appendChild(card);
}

async function saveFavorite(recipe) {
  if (!currentUser) {
    alert('Please login to save favorites');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        recipeImage: recipe.image
      })
    });

    if (response.ok) {
      loadFavorites();
    } else {
      const data = await response.json();
      if (data.error === 'Recipe already in favorites') {
        alert('Recipe is already in your favorites!');
      } else {
        alert('Error saving favorite');
      }
    }
  } catch (error) {
    console.error('Error saving favorite:', error);
    alert('Error saving favorite');
  }
}

async function loadFavorites() {
  if (!currentUser) {
    favorites.innerHTML = "";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/favorites`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      favorites.innerHTML = "";
      data.favorites.forEach(recipe => renderCard(recipe, favorites, false));
    }
  } catch (error) {
    console.error('Error loading favorites:', error);
  }
}

async function addToHistory(query) {
  if (currentUser) {
    try {
      await fetch(`${API_BASE_URL}/users/search-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ query })
      });
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  // Also save locally as backup
  const history = JSON.parse(localStorage.getItem("mealMateHistory") || "[]");
  if (!history.includes(query)) {
    history.push(query);
    localStorage.setItem("mealMateHistory", JSON.stringify(history));
  }
  
  loadHistory();
}

async function loadHistory() {
  historyList.innerHTML = "";
  let history = [];

  if (currentUser) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/search-history`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        history = data.history.map(item => item.search_query);
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }

  // Fallback to local storage
  if (history.length === 0) {
    history = JSON.parse(localStorage.getItem("mealMateHistory") || "[]");
  }

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

async function deleteFavorite(recipeId) {
  if (!currentUser) return;

  try {
    const response = await fetch(`${API_BASE_URL}/users/favorites/${recipeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      loadFavorites();
    }
  } catch (error) {
    console.error('Error deleting favorite:', error);
  }
}

// Event listeners
loginBtn.addEventListener('click', () => showAuthModal(false));
registerBtn.addEventListener('click', () => showAuthModal(true));
loginPromptBtn.addEventListener('click', () => showAuthModal(false));
logoutBtn.addEventListener('click', logout);
closeModal.addEventListener('click', hideAuthModal);
toggleAuth.addEventListener('click', () => showAuthModal(!isRegistering));
authForm.addEventListener('submit', handleAuth);

// Close modal on outside click
authModal.addEventListener('click', (e) => {
  if (e.target === authModal) {
    hideAuthModal();
  }
});

// Event delegation for dynamic buttons
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

// Infinite scroll
window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && 
    currentQuery && currentCount < MAX_DISPLAYED
  ) {
    fetchRecipes(currentQuery, true);
  }
});