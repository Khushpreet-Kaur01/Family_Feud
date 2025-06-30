const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Game state
let gameState = {
    isActive: false,
    currentQuestion: 0,
    timer: 40,
    timerInterval: null,
    scores: { 'Team A': 0, 'Team B': 0 },
    strikes: { 'Team A': 0, 'Team B': 0 },
    participants: { 'Team A': [], 'Team B': [] },
    host: null,
    revealedAnswers: {
        'Team A': [],
        'Team B': []
    },
    teamAnswers: { 'Team A': [], 'Team B': [] }, // Store team answers for final display
    teamChats: { 'Team A': [], 'Team B': [] }, // Store chat messages
    questions: [
        {
            question: "Name a Sanskrit term for natural element( earth, fire, water etc)?",
            answers: [
                { text: "Agni", points: 25 },
                { text: "Prithvi", points: 20 },
                { text: "Bhumi", points: 15 },
                { text: "Jal", points: 10 },
                { text: "Vayu", points: 5 }
            ]
        },
        {
            question: "What is the Sanskrit word for 'knowledge' and its variations?",
            answers: [
                { text: "ज्ञान (Gyana)", points: 25 },
                { text: "विद्या (Vidya)", points: 20 },
                { text: "बुद्धि (Buddhi)", points: 15 },
                { text: "प्रज्ञा (Prajna)", points: 10 },
                { text: "मेधा (Medha)", points: 5 }
            ]
        },
        {
            question: "Complete: 'वसुधैव कुटुम्बकम्' - What does this Sanskrit phrase mean?",
            answers: [
                { text: "The world is one family", points: 25 },
                { text: "Earth is our home", points: 20 },
                { text: "Unity in diversity", points: 15 },
                { text: "Global brotherhood", points: 10 },
                { text: "Universal love", points: 5 }
            ]
        }
    ]
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/host', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'host.html'));
});

