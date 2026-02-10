
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Path to pokemons data file
const pokemonsFilePath = path.join(__dirname, 'data', 'pokemons.json');

// Helper functions to read and write Pokemon data
const readPokemons = () => {
  try {
    const data = fs.readFileSync(pokemonsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading pokemons:', error);
    return [];
  }
};

const writePokemons = (pokemons) => {
  try {
    fs.writeFileSync(pokemonsFilePath, JSON.stringify(pokemons, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing pokemons:', error);
    return false;
  }
};

// Routes

// GET all pokemons with pagination (20 per page)
app.get('/api/pokemons', (req, res) => {
  const pokemons = readPokemons();
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedPokemons = pokemons.slice(startIndex, endIndex);
  const totalPages = Math.ceil(pokemons.length / limit);

  res.json({
    pokemons: paginatedPokemons,
    currentPage: page,
    totalPages: totalPages,
    totalPokemons: pokemons.length,
    limit: limit
  });
});

// GET a pokemon by name (search)
app.get('/api/pokemons/search/:name', (req, res) => {
  const pokemons = readPokemons();
  const searchName = req.params.name.toLowerCase();
  
  const pokemon = pokemons.find(p => 
    p.name.english.toLowerCase().includes(searchName) ||
    p.name.french.toLowerCase().includes(searchName) ||
    p.name.japanese.toLowerCase().includes(searchName)
  );

  if (!pokemon) {
    return res.status(404).json({ error: 'Pokemon not found' });
  }

  res.json(pokemon);
});

// GET a pokemon by ID
app.get('/api/pokemons/:id', (req, res) => {
  const pokemons = readPokemons();
  const id = parseInt(req.params.id);
  
  const pokemon = pokemons.find(p => p.id === id);

  if (!pokemon) {
    return res.status(404).json({ error: 'Pokemon not found' });
  }

  res.json(pokemon);
});

// POST create a new pokemon
app.post('/api/pokemons', (req, res) => {
  const pokemons = readPokemons();
  const newPokemon = req.body;

  // Generate new ID
  const maxId = Math.max(...pokemons.map(p => p.id), 0);
  newPokemon.id = maxId + 1;

  // Validate required fields
  if (!newPokemon.name || !newPokemon.type || !newPokemon.base) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  pokemons.push(newPokemon);

  if (writePokemons(pokemons)) {
    res.status(201).json(newPokemon);
  } else {
    res.status(500).json({ error: 'Error saving pokemon' });
  }
});

// PUT update a pokemon by ID
app.put('/api/pokemons/:id', (req, res) => {
  const pokemons = readPokemons();
  const id = parseInt(req.params.id);
  
  const pokemonIndex = pokemons.findIndex(p => p.id === id);

  if (pokemonIndex === -1) {
    return res.status(404).json({ error: 'Pokemon not found' });
  }

  const updatedPokemon = { ...pokemons[pokemonIndex], ...req.body, id };
  pokemons[pokemonIndex] = updatedPokemon;

  if (writePokemons(pokemons)) {
    res.json(updatedPokemon);
  } else {
    res.status(500).json({ error: 'Error updating pokemon' });
  }
});

// DELETE a pokemon by ID
app.delete('/api/pokemons/:id', (req, res) => {
  const pokemons = readPokemons();
  const id = parseInt(req.params.id);
  
  const pokemonIndex = pokemons.findIndex(p => p.id === id);

  if (pokemonIndex === -1) {
    return res.status(404).json({ error: 'Pokemon not found' });
  }

  const deletedPokemon = pokemons[pokemonIndex];
  pokemons.splice(pokemonIndex, 1);

  if (writePokemons(pokemons)) {
    res.json({ message: 'Pokemon deleted successfully', pokemon: deletedPokemon });
  } else {
    res.status(500).json({ error: 'Error deleting pokemon' });
  }
});

// Static route for assets
app.get('/', (req, res) => {
  res.send('Pokemon API Server is running. Use /api/pokemons endpoints.');
});

console.log('Server is set up. Ready to start listening on a port.');

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});