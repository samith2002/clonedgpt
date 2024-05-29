require('dotenv').config();
const express = require('express');
const path = require('path');
const OpenAI = require('openai');
const bodyParser = require('body-parser');
const pool = require('./database');

const apiKey = process.env.aikey;
const openai = new OpenAI({ apiKey });

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    const query = 'SELECT * FROM chat_sessions ORDER BY createdAt ASC';
    try {
        const results = await pool.query(query);
        res.render('index', { sessions: results.rows });
    } catch (err) {
        console.error('Error retrieving chat sessions:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/chat/:sessionId', async (req, res) => {
    const sessionId = req.params.sessionId;
    const query = 'SELECT * FROM messages WHERE session_id = $1 ORDER BY createdAt ASC';
    try {
        const results = await pool.query(query, [sessionId]);
        res.json({ messages: results.rows });
    } catch (err) {
        console.error('Error retrieving messages:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/home', (req, res) => {
    res.redirect('/');
});

app.post('/chat', async (req, res) => {
    const { message, sessionId } = req.body;

    const insertUserMessage = async (sessionId) => {
        const insertUserMessageQuery = 'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)';
        try {
            await pool.query(insertUserMessageQuery, [sessionId, 'user', message]);
            const query = 'SELECT * FROM messages WHERE session_id = $1 ORDER BY createdAt ASC';
            const results = await pool.query(query, [sessionId]);

            const formattedMessages = results.rows.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            try {
                const completion = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: formattedMessages,
                    temperature: 0,
                });

                let assistantMessage = completion.choices[0].message.content;
                const insertAssistantMessageQuery = 'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)';
                await pool.query(insertAssistantMessageQuery, [sessionId, 'assistant', assistantMessage]);

                res.json({ response: assistantMessage, sessionId });
            } catch (error) {
                console.error('OpenAI API Error:', error);
                res.status(500).send('Internal Server Error');
            }
        } catch (err) {
            console.error('Error inserting user message:', err);
            res.status(500).send('Internal Server Error');
        }
    };

    if (!sessionId) {
        try {
            const newTitle = await generateTitle(message);
            const createSessionQuery = 'INSERT INTO chat_sessions (title) VALUES ($1) RETURNING id';
            const result = await pool.query(createSessionQuery, [newTitle]);
            const newSessionId = result.rows[0].id;
            insertUserMessage(newSessionId);
        } catch (error) {
            console.error('Error generating title:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        insertUserMessage(sessionId);
    }
});

const generateTitle = async (messageContent) => {
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful assistant that generates a title for a conversation.' },
                { role: 'user', content: `Generate a title for the following conversation: ${messageContent}` }
            ],
            temperature: 0,
        });
        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI API Error:', error);
        return 'New Conversation';
    }
};

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
