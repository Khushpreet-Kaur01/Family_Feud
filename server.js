const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// Serve the main game file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.html'));
});

// Game state
let gameState = {
    participants: {
        teamA: [],
        teamB: []
    },
    host: null,
    gameStarted: false,
    currentQuestion: 1,
    timer: 40,
    strikes: { teamA: 0, teamB: 0 },
    scores: { teamA: 0, teamB: 0 },
    questions: [
        {
            question: "Complete the Sanskrit verse: 'सत्यं वद धर्मं चर स्वाध्यायान्मा प्रमदः |' What comes next?",
            answers: [
                { text: "आचार्याय प्रियं धनमाहृत्य", points: 25 },
                { text: "मातृदेवो भव", points: 20 },
                { text: "पितृदेवो भव", points: 15 },
                { text: "अतिथिदेवो भव", points: 10 },
                { text: "गुरुदेवो भव", points: 5 }
            ],
            revealed: []
        },
        {
            question: "What is the Sanskrit word for 'knowledge'?",
            answers: [
                { text: "ज्ञान", points: 25 },
                { text: "विद्या", points: 20 },
                { text: "बुद्धि", points: 15 },
                { text: "प्रज्ञा", points: 10 },
                { text: "मेधा", points: 5 }
            ],
            revealed: []
        },
        {
            question: "Complete: 'वसुधैव कुटुम्बकम्' - What does this mean?",
            answers: [
                { text: "The world is one family", points: 25 },
                { text: "Earth is our home", points: 20 },
                { text: "Unity in diversity", points: 15 },
                { text: "Global brotherhood", points: 10 },
                { text: "Universal love", points: 5 }
            ],
            revealed: []
        }
    ]
};

let timerInterval = null;

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Host login
    socket.on('hostLogin', (data) => {
        gameState.host = socket.id;
        socket.emit('hostLoginSuccess');
        socket.emit('participantsUpdate', gameState.participants);
    });

    // Participant login
    socket.on('participantLogin', (data) => {
        const { teamName, participantName, password } = data;
        
        if (password !== 'game123') {
            socket.emit('loginError', 'Invalid password');
            return;
        }

        const participant = {
            id: socket.id,
            name: participantName,
            team: teamName
        };

        if (teamName === 'Team A') {
            gameState.participants.teamA.push(participant);
        } else if (teamName === 'Team B') {
            gameState.participants.teamB.push(participant);
        }

        socket.emit('participantLoginSuccess', { team: teamName, participants: gameState.participants[teamName === 'Team A' ? 'teamA' : 'teamB'] });
        
        // Update host with new participants
        if (gameState.host) {
            io.to(gameState.host).emit('participantsUpdate', gameState.participants);
        }
    });

    // Start game
    socket.on('startGame', () => {
        if (socket.id === gameState.host && gameState.participants.teamA.length > 0 && gameState.participants.teamB.length > 0) {
            gameState.gameStarted = true;
            gameState.currentQuestion = 1;
            gameState.timer = 40;
            gameState.strikes = { teamA: 0, teamB: 0 };
            gameState.scores = { teamA: 0, teamB: 0 };
            
            // Reset revealed answers
            gameState.questions.forEach(q => q.revealed = []);
            
            io.emit('gameStarted', {
                question: gameState.questions[0],
                questionNumber: 1,
                timer: gameState.timer,
                strikes: gameState.strikes,
                scores: gameState.scores
            });
            
            startTimer();
        }
    });

    // Submit answer
    socket.on('submitAnswer', (data) => {
        const { answer, team } = data;
        const currentQ = gameState.questions[gameState.currentQuestion - 1];
        
        // Check if answer is correct
        let found = false;
        let points = 0;
        let answerIndex = -1;

        for (let i = 0; i < currentQ.answers.length; i++) {
            if (answer.toLowerCase().includes(currentQ.answers[i].text.toLowerCase()) ||
                currentQ.answers[i].text.toLowerCase().includes(answer.toLowerCase())) {
                if (!currentQ.revealed.includes(i)) {
                    found = true;
                    points = currentQ.answers[i].points;
                    answerIndex = i;
                    currentQ.revealed.push(i);
                    
                    // Update score
                    gameState.scores[team === 'Team A' ? 'teamA' : 'teamB'] += points;
                    break;
                }
            }
        }

        if (found) {
            io.emit('correctAnswer', {
                team,
                answer: currentQ.answers[answerIndex].text,
                points,
                answerIndex,
                scores: gameState.scores
            });
        } else {
            // Add strike
            gameState.strikes[team === 'Team A' ? 'teamA' : 'teamB']++;
            io.emit('incorrectAnswer', {
                team,
                strikes: gameState.strikes
            });
        }
    });

    // Reveal answer (host only)
    socket.on('revealAnswer', (answerIndex) => {
        if (socket.id === gameState.host) {
            const currentQ = gameState.questions[gameState.currentQuestion - 1];
            if (!currentQ.revealed.includes(answerIndex)) {
                currentQ.revealed.push(answerIndex);
                io.emit('answerRevealed', {
                    answerIndex,
                    answer: currentQ.answers[answerIndex].text
                });
            }
        }
    });

    // Next question (host only)
    socket.on('nextQuestion', () => {
        if (socket.id === gameState.host) {
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            
            if (gameState.currentQuestion < 3) {
                gameState.currentQuestion++;
                gameState.timer = 40;
                gameState.strikes = { teamA: 0, teamB: 0 };
                
                io.emit('nextQuestion', {
                    question: gameState.questions[gameState.currentQuestion - 1],
                    questionNumber: gameState.currentQuestion,
                    timer: gameState.timer,
                    strikes: gameState.strikes,
                    scores: gameState.scores
                });
                
                startTimer();
            } else {
                // Game over
                io.emit('gameOver', {
                    scores: gameState.scores,
                    winner: gameState.scores.teamA > gameState.scores.teamB ? 'Team A' : 
                           gameState.scores.teamB > gameState.scores.teamA ? 'Team B' : 'Tie'
                });
            }
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Remove from participants
        gameState.participants.teamA = gameState.participants.teamA.filter(p => p.id !== socket.id);
        gameState.participants.teamB = gameState.participants.teamB.filter(p => p.id !== socket.id);
        
        // Update host
        if (gameState.host) {
            io.to(gameState.host).emit('participantsUpdate', gameState.participants);
        }
        
        // Reset host if host disconnects
        if (socket.id === gameState.host) {
            gameState.host = null;
        }
    });
});

function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(() => {
        gameState.timer--;
        io.emit('timerUpdate', gameState.timer);
        
        if (gameState.timer <= 0) {
            clearInterval(timerInterval);
            io.emit('timeUp');
        }
    }, 1000);
}

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});