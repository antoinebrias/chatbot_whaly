import { process } from '/env.js';
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);


// Define the expected response format
const expectedFormat = {
    response: '',
    keywords: [],
    follow_up_questions: [],
    taxon: 'none'
};

const conversationArr = [
    {
        role: 'system',
        content: `You are an expert in marine science (the study of fish, ocean and sea species). You answer questions only about species, habitats, distribution, and behavior. Provide brief and concise answers. Additionally, you must be able to write API calls to fishbase or GBIF for the relevant species if the user asks for.
        After each response, include two relevant keywords that summarize the main topics of your answer. 
        Additionally, each keyword is associated to a follow-up questions related to the topic discussed to help the user dig deeper into the subject. 
      
        Additionally, find the best suitable taxon in the dialog and include it as "taxon" in your response, formatted as follows:
        - Two words
        - The first letter of the first word capitalized
        - The rest of the letters in lowercase
        If no suitable taxon is found, return "none".
    The format of your response will always be a structure with 4 elements: response, keywords, follow_up_questions and taxon.   If asked about other topics, politely redirect the conversation to marine science-related information (still following the output structure). Stick with the format in the following examples:
        {
            "response": "The Atlantic bluefin tuna (Thunnus thynnus) primarily inhabit warm, shallow waters of the Pacific and Indian Oceans, often living among the tentacles of sea anemones.",
            "keywords": ["Clownfish", "Sea Anemone"],
            "follow_up_questions": [
                "What are the behaviors that clownfish exhibit in their natural habitat?",
                "How do clownfish protect themselves from predators?"
            ],
            "taxon": "Thunnus thynnus"
        }, 
          {
            "response": "Anchovies (Engraulidae) are small, common saltwater forage fish of the family Engraulidae. They are found in shallow, brackish areas of the Atlantic, Indian, and Pacific Oceans.",
            "keywords": ["Predators?", "Migration?"],
            "follow_up_questions": [
                "What are the main predators of anchovies?",
                "How does the seasonal migration of anchovies occur?"
            ],
            "taxon": "Anchoa mitchilli"
        }, if user asks for API call:
          {
            "response": "An example of GBIF API call is https://api.gbif.org/v1/species/match?name=Dentex dentex",
            "keywords": [],
            "follow_up_questions": [],
            "taxon": "none"
        }
or if the user asks for unrelevant topics :
         {
            "response": "We should talk about fish right?",
            "keywords": [],
            "follow_up_questions": [],
            "taxon": "none"
        }

`
    }
];

const chatbotConversation = document.getElementById('chatbot-conversation');
const suggestionsContainer = document.getElementById('suggestions-container');

document.addEventListener('submit', (e) => {
    e.preventDefault();
    const userInput = document.getElementById('user-input');   
    const newSpeechBubble = document.createElement('div');
    newSpeechBubble.classList.add('speech', 'speech-human');
    newSpeechBubble.textContent = userInput.value;
    chatbotConversation.appendChild(newSpeechBubble);

    // Update conversationArr with user input
    conversationArr.push({ 
        role: 'user',
        content: userInput.value
    });

    // Disable all suggestion buttons
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');
    suggestionButtons.forEach(button => {
        button.classList.add('disabled');
        button.disabled = true; // Disable button to prevent further clicks
    });

    userInput.value = ''; // Clear the input field
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight; // Scroll to the bottom
    
    fetchReply(); // Fetch reply from the bot
});

async function getTaxonKey(taxon) {
    if (taxon === 'none') {
        console.log('No valid taxon provided. Returning null.');
        return null; // Handle as needed
    }

    const formatTaxon = (taxon) => {
        const words = taxon.toLowerCase().split(' ');
        return words.length === 2
            ? words[0].charAt(0).toUpperCase() + words[0].slice(1) + ' ' + words[1]
            : 'none'; // Return 'none' if the taxon doesn't meet the criteria
    };

    const formattedTaxon = formatTaxon(taxon);
    const url = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(formattedTaxon)}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.usageKey) {
            console.log('Taxon key found:', data.usageKey);
            return data.usageKey; // Return the taxon key if found
        } else {
            console.log('No taxon key found for:', formattedTaxon);
            return null; // Return null if not found
        }
    } catch (error) {
        console.error('Error fetching taxon key:', error);
        return null; // Handle the error
    }
}