app.get('/participant', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'participant.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Host login
    socket.on('host-login', (credentials) => {
        if (credentials.username === 'gamehost' && credentials.password === 'host123') {
            gameState.host = socket.id;
            socket.join('host');
            socket.emit('host-authenticated', {
                success: true,
                gameState: {
                    participants: gameState.participants,
                    scores: gameState.scores,
                    strikes: gameState.strikes,
                    isActive: gameState.isActive
                }
            });
            console.log('Host authenticated:', socket.id);
        } else {
            socket.emit('host-authenticated', { success: false });
        }
    });

    // Participant login
    socket.on('participant-login', (credentials) => {
        const { teamName, participantName, password } = credentials;

        if (password === 'team123' && (teamName === 'Team A' || teamName === 'Team B')) {
            // Check if name already exists
            const allParticipants = [...gameState.participants['Team A'], ...gameState.participants['Team B']];
            if (allParticipants.find(p => p.name === participantName)) {
                socket.emit('participant-authenticated', {
                    success: false,
                    message: 'Name already taken'
                });
                return;
            }

            // Add participant
            const participant = {
                id: socket.id,
                name: participantName,
                team: teamName
            };

            gameState.participants[teamName].push(participant);
            socket.join(teamName);
            socket.participant = participant;

            socket.emit('participant-authenticated', {
                success: true,
                participant: participant,
                teamMembers: gameState.participants[teamName],
                gameState: {
                    isActive: gameState.isActive,
                    currentQuestion: gameState.currentQuestion
                }
            });

            // Update host with new participant
            io.to('host').emit('participants-updated', gameState.participants);

            console.log(`Participant ${participantName} joined ${teamName}`);
        } else {
            socket.emit('participant-authenticated', {
                success: false,
                message: 'Invalid credentials'
            });
        }
    });

    // Start game
    socket.on('start-game', () => {
        if (socket.id === gameState.host) {
            gameState.isActive = true;
            gameState.currentQuestion = 0;
            gameState.scores = { 'Team A': 0, 'Team B': 0 };
            gameState.strikes = { 'Team A': 0, 'Team B': 0 };
            gameState.revealedAnswers = { 'Team A': [], 'Team B': [] };
            gameState.teamAnswers = { 'Team A': [], 'Team B': [] };
            gameState.teamChats = { 'Team A': [], 'Team B': [] };

            // Start countdown for participants
            io.to('Team A').to('Team B').emit('countdown-start');

            setTimeout(() => {
                startQuestion();
            }, 4000); // 3-2-1 countdown + 1 second buffer

            console.log('Game started');
        }
    });

    // Send chat message
    socket.on('send-chat', (data) => {
        console.log('Received send-chat event from:', socket.id, 'Data:', data);

        if (!socket.participant) {
            console.log('Chat rejected - no participant data for socket:', socket.id);
            return;
        }

        // Allow chat in both waiting room and during game
        // Remove the gameState.isActive check to allow chat anytime

        const { message } = data;
        const team = socket.participant.team;
        const sender = socket.participant.name;

        console.log(`Processing chat from ${sender} (${team}): ${message}`);

        // Add message to team chat
        const chatMessage = {
            sender: sender,
            message: message,
            timestamp: new Date().toISOString()
        };

        if (!gameState.teamChats[team]) {
            gameState.teamChats[team] = [];
        }

        gameState.teamChats[team].push(chatMessage);

        console.log(`Team ${team} chat now has ${gameState.teamChats[team].length} messages`);

        // Send to team members
        console.log(`Sending chat to team ${team}`);
        io.to(team).emit('chat-message', {
            team: team,
            messages: gameState.teamChats[team]
        });

        // Send to host (both team chats)
        console.log(`Sending chat to host`);
        io.to('host').emit('chat-message', {
            team: team,
            messages: gameState.teamChats[team]
        });

        console.log(`Chat message sent successfully`);
    });

    // Submit answer by participant
    socket.on('submit-answer', (answerData) => {
        if (!gameState.isActive || !socket.participant) return;

        const { answer } = answerData;
        const team = socket.participant.team;
        const question = gameState.questions[gameState.currentQuestion];

        // Check if answer is correct
        let foundAnswer = null;
        let answerIndex = -1;

        for (let i = 0; i < question.answers.length; i++) {
            const correctAnswer = question.answers[i].text.toLowerCase();
            const userAnswer = answer.toLowerCase();

            if (correctAnswer.includes(userAnswer) || userAnswer.includes(correctAnswer) ||
                // Additional fuzzy matching for Sanskrit words
                (correctAnswer.includes('देवो') && userAnswer.includes('devo')) ||
                (correctAnswer.includes('ज्ञान') && userAnswer.includes('gyan')) ||
                (correctAnswer.includes('विद्या') && userAnswer.includes('vidya'))) {

                // Check if this answer hasn't been revealed to this team yet
                if (!gameState.revealedAnswers[team].includes(i)) {
                    foundAnswer = question.answers[i];
                    answerIndex = i;
                    break;
                }
            }
        }

        if (foundAnswer) {
            // Correct answer
            gameState.revealedAnswers[team].push(answerIndex);
            gameState.scores[team] += foundAnswer.points;

            // Store the answer for final display
            gameState.teamAnswers[team].push({
                question: gameState.currentQuestion + 1,
                answer: answer,
                correct: true,
                points: foundAnswer.points,
                submittedBy: socket.participant.name
            });

            // Send to ONLY the team that answered correctly
            io.to(team).emit('answer-correct', {
                answerIndex: answerIndex,
                answer: foundAnswer,
                points: foundAnswer.points,
                teamScore: gameState.scores[team],
                allScores: gameState.scores, // Send all scores for real-time updates
                submittedBy: socket.participant.name
            });

            // Send to host with team info (host sees all reveals)
            io.to('host').emit('answer-revealed', {
                team: team,
                answerIndex: answerIndex,
                answer: foundAnswer,
                points: foundAnswer.points,
                scores: gameState.scores,
                submittedBy: socket.participant.name,
                submittedAnswer: answer
            });

            console.log(`Team ${team} correctly answered: ${answer} -> ${foundAnswer.text} (+${foundAnswer.points} points)`);

        } else {
            // Incorrect answer
            gameState.strikes[team]++;

            // Store the incorrect answer for final display
            gameState.teamAnswers[team].push({
                question: gameState.currentQuestion + 1,
                answer: answer,
                correct: false,
                submittedBy: socket.participant.name
            });

            // Send strike to team
            io.to(team).emit('answer-incorrect', {
                strikes: gameState.strikes[team],
                submittedBy: socket.participant.name
            });

            // Send to host
            io.to('host').emit('strike-updated', {
                team: team,
                strikes: gameState.strikes[team],
                submittedAnswer: answer,
                submittedBy: socket.participant.name
            });

            // Check if team reached 3 strikes
            if (gameState.strikes[team] >= 3) {
                io.to(team).emit('team-eliminated', { strikes: 3 });
                io.to('host').emit('team-eliminated', { team: team });
            }

            console.log(`Team ${team} incorrect answer: ${answer} (Strike ${gameState.strikes[team]}/3)`);
        }
    });

    // Manual reveal (host only) - reveals to both teams
    socket.on('manual-reveal', (data) => {
        if (socket.id === gameState.host) {
            const { answerIndex } = data;
            const question = gameState.questions[gameState.currentQuestion];
            const answer = question.answers[answerIndex];

            console.log(`Host manually revealing answer ${answerIndex}: ${answer.text}`);

            // Reveal to all participants (both teams)
            io.to('Team A').to('Team B').emit('answer-revealed-all', {
                answerIndex: answerIndex,
                answer: answer,
                allScores: gameState.scores
            });

            // Reveal to host as well - use the same event as participants
            io.to('host').emit('answer-revealed-all', {
                answerIndex: answerIndex,
                answer: answer,
                allScores: gameState.scores
            });

            // Update revealed answers for both teams (since host manually revealed it)
            if (!gameState.revealedAnswers['Team A'].includes(answerIndex)) {
                gameState.revealedAnswers['Team A'].push(answerIndex);
            }
            if (!gameState.revealedAnswers['Team B'].includes(answerIndex)) {
                gameState.revealedAnswers['Team B'].push(answerIndex);
            }
        }
    });

    // Reveal all answers
    socket.on('reveal-all', () => {
        if (socket.id === gameState.host) {
            const question = gameState.questions[gameState.currentQuestion];

            // Reveal all answers to everyone
            io.to('Team A').to('Team B').emit('all-answers-revealed', {
                answers: question.answers
            });

            io.to('host').emit('all-answers-revealed', {
                answers: question.answers
            });

            console.log('Host revealed all answers');
        }
    });

    // Next question
    socket.on('next-question', () => {
        if (socket.id === gameState.host) {
            if (gameState.currentQuestion < 2) { // 0, 1, 2 = 3 questions
                gameState.currentQuestion++;
                gameState.strikes = { 'Team A': 0, 'Team B': 0 };
                gameState.revealedAnswers = { 'Team A': [], 'Team B': [] };
                startQuestion();
            } else {
                endGame();
            }
        }
    });

    // End game
    socket.on('end-game', () => {
        if (socket.id === gameState.host) {
            endGame();
        }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Remove from participants if was a participant
        if (socket.participant) {
            const team = socket.participant.team;
            gameState.participants[team] = gameState.participants[team].filter(
                p => p.id !== socket.id
            );

            // Update host
            io.to('host').emit('participants-updated', gameState.participants);

            // Update team members
            io.to(team).emit('team-updated', gameState.participants[team]);
        }

        // Reset game if host disconnects
        if (socket.id === gameState.host) {
            gameState.host = null;
            gameState.isActive = false;
            if (gameState.timerInterval) {
                clearInterval(gameState.timerInterval);
            }
            io.emit('host-disconnected');
        }
    });
});

