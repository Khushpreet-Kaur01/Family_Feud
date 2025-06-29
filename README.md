# शब्द संवाद (Shabd Samvad) - Sanskrit Family Feud

A real-time multiplayer Sanskrit-themed Family Feud game built with Node.js, Express, and Socket.IO. Two teams compete to answer Sanskrit-related questions in this interactive game show experience.

## 🎮 Game Overview

**शब्द संवाद** (Word Dialogue) is a Sanskrit-themed adaptation of the classic Family Feud game format. Teams compete to guess the most popular answers to Sanskrit-related survey questions, earning points based on the popularity of their responses.

### Game Rules
- **Two Teams**: Team A (🔵) vs Team B (🔴)
- **3 Questions** per game session
- **40 seconds** per question
- **3 strikes** maximum per team per question
- **Points** awarded based on answer popularity
- **Real-time chat** for team coordination

## ✨ Features

- **Real-time Multiplayer**: Live gameplay using WebSockets
- **Host Dashboard**: Complete game control and monitoring
- **Team Chat**: In-game communication for team members
- **Responsive Design**: Works on desktop and mobile devices
- **Sanskrit Theme**: Questions focused on Sanskrit language and culture
- **Live Scoring**: Real-time score updates and strike tracking
- **Game Show Atmosphere**: Immersive UI with animations and effects

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   https://github.com/Khushpreet-Kaur01/Family_Feud
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Access the game**
   - Open your browser to `http://localhost:3000`
   - The server will display network URLs for other devices to join, All the participants and host must connect to same network to play the game and use URL provided by server.

## 🎯 How to Play

### For the Host
1. Navigate to `/host` or click "Host Login" from the main page
2. Login with credentials:
   - Username: `gamehost`
   - Password: `host123`
3. Wait for participants to join teams
4. Start the game when ready
5. Control answer reveals and game flow

### For Participants
1. Navigate to `/participant` or click "Join Team" from the main page
2. Select your team (Team A or Team B)
3. Enter your name and team password: `team123`
4. Wait in the team lobby for the game to start
5. Submit answers during gameplay and chat with teammates

## 🏗️ Project Structure

```
sanskrit-family-feud/
├── public/
│   ├── index.html          # Welcome page
│   ├── host.html           # Host dashboard
│   ├── participant.html    # Participant interface
│   └── gameshow-background.jpg
├── server.js               # Main server file
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.IO
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Styling**: Custom CSS with glassmorphism effects
- **Development**: Nodemon for auto-restart

## 🎨 Game Features

### Host Dashboard
- **Team Management**: View all participants and their teams
- **Game Control**: Start games, reveal answers, manage questions
- **Live Monitoring**: See team chats, scores, and strikes in real-time
- **Manual Controls**: Reveal individual answers or all at once

### Participant Interface
- **Team Selection**: Choose between Team A or Team B
- **Real-time Chat**: Coordinate with teammates
- **Answer Submission**: Submit answers with instant feedback
- **Live Updates**: See scores, timer, and revealed answers in real-time

### Game Mechanics
- **Timer System**: 40-second countdown per question
- **Strike System**: 3 strikes per team per question
- **Scoring**: Points based on answer popularity
- **Answer Matching**: Fuzzy matching for Sanskrit and English inputs

## 📝 Sample Questions

1. **Natural Elements**: Name Sanskrit terms for natural elements (earth, fire, water, etc.)
2. **Knowledge Terms**: Sanskrit words for 'knowledge' and variations
3. **Cultural Phrases**: Complete and explain famous Sanskrit phrases like "वसुधैव कुटुम्बकम्"

## 🔧 Configuration

### Default Credentials
- **Host Login**: `gamehost` / `host123`
- **Team Password**: `team123`

### Server Settings
- **Default Port**: 3000
- **Timer Duration**: 40 seconds per question
- **Max Strikes**: 3 per team per question
- **Questions**: 3 per game

## 🌐 Network Play

The server automatically detects your local IP address and displays connection URLs:
- **Local**: `http://localhost:3000`
- **Network**: `http://[your-ip]:3000`

Share the network URL with participants on the same network to join the game.

## 🎭 Game Flow

1. **Setup**: Host logs in and waits for participants
2. **Team Formation**: Participants join Team A or Team B
3. **Game Start**: Host initiates the game with a countdown
4. **Questions**: 3 rounds of questions with 40-second timers
5. **Scoring**: Points awarded for correct answers
6. **Results**: Final scores and winner announcement

## 🤝 Contributing

Contributions are welcome! Here are some ways you can help:

- Add more Sanskrit questions and answers
- Improve the UI/UX design
- Add sound effects and music
- Implement additional game modes
- Fix bugs and improve performance

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## 📱 Mobile Support

The game is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile phones
- Smart TVs (for display purposes)

## 🐛 Troubleshooting

### Common Issues

**Connection Problems**
- Ensure all devices are on the same network
- Check firewall settings
- Try using the IP address instead of localhost

**Game Not Starting**
- Verify at least one participant has joined each team
- Check host credentials
- Refresh the page and try again

**Chat Not Working**
- Ensure participants are properly logged in
- Check browser console for errors
- Verify WebSocket connection

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the classic Family Feud game show format
- Sanskrit questions curated for educational and cultural value
- Built with modern web technologies for seamless real-time gameplay

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Open an issue on GitHub
3. Contact the development team

---

**सर्वेभ्यः प्रतियोगिभ्यः तथा आमन्त्रकाय हार्दं स्वागतं।**  
*A heartfelt welcome to all participants and hosts!*

Enjoy playing शब्द संवाद! 🎮✨