async function fetchReply() {
    const typingIndicator = document.createElement('div');
    await new Promise(resolve => setTimeout(resolve, 500));
    typingIndicator.classList.add('speech', 'speech-ai', 'blinking-cursor');
    typingIndicator.textContent = 'Whaly is thinking...';
    chatbotConversation.appendChild(typingIndicator);
    
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight;

    // Reminder for expected format
    const formatReminder = {
        role: 'system',
        content: `Please remember the expected response format: {
            response: '',
            keywords: [],
            follow_up_questions: [],
            taxon: 'none'
        }`
    };
    conversationArr.push(formatReminder); // Add this reminder to conversation history

    try {
        const response = await openai.createChatCompletion({
            model: 'gpt-4',
            messages: conversationArr,
        });

        // Check if choices are available
        if (!response.data.choices || response.data.choices.length === 0) {
            throw new Error('No choices available in the response.');
        }

        const replyData = response.data.choices[0].message.content;
        console.log('replyData:', replyData);
        // Try parsing the JSON, handle any parsing errors
        let parsedData;
        try {
            parsedData = JSON.parse(replyData);
        } catch (jsonError) {
            throw new Error('Failed to parse the reply data: ' + jsonError.message);
        }

        const { response: reply, keywords, follow_up_questions, taxon } = parsedData;

        let taxonKey = null;
        if (taxon && taxon !== 'none') {
            taxonKey = await getTaxonKey(taxon);
        }

        // Check if taxonKey is valid
        if (!taxonKey) {
            console.warn('No valid taxon key found for:', taxon);
        }

        conversationArr.push({ 
            role: 'assistant', 
            content: reply, 
            taxon: taxonKey || 'none' 
        });

        chatbotConversation.removeChild(typingIndicator);
        renderTypewriterText(reply, keywords, follow_up_questions, taxonKey);
    } catch (error) {
        console.error('Error fetching the reply:', error);
        chatbotConversation.removeChild(typingIndicator);
        const errorBubble = document.createElement('div');
        errorBubble.classList.add('speech', 'speech-ai');
        errorBubble.textContent = 'Sorry, there was an error fetching the reply. Try again.';
        chatbotConversation.appendChild(errorBubble);
    }

    chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
}



function renderTypewriterText(text, keywords, follow_up_questions, taxonKey) {
    const newSpeechBubble = document.createElement('div');
    newSpeechBubble.classList.add('speech', 'speech-ai', 'blinking-cursor');
    chatbotConversation.appendChild(newSpeechBubble);

    let i = 0;
    const interval = setInterval(() => {
        newSpeechBubble.textContent += text.slice(i, i + 1);
        i++;
        if (i === text.length) {
            clearInterval(interval);
            newSpeechBubble.classList.remove('blinking-cursor');
            generateSuggestions(keywords, follow_up_questions, taxonKey);
        }
        chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
    }, 50);
}

function generateSuggestions(keywords, follow_up_questions, taxonKey) {
    suggestionsContainer.innerHTML = ''; // Clear previous suggestions
    
    keywords.forEach((keyword, index) => {
        const suggestionButton = document.createElement('button');
        suggestionButton.classList.add('suggestion-btn');
        suggestionButton.textContent = keyword + '?';
        suggestionButton.onclick = () => handleSuggestionClick(follow_up_questions[index]);
        suggestionsContainer.appendChild(suggestionButton);
    });

    if (taxonKey && taxonKey !== 'none') {
        const taxonButton = document.createElement('button');
        taxonButton.classList.add('suggestion-btn', 'taxon-button');

        const globeImage = document.createElement('img');
        globeImage.src = 'images/glob.png';
        globeImage.alt = 'Glob';
        globeImage.style.width = '25px';
        globeImage.style.height = '25px';
        taxonButton.appendChild(globeImage);

        taxonButton.onclick = () => loadTaxonMap(taxonKey, { style: 'classic.poly', bin: 'hex', hexPerTile: 17 });
        suggestionsContainer.appendChild(taxonButton);
    }

    suggestionsContainer.style.display = suggestionsContainer.childElementCount > 0 ? 'block' : 'none';
}