// Helper functions
function startQuestion() {
    gameState.timer = 40;

    const question = gameState.questions[gameState.currentQuestion];

    // Send question to all participants and host
    io.emit('question-started', {
        questionNumber: gameState.currentQuestion + 1,
        question: question.question,
        answers: question.answers.map(a => ({ points: a.points })), // Don't send answer text to participants
        fullAnswers: question.answers // Send full answers to host
    });

    // Start timer
    startTimer();
}

function startTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }

    gameState.timerInterval = setInterval(() => {
        gameState.timer--;

        // Broadcast timer update
        io.emit('timer-update', gameState.timer);

        if (gameState.timer <= 0) {
            clearInterval(gameState.timerInterval);
            io.emit('timer-expired');
        }
    }, 1000);
}

function endGame() {
    gameState.isActive = false;
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }

    const winner = gameState.scores['Team A'] > gameState.scores['Team B'] ? 'Team A' :
        gameState.scores['Team B'] > gameState.scores['Team A'] ? 'Team B' : 'Tie';

    io.emit('game-ended', {
        winner: winner,
        scores: gameState.scores,
        teamAnswers: gameState.teamAnswers
    });

    console.log('Game ended. Winner:', winner);
}

// Get local IP address
function getLocalIP() {
    const interfaces = require('os').networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address;
            }
        }
    }
    return 'localhost';
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    const localIP = getLocalIP();
    console.log(`🎮 शब्द संवाद Server running on:`);
    console.log(`   Local:    http://localhost:${PORT}`);
    console.log(`   Network:  http://${localIP}:${PORT}`);
    console.log(`\n📱 Team members can join using: http://${localIP}:${PORT}`);
    console.log(`🎯 Host login: http://${localIP}:${PORT}/host`);
    console.log(`👥 Participant login: http://${localIP}:${PORT}/participant`);
});