const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://127.0.0.1:27017/contactdb', { useNewUrlParser: true, useUnifiedTopology: true });

const ContactSchema = new mongoose.Schema({
    name: String,
    email: String,
});

const Contact = mongoose.model('Contact', ContactSchema);

async function addSampleContacts() {
    try {
        const sampleContacts = [
            { name: 'John Doe', email: 'john.doe@example.com' },
            { name: 'Jane Smith', email: 'jane.smith@example.com' },
            { name: 'Bob Johnson', email: 'bob.johnson@example.com' },
            { name: 'Alice Williams', email: 'alice.williams@example.com' },
            { name: 'Charlie Brown', email: 'charlie.brown@example.com' },
            { name: 'Eva Green', email: 'eva.green@example.com' },
            { name: 'David Lee', email: 'david.lee@example.com' },
            { name: 'Grace Davis', email: 'grace.davis@example.com' },
            { name: 'Michael White', email: 'michael.white@example.com' },
            { name: 'Sophie Turner', email: 'sophie.turner@example.com' },
        ];

        await Contact.insertMany(sampleContacts);

        console.log('Sample contacts added to the database');
    } catch (error) {
        console.error('Error adding sample contacts:', error);
    }
}

mongoose.connection
    .on('error', console.error)
    .once('open', () => {
        console.log('Connected to MongoDB');
        addSampleContacts();

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    });

app.use(express.static('public'));

app.get('/api/contacts', async (req, res) => {
    const { page, filter } = req.query;
    const perPage = 3;
    const skip = (page - 1) * perPage;

    try {
        let query = {};
        if (filter) {
            query = { $or: [
                { name: { $regex: filter, $options: 'i' } },
                { email: { $regex: filter, $options: 'i' } }
            ]};
        }

        const contacts = await Contact.find(query).skip(skip).limit(perPage);
        res.json({ contacts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/download-contacts', async (req, res) => {
    try {
        const contacts = await Contact.find();
        const readableStream = createContactStream(contacts);
        
        res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
        res.setHeader('Content-Type', 'text/csv');

        readableStream.pipe(res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

function createContactStream(contacts) {
    const readableStream = new Readable({
        objectMode: true,
        read() {},
    });

    contacts.forEach(contact => {
        readableStream.push(`${contact.name},${contact.email}\n`);
    });

    readableStream.push(null); 
    return readableStream;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