function handleSuggestionClick(followUpQuestion) {
    const userInput = document.getElementById('user-input');
    userInput.value = followUpQuestion;
}

function loadTaxonMap(taxonKey, params = {}) {
    // Clear existing map before loading a new one
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = ''; // Clear any existing map layers

    var pixel_ratio = parseInt(window.devicePixelRatio) || 1;

    // Create the tile grid for zooming and tiling
    var tile_grid_16 = ol.tilegrid.createXYZ({
        minZoom: 0,
        maxZoom: 16,
        tileSize: 512,
    });

    // Base raster layer (background map)
    var layers = [];

    // Base layer style
    var base_raster_style = 'gbif-classic';
    layers.push(new ol.layer.Tile({
        source: new ol.source.TileImage({
            projection: 'EPSG:3857',
            tileGrid: tile_grid_16,
            tilePixelRatio: pixel_ratio,
            url: 'https://tile.gbif.org/3857/omt/{z}/{x}/{y}@' + pixel_ratio + 'x.png?style=' + base_raster_style,
            wrapX: true
        })
    }));

    // Construct the URL for the occurrence density layer
    var densityUrl = `https://api.gbif.org/v2/map/occurrence/density/{z}/{x}/{y}@${pixel_ratio}x.png?srs=EPSG:3857&taxonKey=${taxonKey}`;

    // Append additional parameters to the URL if they exist
    if (params.basisOfRecord) {
        densityUrl += `&basisOfRecord=${params.basisOfRecord}`;
    }
    if (params.years) {
        densityUrl += `&years=${params.years.join(',')}`;
    }
    if (params.bin) {
        densityUrl += `&bin=${params.bin}`;
    }
    if (params.hexPerTile) {
        densityUrl += `&hexPerTile=${params.hexPerTile}`;
    }
    if (params.style) {
        densityUrl += `&style=${params.style}`;
    }

    // Occurrence density layer with the constructed URL
    layers.push(new ol.layer.Tile({
        source: new ol.source.TileImage({
            projection: 'EPSG:3857',
            tileGrid: tile_grid_16,
            tilePixelRatio: pixel_ratio,
            url: densityUrl,
            wrapX: true
        })
    }));

    // Create the map and bind it to the map container
    var map = new ol.Map({
        layers: layers,
        target: 'map',
        view: new ol.View({
            center: [0, 0],
            zoom: 2
        }),
    });

     toggleMapVisibility(true); // Show the map
    toggleDensityUrl(true,densityUrl) 

}

// Function to show/hide the map based on its content
function toggleMapVisibility(isMapVisible) {
    const mapContainer = document.getElementById('map');
    if (isMapVisible) {
        mapContainer.style.display = 'block'; // Show the map
    } else {
        mapContainer.style.display = 'none'; // Hide the map
    }
}

// Function to show/hide the map based on its content
function toggleDensityUrl(isMapVisible,url) {
    const densityUrlDiv = document.getElementById('density-url');

    if (isMapVisible) {
        densityUrlDiv.style.display = 'block'; // Show the map
        densityUrlDiv.textContent = `Distribution map using GBIF API call:${url}`; // Set the text content with the URL
        densityUrlDiv.style.wordWrap = 'break-word'; // Allow wrapping of long URLs

    } else {
        densityUrlDiv.style.display = 'none'; // Hide the map
    }
}

// Function to display the density URL
function displayDensityUrl() {
    console.log('displayDensityUrl:', url);
    const densityUrlDiv = document.getElementById('density-url');

    // Check if the element is found
    if (densityUrlDiv) {
        densityUrlDiv.textContent = `Distribution map using GBIF API call:<br>${url}`; // Set the innerHTML with the URL and a line break 
        densityUrlDiv.style.wordWrap = 'break-word'; // Allow wrapping of long URLs
        densityUrlDiv.style.display = 'block'; // Make the div visible
    } else {
        console.error('Element with ID density-url not found.');
    }
}
