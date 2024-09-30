# ![fish-logo](https://github.com/user-attachments/assets/92a0a0b2-2f7e-4d31-8823-9ddefc2bf2de) Fish-Focused Chatbot ![fish-logo](https://github.com/user-attachments/assets/92a0a0b2-2f7e-4d31-8823-9ddefc2bf2de) 

## Overview

This web application is designed to provide information about fish species and their distribution. The chatbot utilizes an OpenAI language model to answer user queries and generate distribution maps for various fish species. 🌊🐠

## Features

- **Conversational Interface**: Ask questions about fish and receive informative responses. 💬
- **Taxon Identification**: The chatbot identifies and provides information on specific fish taxa. 🦈
- **Distribution Mapping**: Generates maps showing the distribution of fish species based on user queries using GBIF API. 🗺️
- **Follow-Up Suggestions**: Offers suggestions for continuing the conversation based on user input. 🔄
- **Adaptable**: Can be customized to provide information on other animals or data if specified. 🦋🐾

## Installation

To set up this project locally, follow these steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/antoinebrias/chatbot_whaly.git
   cd chatbot_whaly
   ```
2. **Install Dependencies**: Ensure you have Node.js installed, then run:
   ```bash
   npm install
   ```

3. **Set Up OpenAI API Key**: You'll need to place your own OpenAI API key in env.js. 
   
4. **Run the server**:
   ```bash
   npm start
   ```   
5. **Open the Application**: Navigate to http://localhost:5174 in your browser to view the chatbot in action! 

## Usage

Once the chatbot is running, you can interact with it by typing questions related to fish species. The chatbot will respond with information, keywords, and follow-up questions. You can also view distribution maps related to the fish species you inquire about. 

## Example Interaction

- **User**: "Tell me about red salmon."  
- **Chatbot**: "Red salmon, also known as sockeye salmon, is recognized for its vibrant red color during spawning. They primarily inhabit the North Pacific Ocean and rivers that flow into it." 🌊 
  - **Keywords**: Lifecycle, Other salmon
  - **Follow-Up Questions**: "What is their lifecycle like?" | "How do they differ from other salmon species?"   
  - **Taxon**: Oncorhynchus nerka    

## Adaptability

This chatbot can be adapted to provide information about other animals or datasets. Specify your needs, and the chatbot can be customized accordingly. 

## Video Illustration

https://github.com/user-attachments/assets/d4c79c50-54de-446d-9e95-89bad5386679

## Contributing

If you'd like to contribute to this project, feel free to submit a pull request or open an issue. 🙌

## License

This project is licensed under the MIT License. See the LICENSE file for more details. 📜

## Acknowledgements

- gbif.org for taxon information. 🌿
- https://www.freecodecamp.org/news/build-gpt-4-api-chatbot-turorial/#heading-the-flow-of-this-app was a good starting base.
